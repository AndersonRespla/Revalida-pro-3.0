// Configuração de fallbacks para APIs externas
export class ApiFallbackService {
  private static instance: ApiFallbackService;
  private retryAttempts: number = 3;
  private retryDelay: number = 1000; // 1 segundo

  private constructor() {}

  public static getInstance(): ApiFallbackService {
    if (!ApiFallbackService.instance) {
      ApiFallbackService.instance = new ApiFallbackService();
    }
    return ApiFallbackService.instance;
  }

  // Retry com backoff exponencial
  public async withRetry<T>(
    apiCall: () => Promise<T>,
    context: string,
    maxRetries: number = this.retryAttempts
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await apiCall();
      } catch (error) {
        lastError = error as Error;
        
        console.warn(`API call failed (attempt ${attempt}/${maxRetries}):`, context, error);
        
        if (attempt === maxRetries) {
          break;
        }

        // Backoff exponencial
        const delay = this.retryDelay * Math.pow(2, attempt - 1);
        await this.sleep(delay);
      }
    }

    throw lastError!;
  }

  // Fallback para transcrição de áudio
  public async transcribeAudioWithFallback(audioBlob: Blob): Promise<string> {
    try {
      // Tentar OpenAI Whisper primeiro
      return await this.withRetry(
        () => this.callOpenAIWhisper(audioBlob),
        'OpenAI Whisper transcription'
      );
    } catch (error) {
      console.error('OpenAI Whisper failed, trying fallback:', error);
      
      // Fallback: retornar mensagem de erro amigável
      return "Transcrição não disponível no momento. Por favor, tente novamente mais tarde.";
    }
  }

  // Fallback para geração de feedback
  public async generateFeedbackWithFallback(transcript: string): Promise<string> {
    try {
      // Tentar OpenAI GPT primeiro
      return await this.withRetry(
        () => this.callOpenAIGPT(transcript),
        'OpenAI GPT feedback generation'
      );
    } catch (error) {
      console.error('OpenAI GPT failed, using fallback:', error);
      
      // Fallback: feedback genérico
      return this.getGenericFeedback(transcript);
    }
  }

  // Fallback para chat com IA
  public async chatWithFallback(message: string, history: any[] = []): Promise<string> {
    try {
      return await this.withRetry(
        () => this.callOpenAIChat(message, history),
        'OpenAI Chat'
      );
    } catch (error) {
      console.error('OpenAI Chat failed, using fallback:', error);
      
      // Fallback: respostas pré-definidas baseadas em palavras-chave
      return this.getFallbackResponse(message);
    }
  }

  // Implementações dos métodos de API
  private async callOpenAIWhisper(audioBlob: Blob): Promise<string> {
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.webm');
    formData.append('model', 'whisper-1');

    const response = await fetch('/api/transcribe', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Transcription failed: ${response.statusText}`);
    }

    const result = await response.json();
    return result.transcript || '';
  }

  private async callOpenAIGPT(transcript: string): Promise<string> {
    const response = await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transcripts: { 1: transcript } })
    });

    if (!response.ok) {
      throw new Error(`Feedback generation failed: ${response.statusText}`);
    }

    const result = await response.json();
    return result.feedbackHtml || '';
  }

  private async callOpenAIChat(message: string, history: any[]): Promise<string> {
    const response = await fetch('/api/chatgpt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, conversationHistory: history })
    });

    if (!response.ok) {
      throw new Error(`Chat failed: ${response.statusText}`);
    }

    const result = await response.json();
    return result.response || '';
  }

  // Fallbacks genéricos
  private getGenericFeedback(transcript: string): string {
    const wordCount = transcript.split(' ').length;
    
    if (wordCount < 10) {
      return `
        <div class="feedback-fallback">
          <h3>Feedback Genérico</h3>
          <p>Sua resposta foi muito breve. Tente ser mais detalhado na próxima vez.</p>
          <ul>
            <li>Inclua mais detalhes na anamnese</li>
            <li>Explique melhor seus achados no exame físico</li>
            <li>Justifique suas condutas</li>
          </ul>
        </div>
      `;
    }

    return `
      <div class="feedback-fallback">
        <h3>Feedback Genérico</h3>
        <p>Obrigado por sua participação! Continue praticando para melhorar suas habilidades.</p>
        <ul>
          <li>Mantenha a confiança durante a simulação</li>
          <li>Pratique a comunicação com o paciente</li>
          <li>Revise os protocolos clínicos</li>
        </ul>
      </div>
    `;
  }

  private getFallbackResponse(message: string): string {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('osce') || lowerMessage.includes('simulação')) {
      return "Para simulações OSCE, recomendo praticar com diferentes cenários clínicos e focar na comunicação com o paciente.";
    }
    
    if (lowerMessage.includes('cardiologia') || lowerMessage.includes('coração')) {
      return "Em cardiologia, é importante avaliar sintomas como dor torácica, dispneia e palpitações. Considere sempre o risco cardiovascular.";
    }
    
    if (lowerMessage.includes('neurologia') || lowerMessage.includes('cérebro')) {
      return "Na neurologia, avalie função motora, sensorial e cognitiva. Sempre considere o tempo de evolução dos sintomas.";
    }
    
    if (lowerMessage.includes('emergência') || lowerMessage.includes('urgência')) {
      return "Em emergências, priorize a estabilização do paciente (ABC) e avalie a necessidade de intervenções imediatas.";
    }
    
    return "Obrigado pela pergunta! Para uma resposta mais específica, tente reformular sua pergunta ou consulte materiais de estudo atualizados.";
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Instância singleton
export const apiFallbacks = ApiFallbackService.getInstance();

// Hook para React
export function useApiFallbacks() {
  return apiFallbacks;
}
