import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Users, 
  Brain,
  Target,
  TrendingUp,
  ExternalLink
} from "lucide-react";

export function ActivityTimeline() {
  const activities = [
    {
      id: 1,
      type: "completion",
      title: "Estação Cardiologia",
      description: "Caso: Infarto Agudo do Miocárdio",
      score: "87%",
      time: "Há 2 horas",
      icon: CheckCircle,
      iconColor: "text-secondary",
      bgColor: "bg-secondary/20"
    },
    {
      id: 2,
      type: "collaboration",
      title: "Sessão Colaborativa",
      description: "Grupo: Medicina Interna - 4 participantes",
      score: "Participação ativa",
      time: "Ontem às 14:30",
      icon: Users,
      iconColor: "text-primary",
      bgColor: "bg-primary/20"
    },
    {
      id: 3,
      type: "ai_training",
      title: "IA Independente",
      description: "5 casos de Pneumologia concluídos",
      score: "Média: 82%",
      time: "2 dias atrás",
      icon: Brain,
      iconColor: "text-accent",
      bgColor: "bg-accent/20"
    },
    {
      id: 4,
      type: "milestone",
      title: "Meta Alcançada",
      description: "Completou 100 casos OSCE",
      score: "Conquista desbloqueada",
      time: "3 dias atrás",
      icon: Target,
      iconColor: "text-yellow-500",
      bgColor: "bg-yellow-500/20"
    },
    {
      id: 5,
      type: "improvement",
      title: "Melhoria de Performance",
      description: "Neurologia: 65% → 78%",
      score: "+13%",
      time: "1 semana atrás",
      icon: TrendingUp,
      iconColor: "text-secondary",
      bgColor: "bg-secondary/20"
    }
  ];

  return (
    <Card className="card-medical p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Atividade Recente</h3>
        <Button variant="ghost" size="sm" className="gap-2">
          Ver Todas
          <ExternalLink className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-4">
        {activities.map((activity, index) => (
          <div key={activity.id} className="flex items-start gap-4 group">
            {/* Timeline line */}
            <div className="relative flex flex-col items-center">
              <div className={`p-2 rounded-full ${activity.bgColor} group-hover:scale-110 transition-transform duration-200`}>
                <activity.icon className={`h-4 w-4 ${activity.iconColor}`} />
              </div>
              {index < activities.length - 1 && (
                <div className="w-px h-8 bg-border/50 mt-2" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 pb-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <h4 className="text-sm font-medium group-hover:text-primary transition-colors">
                    {activity.title}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {activity.description}
                  </p>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-muted/50 text-muted-foreground text-xs">
                      {activity.score}
                    </Badge>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {activity.time}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

export function UpcomingActivities() {
  const upcoming = [
    {
      title: "Sessão Colaborativa",
      subtitle: "Medicina Interna",
      time: "Hoje às 16:00",
      participants: 3,
      status: "confirmado"
    },
    {
      title: "Simulação OSCE",
      subtitle: "Avaliação Completa",
      time: "Amanhã às 09:00",
      participants: 1,
      status: "agendado"
    },
    {
      title: "Revisão IA",
      subtitle: "Casos Perdidos",
      time: "Sexta às 14:30",
      participants: 1,
      status: "sugerido"
    }
  ];

  return (
    <Card className="card-medical p-6">
      <h3 className="text-lg font-semibold mb-4">Próximas Atividades</h3>
      
      <div className="space-y-3">
        {upcoming.map((item, index) => (
          <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors group cursor-pointer">
            <div className="space-y-1">
              <h4 className="text-sm font-medium group-hover:text-primary transition-colors">
                {item.title}
              </h4>
              <p className="text-xs text-muted-foreground">{item.subtitle}</p>
              <div className="flex items-center gap-2">
                <Badge className={`text-xs ${
                  item.status === 'confirmado' 
                    ? 'bg-secondary/20 text-secondary' 
                    : item.status === 'agendado'
                    ? 'bg-primary/20 text-primary'
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {item.status}
                </Badge>
                <span className="text-xs text-muted-foreground">{item.time}</span>
              </div>
            </div>
            
            {item.participants > 1 && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Users className="h-3 w-3" />
                {item.participants}
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}