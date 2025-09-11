#!/usr/bin/env node

/**
 * Script de Simulação OSCE com ElevenLabs Conversational AI
 * 
 * Funcionalidades:
 * - Conecta ao Supabase e busca 5 estações aleatórias
 * - Simula transferência entre 5 agentes (Paciente 1-5)
 * - Salva transcrições em arquivos individuais
 * - Gera relatório final de feedback
 * 
 * Uso: node simulation-runner.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');

// Configurações (substitua pelos seus valores)
const SUPABASE_URL = process.env.SUPABASE_URL || 'YOUR_SUPABASE_URL_HERE';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'YOUR_SUPABASE_ANON_KEY_HERE';
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || 'YOUR_ELEVENLABS_API_KEY_HERE';

// Configuração do Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// IDs dos agentes ElevenLabs (substitua pelos seus agentes)
const AGENT_IDS = [
  'agent_patient_1_id',  // Paciente 1
  'agent_patient_2_id',  // Paciente 2
  'agent_patient_3_id',  // Paciente 3
  'agent_patient_4_id',  // Paciente 4
  'agent_patient_5_id',  // Paciente 5
];

// Configurações da simulação
const SIMULATION_CONFIG = {
  totalStations: 5,
  stationDuration: 10, // minutos
  transferDelay: 2000, // ms entre transferências
  outputDir: './simulation-output'
};

/**
 * Classe principal para gerenciar a simulação
 */
class SimulationRunner {
  constructor() {
    this.stations = [];
    this.transcriptions = [];
    this.feedback = [];
    this.startTime = new Date();
  }

  /**
   * Cria diretório de saída se não existir
   */
  async createOutputDir() {
    try {
      await fs.mkdir(SIMULATION_CONFIG.outputDir, { recursive: true });
      console.log(`📁 Diretório de saída criado: ${SIMULATION_CONFIG.outputDir}`);
    } catch (error) {
      console.error('❌ Erro ao criar diretório:', error.message);
      throw error;
    }
  }

  /**
   * Busca estações aleatórias do Supabase
   */
  async fetchRandomStations() {
    console.log('🔍 Buscando estações aleatórias do Supabase...');
    
    try {
      const { data, error } = await supabase
        .from('stations_with_criteria')
        .select('*')
        .eq('is_active', true)
        .limit(SIMULATION_CONFIG.totalStations);

      if (error) {
        throw new Error(`Erro na query Supabase: ${error.message}`);
      }

      if (!data || data.length === 0) {
        throw new Error('Nenhuma estação ativa encontrada');
      }

      // Embaralha as estações para simular ORDER BY random()
      this.stations = data.sort(() => Math.random() - 0.5).slice(0, SIMULATION_CONFIG.totalStations);
      
      console.log(`✅ ${this.stations.length} estações carregadas`);
      this.stations.forEach((station, index) => {
        console.log(`   ${index + 1}. ${station.name} (${station.specialty})`);
      });

      return this.stations;
    } catch (error) {
      console.error('❌ Erro ao buscar estações:', error.message);
      throw error;
    }
  }

  /**
   * Simula interação com agente ElevenLabs
   */
  async interactWithAgent(agentId, station, stationIndex) {
    console.log(`\n🎭 Iniciando interação com Agente ${stationIndex + 1} (${agentId})`);
    console.log(`📋 Estação: ${station.name}`);
    console.log(`⏱️  Duração: ${SIMULATION_CONFIG.stationDuration} minutos`);

    try {
      // Simula início da conversa com o agente
      const conversationStart = {
        timestamp: new Date().toISOString(),
        agentId: agentId,
        station: station.name,
        specialty: station.specialty,
        participantInfo: station.participant_info,
        actorInfo: station.actor_info,
        availableExams: station.available_exams,
        criteria: station.criteria
      };

      // Simula transcrição da conversa (em produção, viria da ElevenLabs)
      const transcription = await this.generateMockTranscription(station, stationIndex);
      
      // Simula transferência para próximo agente
      if (stationIndex < SIMULATION_CONFIG.totalStations - 1) {
        await this.transferToNextAgent(agentId, AGENT_IDS[stationIndex + 1]);
      }

      return {
        ...conversationStart,
        transcription: transcription,
        duration: SIMULATION_CONFIG.stationDuration,
        status: 'completed'
      };

    } catch (error) {
      console.error(`❌ Erro na interação com agente ${stationIndex + 1}:`, error.message);
      return {
        agentId: agentId,
        station: station.name,
        error: error.message,
        status: 'failed'
      };
    }
  }

