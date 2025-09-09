import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { OnboardingModal, studyOnboardingSteps } from "@/components/OnboardingModal";
import { BackButton } from "@/components/BackButton";

const TEN_MINUTES = 10 * 60;
const TOTAL_STATIONS = 1;
const STUDY_AGENT_ID = import.meta.env.VITE_ELEVENLABS_AGENT_STUDY || "agent_STUDY_PLACEHOLDER";

function generateSimulationId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return (crypto as any).randomUUID();
  }
  return 'sim-' + Date.now();
}

export default function SimulationStudy() {
  const [step, setStep] = useState<"idle" | "running" | "finished">("idle");
  const [secondsLeft, setSecondsLeft] = useState<number>(TEN_MINUTES);
  const [currentStation, setCurrentStation] = useState<number>(1);
  const [finalFeedback, setFinalFeedback] = useState<string>("");
  const [simulationId] = useState<string>(() => generateSimulationId());
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const intervalRef = useRef<number | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingIdRef = useRef<string | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);

  const progress = useMemo(() => ((TEN_MINUTES - secondsLeft) / TEN_MINUTES) * 100, [secondsLeft]);

  useEffect(() => {
    // Mostrar onboarding na primeira visita ao modo estudos
    const hasSeenStudyOnboarding = localStorage.getItem('hasSeenStudyOnboarding');
    if (!hasSeenStudyOnboarding) {
      setShowOnboarding(true);
    }
  }, []);

  const handleOnboardingClose = () => {
    setShowOnboarding(false);
    localStorage.setItem('hasSeenStudyOnboarding', 'true');
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
      body: JSON.stringify({ simulationId, station, totalStations: TOTAL_STATIONS })
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
        if (json?.ok && json?.feedback) setFinalFeedback(String(json.feedback || ''));
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
              setStep("finished");
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
    setStep("finished");
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
            <h1 className="text-xl font-bold">Modo Estudos</h1>
            <p className="text-sm text-muted-foreground">Estação {currentStation} de {TOTAL_STATIONS} • {step === "running" ? "Em andamento" : "Preparação"}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowOnboarding(true)}
            className="text-xs"
          >
            Ver Tutorial
          </Button>
          {step === "running" && (
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">{formatTime(secondsLeft)}</div>
              <div className="text-xs text-muted-foreground">Tempo restante</div>
            </div>
          )}
        </div>

        <Card className="p-4 md:p-6">
          <div className="mb-6">
            <elevenlabs-convai agent-id={STUDY_AGENT_ID} position="inline" />
          </div>

          {step === "running" && (
            <div className="space-y-2 mb-6">
              <Progress value={progress} />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0-3 min: Anamnese + Exame físico</span>
                <span>3-7 min: Hipóteses e Condutas</span>
                <span>7-10 min: Finalização</span>
              </div>
              <div className="flex justify-center mt-4">
                <Button onClick={handleEndConsultation} variant="outline" size="sm" className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground">
                  Encerrar Consulta
                </Button>
              </div>
            </div>
          )}

          {step === "idle" && (
            <div className="mt-6 text-center">
              <Button onClick={handleStartTreatment} variant="medical" size="lg" className="px-8 py-3">
                Iniciar Atendimento
              </Button>
            </div>
          )}

          {step === "running" && isTranscribing && (
            <div className="text-center text-xs text-muted-foreground">Transcrevendo...</div>
          )}

          {step === "finished" && (
            <div className="mt-6 text-center">
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-primary mb-2">🎉 Estação Concluída!</h3>
                <p className="text-muted-foreground">Você concluiu a prática desta estação.</p>
              </div>
              {!!finalFeedback && (
                <div className="text-left max-w-3xl mx-auto mb-6 p-4 border border-border rounded-lg">
                  <style>{`.ok{color:#16a34a;font-weight:600}.miss{color:#dc2626;font-weight:600}`}</style>
                  <h4 className="font-semibold mb-2">Feedback</h4>
                  <div className="prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: finalFeedback }} />
                </div>
              )}
              <div className="space-y-2">
                <Button onClick={() => window.location.reload()} variant="medical">Praticar Outra Estação</Button>
                <Button onClick={() => window.location.href = '/dashboard'} variant="outline">Voltar ao Dashboard</Button>
              </div>
            </div>
          )}
        </Card>

        <OnboardingModal
          isOpen={showOnboarding}
          onClose={handleOnboardingClose}
          steps={studyOnboardingSteps}
          title="Modo Estudos"
          description="Aprenda como praticar uma estação por vez"
        />
      </div>
    </div>
  );
}


