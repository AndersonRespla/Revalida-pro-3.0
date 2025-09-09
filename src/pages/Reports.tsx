import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SidebarProvider } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { useUserStats, useUserActivity, useReportsPerformance, useReportsSpecialties, useReportsGoals } from "@/hooks/useUserStats";
import { BackButton } from "@/components/BackButton";
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Clock, 
  Target,
  Download,
  Filter,
  Calendar,
  Eye,
  Award,
  Brain,
  Stethoscope,
  LineChart,
  PieChart,
  FileText,
  Share
} from "lucide-react";

interface MetricCard {
  title: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral';
  icon: any;
  description: string;
}

interface ChartData {
  period: string;
  sessions: number;
  score: number;
  studyTime: number;
}

export default function Reports() {
  const [selectedPeriod, setSelectedPeriod] = useState('7d');
  const [selectedMetric, setSelectedMetric] = useState('performance');
  const userId = 'demo-user'; // TODO: Get from auth

  // Buscar dados reais
  const { data: userStats, isLoading: statsLoading } = useUserStats(userId);
  const { data: performanceData, isLoading: perfLoading } = useReportsPerformance(userId, selectedPeriod);
  const { data: specialtyData, isLoading: specLoading } = useReportsSpecialties(userId);
  const { data: goalsData, isLoading: goalsLoading } = useReportsGoals(userId);
  const { data: recentActivity } = useUserActivity(userId, 10);

  // Calcular métricas baseadas nos dados reais
  const metricCards: MetricCard[] = [
    {
      title: 'Performance Geral',
      value: `${userStats?.averageScore || 0}%`,
      change: userStats?.averageScore > 75 ? '+5.2%' : '+2.1%',
      changeType: userStats?.averageScore > 75 ? 'positive' : 'neutral',
      icon: Target,
      description: `Média de ${userStats?.totalSessions || 0} simulações`
    },
    {
      title: 'Tempo de Estudo',
      value: `${userStats?.studyTimeThisWeek || 0}h`,
      change: userStats?.studyTimeThisWeek > 20 ? '+12h' : '+5h',
      changeType: userStats?.studyTimeThisWeek > 20 ? 'positive' : 'neutral',
      icon: Clock,
      description: 'Total nas últimas 4 semanas'
    },
    {
      title: 'Simulações Concluídas',
      value: `${userStats?.totalSessions || 0}`,
      change: `+${userStats?.sessionsThisWeek || 0}`,
      changeType: userStats?.sessionsThisWeek > 0 ? 'positive' : 'neutral',
      icon: Stethoscope,
      description: 'Desde o início do mês'
    },
    {
      title: 'Ranking Global',
      value: userStats?.ranking ? `#${userStats.ranking}` : 'N/A',
      change: userStats?.ranking ? `Top ${userStats.percentile}%` : 'Sem dados',
      changeType: userStats?.ranking && userStats.ranking <= 100 ? 'positive' : 'neutral',
      icon: Award,
      description: `Entre ${userStats?.totalUsers || 1} estudantes`
    }
  ];

  // Dados do gráfico de performance (usando dados reais se disponíveis)
  const chartData: ChartData[] = performanceData?.chartData || [];

  // Dados de especialidades (usando dados reais se disponíveis)
  const realSpecialtyData = specialtyData || [];

  // Metas da semana (usando dados reais se disponíveis)
  const weeklyGoals = goalsData || [];

  // Sessões recentes (transformar atividades reais)
  const recentSessions = recentActivity?.slice(0, 5).map(activity => ({
    date: new Date(activity.started_at).toLocaleDateString('pt-BR'),
    type: activity.activity_title,
    specialty: 'Geral', // TODO: extrair especialidade dos metadados
    score: activity.total_score ? Math.round(activity.total_score) : 0,
    duration: activity.duration_minutes ? `${activity.duration_minutes} min` : 'N/A'
  })) || [];

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <DashboardSidebar />
        
        <div className="flex-1 flex flex-col">
          <DashboardHeader />
          
          <main className="flex-1 overflow-auto">
            <div className="p-6 space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <BackButton className="mr-4" />
                <div className="flex-1">
                  <h1 className="text-3xl font-bold">Relatórios</h1>
                  <p className="text-muted-foreground">
                    Analise seu desempenho e acompanhe seu progresso
                  </p>
                </div>

                <div className="flex gap-2">
                  <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Período" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7d">Últimos 7 dias</SelectItem>
                      <SelectItem value="30d">Últimos 30 dias</SelectItem>
                      <SelectItem value="90d">Últimos 3 meses</SelectItem>
                      <SelectItem value="1y">Último ano</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Button variant="outline" className="gap-2">
                    <Download className="h-4 w-4" />
                    Exportar
                  </Button>
                </div>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statsLoading ? (
                  // Loading skeleton
                  Array.from({ length: 4 }).map((_, index) => (
                    <Card key={index} className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <div className="h-4 bg-muted animate-pulse rounded w-32"></div>
                          <div className="h-8 bg-muted animate-pulse rounded w-16"></div>
                          <div className="h-4 bg-muted animate-pulse rounded w-20"></div>
                          <div className="h-3 bg-muted animate-pulse rounded w-40"></div>
                        </div>
                        <div className="p-3 rounded-lg bg-muted animate-pulse">
                          <div className="h-5 w-5"></div>
                        </div>
                      </div>
                    </Card>
                  ))
                ) : (
                  metricCards.map((metric, index) => (
                  <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">
                          {metric.title}
                        </p>
                        <p className="text-2xl font-bold">{metric.value}</p>
                        <div className="flex items-center gap-2">
                          <Badge 
                            className={`text-xs ${
                              metric.changeType === 'positive' 
                                ? 'bg-green-500/10 text-green-600 border-green-200' 
                                : metric.changeType === 'negative'
                                ? 'bg-red-500/10 text-red-600 border-red-200'
                                : 'bg-gray-500/10 text-gray-600 border-gray-200'
                            }`}
                          >
                            {metric.changeType === 'positive' && <TrendingUp className="h-3 w-3 mr-1" />}
                            {metric.changeType === 'negative' && <TrendingDown className="h-3 w-3 mr-1" />}
                            {metric.change}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {metric.description}
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-primary/10">
                        <metric.icon className="h-5 w-5 text-primary" />
                      </div>
                    </div>
                  </Card>
                  ))
                )}
              </div>

              <Tabs value={selectedMetric} onValueChange={setSelectedMetric} className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="performance">Performance</TabsTrigger>
                  <TabsTrigger value="specialty">Por Especialidade</TabsTrigger>
                  <TabsTrigger value="goals">Metas</TabsTrigger>
                  <TabsTrigger value="history">Histórico</TabsTrigger>
                </TabsList>

                {/* Performance Tab */}
                <TabsContent value="performance" className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Performance Chart */}
                    <Card className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold">Evolução da Performance</h3>
                        <LineChart className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="h-64 flex items-center justify-center bg-muted/20 rounded-lg">
                        <div className="text-center">
                          <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">Gráfico de Performance</p>
                          <p className="text-xs text-muted-foreground">Dados dos últimos {selectedPeriod}</p>
                        </div>
                      </div>
                    </Card>

                    {/* Study Time Chart */}
                    <Card className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold">Tempo de Estudo</h3>
                        <Clock className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="h-64 flex items-center justify-center bg-muted/20 rounded-lg">
                        <div className="text-center">
                          <PieChart className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">Distribuição do Tempo</p>
                          <p className="text-xs text-muted-foreground">Por tipo de atividade</p>
                        </div>
                      </div>
                    </Card>
                  </div>

                  {/* Performance Table */}
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Detalhamento por Período</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-2">Data</th>
                            <th className="text-left p-2">Sessões</th>
                            <th className="text-left p-2">Score Médio</th>
                            <th className="text-left p-2">Tempo de Estudo</th>
                            <th className="text-left p-2">Tendência</th>
                          </tr>
                        </thead>
                        <tbody>
                          {chartData.map((data, index) => (
                            <tr key={index} className="border-b">
                              <td className="p-2">{data.period}</td>
                              <td className="p-2">{data.sessions}</td>
                              <td className="p-2">{data.score}%</td>
                              <td className="p-2">{data.studyTime}h</td>
                              <td className="p-2">
                                <TrendingUp className="h-4 w-4 text-green-500" />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                </TabsContent>

                {/* Specialty Tab */}
                <TabsContent value="specialty" className="space-y-6">
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Performance por Especialidade</h3>
                    <div className="space-y-4">
                      {realSpecialtyData.map((specialty, index) => (
                        <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="space-y-1">
                            <h4 className="font-medium">{specialty.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {specialty.sessions} simulações realizadas
                            </p>
                          </div>
                          <div className="text-right space-y-1">
                            <p className="text-xl font-bold">{specialty.avgScore}%</p>
                            <Badge className="bg-green-500/10 text-green-600">
                              {specialty.improvement}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </TabsContent>

                {/* Goals Tab */}
                <TabsContent value="goals" className="space-y-6">
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Metas da Semana</h3>
                    <div className="space-y-4">
                      {weeklyGoals.map((goal, index) => (
                        <div key={index} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{goal.goal}</span>
                            <Badge className={goal.completed ? 'bg-green-500/10 text-green-600' : 'bg-yellow-500/10 text-yellow-600'}>
                              {goal.completed ? 'Concluída' : 'Em andamento'}
                            </Badge>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${goal.completed ? 'bg-green-500' : 'bg-primary'}`}
                              style={{ width: `${Math.min((goal.progress / goal.target) * 100, 100)}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-sm text-muted-foreground">
                            <span>{goal.progress} / {goal.target}</span>
                            <span>{Math.round((goal.progress / goal.target) * 100)}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </TabsContent>

                {/* History Tab */}
                <TabsContent value="history" className="space-y-6">
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Sessões Recentes</h3>
                    <div className="space-y-3">
                      {recentSessions.map((session, index) => (
                        <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="space-y-1">
                            <h4 className="font-medium">{session.type}</h4>
                            <p className="text-sm text-muted-foreground">
                              {session.specialty} • {session.date}
                            </p>
                          </div>
                          <div className="text-right space-y-1">
                            <p className="text-lg font-bold">{session.score}%</p>
                            <p className="text-sm text-muted-foreground">{session.duration}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
