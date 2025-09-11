// Utilities for handling timeouts and retries with fault tolerance

export interface TimeoutOptions {
  timeoutMs: number;
  errorMessage?: string;
}

export interface RetryOptions {
  maxAttempts: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
  jitterFactor?: number; // 0 to 1
  shouldRetry?: (error: any, attempt: number) => boolean;
  onRetry?: (error: any, attempt: number, nextDelay: number) => void;
}

// Timeout wrapper com Promise
export async function withTimeout<T>(
  promise: Promise<T>,
  options: TimeoutOptions
): Promise<T> {
  const { timeoutMs, errorMessage = `Operation timed out after ${timeoutMs}ms` } = options;
  
  let timeoutId: NodeJS.Timeout;
  
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(errorMessage));
    }, timeoutMs);
  });
  
  try {
    const result = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timeoutId!);
    return result;
  } catch (error) {
    clearTimeout(timeoutId!);
    throw error;
  }
}

// Sleep helper
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Exponential backoff com jitter
export function calculateBackoffDelay(
  attempt: number,
  options: Pick<RetryOptions, 'initialDelayMs' | 'maxDelayMs' | 'backoffMultiplier' | 'jitterFactor'>
): number {
  const {
    initialDelayMs = 1000,
    maxDelayMs = 30000,
    backoffMultiplier = 2,
    jitterFactor = 0.3
  } = options;
  
  // Calcular delay exponencial
  const exponentialDelay = Math.min(
    initialDelayMs * Math.pow(backoffMultiplier, attempt - 1),
    maxDelayMs
  );
  
  // Adicionar jitter para evitar thundering herd
  const jitter = exponentialDelay * jitterFactor * Math.random();
  
  return Math.round(exponentialDelay + jitter);
}

// Retry com exponential backoff
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions
): Promise<T> {
  const {
    maxAttempts,
    shouldRetry = () => true,
    onRetry = () => {}
  } = options;
  
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Verificar se deve tentar novamente
      if (attempt === maxAttempts || !shouldRetry(error, attempt)) {
        throw error;
      }
      
      // Calcular delay para próxima tentativa
      const delay = calculateBackoffDelay(attempt, options);
      
      // Callback antes de retry
      onRetry(error, attempt, delay);
      
      // Aguardar antes da próxima tentativa
      await sleep(delay);
    }
  }
  
  throw lastError;
}

// Combinar timeout com retry
export async function withTimeoutAndRetry<T>(
  fn: () => Promise<T>,
  timeoutOptions: TimeoutOptions,
  retryOptions: RetryOptions
): Promise<T> {
  return withRetry(
    () => withTimeout(fn(), timeoutOptions),
    retryOptions
  );
}

// Verificar se erro é retryable
export function isRetryableError(error: any): boolean {
  // Network errors
  if (error.code === 'ECONNREFUSED' || 
      error.code === 'ENOTFOUND' || 
      error.code === 'ETIMEDOUT' ||
      error.code === 'ECONNRESET') {
    return true;
  }
  
  // HTTP status codes que indicam erro temporário
  if (error.status === 429 || // Too Many Requests
      error.status === 502 || // Bad Gateway
      error.status === 503 || // Service Unavailable
      error.status === 504) { // Gateway Timeout
    return true;
  }
  
  // Timeouts
  if (error.message?.includes('timeout') || 
      error.message?.includes('timed out')) {
    return true;
  }
  
  return false;
}

// Wrapper para APIs críticas com todas as proteções
export async function callWithProtection<T>(
  name: string,
  fn: () => Promise<T>,
  options: {
    timeout?: number;
    maxRetries?: number;
    circuitBreaker?: any; // Import do circuit breaker se necessário
  } = {}
): Promise<T> {
  const {
    timeout = 20000,
    maxRetries = 3,
    circuitBreaker
  } = options;
  
  console.log(`🔄 Chamando ${name} com proteção...`);
  
  const executeCall = async () => {
    return withTimeoutAndRetry(
      fn,
      {
        timeoutMs: timeout,
        errorMessage: `${name} timeout após ${timeout}ms`
      },
      {
        maxAttempts: maxRetries,
        shouldRetry: (error, attempt) => {
          const isRetryable = isRetryableError(error);
          console.log(`${name} - Tentativa ${attempt}/${maxRetries} falhou. Retryable: ${isRetryable}`);
          return isRetryable;
        },
        onRetry: (error, attempt, nextDelay) => {
          console.log(`⏳ ${name} - Aguardando ${nextDelay}ms antes da tentativa ${attempt + 1}`);
        }
      }
    );
  };
  
  // Se tiver circuit breaker, usar
  if (circuitBreaker) {
    return circuitBreaker.execute(executeCall);
  }
  
  return executeCall();
}

// Timeout handlers para diferentes cenários
export const timeoutPresets = {
  // APIs externas
  externalApi: { timeoutMs: 30000, errorMessage: 'API externa não respondeu a tempo' },
  
  // Operações de banco
  database: { timeoutMs: 10000, errorMessage: 'Timeout na operação do banco de dados' },
  
  // Transcrição de áudio
  transcription: { timeoutMs: 60000, errorMessage: 'Timeout na transcrição de áudio' },
  
  // Handoff entre agentes
  agentHandoff: { timeoutMs: 20000, errorMessage: 'Timeout no handoff entre agentes' },
  
  // Geração de feedback
  feedbackGeneration: { timeoutMs: 45000, errorMessage: 'Timeout na geração de feedback' }
};
