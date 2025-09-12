import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabaseAdmin } from '../_supabase.js';
import { circuitBreakers } from '../../lib/circuit-breaker.js';
import { withTimeoutAndRetry, isRetryableError, timeoutPresets } from '../../lib/timeout-utils.js';

interface HandoffRequest {
  simulationId: string; fromAgent: string; toAgent: string; stationNumber: number; stationSummary?: string; reason: 'station_complete' | 'timeout' | 'manual' | 'error';
}

async function performHandoffCall(handoffData: HandoffRequest): Promise<void> {
  if (Math.random() < 0.2) throw new Error('Handoff temporariamente indisponível');
  await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  try {
    const handoffData = req.body as HandoffRequest;
    if (!handoffData.simulationId || !handoffData.fromAgent || !handoffData.toAgent || !handoffData.stationNumber) {
      return res.status(400).json({ ok: false, error: 'missing_required_fields', message: 'simulationId, fromAgent, toAgent e stationNumber são obrigatórios' });
    }
    const supabase = getSupabaseAdmin();
    const handoffId = `handoff_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await supabase.from('simulation_events').insert({ simulation_id: handoffData.simulationId, station_number: handoffData.stationNumber, event_type: 'handoff_initiated', event_data: { handoff_id: handoffId, from_agent: handoffData.fromAgent, to_agent: handoffData.toAgent, reason: handoffData.reason, station_summary: handoffData.stationSummary } });

    const startTime = Date.now();
    let handoffSuccess = false; let handoffError: any;
    try {
      await circuitBreakers.elevenlabs.execute(async () => {
        await withTimeoutAndRetry(() => performHandoffCall(handoffData), timeoutPresets.agentHandoff, { maxAttempts: 3, initialDelayMs: 1000, maxDelayMs: 8000, backoffMultiplier: 2, jitterFactor: 0.3, shouldRetry: (error) => isRetryableError(error), onRetry: (error, attempt, nextDelay) => { console.log(`⏳ Handoff retry ${attempt}: aguardando ${nextDelay}ms`); console.log(`   Erro: ${error.message}`); } });
      });
      handoffSuccess = true;
    } catch (error) { handoffError = error; handoffSuccess = false; }

    const duration = Date.now() - startTime;
    if (handoffSuccess) {
      await supabase.from('simulation_events').insert({ simulation_id: handoffData.simulationId, station_number: handoffData.stationNumber, event_type: 'handoff_completed', event_data: { handoff_id: handoffId, duration_ms: duration, circuit_breaker_state: circuitBreakers.elevenlabs.getState() } });
      if (handoffData.reason === 'station_complete') {
        await supabase.from('simulation_stations').update({ status: 'completed', completed_at: new Date().toISOString() }).eq('simulation_id', handoffData.simulationId).eq('station_order', handoffData.stationNumber);
        const nextStation = handoffData.stationNumber + 1;
        if (nextStation <= 5) await supabase.from('simulation_stations').update({ status: 'active', started_at: new Date().toISOString() }).eq('simulation_id', handoffData.simulationId).eq('station_order', nextStation);
      }
      return res.status(200).json({ ok: true, handoffId, message: `Handoff realizado com sucesso para ${handoffData.toAgent}` });
    } else {
      await supabase.from('simulation_events').insert({ simulation_id: handoffData.simulationId, station_number: handoffData.stationNumber, event_type: 'handoff_failed', event_data: { handoff_id: handoffId, error: handoffError?.message || 'Unknown error', error_type: handoffError?.name || 'UnknownError', circuit_breaker_state: circuitBreakers.elevenlabs.getState(), duration_ms: duration } });
      await supabase.from('simulation_events').insert({ simulation_id: handoffData.simulationId, station_number: handoffData.stationNumber, event_type: 'moderator_returned', event_data: { reason: 'handoff_failed', original_target: handoffData.toAgent } });
      return res.status(503).json({ ok: false, error: 'handoff_failed', message: `Falha ao transferir para ${handoffData.toAgent}. Retornando ao moderador.`, fallback: 'moderator' });
    }
  } catch (error) {
    const supabase = getSupabaseAdmin();
    await supabase.from('simulation_events').insert({ simulation_id: (req.body || {}).simulationId, event_type: 'error', event_data: { error: error instanceof Error ? (error as Error).message : 'Erro desconhecido', context: 'handoff_critical_error' } });
    return res.status(500).json({ ok: false, error: 'handoff_critical_error', message: error instanceof Error ? (error as Error).message : 'Erro crítico no sistema de handoff' });
  }
}


