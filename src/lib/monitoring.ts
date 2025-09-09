// Configuração de monitoramento e logging
export class MonitoringService {
  private static instance: MonitoringService;
  private isProduction: boolean;

  private constructor() {
    this.isProduction = import.meta.env.PROD;
  }

  public static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService();
    }
    return MonitoringService.instance;
  }

  // Log de erros
  public logError(error: Error, context?: Record<string, any>) {
    console.error('Error:', error.message, context);
    
    if (this.isProduction) {
      // Aqui você pode integrar com Sentry, LogRocket, etc.
      // Sentry.captureException(error, { extra: context });
    }
  }

  // Log de eventos importantes
  public logEvent(event: string, data?: Record<string, any>) {
    console.log(`Event: ${event}`, data);
    
    if (this.isProduction) {
      // Aqui você pode enviar para analytics
      // analytics.track(event, data);
    }
  }

  // Log de performance
  public logPerformance(metric: string, value: number, context?: Record<string, any>) {
    console.log(`Performance: ${metric} = ${value}ms`, context);
    
    if (this.isProduction) {
      // Aqui você pode enviar para monitoring
      // performance.track(metric, value, context);
    }
  }

  // Monitoramento de API calls
  public async trackApiCall<T>(
    apiCall: () => Promise<T>,
    endpoint: string,
    method: string = 'GET'
  ): Promise<T> {
    const startTime = performance.now();
    
    try {
      const result = await apiCall();
      const duration = performance.now() - startTime;
      
      this.logPerformance(`api.${method.toLowerCase()}.${endpoint}`, duration);
      
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      
      this.logError(error as Error, {
        endpoint,
        method,
        duration
      });
      
      throw error;
    }
  }

  // Monitoramento de user actions
  public trackUserAction(action: string, userId?: string, data?: Record<string, any>) {
    this.logEvent('user_action', {
      action,
      userId,
      timestamp: new Date().toISOString(),
      ...data
    });
  }

  // Monitoramento de simulações
  public trackSimulationEvent(event: string, simulationId: string, userId: string, data?: Record<string, any>) {
    this.logEvent('simulation_event', {
      event,
      simulationId,
      userId,
      timestamp: new Date().toISOString(),
      ...data
    });
  }
}

// Instância singleton
export const monitoring = MonitoringService.getInstance();

// Hook para React
export function useMonitoring() {
  return monitoring;
}
