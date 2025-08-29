import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Play, Smartphone, Tablet, Monitor } from "lucide-react";
import appMockup from "@/assets/app-mockup.jpg";

export function AppScreensSection() {
  const features = [
    {
      title: "Interface Intuitiva",
      description: "Design médico profissional pensado para reduzir ansiedade"
    },
    {
      title: "Multi-dispositivo",
      description: "Acesse pelo celular, tablet ou computador"
    },
    {
      title: "Offline Ready",
      description: "Baixe casos e treine mesmo sem internet"
    },
    {
      title: "Tempo Real",
      description: "Sincronização instantânea entre dispositivos"
    }
  ];

  return (
    <section className="py-20 px-6 bg-muted/20">
      <div className="container mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* App Preview */}
          <div className="relative animate-medical-float">
            <div className="relative z-10">
              <img 
                src={appMockup} 
                alt="Revalida Pro 3.0 app interface mockup"
                className="w-full rounded-2xl shadow-2xl"
              />
              
              {/* Floating Play Button */}
              <div className="absolute inset-0 flex items-center justify-center">
                <Button 
                  size="lg" 
                  variant="medical"
                  className="rounded-full h-16 w-16 p-0 shadow-2xl animate-medical-pulse"
                >
                  <Play className="h-6 w-6 ml-1" />
                </Button>
              </div>
            </div>

            {/* Floating Badges */}
            <Badge className="absolute -top-4 -right-4 bg-secondary text-secondary-foreground">
              Disponível iOS & Android
            </Badge>
            <Badge className="absolute -bottom-4 -left-4 bg-primary text-primary-foreground">
              PWA Ready
            </Badge>
          </div>

          {/* Content */}
          <div className="space-y-8">
            <div>
              <Badge className="mb-4 bg-accent/20 text-accent border-accent/50">
                Interface Premium
              </Badge>
              <h2 className="text-4xl font-bold mb-4">
                Tecnologia que <span className="text-primary">elimina barreiras</span>
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Uma interface cuidadosamente projetada para reduzir ansiedade e maximizar 
                o aprendizado. Cada elemento foi pensado para criar um ambiente de 
                treinamento confortável e eficiente.
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid sm:grid-cols-2 gap-4">
              {features.map((feature, index) => (
                <Card key={index} className="p-4 bg-background/50 border-border/50">
                  <h4 className="font-semibold mb-2">{feature.title}</h4>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </Card>
              ))}
            </div>

            {/* Device Icons */}
            <div className="flex gap-6 pt-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Smartphone className="h-5 w-5" />
                <span className="text-sm">Mobile</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Tablet className="h-5 w-5" />
                <span className="text-sm">Tablet</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Monitor className="h-5 w-5" />
                <span className="text-sm">Desktop</span>
              </div>
            </div>

            <Button variant="medical" size="lg" className="w-full sm:w-auto">
              Baixar Demonstração
              <Play className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}