import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BackButton } from "@/components/BackButton";
import { Play, Square, Download, RefreshCw, CheckCircle, XCircle, Clock } from "lucide-react";

interface SimulationResult {
  stationNumber: number;
  station: {
    id: string;
    name: string;
    specialty: string;
    code: string;
  };
  agent: {
    id: string;
    name: string;
  };
  transcription: string;
  duration: number;
  status: 'completed' | 'failed';
  error?: string;
  timestamp: string;
}

interface SimulationResponse {
  ok: boolean;
  simulation: {
    id: string;
    startTime: string;
    endTime: string;
    totalDuration: number;
    statistics: {
      totalStations: number;
      completedStations: number;
      failedStations: number;
      successRate: number;
    };
  };
  stations: SimulationResult[];
}

export default function SimulationTest() {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<SimulationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedStation, setSelectedStation] = useState<number | null>(null);

  const startSimulation = async () => {
    setIsRunning(true);
    setProgress(0);
    setResults(null);
    setError(null);
    setSelectedStation(null);

    try {
      // Simular progresso
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + Math.random() * 10;
        });
      }, 1000);

      const response = await fetch('/api/simulation/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro na simulação');
      }

      const data: SimulationResponse = await response.json();
      setResults(data);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      setProgress(0);
    } finally {
      setIsRunning(false);
    }
  };

  const downloadResults = () => {
    if (!results) return;

    const content = `RELATÓRIO DE SIMULAÇÃO OSCE
========================

ID da Simulação: ${results.simulation.id}
Data de Início: ${new Date(results.simulation.startTime).toLocaleString('pt-BR')}
Data de Conclusão: ${new Date(results.simulation.endTime).toLocaleString('pt-BR')}
Duração Total: ${results.simulation.totalDuration} segundos

ESTATÍSTICAS:
- Total de Estações: ${results.simulation.statistics.totalStations}
- Estações Concluídas: ${results.simulation.statistics.completedStations}
- Estações com Erro: ${results.simulation.statistics.failedStations}
- Taxa de Sucesso: ${results.simulation.statistics.successRate}%

ESTAÇÕES:
${results.stations.map(station => `
ESTAÇÃO ${station.stationNumber}:
- Nome: ${station.station.name}
- Especialidade: ${station.station.specialty}
- Código: ${station.station.code}
- Agente: ${station.agent.name}
- Status: ${station.status === 'completed' ? 'Concluída' : 'Falhou'}
- Duração: ${station.duration} minutos
- Timestamp: ${new Date(station.timestamp).toLocaleString('pt-BR')}
${station.error ? `- Erro: ${station.error}` : ''}

TRANSCRIÇÃO:
${station.transcription}

${'='.repeat(50)}
`).join('\n')}
`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `simulacao-osce-${results.simulation.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const resetSimulation = () => {
    setResults(null);
    setError(null);
    setProgress(0);
    setSelectedStation(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <BackButton className="mr-4" />
          <div className="flex-1">
            <h1 className="text-3xl font-bold">Teste de Simulação OSCE</h1>
            <p className="text-muted-foreground mt-2">
              Teste a simulação automatizada com transferência de agentes ElevenLabs
            </p>
          </div>
        </div>

        {/* Controles */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5" />
              Controles da Simulação
            </CardTitle>
            <CardDescription>
              Execute uma simulação completa com 5 estações e transferência entre agentes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Button 
                onClick={startSimulation} 
                disabled={isRunning}
                className="flex items-center gap-2"
              >
                {isRunning ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                {isRunning ? 'Executando...' : 'Iniciar Simulação'}
              </Button>
              
              {results && (
                <>
                  <Button 
                    onClick={downloadResults}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Baixar Relatório
                  </Button>
                  
                  <Button 
                    onClick={resetSimulation}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Square className="h-4 w-4" />
                    Nova Simulação
                  </Button>
                </>
              )}
            </div>

            {isRunning && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progresso da Simulação</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}

            {error && (
              <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                <div className="flex items-center gap-2 text-destructive">
                  <XCircle className="h-4 w-4" />
                  <span className="font-medium">Erro na Simulação</span>
                </div>
                <p className="text-sm text-destructive/80 mt-1">{error}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Resultados */}
        {results && (
          <div className="space-y-6">
            {/* Estatísticas Gerais */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Resultados da Simulação
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{results.simulation.statistics.totalStations}</div>
                    <div className="text-sm text-muted-foreground">Total de Estações</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-500">{results.simulation.statistics.completedStations}</div>
                    <div className="text-sm text-muted-foreground">Concluídas</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-500">{results.simulation.statistics.failedStations}</div>
                    <div className="text-sm text-muted-foreground">Com Erro</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{results.simulation.statistics.successRate}%</div>
                    <div className="text-sm text-muted-foreground">Taxa de Sucesso</div>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t">
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Duração Total: {results.simulation.totalDuration}s</span>
                    <span>ID: {results.simulation.id}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Lista de Estações */}
            <div className="grid gap-4">
              <h3 className="text-xl font-semibold">Estações da Simulação</h3>
              
              {results.stations.map((station, index) => (
                <Card 
                  key={index}
                  className={`cursor-pointer transition-colors ${
                    selectedStation === index ? 'ring-2 ring-primary' : 'hover:bg-muted/50'
                  }`}
                  onClick={() => setSelectedStation(selectedStation === index ? null : index)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          {station.status === 'completed' ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-500" />
                          )}
                          <span className="font-medium">Estação {station.stationNumber}</span>
                        </div>
                        
                        <Badge variant="outline">{station.station.specialty}</Badge>
                        <Badge variant="secondary">{station.agent.name}</Badge>
                        
                        {station.status === 'completed' && (
                          <Badge className="bg-green-500 text-white">
                            <Clock className="h-3 w-3 mr-1" />
                            {station.duration}min
                          </Badge>
                        )}
                      </div>
                      
                      <div className="text-sm text-muted-foreground">
                        {station.station.name}
                      </div>
                    </div>
                    
                    {selectedStation === index && (
                      <div className="mt-4 pt-4 border-t">
                        <div className="space-y-3">
                          <div>
                            <h4 className="font-medium mb-2">Informações da Estação</h4>
                            <div className="text-sm text-muted-foreground space-y-1">
                              <p><strong>Código:</strong> {station.station.code}</p>
                              <p><strong>Agente:</strong> {station.agent.id}</p>
                              <p><strong>Status:</strong> {station.status === 'completed' ? 'Concluída' : 'Falhou'}</p>
                              <p><strong>Timestamp:</strong> {new Date(station.timestamp).toLocaleString('pt-BR')}</p>
                              {station.error && <p><strong>Erro:</strong> <span className="text-red-500">{station.error}</span></p>}
                            </div>
                          </div>
                          
                          {station.transcription && (
                            <div>
                              <h4 className="font-medium mb-2">Transcrição da Conversa</h4>
                              <div className="bg-muted p-3 rounded-lg text-sm font-mono whitespace-pre-wrap max-h-40 overflow-y-auto">
                                {station.transcription}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
