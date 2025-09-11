// Circuit Breaker implementation for fault tolerance

export interface CircuitBreakerOptions {
  failureThreshold: number;  // Número de falhas antes de abrir o circuito
  resetTimeout: number;      // Tempo em ms antes de tentar fechar o circuito
  timeout?: number;          // Timeout opcional para cada chamada
  monitoringPeriod?: number; // Período para resetar contadores (ms)
}

export interface CircuitBreakerState {
  failures: number;
  successes: number;
  lastFailureTime?: number;
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
}

export class CircuitBreaker<T = any> {
  private state: CircuitBreakerState = {
    failures: 0,
    successes: 0,
    state: 'CLOSED'
  };
  
  private resetTimer?: NodeJS.Timeout;
  private monitoringTimer?: NodeJS.Timeout;
  
  constructor(
    private name: string,
    private options: CircuitBreakerOptions
  ) {
    // Configurar reset periódico de contadores
    if (options.monitoringPeriod) {
      this.monitoringTimer = setInterval(() => {
        if (this.state.state === 'CLOSED') {
          this.state.failures = 0;
          this.state.successes = 0;
        }
      }, options.monitoringPeriod);
    }
  }
  
  async execute<R>(fn: () => Promise<R>): Promise<R> {
    // Verificar estado do circuit breaker
    if (this.state.state === 'OPEN') {
      const now = Date.now();
      const timeSinceLastFailure = now - (this.state.lastFailureTime || 0);
      
      if (timeSinceLastFailure < this.options.resetTimeout) {
        throw new Error(`Circuit breaker ${this.name} is OPEN. Service unavailable.`);
      }
      
      // Tentar half-open
      this.state.state = 'HALF_OPEN';
      console.log(`🔄 Circuit breaker ${this.name} tentando HALF_OPEN`);
    }
    
    try {
      // Executar com timeout se configurado
      const result = await this.executeWithTimeout(fn);
      
      // Sucesso
      this.onSuccess();
      return result;
      
    } catch (error) {
      // Falha
      this.onFailure();
      throw error;
    }
  }
  
  private async executeWithTimeout<R>(fn: () => Promise<R>): Promise<R> {
    if (!this.options.timeout) {
      return fn();
    }
    
    return Promise.race([
      fn(),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error(`Timeout após ${this.options.timeout}ms`)), this.options.timeout)
      )
    ]);
  }
  
  private onSuccess() {
    this.state.successes++;
    
    if (this.state.state === 'HALF_OPEN') {
      // Resetar e fechar o circuito
      this.state.state = 'CLOSED';
      this.state.failures = 0;
      console.log(`✅ Circuit breaker ${this.name} FECHADO após sucesso`);
    }
  }
  
  private onFailure() {
    this.state.failures++;
    this.state.lastFailureTime = Date.now();
    
    console.log(`❌ Circuit breaker ${this.name}: falha ${this.state.failures}/${this.options.failureThreshold}`);
    
    if (this.state.failures >= this.options.failureThreshold) {
      this.state.state = 'OPEN';
      console.log(`🚨 Circuit breaker ${this.name} ABERTO após ${this.state.failures} falhas`);
      
      // Agendar tentativa de reset
      if (this.resetTimer) {
        clearTimeout(this.resetTimer);
      }
      
      this.resetTimer = setTimeout(() => {
        console.log(`⏰ Circuit breaker ${this.name} tentando reset...`);
        this.state.state = 'HALF_OPEN';
      }, this.options.resetTimeout);
    }
  }
  
  getState(): CircuitBreakerState {
    return { ...this.state };
  }
  
  reset() {
    this.state = {
      failures: 0,
      successes: 0,
      state: 'CLOSED'
    };
    
    if (this.resetTimer) {
      clearTimeout(this.resetTimer);
    }
    
    console.log(`🔄 Circuit breaker ${this.name} resetado manualmente`);
  }
  
  destroy() {
    if (this.resetTimer) {
      clearTimeout(this.resetTimer);
    }
    
    if (this.monitoringTimer) {
      clearInterval(this.monitoringTimer);
    }
  }
}

// Factory para criar circuit breakers configurados
export function createCircuitBreaker(
  name: string,
  options: Partial<CircuitBreakerOptions> = {}
): CircuitBreaker {
  const defaultOptions: CircuitBreakerOptions = {
    failureThreshold: 3,
    resetTimeout: 30000, // 30 segundos
    timeout: 20000,      // 20 segundos
    monitoringPeriod: 300000 // 5 minutos
  };
  
  return new CircuitBreaker(name, { ...defaultOptions, ...options });
}

// Circuit breakers pré-configurados para diferentes serviços
export const circuitBreakers = {
  elevenlabs: createCircuitBreaker('ElevenLabs', {
    failureThreshold: 3,
    resetTimeout: 60000,   // 1 minuto
    timeout: 30000         // 30 segundos
  }),
  
  openai: createCircuitBreaker('OpenAI', {
    failureThreshold: 5,
    resetTimeout: 30000,   // 30 segundos
    timeout: 60000         // 60 segundos
  }),
  
  supabase: createCircuitBreaker('Supabase', {
    failureThreshold: 10,
    resetTimeout: 10000,   // 10 segundos
    timeout: 10000         // 10 segundos
  })
};
