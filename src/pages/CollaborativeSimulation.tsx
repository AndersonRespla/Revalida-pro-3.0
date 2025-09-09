import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { BackButton } from "@/components/BackButton";

const TEN_MINUTES = 10 * 60; // seconds

interface Station {
  id: string;
  name: string;
  description: string;
  checklist: any;
}

interface Simulation {
  id: string;
  code: string;
  status: string;
  total_stations: number;
  current_index: number;
}

type ExamType = "text" | "image";

interface ExamItem {
  id: string;
  title: string;
  type: ExamType;
  contentText?: string;
  imageUrl?: string;
  orderIndex: number;
}

interface CriterionOption {
  id: string;
  label: string; // Adequado, Parcialmente adequado, Inadequado
  points: number;
  description?: string;
}

interface CorrectionCriterion {
  id?: string;
  criterion: string;
  description: string;
  options: CriterionOption[];
  selectedOptionId?: string;
  notes?: string;
}

export default function CollaborativeSimulation() {
  const { code } = useParams<{ code: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const role = searchParams.get("role") || "actor"; // "actor" ou "doctor"
  
  console.log("CollaborativeSimulation - code:", code, "role:", role);
  
  const [simulation, setSimulation] = useState<Simulation | null>(null);
  const [currentStation, setCurrentStation] = useState<Station | null>(null);
  const [step, setStep] = useState<"welcome" | "running" | "finished" | "correction">("welcome");
  const [secondsLeft, setSecondsLeft] = useState<number>(TEN_MINUTES);
  const [isStarted, setIsStarted] = useState<boolean>(false);
  const [participants, setParticipants] = useState<Array<{role: string, joined_at: string}>>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Exames da estação corrente
  const [exams, setExams] = useState<ExamItem[]>([]);
  const [releasedExams, setReleasedExams] = useState<ExamItem[]>([]);
  const [stationInfo, setStationInfo] = useState<{ participant_info?: string; actor_info?: string } | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  // Estados para correção
  const [criteria, setCriteria] = useState<CorrectionCriterion[]>([]);
  const [totalScore, setTotalScore] = useState<number>(0);
  const [correctionNotes, setCorrectionNotes] = useState<string>("");
  
  // Estados para múltiplas estações
  const [allStations, setAllStations] = useState<Station[]>([]);
  const [currentStationIndex, setCurrentStationIndex] = useState<number>(0);

  const intervalRef = useRef<number | null>(null);

  const progress = useMemo(() => ((TEN_MINUTES - secondsLeft) / TEN_MINUTES) * 100, [secondsLeft]);

  // Carregar dados da simulação
  useEffect(() => {
    async function loadSimulation() {
      if (!code) {
        setError("Código da simulação não fornecido");
        setLoading(false);
        return;
      }
      
      try {
        console.log("Buscando simulação com código:", code);
        
        // Buscar simulação
        const { data: sim, error } = await supabase
          .from("simulations" as any)
          .select("*")
          .eq("code", code)
          .single();

        if (error) {
          console.error("Erro ao buscar simulação:", error);
          setError(`Erro ao buscar simulação: ${error.message}`);
          setLoading(false);
          return;
        }
        
        console.log("Simulação carregada:", sim);
        setSimulation(sim as any);

        // Buscar estação atual (sempre buscar a primeira estação para carregar critérios)
        const { data: stationData } = await supabase
          .from("simulation_stations" as any)
          .select(`
            station_id,
            stations (
              id,
              name,
              description,
              checklist
            )
          `)
          .eq("simulation_id", (sim as any).id)
          .eq("order_index", 1) // Sempre buscar a primeira estação
          .single();

        if ((stationData as any)?.stations) {
          setCurrentStation((stationData as any).stations);
          // Preparar exames a partir do checklist da estação (Supabase)
          const station = (stationData as any).stations as any;
          const payload = station?.checklist ?? {};
          setStationInfo({ participant_info: payload.participant_info, actor_info: payload.actor_info });
          
          // Carregar critérios (suporta options Adequado/Parcial/Inadequado)
          if (payload?.criteria && Array.isArray(payload.criteria)) {
            console.log("Critérios encontrados:", payload.criteria);
            const criteriaList: CorrectionCriterion[] = payload.criteria.map((c: any) => {
              const hasOptions = Array.isArray(c.options) && c.options.length > 0;
              const options: CriterionOption[] = hasOptions
                ? c.options.map((o: any) => ({ id: String(o.id ?? `${Date.now()}-${Math.random()}`), label: String(o.label ?? ""), points: Number(o.points ?? 0), description: o.description ? String(o.description) : undefined }))
                : [
                    { id: "opt-adequado", label: "Adequado", points: Number(c.max_score ?? 1), description: c.description },
                    { id: "opt-parcial", label: "Parcialmente adequado", points: Math.max(0, Number(((c.max_score ?? 1) / 2).toFixed(2))), description: c.description },
                    { id: "opt-inadequado", label: "Inadequado", points: 0, description: c.description },
                  ];
              return {
                id: c.id ? String(c.id) : undefined,
                criterion: String(c.title ?? c.criterion ?? ""),
                description: String(c.instruction ?? c.description ?? ""),
                options,
                selectedOptionId: undefined,
                notes: "",
              } as CorrectionCriterion;
            });
            setCriteria(criteriaList);
            setTotalScore(0);
            console.log("Critérios carregados:", criteriaList);
          } else {
            console.log("Nenhum critério encontrado em payload:", payload);
          }
          
          const stationExams: ExamItem[] = Array.isArray(payload?.exams)
        ? (payload.exams as any[]).map((e: any, idx: number) => ({
            id: e.id ?? `e${idx + 1}`,
            title: e.title ?? `Exame ${idx + 1}`,
            type: (e.type as ExamType) ?? "text",
            contentText: e.contentText,
            imageUrl: e.imageUrl,
            orderIndex: e.orderIndex ?? idx + 1
          }))
        : [];
          setExams(stationExams);
          
          // Carregar exames já liberados apenas se simulação estiver em andamento
          if ((sim as any).current_index > 0) {
            await loadReleasedExams((sim as any).id, (sim as any).current_index, stationExams);
          }
        } else {
          console.log("Nenhuma estação encontrada para simulação:", (sim as any).id);
        }

        // Buscar participantes
        const { data: participantsData } = await supabase
          .from("simulation_participants" as any)
          .select("role, joined_at")
          .eq("simulation_id", (sim as any).id);

        if (participantsData) {
          const unique = Array.from(new Map((participantsData as any[]).map((p: any) => [p.role, p])).values());
          setParticipants(unique as any);
        }

        setLoading(false);
      } catch (error) {
        console.error("Erro ao carregar simulação:", error);
        setError(`Erro inesperado: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
        setLoading(false);
      }
    }

    loadSimulation();
  }, [code]);

  // Registrar participante
  useEffect(() => {
    async function registerParticipant() {
      if (!simulation || !role) return;

      try {
        const { data, error } = await supabase
          .from("simulation_participants" as any)
          .upsert(
            {
              simulation_id: (simulation as any).id,
              role,
              joined_at: new Date().toISOString()
            } as any,
            { onConflict: "simulation_id,role", ignoreDuplicates: true } as any
          );

        if (error) {
          console.error("Erro específico ao registrar participante:", error);
          // Não mostrar erro para o usuário, só logar
          return;
        }

        console.log("Participante registrado com sucesso:", data);
      } catch (error) {
        console.error("Erro inesperado ao registrar participante:", error);
        // Falha silenciosa - não impacta a experiência do usuário
      }
    }

    // Registrar com delay para evitar muitas tentativas simultâneas
    const timeout = setTimeout(registerParticipant, 500);
    return () => clearTimeout(timeout);
  }, [simulation, role]);

  // Sincronização em tempo real - verificar mudanças na simulação
  useEffect(() => {
    if (!simulation) return;

    const syncInterval = window.setInterval(async () => {
      try {
        // Verificar se a simulação foi iniciada por outro participante
        const { data: currentSim, error } = await supabase
          .from("simulations" as any)
          .select("status, current_index")
          .eq("id", simulation.id)
          .single();

        if (error) {
          console.error("Erro ao sincronizar simulação:", error);
          return;
        }

        // Se a simulação foi iniciada, atualizar o estado local
        if ((currentSim as any).status === "in_progress" && step === "welcome") {
          console.log("Simulação foi iniciada por outro participante!");
          setIsStarted(true);
          setStep("running");
        }
        
        // Se a simulação foi encerrada, ir para correção
        if ((currentSim as any).status === "completed" && step === "running") {
          console.log("Simulação foi encerrada por outro participante!");
          setStep("correction");
          setIsStarted(false);
          
          // Carregar critérios se ainda não foram carregados
          if (criteria.length === 0 && currentStation?.checklist?.criteria) {
            const stationChecklist = currentStation.checklist;
            const criteriaList = stationChecklist.criteria.map((c: any) => ({
              criterion: c.criterion || "",
              max_score: c.max_score || 0,
              description: c.description || "",
              score: 0,
              notes: ""
            }));
            setCriteria(criteriaList);
            setTotalScore(0);
          }
        }

        // Atualizar estado local da simulação (status e índice corrente)
        setSimulation((prev: any) => prev ? { ...prev, status: (currentSim as any).status, current_index: (currentSim as any).current_index } : prev);

        // Carregar estação atual se houver índice definido e simulação não foi encerrada
        if ((currentSim as any).current_index && (currentSim as any).current_index > 0 && (currentSim as any).status !== "completed") {
          const { data: stationData } = await supabase
            .from("simulation_stations" as any)
            .select(`
              station_id,
              stations (
                id,
                name,
                description,
                checklist
              )
            `)
            .eq("simulation_id", (simulation as any).id)
            .eq("order_index", (currentSim as any).current_index)
            .single();

          if ((stationData as any)?.stations) {
            setCurrentStation((stationData as any).stations);
            const station = (stationData as any).stations as any;
            const payload = station?.checklist ?? {};
            setStationInfo({ participant_info: payload.participant_info, actor_info: payload.actor_info });
            
            // Carregar critérios de correção
            if (payload?.criteria && Array.isArray(payload.criteria)) {
              const criteriaList = payload.criteria.map((c: any) => ({
                criterion: c.criterion || "",
                max_score: c.max_score || 0,
                description: c.description || "",
                score: 0,
                notes: ""
              }));
              setCriteria(criteriaList);
              setTotalScore(0);
            }
            
            const stationExams: ExamItem[] = Array.isArray(payload?.exams)
          ? (payload.exams as any[]).map((e: any, idx: number) => ({
              id: e.id ?? `e${idx + 1}`,
              title: e.title ?? `Exame ${idx + 1}`,
              type: (e.type as ExamType) ?? "text",
              contentText: e.contentText,
              imageUrl: e.imageUrl,
              orderIndex: e.orderIndex ?? idx + 1
            }))
          : [];
        setExams(stationExams);
        await loadReleasedExams((simulation as any).id, (currentSim as any).current_index, stationExams);
          }
        }

        // Verificar novos participantes
        const { data: newParticipants } = await supabase
          .from("simulation_participants" as any)
          .select("role, joined_at")
          .eq("simulation_id", simulation.id);

        if (newParticipants) {
          const unique = Array.from(new Map((newParticipants as any[]).map((p: any) => [p.role, p])).values());
          if (unique.length !== participants.length) {
            console.log("Participantes (dedupe):", unique);
            setParticipants(unique as any);
          }
        }

        // Sincronizar exames liberados (apenas se simulação não foi encerrada)
        if ((simulation as any).id && (simulation as any).current_index && (currentSim as any).status !== "completed") {
          await loadReleasedExams((simulation as any).id, (simulation as any).current_index, exams);
        }

      } catch (error) {
        console.error("Erro na sincronização:", error);
      }
    }, 2000); // Verificar a cada 2 segundos

    return () => {
      clearInterval(syncInterval);
    };
  }, [simulation, step, participants.length]);

  // Timer
  useEffect(() => {
    if (!isStarted || step !== "running") return;

    intervalRef.current = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setStep("finished");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isStarted, step]);

  // Função para carregar todas as estações da simulação
  async function loadAllStations() {
    if (!simulation) return;
    
    try {
      const { data: stationsData, error } = await supabase
        .from("simulation_stations" as any)
        .select(`
          station_id,
          order_index,
          stations (
            id,
            name,
            description,
            checklist
          )
        `)
        .eq("simulation_id", simulation.id)
        .order("order_index");

      if (error) {
        console.error("Erro ao carregar estações:", error);
        return;
      }

      if (stationsData) {
        const stations = stationsData.map((item: any) => item.stations).filter(Boolean);
        setAllStations(stations);
        console.log("Todas as estações carregadas:", stations);
      }
    } catch (error) {
      console.error("Erro ao carregar estações:", error);
    }
  }

  async function endSimulation() {
    if (!simulation || !currentStation) return;
    
    try {
      // Parar o timer
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      
      // Atualizar status da simulação para "completed"
      const { error } = await supabase
        .from("simulations" as any)
        .update({ 
          status: "completed", 
          completed_at: new Date().toISOString() 
        })
        .eq("id", simulation.id);

      if (error) {
        console.error("Erro ao encerrar simulação:", error);
        alert(`Erro ao encerrar simulação: ${error.message}`);
        return;
      }

      // Carregar todas as estações da simulação
      await loadAllStations();

      // Carregar critérios de correção da estação atual
      const stationChecklist = currentStation.checklist;
      console.log("endSimulation - stationChecklist:", stationChecklist);
      console.log("endSimulation - criteria:", stationChecklist?.criteria);
      
      if (stationChecklist?.criteria && Array.isArray(stationChecklist.criteria)) {
        console.log("endSimulation - Critérios encontrados:", stationChecklist.criteria);
        const criteriaList = stationChecklist.criteria.map((c: any) => ({
          criterion: c.criterion || "",
          max_score: c.max_score || 0,
          description: c.description || "",
          score: 0,
          notes: ""
        }));
        setCriteria(criteriaList);
        setTotalScore(0);
        console.log("endSimulation - Critérios mapeados:", criteriaList);
      } else {
        console.log("endSimulation - Nenhum critério encontrado ou não é array");
        console.log("endSimulation - Tipo de criteria:", typeof stationChecklist?.criteria);
      }

      // Ir para modo correção
      setStep("correction");
      setIsStarted(false);
      
      console.log("Simulação encerrada com sucesso!");
    } catch (error) {
      console.error("Erro ao encerrar simulação:", error);
      alert(`Erro inesperado: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  async function startSimulation() {
    console.log("startSimulation chamada!");
    console.log("simulation:", simulation);
    console.log("simulation?.id:", simulation?.id);
    
    try {
      // Atualizar status da simulação no banco
      const { data, error } = await supabase
        .from("simulations" as any)
        .update({ status: "in_progress", current_index: (simulation as any).current_index || 1 })
        .eq("id", simulation?.id);

      console.log("Resultado da atualização:", { data, error });

      if (error) {
        console.error("Erro ao atualizar status da simulação:", error);
        alert(`Erro ao iniciar simulação: ${error.message}`);
        return;
      }

      // Atualizar estado local
      setIsStarted(true);
      setStep("running");
      setSimulation((prev: any) => prev ? { ...prev, status: "in_progress", current_index: prev.current_index || 1 } : prev);

      // Carregar estação atual (início na 1ª estação)
      const currentIdx = (simulation as any).current_index || 1;
      const { data: stationData } = await supabase
        .from("simulation_stations" as any)
        .select(`
          station_id,
          stations (
            id,
            name,
            description,
            checklist
          )
        `)
        .eq("simulation_id", (simulation as any).id)
        .eq("order_index", currentIdx)
        .single();

      if ((stationData as any)?.stations) {
        setCurrentStation((stationData as any).stations);
        const station = (stationData as any).stations as any;
        const payload = station?.checklist ?? {};
        setStationInfo({ participant_info: payload.participant_info, actor_info: payload.actor_info });
        
        // Carregar critérios de correção
        if (payload?.criteria && Array.isArray(payload.criteria)) {
          const criteriaList = payload.criteria.map((c: any) => ({
            criterion: c.criterion || "",
            max_score: c.max_score || 0,
            description: c.description || "",
            score: 0,
            notes: ""
          }));
          setCriteria(criteriaList);
          setTotalScore(0);
        }
        
        const stationExams: ExamItem[] = Array.isArray(payload?.exams)
          ? (payload.exams as any[]).map((e: any, idx: number) => ({
              id: e.id ?? `e${idx + 1}`,
              title: e.title ?? `Exame ${idx + 1}`,
              type: (e.type as ExamType) ?? "text",
              contentText: e.contentText,
              imageUrl: e.imageUrl,
              orderIndex: e.orderIndex ?? idx + 1
            }))
          : [];
        setExams(stationExams);
        await loadReleasedExams((simulation as any).id, currentIdx, stationExams);
      }
      
      console.log("Simulação iniciada com sucesso!");
      alert("Simulação iniciada com sucesso!");
    } catch (error) {
      console.error("Erro ao iniciar simulação:", error);
      alert(`Erro inesperado: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  function copyCode() {
    if (simulation?.code) {
      navigator.clipboard.writeText(simulation.code);
    }
  }

  function openImageModal(imageUrl: string) {
    setSelectedImage(imageUrl);
  }

  function closeImageModal() {
    setSelectedImage(null);
  }

  // Funções para correção
  function updateCriterionScore(index: number, score: number) {
    const newCriteria = [...criteria];
    // compat: manter função antiga caso input manual exista
    const opt = newCriteria[index].options?.find(o => o.points === score);
    newCriteria[index].selectedOptionId = opt ? opt.id : newCriteria[index].selectedOptionId;
    setCriteria(newCriteria);
    const total = newCriteria.reduce((sum, c) => {
      const sel = c.options?.find(o => o.id === c.selectedOptionId);
      return sum + (sel ? sel.points : 0);
    }, 0);
    setTotalScore(total);
  }

  function updateCriterionSelection(index: number, optionId: string) {
    const updated = [...criteria];
    updated[index].selectedOptionId = optionId;
    setCriteria(updated);
    const total = updated.reduce((sum, c) => {
      const opt = c.options.find(o => o.id === c.selectedOptionId);
      return sum + (opt ? opt.points : 0);
    }, 0);
    setTotalScore(total);
  }

  // Funções para navegar entre estações
  function goToStation(stationIndex: number) {
    if (stationIndex >= 0 && stationIndex < allStations.length) {
      setCurrentStationIndex(stationIndex);
      const station = allStations[stationIndex];
      setCurrentStation(station);
      
      // Atualizar informações da estação
      const payload = station?.checklist ?? {};
      setStationInfo({ 
        participant_info: payload.participant_info, 
        actor_info: payload.actor_info 
      });
      
      // Carregar exames da estação
      const stationExams: ExamItem[] = Array.isArray(payload?.exams)
        ? (payload.exams as any[]).map((e: any, idx: number) => ({
            id: e.id ?? `e${idx + 1}`,
            title: e.title ?? `Exame ${idx + 1}`,
            type: (e.type as ExamType) ?? "text",
            contentText: e.contentText,
            imageUrl: e.imageUrl,
            orderIndex: e.orderIndex ?? idx + 1
          }))
        : [];
      setExams(stationExams);
      
      // Carregar critérios da estação
      if (payload?.criteria && Array.isArray(payload.criteria)) {
        const criteriaList = payload.criteria.map((c: any) => ({
          criterion: c.criterion || "",
          max_score: c.max_score || 0,
          description: c.description || "",
          score: 0,
          notes: ""
        }));
        setCriteria(criteriaList);
        setTotalScore(0);
      }
    }
  }

  function nextStation() {
    if (currentStationIndex < allStations.length - 1) {
      goToStation(currentStationIndex + 1);
    }
  }

  function previousStation() {
    if (currentStationIndex > 0) {
      goToStation(currentStationIndex - 1);
    }
  }

  async function saveCorrection() {
    if (!simulation) return;
    
    try {
      // Salvar correção no banco
      const { error } = await supabase
        .from("simulations" as any)
        .update({
          score: totalScore,
          feedback: JSON.stringify({
            criteria: criteria,
            totalScore: totalScore,
            correctedAt: new Date().toISOString(),
            correctedBy: role
          })
        })
        .eq("id", simulation.id);

      if (error) {
        console.error("Erro ao salvar correção:", error);
        alert(`Erro ao salvar correção: ${error.message}`);
        return;
      }

      console.log("Correção salva:", { criteria, totalScore });
      
      // Redirecionar para o dashboard
      navigate("/dashboard");
    } catch (error) {
      console.error("Erro ao salvar correção:", error);
      alert(`Erro inesperado: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  function goToNewSimulation() {
    // Redirecionar para página de escolha das estações (modo colaborativo)
    navigate("/dashboard/collaborative");
  }



  async function loadReleasedExams(simId: string, stationOrder: number, all: ExamItem[]) {
    try {
      const { data } = await supabase
        .from("simulation_exam_releases" as any)
        .select("exam_id,payload")
        .eq("simulation_id", simId)
        .eq("station_order", stationOrder);
      
      if (data && data.length > 0) {
        // Usar o payload completo do banco ou encontrar o exame original
        const releasedExams = data.map((release: any) => {
          // Se o payload tem dados completos, usar ele
          if (release.payload && release.payload.id) {
            return release.payload as ExamItem;
          }
          // Senão, buscar no array original de exames
          const originalExam = all.find(e => e.id === release.exam_id);
          return originalExam;
        }).filter(Boolean) as ExamItem[];
        
        setReleasedExams(releasedExams);
      } else {
        setReleasedExams([]);
      }
    } catch (e) {
      console.error("Erro ao carregar exames liberados:", e);
      setReleasedExams([]);
    }
  }

  async function releaseExam(exam: ExamItem) {
    if (!simulation) return;
    try {
      await supabase
        .from("simulation_exam_releases" as any)
        .upsert({
          simulation_id: (simulation as any).id,
          station_order: (simulation as any).current_index || 1,
          exam_id: exam.id,
          payload: exam
        } as any, { onConflict: "simulation_id,station_order,exam_id", ignoreDuplicates: true } as any);
      // Atualizar localmente
      setReleasedExams((prev) => {
        const has = prev.some((e) => e.id === exam.id);
        return has ? prev : [...prev, exam].sort((a, b) => a.orderIndex - b.orderIndex);
      });
    } catch (e) {
      console.error("Erro ao liberar exame:", e);
      alert("Falha ao liberar exame");
    }
  }

  // Tela de carregamento
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Carregando simulação...</h1>
          <p className="text-muted-foreground">Código da URL: {code}</p>
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">Debug:</p>
            <p className="text-sm">Role: {role}</p>
            <p className="text-sm">Code param: {code}</p>
            <p className="text-sm">Loading: {loading ? 'true' : 'false'}</p>
          </div>
        </div>
      </div>
    );
  }

  // Tela de erro
  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4 text-red-600">Erro ao carregar simulação</h1>
          <p className="text-muted-foreground mb-4">{error}</p>
          <p className="text-sm text-muted-foreground">Código tentado: {code}</p>
          <div className="mt-6">
            <Button onClick={() => window.location.reload()}>
              Tentar novamente
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Verificar se a simulação foi carregada
  if (!simulation) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Simulação não encontrada</h1>
          <p className="text-muted-foreground">Código: {code}</p>
          <p className="text-sm text-muted-foreground mt-2">
            Verifique se o código está correto ou se a simulação foi criada.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <BackButton className="mr-4" />
            <div className="flex-1">
              <h1 className="text-3xl font-bold">Simulação Colaborativa</h1>
              <div className="flex items-center gap-2 mt-2">
                <p className="text-muted-foreground">Código: <span className="font-mono font-bold text-lg">{simulation.code}</span></p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={copyCode}
                  className="ml-2"
                >
                  Copiar
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">ID: {simulation.id}</p>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant={role === "doctor" ? "default" : "secondary"}>
                {role === "doctor" ? "Médico" : "Ator/Atriz"}
              </Badge>
              <Badge variant="outline">
                {step === "correction" ? "Modo Correção" : `Estação ${simulation.current_index || 1} de ${simulation.total_stations}`}
              </Badge>
            </div>
          </div>

          {/* Participantes */}
          <div className="flex gap-2">
            {participants.map((p, idx) => (
              <Badge key={idx} variant="outline">
                {p.role === "doctor" ? "Médico" : "Ator/Atriz"}
              </Badge>
            ))}
          </div>
        </div>

        {/* Conteúdo principal */}
        {step === "welcome" && (
          <Card className="card-medical p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Bem-vindo à Simulação!</h2>
            
            {role === "doctor" ? (
              <div className="space-y-4">
                <p className="text-lg">
                  Você é o <strong>médico</strong> responsável por conduzir esta estação.
                </p>
                <p className="text-muted-foreground">
                  Você deve iniciar a simulação quando estiver pronto para começar.
                </p>
                <div className="mt-6">
                  <Button 
                    onClick={() => {
                      console.log("Botão clicado!");
                      startSimulation();
                    }} 
                    size="lg"
                    disabled={!simulation}
                  >
                    Iniciar Simulação
                  </Button>
                  <p className="text-sm text-muted-foreground mt-2">
                    Debug: simulation={simulation ? 'loaded' : 'null'}, step={step}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="card-medical border rounded-lg p-4 mb-4">
                  <h3 className="font-semibold text-primary mb-2">📋 Código da Simulação</h3>
                  <p className="text-muted-foreground mb-2">
                    Compartilhe este código com o médico para que ele possa entrar na simulação:
                  </p>
                  <div className="bg-white border border-blue-300 rounded p-3">
                    <span className="font-mono font-bold text-2xl text-blue-900">{simulation.code}</span>
                  </div>
                  <Button 
                    onClick={copyCode} 
                    variant="outline" 
                    size="sm" 
                    className="mt-2"
                  >
                    📋 Copiar Código
                  </Button>
                </div>
                
                                 <p className="text-lg">
                   Você é o <strong>ator/atriz</strong> que interpretará o paciente.
                 </p>
                 <p className="text-muted-foreground">
                   Aguarde o médico entrar com o código e iniciar a simulação.
                 </p>
                 
                 {/* Status dos participantes */}
                 <div className="mt-4 p-4 bg-muted rounded-lg">
                   <h4 className="font-semibold mb-2">Participantes na Sala:</h4>
                   <div className="flex gap-2 flex-wrap">
                     {participants.map((p, idx) => (
                       <Badge key={idx} variant={p.role === "doctor" ? "default" : "secondary"}>
                         {p.role === "doctor" ? "👨‍⚕️ Médico" : "🎭 Ator/Atriz"}
                       </Badge>
                     ))}
                   </div>
                   {participants.length === 1 && (
                     <p className="text-sm text-muted-foreground mt-2">
                       Aguardando o médico entrar...
                     </p>
                   )}
                   {participants.length > 1 && (
                     <p className="text-sm text-green-600 mt-2">
                       ✅ Médico conectado! Aguardando início da simulação...
                     </p>
                   )}
                 </div>
                 
                 <div className="mt-6">
                   <Badge variant="secondary" className="text-lg px-4 py-2">
                     {participants.length > 1 ? "Médico conectado!" : "Aguardando médico..."}
                   </Badge>
                 </div>
              </div>
            )}
          </Card>
        )}

        {step === "running" && (
          <div className="space-y-6">
            {/* Notificação de início */}
            <Card className="card-medical p-4">
              <div className="flex items-center gap-2 text-secondary">
                <span className="text-2xl">🎬</span>
                <div>
                  <h3 className="font-semibold">Simulação Iniciada!</h3>
                  <p className="text-sm">O médico iniciou a simulação. Boa sorte!</p>
                </div>
              </div>
            </Card>
            
            {/* Timer e Progresso */}
            <Card className="card-medical p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">Tempo Restante</h3>
                <span className="text-3xl font-mono font-bold text-primary">
                  {formatTime(secondsLeft)}
                </span>
              </div>
              <Progress value={progress} className="h-3" />
              
              {/* Botão Encerrar Simulação */}
              <div className="mt-4 flex justify-center">
                <Button 
                  onClick={endSimulation}
                  variant="destructive"
                  size="lg"
                  className="px-8"
                >
                  🏁 Encerrar Simulação
                </Button>
              </div>
              <p className="text-sm text-muted-foreground text-center mt-2">
                Clique para encerrar a simulação e ir para correção
              </p>
            </Card>

            {/* Conteúdo da Estação */}
            {currentStation && (
              <Card className="card-medical p-6">
                <h3 className="text-xl font-semibold mb-4">{currentStation.name}</h3>
                
                {role === "doctor" ? (
                  <div className="space-y-6">
                    <div>
                      <h4 className="font-semibold mb-2">Informações ao Participante</h4>
                      <p className="text-muted-foreground whitespace-pre-wrap">{stationInfo?.participant_info || ""}</p>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h4 className="font-semibold mb-2">Exames Liberados</h4>
                      {releasedExams.length === 0 ? (
                        <p className="text-muted-foreground">Nenhum exame foi liberado ainda.</p>
                      ) : (
                        <div className="space-y-3">
                          {releasedExams.map((ex) => (
                            <Card key={ex.id} className="p-4">
                              <h5 className="font-medium">{ex.title}</h5>
                              {ex.type === 'text' ? (
                                <p className="text-muted-foreground mt-2 whitespace-pre-wrap">{ex.contentText}</p>
                              ) : (
                                ex.imageUrl ? (
                                  <div className="mt-2">
                                    <img 
                                      src={ex.imageUrl} 
                                      className="max-h-72 object-contain cursor-pointer hover:opacity-80 transition-opacity" 
                                      onClick={() => openImageModal(ex.imageUrl!)}
                                      alt={`Exame: ${ex.title}`}
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">Clique na imagem para ampliar</p>
                                  </div>
                                ) : (
                                  <p className="text-muted-foreground">Imagem não disponível</p>
                                )
                              )}
                            </Card>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div>
                      <h4 className="font-semibold mb-2">Informações ao Ator</h4>
                      <p className="text-muted-foreground whitespace-pre-wrap">{stationInfo?.actor_info || ""}</p>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h4 className="font-semibold mb-2">Exames Disponíveis</h4>
                      {exams.length === 0 ? (
                        <p className="text-muted-foreground">Nenhum exame cadastrado para esta estação ainda.</p>
                      ) : (
                        <div className="space-y-3">
                          {exams.map((ex) => {
                            const isReleased = releasedExams.some((r) => r.id === ex.id);
                            return (
                              <Card key={ex.id} className="p-4">
                                <div className="flex items-center justify-between">
                                  <h5 className="font-medium">{ex.title}</h5>
                                  <Button size="sm" disabled={isReleased} onClick={() => releaseExam(ex)}>
                                    {isReleased ? 'Liberado' : 'Liberar exame'}
                                  </Button>
                                </div>
                                {ex.type === 'text' ? (
                                  <p className="text-muted-foreground mt-2 whitespace-pre-wrap">{ex.contentText}</p>
                                ) : (
                                  ex.imageUrl ? (
                                    <div className="mt-2">
                                      <img 
                                        src={ex.imageUrl} 
                                        className="max-h-72 object-contain cursor-pointer hover:opacity-80 transition-opacity" 
                                        onClick={() => openImageModal(ex.imageUrl!)}
                                        alt={`Exame: ${ex.title}`}
                                      />
                                      <p className="text-xs text-muted-foreground mt-1">Clique na imagem para ampliar</p>
                                    </div>
                                  ) : (
                                    <p className="text-muted-foreground">Imagem não disponível</p>
                                  )
                                )}
                              </Card>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            )}
          </div>
        )}

        {step === "finished" && (
          <Card className="card-medical p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Simulação Finalizada!</h2>
            <p className="text-muted-foreground mb-6">
              O tempo de 10 minutos foi concluído.
            </p>
            <Button onClick={() => window.location.reload()}>
              Nova Simulação
            </Button>
          </Card>
        )}

        {step === "correction" && (
          <div className="space-y-6">
            {/* Header da Correção */}
            <Card className="card-medical p-6">
              <div className="flex items-center gap-3 text-primary">
                <span className="text-3xl">📝</span>
                <div>
                  <h2 className="text-2xl font-bold">Correção do gabarito</h2>
                  <p className="text-lg">Selecione a opção para cada critério</p>
                </div>
              </div>
            </Card>

            {/* Navegação entre estações (apenas se houver múltiplas) */}
            {allStations.length > 1 && (
              <Card className="card-medical p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <h3 className="text-lg font-semibold text-primary">
                      Estação {currentStationIndex + 1} de {allStations.length}
                    </h3>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={previousStation}
                        disabled={currentStationIndex === 0}
                        className="flex items-center gap-2"
                      >
                        ← Anterior
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={nextStation}
                        disabled={currentStationIndex === allStations.length - 1}
                        className="flex items-center gap-2"
                      >
                        Próxima →
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Ir para:</span>
                    <select
                      value={currentStationIndex}
                      onChange={(e) => goToStation(parseInt(e.target.value))}
                      className="px-3 py-1 border border-blue-300 rounded text-sm bg-white"
                    >
                      {allStations.map((station, index) => (
                        <option key={station.id} value={index}>
                          Estação {index + 1}: {station.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </Card>
            )}

            {/* Resumo da Estação */}
            <Card className="card-medical p-6">
              <h3 className="text-xl font-semibold mb-4">📋 Estação: {currentStation?.name}</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-2">Informações ao Participante</h4>
                  <p className="text-muted-foreground whitespace-pre-wrap">{stationInfo?.participant_info || ""}</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Informações ao Ator</h4>
                  <p className="text-muted-foreground whitespace-pre-wrap">{stationInfo?.actor_info || ""}</p>
                </div>
              </div>
            </Card>

            {/* Critérios com opções PEP */}
            <Card className="card-medical p-6">
              <h3 className="text-xl font-semibold mb-4">🎯 Critérios de Avaliação</h3>
              {criteria.length === 0 ? (
                <p className="text-muted-foreground">Nenhum critério de correção definido para esta estação.</p>
              ) : (
                <div className="space-y-4">
                  {criteria.map((criterion, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold">{criterion.criterion}</h4>
                        <span className="text-sm text-muted-foreground">
                          Selecionado: {(criterion.options?.find(o => o.id === criterion.selectedOptionId)?.points ?? 0)} pontos
                        </span>
                      </div>
                      <p className="text-muted-foreground">{criterion.description}</p>

                      <RadioGroup
                        value={criterion.selectedOptionId || ""}
                        onValueChange={(val) => updateCriterionSelection(index, val)}
                        className="grid md:grid-cols-3 gap-3"
                      >
                        {(criterion.options ?? []).map((opt) => (
                          <label key={opt.id} className="flex items-start gap-3 p-3 border rounded-md cursor-pointer hover:bg-muted/50">
                            <RadioGroupItem value={opt.id} id={`${criterion.criterion}-${opt.id}`} />
                            <div>
                              <Label htmlFor={`${criterion.criterion}-${opt.id}`} className="font-medium">
                                {opt.label} ({opt.points} pts)
                              </Label>
                              {opt.description && (
                                <p className="text-xs text-muted-foreground mt-1">{opt.description}</p>
                              )}
                            </div>
                          </label>
                        ))}
                                             </RadioGroup>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Resumo da Pontuação */}
            <Card className="card-medical p-6">
              <div className="text-center">
                <h3 className="text-xl font-semibold mb-2">🏆 Pontuação Total</h3>
                <div className="text-4xl font-bold text-green-600 mb-4">
                  {totalScore} pontos
                </div>
                <p className="text-green-700">
                  Máximo possível: {(criteria ?? []).reduce((sum, c) => sum + (Math.max(...(c.options?.map(o => o.points) || [0]))), 0)} pontos
                </p>
              </div>
            </Card>

            {/* Ações */}
            <Card className="card-medical p-6">
              <div className="flex gap-4 justify-center">
                <Button onClick={saveCorrection} size="lg" className="px-8">
                  💾 Salvar Correção
                </Button>
                <Button onClick={goToNewSimulation} variant="outline" size="lg" className="px-8">
                  🔄 Nova Simulação
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Modal de Imagem Ampliada */}
        {selectedImage && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
            onClick={closeImageModal}
          >
            <div className="relative max-w-4xl max-h-full">
              <img 
                src={selectedImage} 
                className="max-w-full max-h-full object-contain"
                alt="Imagem ampliada do exame"
                onClick={(e) => e.stopPropagation()}
              />
              <Button
                variant="outline"
                size="sm"
                className="absolute top-2 right-2 bg-white hover:bg-gray-100"
                onClick={closeImageModal}
              >
                ✕ Fechar
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
