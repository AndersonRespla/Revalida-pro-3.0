import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Brain, Users, Zap, ArrowRight, Star } from "lucide-react";

export function SolutionSection() {
  const features = [
    "200 casos clínicos OSCE reais",
    "Padrão PEP oficial",
    "Aprovado pela ElevenLabs",
    "Feedback instantâneo",
    "Análise de performance",
    "Certificação de progresso"
  ];

  const modes = [
    {
      icon: Brain,
      title: "IA Independente",
      subtitle: "Treine quando quiser, onde quiser",
      features: [
        "Disponível 24/7",
        "Sem dependência de terceiros",
        "Adaptação ao seu ritmo",
        "Feedback imediato personalizado"
      ],
      color: "primary",
      popular: false
    },
    {
      icon: Users,
      title: "Colaborativo",
      subtitle: "Conecte-se com outros estudantes",
      features: [
        "Grupos de estudo virtuais",
        "Matching inteligente",
        "Sessões agendadas",
        "Avaliação peer-to-peer"
      ],
      color: "secondary",
      popular: false
    },
    {
      icon: Zap,
      title: "Híbrido",
      subtitle: "O melhor dos dois mundos",
      features: [
        "IA + colaboração humana",
        "Máxima flexibilidade",
        "Resultados comprovados",
        "Redução de 80% na ansiedade"
      ],
      color: "accent",
      popular: true
    }
  ];

  return (
    <section className="py-20 px-6">
      <div className="container mx-auto">
        {/* Solution Header */}
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-secondary/20 text-secondary border-secondary/50">
            Solução Revolucionária
          </Badge>
          <h2 className="text-4xl font-bold mb-6">
            Finalmente, uma plataforma que <span className="text-primary">funciona</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Revalida Pro 3.0 combina inteligência artificial avançada com colaboração humana 
            para eliminar as barreiras que impedem seu sucesso.
          </p>
        </div>

        {/* Key Features */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-16">
          {features.map((feature, index) => (
            <div key={index} className="flex items-center gap-3 p-4 rounded-lg bg-muted/20">
              <CheckCircle className="h-5 w-5 text-secondary flex-shrink-0" />
              <span className="text-sm font-medium">{feature}</span>
            </div>
          ))}
        </div>

        {/* Training Modes */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {modes.map((mode, index) => (
            <Card key={index} className={`card-medical p-6 relative ${mode.popular ? 'ring-2 ring-accent' : ''}`}>
              {mode.popular && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-accent text-accent-foreground">
                  <Star className="h-3 w-3 mr-1" />
                  Mais Popular
                </Badge>
              )}
              
              <div className="text-center mb-6">
                <div className={`inline-flex p-4 rounded-full bg-${mode.color}/20 mb-4`}>
                  <mode.icon className={`h-8 w-8 text-${mode.color}`} />
                </div>
                <h3 className="text-xl font-bold mb-2">{mode.title}</h3>
                <p className="text-sm text-muted-foreground">{mode.subtitle}</p>
              </div>

              <ul className="space-y-3 mb-6">
                {mode.features.map((feature, fIdx) => (
                  <li key={fIdx} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-secondary flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Button 
                variant={mode.popular ? "medical" : "medical-outline"} 
                className="w-full"
              >
                Experimentar Modo
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Card>
          ))}
        </div>

        {/* Results Preview */}
        <Card className="card-medical p-8 text-center">
          <h3 className="text-2xl font-bold mb-4">
            Resultados que falam por si só
          </h3>
          <div className="grid md:grid-cols-4 gap-6">
            <div>
              <div className="text-3xl font-bold text-secondary mb-2">94%</div>
              <div className="text-sm text-muted-foreground">Taxa de aprovação</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary mb-2">-80%</div>
              <div className="text-sm text-muted-foreground">Redução ansiedade</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-accent mb-2">1.2</div>
              <div className="text-sm text-muted-foreground">Tentativas média</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-secondary mb-2">96%</div>
              <div className="text-sm text-muted-foreground">Satisfação</div>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
}