import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Shield, Clock, Trophy, Users } from "lucide-react";

export function CTASection() {
  return (
    <section className="py-20 px-6">
      <div className="container mx-auto">
        {/* Main CTA */}
        <Card className="card-medical p-8 lg:p-12 text-center mb-16">
          <Badge className="mb-6 bg-secondary/20 text-secondary border-secondary/50 text-lg px-4 py-2">
            Oferta de Lançamento - 50% OFF
          </Badge>
          
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            Pare de <span className="text-destructive">sofrer</span>.
            <br />
            Comece a <span className="text-primary">vencer</span>.
          </h2>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Junte-se a mais de <strong>2.847 médicos</strong> que já superaram 
            a ansiedade e conquistaram sua aprovação no Revalida com nossa plataforma.
          </p>

          {/* Email Signup */}
          <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto mb-8">
            <Input 
              placeholder="Seu email profissional" 
              className="bg-background border-border"
            />
            <Button variant="medical" size="lg" className="px-8">
              Começar Agora
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>

          <p className="text-sm text-muted-foreground mb-8">
            ✅ 7 dias grátis • ✅ Cancele quando quiser • ✅ Suporte 24/7
          </p>

          {/* Trust Indicators */}
          <div className="grid md:grid-cols-4 gap-6">
            <div className="flex flex-col items-center gap-2">
              <div className="p-3 rounded-full bg-secondary/20">
                <Shield className="h-6 w-6 text-secondary" />
              </div>
              <div className="text-sm font-medium">Seguro & Confiável</div>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="p-3 rounded-full bg-primary/20">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <div className="text-sm font-medium">Acesso Imediato</div>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="p-3 rounded-full bg-accent/20">
                <Trophy className="h-6 w-6 text-accent" />
              </div>
              <div className="text-sm font-medium">Resultados Garantidos</div>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="p-3 rounded-full bg-secondary/20">
                <Users className="h-6 w-6 text-secondary" />
              </div>
              <div className="text-sm font-medium">Comunidade Ativa</div>
            </div>
          </div>
        </Card>

        {/* Social Proof */}
        <div className="text-center">
          <p className="text-muted-foreground mb-4">
            Mais de 2.847 médicos já confiam no Revalida Pro
          </p>
          <div className="flex justify-center items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary border-2 border-background"
                  />
                ))}
              </div>
              <span className="text-muted-foreground">+2.847 médicos</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-yellow-500">★★★★★</span>
              <span className="text-muted-foreground">(4.9/5)</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}