import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Trophy, 
  TrendingUp, 
  AlertTriangle, 
  BarChart3, 
  FileText,
  Loader2,
  Download,
  Share2,
  RefreshCw
} from 'lucide-react';

interface CriterionScore {
  criterionId: string;
  criterionName: string;
  weight: number;
  score: number;
  maxScore: number;
  justification: string;
  evidenceFound: string[];
}

interface StationFeedback {
  stationNumber: number;
  overallScore: number;
  percentageScore: number;
  criteriaScores: CriterionScore[];
  strengths: string[];
  improvements: string[];
  clinicalAccuracy: string;
  communicationSkills: string;
}

interface SimulationFeedbackData {
  simulationId: string;
  totalStations: number;
  averageScore: number;
  averagePercentage: number;
  stationsFeedback: StationFeedback[];
  summary: {
    strongPoints: string[];
    areasForImprovement: string[];
    overallAssessment: string;
  };
}

interface SimulationFeedbackProps {
  simulationId: string;
  onNewSimulation?: () => void;
  onReturnToDashboard?: () => void;
}

export function SimulationFeedback({
  simulationId,
  onNewSimulation,
  onReturnToDashboard
}: SimulationFeedbackProps) {
  const [feedback, setFeedback] = useState<SimulationFeedbackData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generatingFeedback, setGeneratingFeedback] = useState(false);

  useEffect(() => {
    loadFeedback();
  }, [simulationId]);

  const loadFeedback = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/feedback/get?simulationId=${simulationId}`);
      const data = await response.json();
      
      if (!response.ok) {
        if (response.status === 404) {
          // Feedback ainda não foi gerado
          await generateFeedback();
          return;
        }
        throw new Error(data.message || 'Erro ao carregar feedback');
      }
      
      setFeedback(data.feedback);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  const generateFeedback = async () => {
    try {
      setGeneratingFeedback(true);
      setError(null);
      
      const response = await fetch('/api/feedback/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ simulationId })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Erro ao gerar feedback');
      }
      
      setFeedback(data.feedback);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao gerar feedback');
    } finally {
      setGeneratingFeedback(false);
      setLoading(false);
    }
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadge = (percentage: number) => {
    if (percentage >= 80) return { variant: 'success' as const, text: 'Excelente' };
    if (percentage >= 60) return { variant: 'warning' as const, text: 'Bom' };
    return { variant: 'destructive' as const, text: 'Precisa Melhorar' };
  };

  if (loading || generatingFeedback) {
    return (
      <Card className="p-8">
        <div className="flex flex-col items-center justify-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-lg font-medium">
            {generatingFeedback ? 'Gerando feedback detalhado...' : 'Carregando feedback...'}
          </p>
          <p className="text-sm text-muted-foreground">
            Isso pode levar alguns segundos
          </p>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-8">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Erro ao carregar feedback</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="flex justify-center mt-4">
          <Button onClick={loadFeedback} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Tentar novamente
          </Button>
        </div>
      </Card>
    );
  }

  if (!feedback) {
    return null;
  }

  const scoreBadge = getScoreBadge(feedback.averagePercentage);

  return (
    <div className="space-y-6">
      {/* Header com score geral */}
      <Card className="p-6 bg-gradient-to-r from-primary/10 to-primary/5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Feedback da Simulação</h2>
            <p className="text-muted-foreground">
              Análise detalhada do seu desempenho nas {feedback.totalStations} estações
            </p>
          </div>
          <div className="text-center">
            <div className={`text-4xl font-bold ${getScoreColor(feedback.averagePercentage)}`}>
              {feedback.averageScore.toFixed(1)}/10
            </div>
            <Badge variant={scoreBadge.variant} className="mt-2">
              {scoreBadge.text}
            </Badge>
          </div>
        </div>
        
        <div className="mt-6">
          <div className="flex items-center justify-between text-sm mb-2">
            <span>Pontuação Geral</span>
            <span className="font-medium">{feedback.averagePercentage.toFixed(1)}%</span>
          </div>
          <Progress value={feedback.averagePercentage} className="h-3" />
        </div>
      </Card>

      {/* Resumo rápido */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Trophy className="h-8 w-8 text-green-600" />
            <div>
              <p className="text-sm text-muted-foreground">Pontos Fortes</p>
              <p className="text-xl font-bold">{feedback.summary.strongPoints.length}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-8 w-8 text-yellow-600" />
            <div>
              <p className="text-sm text-muted-foreground">Áreas de Melhoria</p>
              <p className="text-xl font-bold">{feedback.summary.areasForImprovement.length}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Estações Avaliadas</p>
              <p className="text-xl font-bold">{feedback.totalStations}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs com detalhes */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="stations">Por Estação</TabsTrigger>
          <TabsTrigger value="criteria">Por Critério</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Avaliação Geral</h3>
            <p className="text-muted-foreground mb-6">
              {feedback.summary.overallAssessment}
            </p>
            
            {feedback.summary.strongPoints.length > 0 && (
              <div className="mb-6">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-green-600" />
                  Pontos Fortes Identificados
                </h4>
                <ul className="space-y-2">
                  {feedback.summary.strongPoints.map((point, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-green-600 mt-0.5">•</span>
                      <span className="text-sm">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {feedback.summary.areasForImprovement.length > 0 && (
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-yellow-600" />
                  Áreas para Desenvolvimento
                </h4>
                <ul className="space-y-2">
                  {feedback.summary.areasForImprovement.map((area, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-yellow-600 mt-0.5">•</span>
                      <span className="text-sm">{area}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>
        </TabsContent>
        
        <TabsContent value="stations" className="space-y-4">
          {feedback.stationsFeedback.map((station) => (
            <Card key={station.stationNumber} className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold">Estação {station.stationNumber}</h4>
                <div className="flex items-center gap-2">
                  <span className={`text-lg font-bold ${getScoreColor(station.percentageScore)}`}>
                    {station.overallScore.toFixed(1)}/10
                  </span>
                  <Badge variant={getScoreBadge(station.percentageScore).variant}>
                    {station.percentageScore.toFixed(0)}%
                  </Badge>
                </div>
              </div>
              
              <Progress value={station.percentageScore} className="h-2 mb-4" />
              
              <div className="space-y-3 text-sm">
                {station.strengths.length > 0 && (
                  <div>
                    <p className="font-medium text-green-600 mb-1">Pontos positivos:</p>
                    <ul className="space-y-1">
                      {station.strengths.map((strength, idx) => (
                        <li key={idx} className="text-muted-foreground">• {strength}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {station.improvements.length > 0 && (
                  <div>
                    <p className="font-medium text-yellow-600 mb-1">Sugestões:</p>
                    <ul className="space-y-1">
                      {station.improvements.map((improvement, idx) => (
                        <li key={idx} className="text-muted-foreground">• {improvement}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </TabsContent>
        
        <TabsContent value="criteria" className="space-y-4">
          {feedback.stationsFeedback.map((station) => (
            <Card key={station.stationNumber} className="p-6">
              <h4 className="font-semibold mb-4">Estação {station.stationNumber} - Critérios Detalhados</h4>
              <div className="space-y-3">
                {station.criteriaScores.map((criterion) => (
                  <div key={criterion.criterionId} className="border-b pb-3 last:border-0">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">{criterion.criterionName}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          Peso: {criterion.weight}%
                        </span>
                        <Badge variant="outline">
                          {criterion.score}/{criterion.maxScore}
                        </Badge>
                      </div>
                    </div>
                    <Progress 
                      value={(criterion.score / criterion.maxScore) * 100} 
                      className="h-1.5 mb-2" 
                    />
                    <p className="text-xs text-muted-foreground">
                      {criterion.justification}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      {/* Ações */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button variant="outline" size="lg">
            <Download className="h-4 w-4 mr-2" />
            Baixar Relatório PDF
          </Button>
          <Button variant="outline" size="lg">
            <Share2 className="h-4 w-4 mr-2" />
            Compartilhar Resultado
          </Button>
          {onNewSimulation && (
            <Button variant="default" size="lg" onClick={onNewSimulation}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Nova Simulação
            </Button>
          )}
          {onReturnToDashboard && (
            <Button variant="ghost" size="lg" onClick={onReturnToDashboard}>
              <FileText className="h-4 w-4 mr-2" />
              Voltar ao Dashboard
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
