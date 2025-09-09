import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, ChevronLeft, X, Play, Users, BookOpen, Clock, Mic, Brain } from "lucide-react";

interface OnboardingStep {
  title: string;
  content: React.ReactNode;
  icon?: React.ReactNode;
}

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  steps: OnboardingStep[];
  title: string;
  description?: string;
}

export function OnboardingModal({ isOpen, onClose, steps, title, description }: OnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
    }
  }, [isOpen]);

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const skipOnboarding = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl font-bold">{title}</DialogTitle>
              {description && (
                <p className="text-muted-foreground mt-2">{description}</p>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={skipOnboarding}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress indicator */}
          <div className="flex items-center justify-center space-x-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-2 w-8 rounded-full transition-colors ${
                  index <= currentStep ? "bg-primary" : "bg-muted"
                }`}
              />
            ))}
          </div>

          {/* Current step content */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                {steps[currentStep].icon && (
                  <div className="flex-shrink-0 p-2 bg-primary/10 rounded-lg">
                    {steps[currentStep].icon}
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-3">
                    {steps[currentStep].title}
                  </h3>
                  <div className="text-muted-foreground">
                    {steps[currentStep].content}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Navigation buttons */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 0}
              className="flex items-center space-x-2"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Anterior</span>
            </Button>

            <div className="flex items-center space-x-2">
              <Button variant="ghost" onClick={skipOnboarding}>
                Pular
              </Button>
              <Button onClick={nextStep} className="flex items-center space-x-2">
                <span>{currentStep === steps.length - 1 ? "Começar" : "Próximo"}</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Onboarding steps para a página inicial
export const initialOnboardingSteps: OnboardingStep[] = [
  {
    title: "Bem-vindo ao Revalida AI Coach",
    content: (
      <div className="space-y-3">
        <p>
          Este é um sistema de simulação OSCE (Objective Structured Clinical Examination) 
          que utiliza inteligência artificial para criar experiências de treinamento médico realistas.
        </p>
        <div className="flex items-center space-x-2">
          <Badge variant="secondary">IA Conversacional</Badge>
          <Badge variant="secondary">Gravação de Áudio</Badge>
          <Badge variant="secondary">Feedback Automático</Badge>
        </div>
      </div>
    ),
    icon: <Brain className="h-6 w-6 text-primary" />
  },
  {
    title: "Como Funciona",
    content: (
      <div className="space-y-3">
        <p>O sistema funciona em duas etapas principais:</p>
        <ol className="list-decimal list-inside space-y-2 text-sm">
          <li><strong>Interação com IA:</strong> Você conversa com agentes conversacionais que simulam pacientes</li>
          <li><strong>Gravação e Análise:</strong> Sua conversa é gravada, transcrita e analisada por IA</li>
          <li><strong>Feedback Personalizado:</strong> Recebe feedback detalhado baseado nas diretrizes OSCE</li>
        </ol>
      </div>
    ),
    icon: <Play className="h-6 w-6 text-primary" />
  },
  {
    title: "Dois Modos Disponíveis",
    content: (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Users className="h-5 w-5 text-blue-500" />
              <h4 className="font-semibold">Simulação do Dia da Prova</h4>
            </div>
            <p className="text-sm text-muted-foreground">
              5 estações sequenciais com agente moderador multiagentes
            </p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center space-x-2 mb-2">
              <BookOpen className="h-5 w-5 text-green-500" />
              <h4 className="font-semibold">Modo Estudos</h4>
            </div>
            <p className="text-sm text-muted-foreground">
              1 estação por vez para prática focada
            </p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Users className="h-5 w-5 text-purple-500" />
              <h4 className="font-semibold">Modo Híbrido</h4>
            </div>
            <p className="text-sm text-muted-foreground">
              Treino colaborativo com correção automática por IA
            </p>
          </Card>
        </div>
      </div>
    ),
    icon: <Users className="h-6 w-6 text-primary" />
  }
];

// Onboarding steps para o modo exame
export const examOnboardingSteps: OnboardingStep[] = [
  {
    title: "Simulação do Dia da Prova",
    content: (
      <div className="space-y-3">
        <p>
          Você está prestes a iniciar uma simulação completa com <strong>5 estações sequenciais</strong>, 
          controlada por um agente moderador multiagentes.
        </p>
        <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg">
          <p className="text-sm">
            <strong>Dica:</strong> O agente moderador irá guiá-lo através de cada estação e 
            transferir você para diferentes pacientes conforme necessário.
          </p>
        </div>
      </div>
    ),
    icon: <Users className="h-6 w-6 text-blue-500" />
  },
  {
    title: "Fluxo de Interação",
    content: (
      <div className="space-y-3">
        <p>O processo funciona assim:</p>
        <ol className="list-decimal list-inside space-y-2 text-sm">
          <li><strong>Converse com o agente:</strong> O moderador irá apresentar a estação</li>
          <li><strong>Clique "Iniciar Atendimento":</strong> Quando o agente indicar</li>
          <li><strong>Atenda o paciente:</strong> Interaja com o agente paciente por 10 minutos</li>
          <li><strong>Transição automática:</strong> O moderador irá guiá-lo para a próxima estação</li>
        </ol>
      </div>
    ),
    icon: <Play className="h-6 w-6 text-blue-500" />
  },
  {
    title: "Recursos Disponíveis",
    content: (
      <div className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-orange-500" />
            <span className="text-sm">10 minutos por estação</span>
          </div>
          <div className="flex items-center space-x-2">
            <Mic className="h-4 w-4 text-green-500" />
            <span className="text-sm">Gravação automática</span>
          </div>
          <div className="flex items-center space-x-2">
            <Brain className="h-4 w-4 text-purple-500" />
            <span className="text-sm">Transcrição em tempo real</span>
          </div>
          <div className="flex items-center space-x-2">
            <BookOpen className="h-4 w-4 text-blue-500" />
            <span className="text-sm">Feedback ao final</span>
          </div>
        </div>
      </div>
    ),
    icon: <Clock className="h-6 w-6 text-blue-500" />
  }
];

// Onboarding steps para o modo híbrido
export const hybridOnboardingSteps: OnboardingStep[] = [
  {
    title: "Modo Híbrido",
    content: (
      <div className="space-y-3">
        <p>
          O modo híbrido combina <strong>treinamento colaborativo</strong> entre usuários 
          com <strong>correção automática por IA</strong>. Ideal para praticar com colegas!
        </p>
        <div className="bg-purple-50 dark:bg-purple-950 p-3 rounded-lg">
          <p className="text-sm">
            <strong>Dica:</strong> Você pode alternar entre os papéis de médico e ator 
            para uma experiência completa de treinamento.
          </p>
        </div>
      </div>
    ),
    icon: <Users className="h-6 w-6 text-purple-500" />
  },
  {
    title: "Como Funciona",
    content: (
      <div className="space-y-3">
        <p>O processo é colaborativo e inteligente:</p>
        <ol className="list-decimal list-inside space-y-2 text-sm">
          <li><strong>Conecte-se:</strong> Entre na mesma sala com outro usuário</li>
          <li><strong>Escolha o papel:</strong> Médico (grava) ou Ator (libera exames)</li>
          <li><strong>Treine juntos:</strong> Interação em tempo real por 10 minutos</li>
          <li><strong>IA analisa:</strong> Feedback automático baseado na gravação</li>
          <li><strong>Troque papéis:</strong> Pratique do outro lado</li>
        </ol>
      </div>
    ),
    icon: <Play className="h-6 w-6 text-purple-500" />
  },
  {
    title: "Recursos Especiais",
    content: (
      <div className="space-y-3">
        <div className="grid grid-cols-1 gap-3">
          <div className="flex items-start space-x-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0" />
            <span className="text-sm"><strong>Gravação automática:</strong> Apenas o médico é gravado</span>
          </div>
          <div className="flex items-start space-x-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0" />
            <span className="text-sm"><strong>Liberação de exames:</strong> O ator controla quando liberar</span>
          </div>
          <div className="flex items-start space-x-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0" />
            <span className="text-sm"><strong>Feedback instantâneo:</strong> IA analisa e fornece correção</span>
          </div>
          <div className="flex items-start space-x-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0" />
            <span className="text-sm"><strong>Troca de papéis:</strong> Pratique ambos os lados</span>
          </div>
        </div>
      </div>
    ),
    icon: <Brain className="h-6 w-6 text-purple-500" />
  }
];

// Onboarding steps para o modo estudos
export const studyOnboardingSteps: OnboardingStep[] = [
  {
    title: "Modo Estudos",
    content: (
      <div className="space-y-3">
        <p>
          Você está no modo de estudos, onde pode praticar <strong>uma estação por vez</strong> 
          com foco no aprendizado e melhoria contínua.
        </p>
        <div className="bg-green-50 dark:bg-green-950 p-3 rounded-lg">
          <p className="text-sm">
            <strong>Dica:</strong> Este modo é ideal para praticar casos específicos 
            e receber feedback imediato.
          </p>
        </div>
      </div>
    ),
    icon: <BookOpen className="h-6 w-6 text-green-500" />
  },
  {
    title: "Como Funciona",
    content: (
      <div className="space-y-3">
        <p>O processo é simples e direto:</p>
        <ol className="list-decimal list-inside space-y-2 text-sm">
          <li><strong>Converse com o agente:</strong> O agente irá apresentar o caso</li>
          <li><strong>Clique "Iniciar Atendimento":</strong> Quando estiver pronto</li>
          <li><strong>Atenda o paciente:</strong> Interaja por 10 minutos</li>
          <li><strong>Receba feedback:</strong> Análise imediata da sua performance</li>
        </ol>
      </div>
    ),
    icon: <Play className="h-6 w-6 text-green-500" />
  },
  {
    title: "Vantagens do Modo Estudos",
    content: (
      <div className="space-y-3">
        <div className="grid grid-cols-1 gap-3">
          <div className="flex items-start space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
            <span className="text-sm">Foco em uma estação específica</span>
          </div>
          <div className="flex items-start space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
            <span className="text-sm">Feedback imediato após cada prática</span>
          </div>
          <div className="flex items-start space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
            <span className="text-sm">Flexibilidade para praticar quando quiser</span>
          </div>
          <div className="flex items-start space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
            <span className="text-sm">Casos aleatórios para diversificar o treino</span>
          </div>
        </div>
      </div>
    ),
    icon: <BookOpen className="h-6 w-6 text-green-500" />
  }
];
