import { Card } from "@/components/ui/card";
import { AlertTriangle, Clock, Users, BookOpen } from "lucide-react";

export function ProblemSection() {
  const problems = [
    {
      icon: AlertTriangle,
      title: "Ansiedade Paralisante",
      description: "90% dos estudantes relatam ansiedade extrema ao treinar sozinhos para o OSCE",
      color: "text-destructive"
    },
    {
      icon: Clock,
      title: "Falta de Disponibilidade",
      description: "Horários limitados e dependência de terceiros para treinar casos práticos",
      color: "text-yellow-500"
    },
    {
      icon: Users,
      title: "Isolamento no Estudo",
      description: "Dificuldade para encontrar parceiros de estudo compatíveis e disponíveis",
      color: "text-orange-500"
    },
    {
      icon: BookOpen,
      title: "Casos Desatualizados",
      description: "Material de estudo que não reflete os padrões atuais do exame Revalida",
      color: "text-red-400"
    }
  ];

  return (
    <section className="py-20 px-6">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-6">
            O Pesadelo dos Estudantes de <span className="text-destructive">Revalida</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Milhares de médicos brasileiros enfrentam barreiras que impedem um treinamento efetivo 
            para o exame mais importante de suas carreiras.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {problems.map((problem, index) => (
            <Card key={index} className="card-medical p-6 text-center group">
              <div className={`inline-flex p-4 rounded-full bg-muted/50 mb-4 group-hover:scale-110 transition-transform duration-300`}>
                <problem.icon className={`h-8 w-8 ${problem.color}`} />
              </div>
              <h3 className="font-semibold text-lg mb-3">{problem.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {problem.description}
              </p>
            </Card>
          ))}
        </div>

        {/* Emotional Impact */}
        <div className="mt-16 text-center">
          <Card className="card-medical p-8 max-w-4xl mx-auto">
            <div className="space-y-4">
              <h3 className="text-2xl font-bold text-destructive">
                "Não consigo treinar sozinho... E se eu reprovar de novo?"
              </h3>
              <p className="text-lg text-muted-foreground italic">
                - Relato comum de 8 em cada 10 candidatos ao Revalida
              </p>
              <div className="flex justify-center gap-8 pt-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-destructive">73%</div>
                  <div className="text-sm text-muted-foreground">Taxa de reprovação</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-destructive">2.3</div>
                  <div className="text-sm text-muted-foreground">Tentativas média</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-destructive">89%</div>
                  <div className="text-sm text-muted-foreground">Relatam ansiedade</div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}