import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { OnboardingModal, initialOnboardingSteps } from "@/components/OnboardingModal";
import { BackButton } from "@/components/BackButton";

export default function SimulationLanding() {
  const navigate = useNavigate();
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    // Verificar se é a primeira visita
    const hasSeenOnboarding = localStorage.getItem('hasSeenInitialOnboarding');
    if (!hasSeenOnboarding) {
      setShowOnboarding(true);
    }
  }, []);

  const handleOnboardingClose = () => {
    setShowOnboarding(false);
    localStorage.setItem('hasSeenInitialOnboarding', 'true');
  };

  const handleModeSelect = async (mode: 'exam' | 'study' | 'hybrid') => {
    if (mode === 'exam') {
      // Para modo exame, criar simulação com 5 estações aleatórias
      try {
        console.log('🎯 Criando simulação com 5 estações aleatórias...');
        
        const response = await fetch('/api/simulation/run', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Erro ao criar simulação');
        }

        const data = await response.json();
        
        if (data.ok) {
          console.log('✅ Simulação criada:', data.simulationId);
          console.log('📋 Estações sorteadas:', data.stations.map((s: any) => `${s.code} - ${s.name}`));
          
          // Navegar para a simulação com o ID gerado
          navigate(`/simulation/exam?simulationId=${data.simulationId}`);
        } else {
          throw new Error(data.message || 'Erro ao criar simulação');
        }
        
      } catch (error) {
        console.error('❌ Erro ao criar simulação:', error);
        // Fallback: navegar sem simulação pré-criada
        navigate('/simulation/exam');
      }
    } else if (mode === 'study') {
      navigate('/simulation/study');
    } else if (mode === 'hybrid') {
      navigate('/simulation/hybrid');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <BackButton className="mr-4" />
            <div className="flex-1">
              <h1 className="text-2xl font-bold">Simulação OSCE</h1>
              <p className="text-muted-foreground">Escolha um modo para começar</p>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowOnboarding(true)}
              className="text-sm"
            >
              Ver Tutorial
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 space-y-4">
            <div>
              <h2 className="text-lg font-semibold">Simulação do Dia da Prova</h2>
              <p className="text-sm text-muted-foreground">
                Fluxo completo com 5 estações aleatórias em sequência, controlado por um agente moderador multiagentes.
              </p>
            </div>
            <Button variant="medical" onClick={() => handleModeSelect('exam')}>
              Iniciar Simulação (5 estações)
            </Button>
          </Card>

          <Card className="p-6 space-y-4">
            <div>
              <h2 className="text-lg font-semibold">Modo Estudos</h2>
              <p className="text-sm text-muted-foreground">
                Treine uma estação por vez, sempre aleatória. Ideal para prática focada.
              </p>
            </div>
            <Button variant="outline" onClick={() => handleModeSelect('study')}>
              Iniciar Estudo (1 estação)
            </Button>
          </Card>

          <Card className="p-6 space-y-4">
            <div>
              <h2 className="text-lg font-semibold">Modo Híbrido</h2>
              <p className="text-sm text-muted-foreground">
                Treine entre usuários alternando papéis (médico/ator) com correção automática por IA.
              </p>
            </div>
            <Button variant="secondary" onClick={() => handleModeSelect('hybrid')}>
              Treinar com Colegas
            </Button>
          </Card>
        </div>

        <OnboardingModal
          isOpen={showOnboarding}
          onClose={handleOnboardingClose}
          steps={initialOnboardingSteps}
          title="Bem-vindo ao Revalida AI Coach"
          description="Aprenda como usar o sistema de simulação OSCE"
        />
      </div>
    </div>
  );
}


