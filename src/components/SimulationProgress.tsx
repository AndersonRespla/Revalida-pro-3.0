import { useMemo } from 'react';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Circle, Clock, Activity } from 'lucide-react';

interface SimulationProgressProps {
  currentStation: number;
  totalStations: number;
  secondsLeft: number;
  status: 'idle' | 'running' | 'finished';
  stationSpecialty?: string;
}

const STATION_DURATION = 10 * 60; // 10 minutos

export function SimulationProgress({
  currentStation,
  totalStations,
  secondsLeft,
  status,
  stationSpecialty
}: SimulationProgressProps) {
  const timeProgress = useMemo(() => {
    if (status !== 'running') return 0;
    return ((STATION_DURATION - secondsLeft) / STATION_DURATION) * 100;
  }, [secondsLeft, status]);

  const overallProgress = useMemo(() => {
    const completedStations = status === 'finished' ? totalStations : currentStation - 1;
    const currentProgress = status === 'running' ? 0.5 : (status === 'finished' ? 1 : 0);
    return ((completedStations + currentProgress) / totalStations) * 100;
  }, [currentStation, totalStations, status]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getStationStatus = (stationNumber: number) => {
    if (stationNumber < currentStation) return 'completed';
    if (stationNumber === currentStation) return status === 'running' ? 'active' : 'current';
    return 'pending';
  };

  return (
    <Card className="p-6 space-y-6">
      {/* Header com informações gerais */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Progresso da Simulação</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {status === 'finished' 
              ? 'Simulação concluída!'
              : `Estação ${currentStation} de ${totalStations}`}
          </p>
        </div>
        
        {status === 'running' && (
          <div className="text-right">
            <div className="flex items-center gap-2 text-2xl font-bold">
              <Clock className="h-5 w-5" />
              {formatTime(secondsLeft)}
            </div>
            <p className="text-xs text-muted-foreground">Tempo restante</p>
          </div>
        )}
      </div>

      {/* Barra de progresso geral */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Progresso geral</span>
          <span className="font-medium">{Math.round(overallProgress)}%</span>
        </div>
        <Progress value={overallProgress} className="h-2" />
      </div>

      {/* Indicadores de estação */}
      <div className="grid grid-cols-5 gap-3">
        {Array.from({ length: totalStations }, (_, i) => {
          const stationNum = i + 1;
          const stationStatus = getStationStatus(stationNum);
          
          return (
            <div
              key={stationNum}
              className={`
                flex flex-col items-center gap-2 p-3 rounded-lg transition-all
                ${stationStatus === 'active' ? 'bg-primary/10 ring-2 ring-primary' : ''}
                ${stationStatus === 'current' ? 'bg-muted' : ''}
              `}
            >
              <div className="relative">
                {stationStatus === 'completed' ? (
                  <CheckCircle2 className="h-8 w-8 text-primary" />
                ) : stationStatus === 'active' ? (
                  <Activity className="h-8 w-8 text-primary animate-pulse" />
                ) : (
                  <Circle className={`h-8 w-8 ${stationStatus === 'current' ? 'text-primary' : 'text-muted-foreground'}`} />
                )}
              </div>
              <span className="text-xs font-medium">
                Estação {stationNum}
              </span>
              {stationStatus === 'active' && stationSpecialty && (
                <Badge variant="secondary" className="text-xs">
                  {stationSpecialty}
                </Badge>
              )}
            </div>
          );
        })}
      </div>

      {/* Barra de progresso do tempo (apenas durante execução) */}
      {status === 'running' && (
        <div className="space-y-2 pt-4 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Tempo da estação atual</span>
            <span className="font-medium">{Math.round(timeProgress)}%</span>
          </div>
          <Progress value={timeProgress} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>0-3 min: Anamnese</span>
            <span>3-7 min: Exame e Hipóteses</span>
            <span>7-10 min: Finalização</span>
          </div>
        </div>
      )}

      {/* Status badges */}
      <div className="flex items-center gap-2 pt-4 border-t">
        {status === 'idle' && (
          <Badge variant="secondary">
            Aguardando início
          </Badge>
        )}
        {status === 'running' && (
          <Badge variant="default" className="animate-pulse">
            Em andamento
          </Badge>
        )}
        {status === 'finished' && (
          <Badge variant="success">
            Concluída
          </Badge>
        )}
      </div>
    </Card>
  );
}
