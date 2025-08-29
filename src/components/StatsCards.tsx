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
  Heart
} from "lucide-react";

export function StatsCards() {
  const stats = [
    {
      title: "Progresso Geral",
      value: "73%",
      change: "+12%",
      changeType: "positive" as const,
      description: "Desde o último mês",
      icon: TrendingUp,
      gradient: "from-primary/20 to-primary/5",
      iconColor: "text-primary"
    },
    {
      title: "Próxima Meta",
      value: "85%",
      change: "12% restante",
      changeType: "neutral" as const,
      description: "Para aprovação",
      icon: Target,
      gradient: "from-secondary/20 to-secondary/5",
      iconColor: "text-secondary"
    },
    {
      title: "Tempo de Estudo",
      value: "47h",
      change: "+8h",
      changeType: "positive" as const,
      description: "Esta semana",
      icon: Clock,
      gradient: "from-accent/20 to-accent/5",
      iconColor: "text-accent"
    },
    {
      title: "Ranking",
      value: "#27",
      change: "↑15",
      changeType: "positive" as const,
      description: "Entre 2.847 estudantes",
      icon: Trophy,
      gradient: "from-yellow-500/20 to-yellow-500/5",
      iconColor: "text-yellow-500"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
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
}

export function QuickAccessCards() {
  const quickAccess = [
    {
      title: "IA Independente",
      subtitle: "Treine sozinho agora",
      description: "200+ casos disponíveis",
      icon: Brain,
      color: "primary",
      available: true
    },
    {
      title: "Sessão Colaborativa",
      subtitle: "3 estudantes online",
      description: "Próxima sessão às 14:30",
      icon: Users,
      color: "secondary",
      available: true
    },
    {
      title: "Estação Cardiologia",
      subtitle: "Recomendado para você",
      description: "Baseado no seu desempenho",
      icon: Heart,
      color: "destructive",
      available: true
    },
    {
      title: "OSCE Completo",
      subtitle: "Simulação realística",
      description: "5 estações • 90 minutos",
      icon: Stethoscope,
      color: "accent",
      available: false
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {quickAccess.map((item, index) => (
        <Card key={index} className={`card-medical p-6 cursor-pointer group ${!item.available ? 'opacity-60' : ''}`}>
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
}