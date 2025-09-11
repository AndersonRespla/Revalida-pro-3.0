import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabaseAdmin } from '../_supabase';
import { circuitBreakers } from '../../lib/circuit-breaker';
import { withTimeoutAndRetry, isRetryableError, timeoutPresets } from '../../lib/timeout-utils';

interface HandoffRequest {
  simulationId: string;
  fromAgent: string;
  toAgent: string;
  stationNumber: number;
  stationSummary?: string;
  reason: 'station_complete' | 'timeout' | 'manual' | 'error';
}

interface HandoffResponse {
  ok: boolean;
  handoffId?: string;
  message?: string;
}

async function performHandoffCall(handoffData: HandoffRequest): Promise<void> {
  console.log(`🔄 Realizando handoff: ${handoffData.fromAgent} → ${handoffData.toAgent}`);
  
  // Simular chamada à API da ElevenLabs
  // Em produção, seria algo como:
  /*
  const response = await fetch(`${ELEVENLABS_API_URL}/handoff`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ELEVENLABS_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from_agent_id: handoffData.fromAgent,
      to_agent_id: handoffData.toAgent,
      context: handoffData.stationSummary
    })
  });
  
  if (!response.ok) {
    throw new Error(`Handoff failed: ${response.status} ${response.statusText}`);
  }
  */
  
  // Simulação: 20% de chance de falha para testes
  if (Math.random() < 0.2) {
    throw new Error('Handoff temporariamente indisponível');
  }
  
  // Simular latência de rede
  await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
  
  console.log('✅ Handoff realizado com sucesso');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  }

  try {
    const handoffData = req.body as HandoffRequest;
    
    // Validar dados obrigatórios
    if (!handoffData.simulationId || !handoffData.fromAgent || !handoffData.toAgent || !handoffData.stationNumber) {
      return res.status(400).json({ 
        ok: false, 
        error: 'missing_required_fields',
        message: 'simulationId, fromAgent, toAgent e stationNumber são obrigatórios'
      });
    }
    
    console.log('🤝 Iniciando handoff para simulação:', handoffData.simulationId);
    console.log(`📍 Estação ${handoffData.stationNumber}: ${handoffData.fromAgent} → ${handoffData.toAgent}`);
    
    const supabase = getSupabaseAdmin();
    const handoffId = `handoff_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // 1. Registrar início do handoff
    await supabase
      .from('simulation_events')
      .insert({
        simulation_id: handoffData.simulationId,
        station_number: handoffData.stationNumber,
        event_type: 'handoff_initiated',
        event_data: {
          handoff_id: handoffId,
          from_agent: handoffData.fromAgent,
          to_agent: handoffData.toAgent,
          reason: handoffData.reason,
          station_summary: handoffData.stationSummary
        }
      });
    
    // 2. Tentar realizar o handoff com circuit breaker e retry
    const startTime = Date.now();
    let handoffSuccess = false;
    let handoffError: any;
    
    try {
      // Usar circuit breaker da ElevenLabs
      await circuitBreakers.elevenlabs.execute(async () => {
        // Executar com timeout e retry
        await withTimeoutAndRetry(
          () => performHandoffCall(handoffData),
          timeoutPresets.agentHandoff,
          {
            maxAttempts: 3,
            initialDelayMs: 1000,
            maxDelayMs: 8000,
            backoffMultiplier: 2,
            jitterFactor: 0.3,
            shouldRetry: (error) => {
              // Verificar se é erro retryable
              return isRetryableError(error);
            },
            onRetry: (error, attempt, nextDelay) => {
              console.log(`⏳ Handoff retry ${attempt}: aguardando ${nextDelay}ms`);
              console.log(`   Erro: ${error.message}`);
            }
          }
        );
      });
      
      handoffSuccess = true;
    } catch (error) {
      handoffError = error;
      handoffSuccess = false;
      console.error('❌ Falha no handoff após todas as tentativas:', error);
    }
    
    const duration = Date.now() - startTime;
    
    if (handoffSuccess) {
      // 3. Registrar sucesso do handoff
      await supabase
        .from('simulation_events')
        .insert({
          simulation_id: handoffData.simulationId,
          station_number: handoffData.stationNumber,
          event_type: 'handoff_completed',
          event_data: {
            handoff_id: handoffId,
            duration_ms: duration,
            circuit_breaker_state: circuitBreakers.elevenlabs.getState()
          }
        });
      
      // 4. Atualizar status da estação se for transição completa
      if (handoffData.reason === 'station_complete') {
        await supabase
          .from('simulation_stations')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString()
          })
          .eq('simulation_id', handoffData.simulationId)
          .eq('station_order', handoffData.stationNumber);
        
        // Iniciar próxima estação se houver
        const nextStation = handoffData.stationNumber + 1;
        if (nextStation <= 5) {
          await supabase
            .from('simulation_stations')
            .update({
              status: 'active',
              started_at: new Date().toISOString()
            })
            .eq('simulation_id', handoffData.simulationId)
            .eq('station_order', nextStation);
        }
      }
      
      console.log(`✅ Handoff concluído com sucesso em ${duration}ms`);
      
      return res.status(200).json({
        ok: true,
        handoffId,
        message: `Handoff realizado com sucesso para ${handoffData.toAgent}`
      });
      
    } else {
      // 5. Registrar falha do handoff
      await supabase
        .from('simulation_events')
        .insert({
          simulation_id: handoffData.simulationId,
          station_number: handoffData.stationNumber,
          event_type: 'handoff_failed',
          event_data: {
            handoff_id: handoffId,
            error: handoffError?.message || 'Unknown error',
            error_type: handoffError?.name || 'UnknownError',
            circuit_breaker_state: circuitBreakers.elevenlabs.getState(),
            duration_ms: duration
          }
        });
      
      console.error(`❌ Handoff falhou após todas as tentativas`);
      
      // 6. Fallback: retornar ao moderador
      await supabase
        .from('simulation_events')
        .insert({
          simulation_id: handoffData.simulationId,
          station_number: handoffData.stationNumber,
          event_type: 'moderator_returned',
          event_data: {
            reason: 'handoff_failed',
            original_target: handoffData.toAgent
          }
        });
      
      return res.status(503).json({
        ok: false,
        error: 'handoff_failed',
        message: `Falha ao transferir para ${handoffData.toAgent}. Retornando ao moderador.`,
        fallback: 'moderator'
      });
    }
    
  } catch (error) {
    console.error('💥 Erro crítico no handoff:', error);
    
    // Registrar erro crítico
    const supabase = getSupabaseAdmin();
    await supabase
      .from('simulation_events')
      .insert({
        simulation_id: req.body.simulationId,
        event_type: 'error',
        event_data: {
          error: error instanceof Error ? error.message : 'Erro desconhecido',
          context: 'handoff_critical_error'
        }
      });
    
    return res.status(500).json({
      ok: false,
      error: 'handoff_critical_error',
      message: error instanceof Error ? error.message : 'Erro crítico no sistema de handoff'
    });
  }
}