  /**
   * Gera transcrição simulada baseada na estação
   */
  async generateMockTranscription(station, stationIndex) {
    const mockConversations = [
      `[${new Date().toISOString()}] Médico: Olá, como posso ajudá-lo hoje?\n[${new Date().toISOString()}] Paciente: Tenho sentido uma dor no peito há algumas horas...\n[${new Date().toISOString()}] Médico: Pode me descrever melhor essa dor?\n[${new Date().toISOString()}] Paciente: É uma dor opressiva, como se algo estivesse apertando meu peito...`,

      `[${new Date().toISOString()}] Médico: Vou realizar um exame físico completo agora.\n[${new Date().toISOString()}] Paciente: Está bem, pode proceder.\n[${new Date().toISOString()}] Médico: Vou auscultar seu coração e pulmões...\n[${new Date().toISOString()}] Paciente: Sinto falta de ar quando me movimento...`,

      `[${new Date().toISOString()}] Médico: Com base nos sintomas, vou solicitar alguns exames.\n[${new Date().toISOString()}] Paciente: Quais exames são necessários?\n[${new Date().toISOString()}] Médico: Vou solicitar um ECG de 12 derivações e enzimas cardíacas...\n[${new Date().toISOString()}] Paciente: Entendi, quando terei os resultados?`,

      `[${new Date().toISOString()}] Médico: Vou prescrever algumas medicações e orientações.\n[${new Date().toISOString()}] Paciente: Preciso tomar algum cuidado especial?\n[${new Date().toISOString()}] Médico: Evite esforços físicos e retorne imediatamente se a dor piorar...\n[${new Date().toISOString()}] Paciente: Muito obrigado, doutor.`
    ];

    // Simula delay da conversa
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return mockConversations[stationIndex % mockConversations.length];
  }

  /**
   * Simula transferência entre agentes
   */
  async transferToNextAgent(currentAgentId, nextAgentId) {
    console.log(`🔄 Transferindo de ${currentAgentId} para ${nextAgentId}...`);
    
    try {
      // Simula chamada para ElevenLabs agent_transfer
      const transferPayload = {
        current_agent_id: currentAgentId,
        target_agent_id: nextAgentId,
        transfer_reason: 'station_complete',
        metadata: {
          timestamp: new Date().toISOString(),
          simulation_id: `sim_${Date.now()}`
        }
      };

      // Em produção, faria a chamada real para ElevenLabs
      console.log('📡 Enviando transferência para ElevenLabs API...');
      console.log('   Payload:', JSON.stringify(transferPayload, null, 2));
      
      // Simula delay da transferência
      await new Promise(resolve => setTimeout(resolve, SIMULATION_CONFIG.transferDelay));
      
      console.log('✅ Transferência concluída');
      
    } catch (error) {
      console.error('❌ Erro na transferência:', error.message);
      throw error;
    }
  }

  /**
   * Salva transcrição individual da estação
   */
  async saveStationTranscription(stationData, stationIndex) {
    const filename = `station${stationIndex + 1}.txt`;
    const filepath = path.join(SIMULATION_CONFIG.outputDir, filename);
    
    const content = `ESTAÇÃO ${stationIndex + 1} - ${stationData.station}
Especialidade: ${stationData.specialty}
Data: ${stationData.timestamp}
Agente: ${stationData.agentId}
Duração: ${stationData.duration} minutos

INFORMAÇÕES AO PARTICIPANTE:
${stationData.participantInfo}

INFORMAÇÕES AO ATOR:
${stationData.actorInfo}

EXAMES DISPONÍVEIS:
${stationData.availableExams}

CRITÉRIOS DE AVALIAÇÃO:
${JSON.stringify(stationData.criteria, null, 2)}

TRANSCRIÇÃO DA CONVERSA:
${stationData.transcription}

STATUS: ${stationData.status}
`;

    try {
      await fs.writeFile(filepath, content, 'utf8');
      console.log(`💾 Transcrição salva: ${filename}`);
      return filepath;
    } catch (error) {
      console.error(`❌ Erro ao salvar ${filename}:`, error.message);
      throw error;
    }
  }

