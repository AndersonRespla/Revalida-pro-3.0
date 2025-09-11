/**
 * Integração Real com ElevenLabs Conversational AI
 * 
 * Este módulo contém as funções para integração real com a API da ElevenLabs
 * Substitua as funções mock no simulation-runner.js por estas implementações
 */

const fetch = require('node-fetch');

class ElevenLabsIntegration {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.elevenlabs.io/v1';
  }

  /**
   * Inicia uma sessão de conversa com um agente
   */
  async startConversation(agentId, context = {}) {
    try {
      const response = await fetch(`${this.baseUrl}/convai/conversation/start`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          agent_id: agentId,
          context: context,
          session_id: `sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        })
      });

      if (!response.ok) {
        throw new Error(`ElevenLabs API error: ${response.status} - ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ Conversa iniciada com agente:', agentId);
      return result;

    } catch (error) {
      console.error('❌ Erro ao iniciar conversa:', error.message);
      throw error;
    }
  }

  /**
   * Transfere conversa para outro agente
   */
  async transferToAgent(currentAgentId, targetAgentId, transferReason = 'station_complete') {
    try {
      console.log(`🔄 Transferindo de ${currentAgentId} para ${targetAgentId}...`);

      const response = await fetch(`${this.baseUrl}/convai/agent-transfer`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          current_agent_id: currentAgentId,
          target_agent_id: targetAgentId,
          transfer_reason: transferReason,
          metadata: {
            timestamp: new Date().toISOString(),
            simulation_id: `sim_${Date.now()}`
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`ElevenLabs transfer error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Transferência concluída:', result);
      return result;

    } catch (error) {
      console.error('❌ Erro na transferência:', error.message);
      throw error;
    }
  }

  /**
   * Envia mensagem para o agente atual
   */
  async sendMessage(agentId, message, sessionId) {
    try {
      const response = await fetch(`${this.baseUrl}/convai/conversation/message`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          agent_id: agentId,
          session_id: sessionId,
          message: message,
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error(`ElevenLabs message error: ${response.status}`);
      }

      const result = await response.json();
      return result;

    } catch (error) {
      console.error('❌ Erro ao enviar mensagem:', error.message);
      throw error;
    }
  }

  /**
   * Obtém transcrição da conversa
   */
  async getTranscription(sessionId) {
    try {
      const response = await fetch(`${this.baseUrl}/convai/conversation/transcript/${sessionId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`ElevenLabs transcript error: ${response.status}`);
      }

      const result = await response.json();
      return result.transcript || '';

    } catch (error) {
      console.error('❌ Erro ao obter transcrição:', error.message);
      throw error;
    }
  }

  /**
   * Finaliza a conversa
   */
  async endConversation(sessionId) {
    try {
      const response = await fetch(`${this.baseUrl}/convai/conversation/end`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          session_id: sessionId,
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error(`ElevenLabs end conversation error: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Conversa finalizada:', sessionId);
      return result;

    } catch (error) {
      console.error('❌ Erro ao finalizar conversa:', error.message);
      throw error;
    }
  }

  /**
   * Simula uma conversa completa com um agente
   */
  async simulateStationConversation(agentId, station, durationMinutes = 10) {
    const sessionId = `sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();
    const endTime = startTime + (durationMinutes * 60 * 1000);

    console.log(`🎭 Iniciando conversa com agente ${agentId}`);
    console.log(`📋 Estação: ${station.name}`);
    console.log(`⏱️  Duração: ${durationMinutes} minutos`);

    try {
      // Iniciar conversa
      await this.startConversation(agentId, {
        station_name: station.name,
        specialty: station.specialty,
        participant_info: station.participant_info,
        actor_info: station.actor_info,
        available_exams: station.available_exams
      });

      // Simular conversa com mensagens periódicas
      const messages = [
        "Olá, como posso ajudá-lo hoje?",
        "Pode me descrever melhor seus sintomas?",
        "Vou realizar um exame físico agora.",
        "Com base nos sintomas, vou solicitar alguns exames.",
        "Vou prescrever algumas medicações e orientações."
      ];

      let messageIndex = 0;
      const messageInterval = (durationMinutes * 60 * 1000) / messages.length;

      while (Date.now() < endTime && messageIndex < messages.length) {
        const message = messages[messageIndex];
        console.log(`💬 Enviando mensagem: "${message}"`);
        
        await this.sendMessage(agentId, message, sessionId);
        
        messageIndex++;
        
        if (messageIndex < messages.length) {
          await new Promise(resolve => setTimeout(resolve, messageInterval));
        }
      }

      // Obter transcrição final
      const transcription = await this.getTranscription(sessionId);
      
      // Finalizar conversa
      await this.endConversation(sessionId);

      return {
        sessionId,
        agentId,
        station: station.name,
        duration: durationMinutes,
        transcription: transcription,
        status: 'completed',
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error(`❌ Erro na conversa com agente ${agentId}:`, error.message);
      
      // Tentar finalizar a conversa mesmo em caso de erro
      try {
        await this.endConversation(sessionId);
      } catch (endError) {
        console.error('❌ Erro ao finalizar conversa após erro:', endError.message);
      }

      return {
        sessionId,
        agentId,
        station: station.name,
        duration: durationMinutes,
        error: error.message,
        status: 'failed',
        timestamp: new Date().toISOString()
      };
    }
  }
}

module.exports = { ElevenLabsIntegration };
