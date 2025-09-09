import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Stethoscope, Share2, Clock, Play, Square, CheckCircle2, Eye, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { BackButton } from "@/components/BackButton";

type Role = "doctor" | "actor";

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

// usando client compartilhado

export default function Collaborative() {
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
  const [secondsLeft, setSecondsLeft] = useState(10 * 60);
  const [showRubric, setShowRubric] = useState(false);
  const [rubricAnswers, setRubricAnswers] = useState<Record<string, string>>({});
  const [participants, setParticipants] = useState<string[]>([]);

  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const rl = params.get("role") as Role | null;
    const codeFromPath = paramsUrl.code as string | undefined;
    if (codeFromPath) setRoom(codeFromPath);
    if (rl === "doctor" || rl === "actor") setRole(rl);
  }, [location.search, paramsUrl.code]);

  useEffect(() => {
    if (!room) return;
    const channel = supabase.channel(`collab:${room}`, {
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
        setSecondsLeft(10 * 60);
        setReleasedExams([]);
        setShowRubric(false);
        if (payload?.payload?.stationCode) {
          setStationCode(payload.payload.stationCode);
          fetchStation(payload.payload.stationCode);
        }
      })
      .on("broadcast", { event: "exam_release" }, (payload) => {
        const examId = payload?.payload?.examId as string;
        if (examId) setReleasedExams((prev) => Array.from(new Set([...prev, examId])));
      })
      .on("broadcast", { event: "end" }, () => {
        setTimerRunning(false);
        setShowRubric(true);
      })
      .on("broadcast", { event: "rubric_submit" }, () => {
        // futuro: persistir avaliação
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
  }, [room, role]);

  useEffect(() => {
    if (!timerRunning) return;
    const id = setInterval(() => setSecondsLeft((s) => (s > 0 ? s - 1 : 0)), 1000);
    if (secondsLeft === 0) {
      setTimerRunning(false);
      setShowRubric(true);
    }
    return () => clearInterval(id);
  }, [timerRunning, secondsLeft]);

  const inviteUrl = useMemo(() => {
    const base = window.location.origin + "/dashboard/collaborative";
    return `${base}?room=${room || generateRoom()}&role=${role === "doctor" ? "actor" : "doctor"}`;
  }, [room, role]);

  function generateRoom() {
    return Math.random().toString(36).slice(2, 8).toUpperCase();
  }

  async function fetchStation(code: string) {
    // Tenta view com critérios + exames serializados (MVP: reuso do schema atual)
    // Aqui buscamos a estação base e, se existir, assumimos exams em JSON em uma coluna alternativa futuramente.
    // Para MVP, mantemos sem persistência dos novos campos e simulamos exames vazios caso não existam.
    const { data, error } = await supabase
      .from("stations")
      .select("id,name,specialty,code,participant_info,actor_info")
      .eq("code", code)
      .maybeSingle();
    if (error) return;
    if (data) {
      const fallbackExams: ExamItem[] = [];
      setStation({
        id: data.id,
        name: data.name,
        specialty: data.specialty,
        code: data.code,
        participant_info: data.participant_info,
        actor_info: data.actor_info,
        exams: fallbackExams,
        criteria: [],
      });
    }
  }

  function copyInvite() {
    navigator.clipboard.writeText(inviteUrl);
  }

  async function startSession() {
    if (!room) setRoom(generateRoom());
    if (!stationCode) return;
    await channelRef.current?.send({ type: "broadcast", event: "start", payload: { stationCode } });
    setTimerRunning(true);
    setSecondsLeft(10 * 60);
    await fetchStation(stationCode);
  }

  async function endSession() {
    await channelRef.current?.send({ type: "broadcast", event: "end", payload: {} });
    setTimerRunning(false);
    setShowRubric(true);
  }

  async function releaseExam(examId: string) {
    await channelRef.current?.send({ type: "broadcast", event: "exam_release", payload: { examId } });
    setReleasedExams((prev) => Array.from(new Set([...prev, examId])));
  }

  async function submitRubric() {
    await channelRef.current?.send({ type: "broadcast", event: "rubric_submit", payload: { rubricAnswers } });
  }

  const mm = (secondsLeft / 60) | 0;
  const ss = secondsLeft % 60;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <BackButton className="mr-4" />
          <div className="flex-1">
            <h1 className="text-2xl font-bold flex items-center gap-2"><Users className="h-5 w-5" /> Modo Colaborativo</h1>
            <p className="text-muted-foreground">Simule uma estação OSCE entre Médico e Ator com liberação de exames em tempo real.</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={connected ? "default" : "secondary"}>{connected ? "Conectado" : "Aguardando"}</Badge>
          </div>
        </div>

        {/* Setup da sala */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Configuração da Sala</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Código da Sala</Label>
              <div className="flex gap-2">
                <Input value={room} onChange={(e) => setRoom(e.target.value.toUpperCase())} placeholder="Ex: 9K3LQZ" />
                <Button variant="outline" onClick={() => setRoom(generateRoom())}>Gerar</Button>
              </div>
            </div>
            <div>
              <Label>Papel</Label>
              <select value={role || ""} onChange={(e) => setRole(e.target.value as Role)} className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="">Selecione</option>
                <option value="doctor">Médico</option>
                <option value="actor">Ator</option>
              </select>
            </div>
            <div>
              <Label>Código da Estação</Label>
              <Input value={stationCode} onChange={(e) => setStationCode(e.target.value.toUpperCase())} placeholder="Ex: CARD-001" />
            </div>
            <div className="flex items-end gap-2">
              <Button className="flex-1" onClick={() => copyInvite()} variant="outline"><Share2 className="h-4 w-4 mr-2" /> Copiar Convite</Button>
            </div>
          </CardContent>
        </Card>

        {/* Painel principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna esquerda: Info + Controles */}
          <div className="space-y-6 lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Stethoscope className="h-5 w-5 text-primary" /> Estação</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary">{role ? (role === "doctor" ? "Médico" : "Ator") : "Sem papel"}</Badge>
                    {station && <Badge variant="outline">{station.code} • {station.specialty}</Badge>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge><Clock className="h-3 w-3 mr-1" /> {String(mm).padStart(2, "0")}:{String(ss).padStart(2, "0")}</Badge>
                    {role === "doctor" && !timerRunning && (
                      <Button onClick={startSession} disabled={!room || !stationCode} className="flex items-center gap-2"><Play className="h-4 w-4" /> Iniciar</Button>
                    )}
                    {timerRunning && (
                      <Button variant="destructive" onClick={endSession} className="flex items-center gap-2"><Square className="h-4 w-4" /> Encerrar</Button>
                    )}
                  </div>
                </div>

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
                            {role === "actor" && timerRunning && (
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
          </div>

          {/* Coluna direita: Rubrica ao final */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-primary" /> Gabarito (Rubrica)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!showRubric ? (
                  <p className="text-sm text-muted-foreground">O gabarito será exibido ao encerrar ou ao fim dos 10 minutos.</p>
                ) : !station || station.criteria.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum critério configurado para esta estação.</p>
                ) : (
                  <div className="space-y-6">
                    {station.criteria.map((c) => (
                      <div key={c.id} className="border rounded-md p-3 space-y-2">
                        <div className="font-medium">{c.title}</div>
                        <div className="text-xs text-muted-foreground">{c.instruction}</div>
                        <div className="grid grid-cols-1 gap-2 mt-1">
                          {c.options.map((o) => (
                            <label key={o.id} className="flex items-center gap-2 text-sm">
                              <input
                                type="radio"
                                name={`crit-${c.id}`}
                                value={o.id}
                                checked={rubricAnswers[c.id] === o.id}
                                onChange={(e) => setRubricAnswers((prev) => ({ ...prev, [c.id]: e.target.value }))}
                              />
                              <span className="font-medium">{o.label}</span>
                              <Badge variant="secondary">{o.points}</Badge>
                              <span className="text-muted-foreground">{o.description}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                    {role === "actor" && (
                      <Button onClick={submitRubric} className="w-full">Enviar Correção</Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Nota sobre vídeo */}
        <div className="mt-6 text-xs text-muted-foreground">
          Dica: utilize uma chamada de vídeo externa (ex: Meet/Zoom) enquanto treina aqui. Integração de vídeo nativo pode ser adicionada futuramente.
        </div>
      </div>
    </div>
  );
}