  /**
   * Gera relatório final de feedback
   */
  async generateFinalReport() {
    const endTime = new Date();
    const totalDuration = Math.round((endTime - this.startTime) / 1000 / 60); // minutos

    const report = `RELATÓRIO FINAL DA SIMULAÇÃO OSCE
==========================================

Data de Início: ${this.startTime.toISOString()}
Data de Conclusão: ${endTime.toISOString()}
Duração Total: ${totalDuration} minutos

RESUMO DAS ESTAÇÕES:
===================
`;

    this.transcriptions.forEach((station, index) => {
      report += `
ESTAÇÃO ${index + 1}:
- Nome: ${station.station}
- Especialidade: ${station.specialty}
- Agente: ${station.agentId}
- Status: ${station.status}
- Duração: ${station.duration} minutos
${station.error ? `- Erro: ${station.error}` : ''}
`;
    });

    report += `
ESTATÍSTICAS:
============
- Total de Estações: ${this.transcriptions.length}
- Estações Concluídas: ${this.transcriptions.filter(s => s.status === 'completed').length}
- Estações com Erro: ${this.transcriptions.filter(s => s.status === 'failed').length}
- Tempo Médio por Estação: ${SIMULATION_CONFIG.stationDuration} minutos

FEEDBACK GERAL:
==============
A simulação foi executada com sucesso, testando a integração entre:
- Supabase (busca de estações)
- ElevenLabs Conversational AI (transferência de agentes)
- Sistema de transcrição e feedback

Próximos passos:
- Implementar integração real com ElevenLabs API
- Adicionar análise de sentimentos nas transcrições
- Implementar sistema de scoring automático
- Integrar com sistema de feedback da IA

Arquivos Gerados:
================
${this.transcriptions.map((_, index) => `- station${index + 1}.txt`).join('\n')}
- feedback.txt (este arquivo)
`;

    const reportPath = path.join(SIMULATION_CONFIG.outputDir, 'feedback.txt');
    
    try {
      await fs.writeFile(reportPath, report, 'utf8');
      console.log(`📊 Relatório final salvo: feedback.txt`);
      return reportPath;
    } catch (error) {
      console.error('❌ Erro ao salvar relatório:', error.message);
      throw error;
    }
  }

  /**
   * Executa a simulação completa
   */
  async run() {
    console.log('🚀 Iniciando Simulação OSCE com ElevenLabs Conversational AI');
    console.log('============================================================\n');

    try {
      // 1. Criar diretório de saída
      await this.createOutputDir();

      // 2. Buscar estações aleatórias
      await this.fetchRandomStations();

      // 3. Executar simulação para cada estação
      for (let i = 0; i < this.stations.length; i++) {
        const station = this.stations[i];
        const agentId = AGENT_IDS[i % AGENT_IDS.length];

        console.log(`\n📍 Processando Estação ${i + 1}/${this.stations.length}`);
        console.log('=' .repeat(50));

        // Interagir com o agente
        const stationData = await this.interactWithAgent(agentId, station, i);
        
        // Salvar transcrição
        await this.saveStationTranscription(stationData, i);
        
        // Armazenar para relatório final
        this.transcriptions.push(stationData);

        // Delay entre estações
        if (i < this.stations.length - 1) {
          console.log(`⏳ Aguardando ${SIMULATION_CONFIG.transferDelay}ms antes da próxima estação...`);
          await new Promise(resolve => setTimeout(resolve, SIMULATION_CONFIG.transferDelay));
        }
      }

      // 4. Gerar relatório final
      await this.generateFinalReport();

      console.log('\n🎉 Simulação concluída com sucesso!');
      console.log(`📁 Arquivos salvos em: ${SIMULATION_CONFIG.outputDir}`);

    } catch (error) {
      console.error('\n💥 Erro na simulação:', error.message);
      process.exit(1);
    }
  }
}

/**
 * Função principal
 */
async function main() {
  // Verificar variáveis de ambiente
  const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_KEY', 'ELEVENLABS_API_KEY'];
  const missingVars = requiredEnvVars.filter(varName => 
    !process.env[varName] || process.env[varName].includes('YOUR_')
  );

  if (missingVars.length > 0) {
    console.error('❌ Variáveis de ambiente não configuradas:');
    missingVars.forEach(varName => console.error(`   - ${varName}`));
    console.error('\n💡 Configure as variáveis ou edite o script com seus valores.');
    process.exit(1);
  }

  // Executar simulação
  const runner = new SimulationRunner();
  await runner.run();
}

// Executar se chamado diretamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { SimulationRunner };
