import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  Target, 
  Clock, 
  Trophy, 
  Brain, 
  Users,
  Stethoscope,
  Heart,
  Loader2
} from "lucide-react";
import { useUserStats } from "@/hooks/useUserStats";
import { useAuth } from "@/hooks/useAuth";

import { memo } from "react";

export const StatsCards = memo(function StatsCards() {
  const { user } = useAuth();
  const { data: userStats, isLoading, isError } = useUserStats(user?.id || '');

  // Dados de fallback para casos de erro ou carregamento
  const fallbackStats = {
    progressPercentage: 0,
    nextGoalPercentage: 85,
    studyTimeThisWeek: 0,
    ranking: null,
    totalUsers: 1,
    averageScore: 0,
    sessionsThisWeek: 0
  };

  const stats = userStats || fallbackStats;

  const statsCards = [
    {
      title: "Progresso Geral",
      value: `${stats.progressPercentage}%`,
      change: stats.sessionsThisWeek > 0 ? `+${stats.sessionsThisWeek} sessões` : "Nenhuma atividade",
      changeType: stats.sessionsThisWeek > 0 ? "positive" as const : "neutral" as const,
      description: "Esta semana",
      icon: TrendingUp,
      gradient: "from-primary/20 to-primary/5",
      iconColor: "text-primary"
    },
    {
      title: "Próxima Meta",
      value: `${stats.nextGoalPercentage}%`,
      change: `${Math.max(0, stats.nextGoalPercentage - stats.progressPercentage)}% restante`,
      changeType: "neutral" as const,
      description: "Para aprovação",
      icon: Target,
      gradient: "from-secondary/20 to-secondary/5",
      iconColor: "text-secondary"
    },
    {
      title: "Tempo de Estudo",
      value: `${stats.studyTimeThisWeek}h`,
      change: stats.studyTimeThisWeek > 0 ? "Ativo" : "Sem atividade",
      changeType: stats.studyTimeThisWeek > 10 ? "positive" as const : "neutral" as const,
      description: "Esta semana",
      icon: Clock,
      gradient: "from-accent/20 to-accent/5",
      iconColor: "text-accent"
    },
    {
      title: "Ranking",
      value: stats.ranking ? `#${stats.ranking}` : "N/A",
      change: stats.ranking ? `Top ${Math.round(((stats.totalUsers - stats.ranking + 1) / stats.totalUsers) * 100)}%` : "Sem dados",
      changeType: stats.ranking && stats.ranking <= stats.totalUsers * 0.3 ? "positive" as const : "neutral" as const,
      description: `Entre ${stats.totalUsers} estudantes`,
      icon: Trophy,
      gradient: "from-yellow-500/20 to-yellow-500/5",
      iconColor: "text-yellow-500"
    }
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((index) => (
          <Card key={index} className="card-medical p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2 flex-1">
                <div className="h-4 bg-muted animate-pulse rounded w-24"></div>
                <div className="h-8 bg-muted animate-pulse rounded w-16"></div>
                <div className="h-4 bg-muted animate-pulse rounded w-20"></div>
                <div className="h-3 bg-muted animate-pulse rounded w-32"></div>
              </div>
              <div className="p-3 rounded-lg bg-muted animate-pulse">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="card-medical p-6 col-span-full">
          <div className="text-center text-muted-foreground">
            <p>Erro ao carregar estatísticas</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statsCards.map((stat, index) => (
        <Card key={index} className="card-medical p-6 group">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </p>
              <p className="text-2xl font-bold">{stat.value}</p>
              <div className="flex items-center gap-2">
                <Badge 
                  className={`text-xs ${
                    stat.changeType === 'positive' 
                      ? 'bg-secondary/20 text-secondary border-secondary/50' 
                      : 'bg-muted text-muted-foreground border-border'
                  }`}
                >
                  {stat.change}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </div>
            <div className={`p-3 rounded-lg bg-gradient-to-br ${stat.gradient} group-hover:scale-110 transition-transform duration-200`}>
              <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
});

export const QuickAccessCards = memo(function QuickAccessCards() {
  const quickAccess = [
    {
      title: "IA Independente",
      subtitle: "Treine sozinho agora",
      description: "",
      icon: Brain,
      color: "primary",
      available: true,
      href: "/simulation/study"
    },
    {
      title: "Sessão Colaborativa",
      subtitle: "Criar/entrar em sala",
      description: "",
      icon: Users,
      color: "secondary",
      available: true,
      href: "/dashboard/collaborative"
    },
    {
      title: "Modo Híbrido",
      subtitle: "Iniciar treino híbrido",
      description: "",
      icon: Stethoscope,
      color: "accent",
      available: true,
      href: "/simulation/hybrid"
    },
    {
      title: "Biblioteca",
      subtitle: "Materiais de estudo",
      description: "",
      icon: Heart,
      color: "destructive",
      available: true,
      href: "/dashboard/library"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {quickAccess.map((item, index) => (
        <Card key={index} className={`card-medical p-6 cursor-pointer group ${!item.available ? 'opacity-60' : ''}`} onClick={() => { if (item.href) window.location.href = item.href; }}>
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-lg bg-${item.color}/20 group-hover:scale-110 transition-transform duration-200`}>
              <item.icon className={`h-6 w-6 text-${item.color}`} />
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold">{item.title}</h3>
                {!item.available && (
                  <Badge className="bg-muted text-muted-foreground text-xs">
                    Em breve
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{item.subtitle}</p>
              <p className="text-xs text-muted-foreground">{item.description}</p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
});