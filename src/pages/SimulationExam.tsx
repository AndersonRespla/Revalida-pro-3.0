import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { OnboardingModal, examOnboardingSteps } from "@/components/OnboardingModal";
import { BackButton } from "@/components/BackButton";
import { SimulationProgress } from "@/components/SimulationProgress";
import { SimulationFeedback } from "@/components/SimulationFeedback";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mic, MicOff, Phone } from "lucide-react";

const TEN_MINUTES = 10 * 60;
const TOTAL_STATIONS = 5;
const EXAM_AGENT_ID = import.meta.env.VITE_ELEVENLABS_AGENT_EXAM || "agent_0901k20v5w0df13vmj2hrvdt0dng";

function generateSimulationId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return (crypto as any).randomUUID();
  }
  return 'sim-' + Date.now();
}

interface StationData {
  id: string;
  name: string;
  specialty: string;
  code: string;
  participant_info: string;
  actor_info: string;
  available_exams: string;
  difficulty_level: string;
  estimated_duration: number;
}

export default function SimulationExam() {
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState<"idle" | "running" | "finished">("idle");
  const [secondsLeft, setSecondsLeft] = useState<number>(TEN_MINUTES);
  const [currentStation, setCurrentStation] = useState<number>(1);
  const [finalFeedback, setFinalFeedback] = useState<string>("");
  const [simulationId] = useState<string>(() => searchParams.get('simulationId') || generateSimulationId());
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [selectedStations, setSelectedStations] = useState<StationData[]>([]);
  const [isLoadingStations, setIsLoadingStations] = useState<boolean>(false);
  const [moderatorContext, setModeratorContext] = useState<any>(null);
  const [publicContext, setPublicContext] = useState<any>(null);

  const intervalRef = useRef<number | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingIdRef = useRef<string | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);

  const progress = useMemo(() => ((TEN_MINUTES - secondsLeft) / TEN_MINUTES) * 100, [secondsLeft]);

  // Carregar estações se não vieram da URL
  useEffect(() => {
    const urlSimulationId = searchParams.get('simulationId');
    
    if (!urlSimulationId) {
      // Se não há simulationId na URL, criar nova simulação
      loadRandomStations();
    } else {
      // Se há simulationId, carregar estações existentes
      loadExistingSimulation(urlSimulationId);
    }
  }, [searchParams]);

  useEffect(() => {
    // Mostrar onboarding na primeira visita ao modo exame
    const hasSeenExamOnboarding = localStorage.getItem('hasSeenExamOnboarding');
    if (!hasSeenExamOnboarding) {
      setShowOnboarding(true);
    }
  }, []);

  const loadRandomStations = async () => {
    setIsLoadingStations(true);
    try {
      console.log('🎯 Carregando estações aleatórias...');
      
      const response = await fetch('/api/simulation/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Erro ao carregar estações');
      }

      const data = await response.json();
      
      if (data.ok) {
        console.log('✅ Estações carregadas:', data.stations.map((s: StationData) => `${s.code} - ${s.name}`));
        setSelectedStations(data.stations);
        
        // Gerar contexto privado para o moderador
        await generateModeratorContext(data.simulationId);
      } else {
        throw new Error(data.message || 'Erro ao carregar estações');
      }
      
    } catch (error) {
      console.error('❌ Erro ao carregar estações:', error);
      // Fallback: usar estações mockadas
      setSelectedStations([]);
    } finally {
      setIsLoadingStations(false);
    }
  };

  const loadExistingSimulation = async (simId: string) => {
    setIsLoadingStations(true);
    try {
      console.log('📋 Carregando simulação existente:', simId);
      
      const response = await fetch(`/api/simulation/load?simulationId=${encodeURIComponent(simId)}`);
      
      if (!response.ok) {
        throw new Error('Erro ao carregar simulação');
      }

      const data = await response.json();
      
      if (data.ok) {
        console.log('✅ Simulação carregada:', data.simulationId);
        console.log('📋 Estações:', data.stations.map((s: StationData) => `${s.code} - ${s.name}`));
        setSelectedStations(data.stations);
        
        // Atualizar estado da simulação se necessário
        if (data.simulation.current_station) {
          setCurrentStation(data.simulation.current_station);
        }
        
        // Gerar contexto privado para o moderador
        await generateModeratorContext(simId);
      } else {
        throw new Error(data.message || 'Erro ao carregar simulação');
      }
      
    } catch (error) {
      console.error('❌ Erro ao carregar simulação existente:', error);
      // Fallback: carregar estações aleatórias
      await loadRandomStations();
    } finally {
      setIsLoadingStations(false);
    }
  };

  const generateModeratorContext = async (simId: string) => {
    try {
      console.log('🧠 Gerando contexto privado para o moderador...');
      
      const response = await fetch('/api/simulation/context', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ simulationId: simId }),
      });

      if (!response.ok) {
        throw new Error('Erro ao gerar contexto');
      }

      const data = await response.json();
      
      if (data.ok) {
        console.log('✅ Contexto privado gerado');
        setModeratorContext(data.context);
        setPublicContext(data.publicContext);
      } else {
        throw new Error(data.message || 'Erro ao gerar contexto');
      }
      
    } catch (error) {
      console.error('❌ Erro ao gerar contexto:', error);
    }
  };

  const handleOnboardingClose = () => {
    setShowOnboarding(false);
    localStorage.setItem('hasSeenExamOnboarding', 'true');
  };

  const notifyAgent = async (action: string, payload?: any) => {
    try {
      await fetch('/api/notify-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, payload })
      });
    } catch {}
  };

  async function startRecordingForStation(station: number) {
    const res = await fetch('/api/audio/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        simulationId, 
        station, 
        totalStations: TOTAL_STATIONS,
        userId: 'demo-user', // TODO: Get real user ID from auth
        sessionType: 'simulation_exam'
      })
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
        if (json?.ok && json?.feedback && currentStation >= TOTAL_STATIONS) setFinalFeedback(String(json.feedback || ''));
      } catch {} finally {
        setIsTranscribing(false);
        recordingIdRef.current = null;
        mediaRecorderRef.current = null;
      }
      return;
    }
    if (audioStreamRef.current) {
      for (const track of audioStreamRef.current.getTracks()) track.stop();
      audioStreamRef.current = null;
    }
    recordingIdRef.current = null;
    mediaRecorderRef.current = null;
  }

  useEffect(() => {
    if (step === "running" && intervalRef.current === null) {
      intervalRef.current = window.setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            window.clearInterval(intervalRef.current!);
            intervalRef.current = null;
            notifyAgent('timeout', { station: currentStation });
            (async () => {
              await finishRecordingAndTranscribe();
              if (currentStation < TOTAL_STATIONS) {
                handleStationComplete(currentStation);
              } else {
                setStep("finished");
              }
            })();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [step, currentStation]);

  const formatTime = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
    const s = Math.floor(totalSeconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const handleStartTreatment = async () => {
    setStep("running");
    setSecondsLeft(TEN_MINUTES);
    try { await startRecordingForStation(currentStation); } catch {}
  };

  const handleEndConsultation = async () => {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    notifyAgent('consultation_ended', { station: currentStation, timeRemaining: secondsLeft });
    await finishRecordingAndTranscribe();
    if (currentStation < TOTAL_STATIONS) {
      handleStationComplete(currentStation);
    } else {
      setStep("finished");
    }
  };

  const handleStationComplete = (station: number) => {
    setCurrentStation(station + 1);
    setStep("idle");
    setSecondsLeft(TEN_MINUTES);
    notifyAgent('station_complete', { completedStation: station, nextStation: station + 1 });
  };

  const handleModeratorReturn = () => {
    setStep("idle");
    setSecondsLeft(TEN_MINUTES);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <BackButton className="mr-4" />
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Simulação OSCE</h1>
            <p className="text-sm text-muted-foreground">
              Modo Dia da Prova - 5 Estações Completas
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowOnboarding(true)}
          >
            Ver Tutorial
          </Button>
        </div>

        {step !== "finished" ? (
          <>
            {/* Progress Card */}
            <div className="mb-6">
              <SimulationProgress
                currentStation={currentStation}
                totalStations={TOTAL_STATIONS}
                secondsLeft={secondsLeft}
                status={step}
                stationSpecialty={publicContext?.stations?.[currentStation - 1]?.specialty}
              />
            </div>

            {/* Main Interaction Card */}
            <Card className="p-4 md:p-6">
              <div className="mb-6">
                {isLoadingStations ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-2 text-sm text-muted-foreground">Preparando simulação...</p>
                  </div>
                ) : (
                  <>
                    <div className="mb-4">
                      <Alert>
                        <Phone className="h-4 w-4" />
                        <AlertDescription>
                          {step === "idle" 
                            ? "Clique em 'Iniciar Atendimento' quando estiver pronto para começar."
                            : "Converse naturalmente com o paciente. O tempo é controlado automaticamente."}
                        </AlertDescription>
                      </Alert>
                    </div>
                    
                    <elevenlabs-convai 
                      agent-id={EXAM_AGENT_ID} 
                      position="inline"
                      moderator-context={moderatorContext ? JSON.stringify(moderatorContext) : ''}
                      current-station={currentStation.toString()}
                      simulation-id={simulationId}
                    />
                    
                    {step === "running" && (
                      <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                        <Mic className="h-4 w-4 animate-pulse text-red-500" />
                        <span>Gravação em andamento</span>
                      </div>
                    )}
                  </>
                )}
              </div>

              <AgentEventsListener 
                onPatientHandoff={async () => {
                  if (step !== 'running') {
                    setStep('running');
                    setSecondsLeft(TEN_MINUTES);
                    try { await startRecordingForStation(currentStation); } catch {}
                  }
                }}
                onStationComplete={handleStationComplete}
                onModeratorReturn={handleModeratorReturn}
              />

              {/* Action Buttons */}
              <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
                {step === "idle" && (
                  <Button 
                    onClick={handleStartTreatment} 
                    variant="default" 
                    size="lg" 
                    className="px-8"
                  >
                    <Phone className="h-4 w-4 mr-2" />
                    Iniciar Atendimento
                  </Button>
                )}
                
                {step === "running" && (
                  <>
                    <Button 
                      variant="outline" 
                      size="lg"
                      disabled
                    >
                      <Mic className="h-4 w-4 mr-2" />
                      Solicitar Exame
                    </Button>
                    <Button 
                      onClick={handleEndConsultation} 
                      variant="destructive" 
                      size="lg"
                    >
                      Encerrar Consulta
                    </Button>
                  </>
                )}
              </div>

              {step === "running" && isTranscribing && (
                <div className="mt-4 text-center text-sm text-muted-foreground">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mx-auto mb-2"></div>
                  Processando áudio...
                </div>
              )}
            </Card>
          </>
        ) : (
          /* Feedback Screen */
          <SimulationFeedback
            simulationId={simulationId}
            onNewSimulation={() => window.location.reload()}
            onReturnToDashboard={() => window.location.href = '/dashboard'}
          />
        )}

        <OnboardingModal
          isOpen={showOnboarding}
          onClose={handleOnboardingClose}
          steps={examOnboardingSteps}
          title="Simulação do Dia da Prova"
          description="Aprenda como funciona o fluxo completo com 5 estações"
        />
      </div>
    </div>
  );
}

function AgentEventsListener({ 
  onPatientHandoff, 
  onStationComplete, 
  onModeratorReturn 
}: { 
  onPatientHandoff: () => void | Promise<void>;
  onStationComplete: (station: number) => void;
  onModeratorReturn: () => void;
}) {
  useEffect(() => {
    const es = new EventSource('/api/ui-events');
    es.onmessage = (e) => {
      try {
        const evt = JSON.parse(e.data || '{}');
        if (evt?.type === 'patient_handoff') onPatientHandoff();
        if (evt?.type === 'frontend_notification') {
          switch (evt.action) {
            case 'station_complete':
              onStationComplete(evt.payload.station);
              break;
            case 'moderator_return':
              onModeratorReturn();
              break;
          }
        }
      } catch {}
    };
    return () => es.close();
  }, [onPatientHandoff, onStationComplete, onModeratorReturn]);
  return null;
}


