import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, Brain, Users, Zap } from "lucide-react";
import heroImage from "@/assets/hero-medical-training.jpg";

interface HeroSectionProps {
  onPrimaryCta?: () => void;
}

export function HeroSection({ onPrimaryCta }: HeroSectionProps) {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background with gradient overlay */}
      <div className="absolute inset-0 hero-gradient">
        <img 
          src={heroImage} 
          alt="Medical professionals training with OSCE simulation"
          className="w-full h-full object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
      </div>

      <div className="relative z-10 container mx-auto px-6 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-5xl lg:text-6xl font-bold text-glow leading-tight">
                Revalida Pro <span className="text-primary">3.0</span>
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed">
                A plataforma de simulação OSCE mais avançada do Brasil. 
                Treine com <span className="text-secondary font-semibold">200 casos clínicos reais</span>, 
                padrão PEP, aprovada pela ElevenLabs.
              </p>
            </div>

            <div className="flex flex-wrap gap-4">
              <Button variant="medical" size="lg" className="text-lg px-8 py-4" onClick={onPrimaryCta}>
                Começar Treinamento
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button variant="medical-outline" size="lg" className="text-lg px-8 py-4">
                Ver Demonstração
              </Button>
            </div>

            {/* Quick Stats */}
            <div className="flex flex-wrap gap-6 pt-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">200+</div>
                <div className="text-sm text-muted-foreground">Casos Clínicos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-secondary">24/7</div>
                <div className="text-sm text-muted-foreground">Disponível</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-accent">3</div>
                <div className="text-sm text-muted-foreground">Modos de Treino</div>
              </div>
            </div>
          </div>

          {/* Training Modes Cards */}
          <div className="space-y-4 animate-medical-float">
            <Card className="card-medical p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-primary/20">
                  <Brain className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">IA Independente</h3>
                  <p className="text-muted-foreground">Treine sozinho, 24/7, sem dependência</p>
                </div>
              </div>
            </Card>

            <Card className="card-medical p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-secondary/20">
                  <Users className="h-6 w-6 text-secondary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Colaborativo</h3>
                  <p className="text-muted-foreground">Treine com outros estudantes</p>
                </div>
              </div>
            </Card>

            <Card className="card-medical p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-accent/20">
                  <Zap className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Híbrido</h3>
                  <p className="text-muted-foreground">Combina IA e colaboração</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}