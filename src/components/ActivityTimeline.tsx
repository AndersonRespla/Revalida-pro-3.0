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
  ExternalLink,
  Loader2,
  Stethoscope
} from "lucide-react";
import { useUserActivity } from "@/hooks/useUserStats";
import { useAuth } from "@/hooks/useAuth";

// Função para mapear tipo de sessão para ícone
function getActivityIcon(sessionType: string) {
  switch (sessionType) {
    case 'simulation_exam':
      return Stethoscope;
    case 'simulation_study':
      return Brain;
    case 'collaborative':
      return Users;
    case 'ai_chat':
      return Brain;
    default:
      return CheckCircle;
  }
}

// Função para mapear tipo de sessão para cor
function getActivityColor(sessionType: string) {
  switch (sessionType) {
    case 'simulation_exam':
      return { iconColor: "text-primary", bgColor: "bg-primary/20" };
    case 'simulation_study':
      return { iconColor: "text-secondary", bgColor: "bg-secondary/20" };
    case 'collaborative':
      return { iconColor: "text-accent", bgColor: "bg-accent/20" };
    case 'ai_chat':
      return { iconColor: "text-blue-500", bgColor: "bg-blue-500/20" };
    default:
      return { iconColor: "text-muted-foreground", bgColor: "bg-muted/20" };
  }
}

export function ActivityTimeline() {
  const { user } = useAuth();
  const { data: activities, isLoading, isError } = useUserActivity(user?.id || '', 5);

  if (isLoading) {
    return (
      <Card className="card-medical p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">Atividade Recente</h3>
          <Loader2 className="h-4 w-4 animate-spin" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((index) => (
            <div key={index} className="flex items-start gap-4">
              <div className="p-2 rounded-full bg-muted animate-pulse">
                <div className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0 pb-4 space-y-2">
                <div className="h-4 bg-muted animate-pulse rounded w-32"></div>
                <div className="h-3 bg-muted animate-pulse rounded w-48"></div>
                <div className="h-3 bg-muted animate-pulse rounded w-24"></div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (isError || !activities || activities.length === 0) {
    return (
      <Card className="card-medical p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">Atividade Recente</h3>
          <Button variant="ghost" size="sm" className="gap-2">
            Ver Todas
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>
        <div className="text-center py-8 text-muted-foreground">
          <AlertCircle className="h-8 w-8 mx-auto mb-2" />
          <p>Nenhuma atividade recente</p>
          <p className="text-sm">Comece uma simulação para ver seu progresso aqui</p>
        </div>
      </Card>
    );
  }

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
        {activities.map((activity, index) => {
          const Icon = getActivityIcon(activity.session_type);
          const colors = getActivityColor(activity.session_type);
          
          return (
            <div key={activity.id} className="flex items-start gap-4 group">
              {/* Timeline line */}
              <div className="relative flex flex-col items-center">
                <div className={`p-2 rounded-full ${colors.bgColor} group-hover:scale-110 transition-transform duration-200`}>
                  <Icon className={`h-4 w-4 ${colors.iconColor}`} />
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
                      {activity.activity_title}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {activity.stations_completed && activity.stations_completed > 1 
                        ? `${activity.stations_completed} estações completadas`
                        : `Duração: ${activity.duration_minutes || 0} minutos`
                      }
                    </p>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-muted/50 text-muted-foreground text-xs">
                        {activity.score_display}
                      </Badge>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {activity.time_relative}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
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