import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Stethoscope, Clock, Play, Square, Eye, Users, Brain, ArrowRight, RotateCcw, Share2, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { OnboardingModal, hybridOnboardingSteps } from "@/components/OnboardingModal";
import { BackButton } from "@/components/BackButton";

type Role = "creator" | "entrant";

type ExamType = "text" | "image";

interface ExamItem {
  id: string;
  title: string;
  type: ExamType;
  contentText?: string;
  imageDataUrl?: string;
  orderIndex: number;
}

interface CriterionOption {
  id: string;
  label: string;
  points: number;
  description: string;
}

interface Criterion {
  id: string;
  title: string;
  instruction: string;
  options: CriterionOption[];
}

interface StationData {
  id: string;
  name: string;
  specialty: string;
  code: string;
  participant_info: string;
  actor_info: string;
  exams: ExamItem[];
  criteria: Criterion[];
}

const TEN_MINUTES = 10 * 60;

function generateSimulationId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return (crypto as any).randomUUID();
  }
  return 'sim-' + Date.now();
}

export default function HybridMode() {
  const navigate = useNavigate();
  const location = useLocation();
  const paramsUrl = useParams();

  const [room, setRoom] = useState<string>("");
  const [role, setRole] = useState<Role | null>(null);
  const [connected, setConnected] = useState(false);
  const [stationCode, setStationCode] = useState("");
  const [station, setStation] = useState<StationData | null>(null);
  const [releasedExams, setReleasedExams] = useState<string[]>([]);
  const [timerRunning, setTimerRunning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(TEN_MINUTES);
  const [participants, setParticipants] = useState<string[]>([]);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [aiFeedback, setAiFeedback] = useState<string>("");
  const [isGeneratingFeedback, setIsGeneratingFeedback] = useState(false);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [currentStationIndex, setCurrentStationIndex] = useState(0);
  const [totalStations, setTotalStations] = useState(0);
  const [creatorStations, setCreatorStations] = useState<string[]>([]);
  const [entrantStations, setEntrantStations] = useState<string[]>([]);
  const [isCurrentUserTurn, setIsCurrentUserTurn] = useState(false);

  // Gravação de áudio
  const [isRecording, setIsRecording] = useState(false);
  const [transcripts, setTranscripts] = useState<Record<number, string>>({});
  const [simulationId] = useState<string>(() => generateSimulationId());
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);

  const intervalRef = useRef<number | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingIdRef = useRef<string | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const progress = useMemo(() => ((TEN_MINUTES - secondsLeft) / TEN_MINUTES) * 100, [secondsLeft]);

  useEffect(() => {
    // Mostrar onboarding na primeira visita ao modo híbrido
    const hasSeenHybridOnboarding = localStorage.getItem('hasSeenHybridOnboarding');
    if (!hasSeenHybridOnboarding) {
      setShowOnboarding(true);
    }
  }, []);

  const handleOnboardingClose = () => {
    setShowOnboarding(false);
    localStorage.setItem('hasSeenHybridOnboarding', 'true');
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const rl = params.get("role") as Role | null;
    const codeFromPath = paramsUrl.code as string | undefined;
    if (codeFromPath) {
      setRoom(codeFromPath);
      loadSimulationStations(codeFromPath);
    }
    if (rl === "creator" || rl === "entrant") setRole(rl);
  }, [location.search, paramsUrl.code]);

  async function loadSimulationStations(simCode: string) {
    try {
      // Buscar simulação pelo código
      const { data: sim, error: simError } = await supabase
        .from("simulations" as any)
        .select("id")
        .eq("code", simCode)
        .single();

      if (simError || !sim) {
        console.error("Erro ao carregar simulação:", simError);
        return;
      }

      // Carregar estações do localStorage
      const creatorStationsData = JSON.parse(localStorage.getItem(`hybrid-creator-${simCode}`) || "[]");
      const entrantStationsData = JSON.parse(localStorage.getItem(`hybrid-entrant-${simCode}`) || "[]");
      const currentIndex = parseInt(localStorage.getItem(`hybrid-current-index-${simCode}`) || "0");

      setCreatorStations(creatorStationsData);
      setEntrantStations(entrantStationsData);
      
      // Calcular total de estações (soma das duas listas)
      const totalStationsCount = creatorStationsData.length + entrantStationsData.length;
      setTotalStations(totalStationsCount);
      setCurrentStationIndex(currentIndex);

      // Determinar se é a vez do usuário atual
      const isCreatorTurn = currentIndex % 2 === 0;
      setIsCurrentUserTurn(
        (role === "creator" && isCreatorTurn) || 
        (role === "entrant" && !isCreatorTurn)
      );

      // Carregar estação atual
      const currentStationId = isCreatorTurn 
        ? creatorStationsData[Math.floor(currentIndex / 2)]
        : entrantStationsData[Math.floor(currentIndex / 2)];

      if (currentStationId) {
        await fetchStationById(currentStationId);
      }
    } catch (error) {
      console.error("Erro ao carregar simulação:", error);
    }
  }

  useEffect(() => {
    if (!room) return;
    const channel = supabase.channel(`hybrid:${room}`, {
      config: { presence: { key: crypto.randomUUID() } }
    });
    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const keys = Object.keys(state);
        setParticipants(keys);
      })
      .on("broadcast", { event: "start" }, (payload) => {
        setTimerRunning(true);
        setSecondsLeft(TEN_MINUTES);
        setReleasedExams([]);
        setSessionCompleted(false);
        setAiFeedback("");
        if (payload?.payload?.stationIndex !== undefined) {
          setCurrentStationIndex(payload.payload.stationIndex);
          setIsCurrentUserTurn(payload.payload.isCurrentUserTurn || false);
          
          // Determinar qual estação carregar baseado no turno
          const isCreatorTurn = payload.payload.stationIndex % 2 === 0;
          const stationId = isCreatorTurn 
            ? creatorStations[Math.floor(payload.payload.stationIndex / 2)]
            : entrantStations[Math.floor(payload.payload.stationIndex / 2)];
            
          if (stationId) {
            fetchStationById(stationId);
          }
        }
        // Iniciar gravação se for a vez do usuário atual
        if (isCurrentUserTurn) {
          startRecordingForStation(payload.payload.stationIndex + 1);
        }
      })
      .on("broadcast", { event: "exam_release" }, (payload) => {
        const examId = payload?.payload?.examId as string;
        if (examId) setReleasedExams((prev) => Array.from(new Set([...prev, examId])));
      })
      .on("broadcast", { event: "end" }, async () => {
        setTimerRunning(false);
        setSessionCompleted(true);
        // Finalizar gravação e gerar feedback por IA
        if (isCurrentUserTurn) {
          await finishRecordingAndTranscribe();
          await generateAiFeedback();
        }
      })
      .on("broadcast", { event: "role_switch" }, (payload) => {
        const newRole = payload?.payload?.role as Role;
        if (newRole) {
          setRole(newRole);
          setSessionCompleted(false);
          setAiFeedback("");
        }
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          setConnected(true);
          await channel.track({ joined_at: Date.now(), role: role || "unknown" });
        }
      });

    channelRef.current = channel;
    return () => {
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [room, role, creatorStations, entrantStations]);

  useEffect(() => {
    if (!timerRunning) return;
    const id = setInterval(() => setSecondsLeft((s) => (s > 0 ? s - 1 : 0)), 1000);
    if (secondsLeft === 0) {
      setTimerRunning(false);
      setSessionCompleted(true);
      // Finalizar gravação e gerar feedback por IA
      if (isCurrentUserTurn) {
        finishRecordingAndTranscribe().then(() => generateAiFeedback());
      }
    }
    return () => clearInterval(id);
  }, [timerRunning, secondsLeft]);

  const inviteUrl = useMemo(() => {
    const base = window.location.origin + "/simulation/hybrid";
    return `${base}?room=${room || generateRoom()}&role=${role === "doctor" ? "actor" : "doctor"}`;
  }, [room, role]);

  function generateRoom() {
    return Math.random().toString(36).slice(2, 8).toUpperCase();
  }

  async function fetchStation(code: string) {
    const { data, error } = await supabase
      .from("stations")
      .select("id,name,specialty,code,participant_info,actor_info,checklist")
      .eq("code", code)
      .maybeSingle();
    if (error) return;
    if (data) {
      const checklist = data.checklist as any || {};
      const fallbackExams: ExamItem[] = Array.isArray(checklist.exams) ? checklist.exams : [];
      const fallbackCriteria: Criterion[] = Array.isArray(checklist.criteria) ? checklist.criteria : [];
      
      setStation({
        id: data.id,
        name: data.name,
        specialty: checklist.specialty || data.specialty || "",
        code: data.code,
        participant_info: checklist.participant_info || data.participant_info || "",
        actor_info: checklist.actor_info || data.actor_info || "",
        exams: fallbackExams,
        criteria: fallbackCriteria,
      });
    }
  }

  async function fetchStationById(stationId: string) {
    const { data, error } = await supabase
      .from("stations")
      .select("id,name,specialty,code,participant_info,actor_info,checklist")
      .eq("id", stationId)
      .maybeSingle();
    if (error) return;
    if (data) {
      const checklist = data.checklist as any || {};
      const fallbackExams: ExamItem[] = Array.isArray(checklist.exams) ? checklist.exams : [];
      const fallbackCriteria: Criterion[] = Array.isArray(checklist.criteria) ? checklist.criteria : [];
      
      setStation({
        id: data.id,
        name: data.name,
        specialty: checklist.specialty || data.specialty || "",
        code: data.code,
        participant_info: checklist.participant_info || data.participant_info || "",
        actor_info: checklist.actor_info || data.actor_info || "",
        exams: fallbackExams,
        criteria: fallbackCriteria,
      });
      setStationCode(data.code);
    }
  }

  // Funções de gravação de áudio (reutilizadas do Simulation.tsx)
  async function startRecordingForStation(station: number) {
    const res = await fetch('/api/audio/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ simulationId, station, totalStations: 1 })
    });
    const json = await res.json();
    if (!json?.ok) throw new Error('Falha ao iniciar gravação');
    recordingIdRef.current = String(json.recordingId);

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    audioStreamRef.current = stream;
    const mr = new MediaRecorder(stream, { mimeType: 'audio/webm' });
    mediaRecorderRef.current = mr;
    mr.ondataavailable = async (evt) => {
      try {
        if (evt.data && evt.data.size > 0 && recordingIdRef.current) {
          await fetch(`/api/audio/chunk?recordingId=${encodeURIComponent(recordingIdRef.current)}`, {
            method: 'POST',
            body: evt.data
          });
        }
      } catch {}
    };
    mr.start(2000);
    setIsRecording(true);
  }

  async function finishRecordingAndTranscribe(): Promise<void> {
    const recId = recordingIdRef.current;
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      const chunks: Blob[] = [];
      const mr = mediaRecorderRef.current;
      const donePromise = new Promise<Blob>((resolve) => {
        const handler = () => {
          mr.removeEventListener('dataavailable', onData);
          resolve(new Blob(chunks, { type: 'audio/webm' }));
        };
        const onData = (evt: BlobEvent) => { if (evt.data && evt.data.size > 0) chunks.push(evt.data); };
        mr.addEventListener('dataavailable', onData);
        mr.addEventListener('stop', handler, { once: true });
        mr.stop();
      });
      await donePromise;

      if (audioStreamRef.current) {
        for (const track of audioStreamRef.current.getTracks()) track.stop();
        audioStreamRef.current = null;
      }
      try {
        setIsTranscribing(true);
        const resp = await fetch('/api/audio/finish', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ recordingId: recId })
        });
        const json = await resp.json();
        if (json?.ok && json?.transcript) {
          setTranscripts(prev => ({ ...prev, [1]: String(json.transcript) }));
        }
      } catch {} finally {
        setIsTranscribing(false);
        recordingIdRef.current = null;
        mediaRecorderRef.current = null;
        setIsRecording(false);
      }
      return;
    }
    if (audioStreamRef.current) {
      for (const track of audioStreamRef.current.getTracks()) track.stop();
      audioStreamRef.current = null;
    }
    recordingIdRef.current = null;
    mediaRecorderRef.current = null;
    setIsRecording(false);
  }

  async function generateAiFeedback() {
    if (Object.keys(transcripts).length === 0) return;
    
    setIsGeneratingFeedback(true);
    try {
      const resp = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ simulationId, transcripts })
      });
      const json = await resp.json();
      if (json?.ok && json?.feedbackHtml) {
        setAiFeedback(String(json.feedbackHtml));
      }
    } catch (error) {
      console.error('Erro ao gerar feedback:', error);
    } finally {
      setIsGeneratingFeedback(false);
    }
  }

  async function nextStation() {
    const nextIndex = currentStationIndex + 1;
    
    if (nextIndex >= totalStations) {
      // Simulação completa
      setSessionCompleted(true);
      return;
    }

    // Determinar se é a vez do criador ou entrante
    const isCreatorTurn = nextIndex % 2 === 0;
    const isCurrentUserTurn = (role === "creator" && isCreatorTurn) || (role === "entrant" && !isCreatorTurn);
    
    // Atualizar estado
    setCurrentStationIndex(nextIndex);
    setIsCurrentUserTurn(isCurrentUserTurn);
    
    // Salvar progresso no localStorage
    const simId = room; // Usando room como ID da simulação
    localStorage.setItem(`hybrid-current-index-${simId}`, nextIndex.toString());
    
    // Carregar próxima estação
    const nextStationId = isCreatorTurn 
      ? creatorStations[Math.floor(nextIndex / 2)]
      : entrantStations[Math.floor(nextIndex / 2)];
      
    if (nextStationId) {
      await fetchStationById(nextStationId);
    }
    
    // Resetar estado
    setReleasedExams([]);
    setAiFeedback("");
    setSessionCompleted(false);
    setSecondsLeft(TEN_MINUTES);

    // Broadcast para o outro participante
    channelRef.current?.send({
      type: "broadcast",
      event: "start",
      payload: { 
        stationIndex: nextIndex,
        isCurrentUserTurn: isCurrentUserTurn
      }
    });

    // Iniciar gravação se for a vez do usuário atual
    if (isCurrentUserTurn) {
      startRecordingForStation(nextIndex + 1);
    }
  }

  function copyInvite() {
    navigator.clipboard.writeText(inviteUrl);
  }

  async function startSession() {
    if (!room) setRoom(generateRoom());
    if (creatorStations.length === 0 && entrantStations.length === 0) return;
    
    // Determinar se é a vez do usuário atual (primeira estação sempre é do criador)
    const isCreatorTurn = currentStationIndex % 2 === 0;
    const isCurrentUserTurn = (role === "creator" && isCreatorTurn) || (role === "entrant" && !isCreatorTurn);
    
    // Iniciar primeira estação
    await channelRef.current?.send({ 
      type: "broadcast", 
      event: "start", 
      payload: { 
        stationIndex: 0,
        isCurrentUserTurn: isCurrentUserTurn
      } 
    });
    setTimerRunning(true);
    setSecondsLeft(TEN_MINUTES);
    setIsCurrentUserTurn(isCurrentUserTurn);
    
    if (isCurrentUserTurn) {
      startRecordingForStation(1);
    }
  }

  async function endSession() {
    await channelRef.current?.send({ type: "broadcast", event: "end", payload: {} });
    setTimerRunning(false);
    setSessionCompleted(true);
    if (isCurrentUserTurn) {
      await finishRecordingAndTranscribe();
      await generateAiFeedback();
    }
  }

  async function releaseExam(examId: string) {
    await channelRef.current?.send({ type: "broadcast", event: "exam_release", payload: { examId } });
    setReleasedExams((prev) => Array.from(new Set([...prev, examId])));
  }


  const mm = (secondsLeft / 60) | 0;
  const ss = secondsLeft % 60;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <BackButton className="mr-4" />
          <div className="flex-1">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Users className="h-5 w-5" /> 
              Modo Híbrido
              <Badge variant="secondary" className="ml-2">IA + Colaborativo</Badge>
            </h1>
            <p className="text-muted-foreground">
              Treine entre usuários alternando papéis com correção automática por IA.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowOnboarding(true)}
              className="text-xs"
            >
              Ver Tutorial
            </Button>
            <Badge variant={connected ? "default" : "secondary"}>
              {connected ? "Conectado" : "Aguardando"}
            </Badge>
          </div>
        </div>

        {/* Status da simulação */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div>
                  <h3 className="font-semibold">Estação {currentStationIndex + 1} de {totalStations}</h3>
                  <p className="text-sm text-muted-foreground">
                    {station ? `${station.code} • ${station.specialty}` : "Carregando..."}
                  </p>
                </div>
                <Badge variant="secondary">
                  {role === "creator" ? "Ator" : "Médico"}
                </Badge>
                {isCurrentUserTurn && (
                  <Badge variant="default" className="ml-2">
                    Sua vez (Médico)
                  </Badge>
                )}
                {!isCurrentUserTurn && (
                  <Badge variant="outline" className="ml-2">
                    {role === "creator" ? "Aguardando (Médico)" : "Aguardando (Ator)"}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyInvite()}
                  className="text-xs"
                >
                  <Share2 className="h-4 w-4 mr-2" /> Compartilhar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Painel principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna esquerda: Info + Controles */}
          <div className="space-y-6 lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Stethoscope className="h-5 w-5 text-primary" /> 
                  Estação
                  {isRecording && <Badge variant="destructive" className="ml-2">Gravando</Badge>}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary">{role ? (role === "creator" ? "Criador" : "Entrante") : "Sem papel"}</Badge>
                    {station && <Badge variant="outline">{station.code} • {station.specialty}</Badge>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge><Clock className="h-3 w-3 mr-1" /> {String(mm).padStart(2, "0")}:{String(ss).padStart(2, "0")}</Badge>
                    {!timerRunning && !sessionCompleted && (
                      <Button onClick={startSession} disabled={!room || (creatorStations.length === 0 && entrantStations.length === 0)} className="flex items-center gap-2">
                        <Play className="h-4 w-4" /> Iniciar Estação
                      </Button>
                    )}
                    {timerRunning && (
                      <Button variant="destructive" onClick={endSession} className="flex items-center gap-2">
                        <Square className="h-4 w-4" /> Encerrar
                      </Button>
                    )}
                    {sessionCompleted && currentStationIndex < totalStations - 1 && (
                      <Button onClick={nextStation} className="flex items-center gap-2">
                        <ArrowRight className="h-4 w-4" /> Próxima Estação
                      </Button>
                    )}
                  </div>
                </div>

                {/* Progress bar durante a sessão */}
                {timerRunning && (
                  <div className="space-y-2">
                    <Progress value={progress} />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>0-3 min: Anamnese + Exame físico</span>
                      <span>3-7 min: Hipóteses e Condutas</span>
                      <span>7-10 min: Finalização</span>
                    </div>
                  </div>
                )}

                {/* Informações diferentes por papel */}
                {station ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-semibold mb-2">Informações para {role === "actor" ? "o Ator" : "o Médico"}</h4>
                      {role === "actor" ? (
                        <Textarea readOnly rows={8} value={station.actor_info} />
                      ) : (
                        <Textarea readOnly rows={8} value={station.participant_info} />
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold mb-2">Participantes</h4>
                      <div className="flex flex-wrap gap-2">
                        {participants.length === 0 ? (
                          <span className="text-sm text-muted-foreground">Ninguém conectado</span>
                        ) : participants.map((p) => (
                          <Badge key={p} variant="outline">{p.slice(0, 6)}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Informe o código da estação e inicie para carregar os dados.</p>
                )}
              </CardContent>
            </Card>

            {/* Exames liberados (visão do Médico) */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Eye className="h-5 w-5 text-primary" /> Exames</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!station || station.exams.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum exame configurado para esta estação.</p>
                ) : (
                  <div className="space-y-4">
                    {station.exams
                      .sort((a, b) => a.orderIndex - b.orderIndex)
                      .map((exam) => (
                        <div key={exam.id} className={`border rounded-md p-3 ${releasedExams.includes(exam.id) ? "border-primary" : "border-border"}`}>
                          <div className="flex items-center justify-between">
                            <div className="font-medium">{exam.title}</div>
                                        {!isCurrentUserTurn && timerRunning && (
                                          <Button size="sm" variant="outline" onClick={() => releaseExam(exam.id)}>Liberar</Button>
                                        )}
                          </div>
                          {releasedExams.includes(exam.id) && (
                            <div className="mt-3">
                              {exam.type === "text" ? (
                                <div className="text-sm whitespace-pre-wrap">{exam.contentText}</div>
                              ) : exam.imageDataUrl ? (
                                <img src={exam.imageDataUrl} alt={exam.title} className="max-h-64 object-contain rounded" />
                              ) : (
                                <div className="text-sm text-muted-foreground">Imagem não disponível.</div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Feedback da IA */}
            {sessionCompleted && aiFeedback && isCurrentUserTurn && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-primary" /> 
                    Feedback da IA
                    {isGeneratingFeedback && <Badge variant="secondary">Gerando...</Badge>}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-left max-w-none p-4 border border-border rounded-lg">
                    <style>{`.ok{color:#16a34a;font-weight:600}.miss{color:#dc2626;font-weight:600}`}</style>
                    <div className="prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: aiFeedback }} />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Coluna direita: Controles e ações */}
          <div className="space-y-6">
            {/* Controles de sessão */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RotateCcw className="h-5 w-5 text-primary" /> 
                  Controles
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                
                {sessionCompleted && (
                  <div className="space-y-2">
                    <Button 
                      onClick={() => {
                        setSessionCompleted(false);
                        setAiFeedback("");
                        setReleasedExams([]);
                        setTimerRunning(false);
                        setSecondsLeft(TEN_MINUTES);
                      }}
                      className="w-full"
                      variant="outline"
                    >
                      Nova Sessão
                    </Button>
                    <Button 
                      onClick={() => navigate('/simulation')}
                      className="w-full"
                      variant="secondary"
                    >
                      Voltar ao Menu
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Status da sessão */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" /> 
                  Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Status da Sessão:</span>
                    <Badge variant={timerRunning ? "default" : sessionCompleted ? "secondary" : "outline"}>
                      {timerRunning ? "Em andamento" : sessionCompleted ? "Concluída" : "Aguardando"}
                    </Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Gravação:</span>
                    <Badge variant={isRecording ? "destructive" : "outline"}>
                      {isRecording ? "Ativa" : "Inativa"}
                    </Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Transcrição:</span>
                    <Badge variant={isTranscribing ? "secondary" : "outline"}>
                      {isTranscribing ? "Processando" : "Concluída"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Nota sobre vídeo */}
        <div className="mt-6 text-xs text-muted-foreground">
          💡 Dica: Utilize uma chamada de vídeo externa (ex: Meet/Zoom) enquanto treina aqui. 
          A gravação de áudio é automática para análise por IA.
        </div>

        <OnboardingModal
          isOpen={showOnboarding}
          onClose={handleOnboardingClose}
          steps={hybridOnboardingSteps}
          title="Modo Híbrido"
          description="Aprenda como treinar entre usuários com correção automática por IA"
        />
      </div>
    </div>
  );
}
