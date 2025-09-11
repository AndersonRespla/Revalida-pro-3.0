import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabaseAdmin } from '../_supabase';

interface EventRequest {
  simulationId: string;
  stationNumber?: number;
  eventType: string;
  eventData?: any;
}

interface EventResponse {
  ok: boolean;
  eventId?: number;
  message?: string;
}

// Eventos válidos
const VALID_EVENT_TYPES = [
  'simulation_started',
  'station_started',
  'handoff_initiated',
  'handoff_completed',
  'handoff_failed',
  'moderator_returned',
  'station_completed',
  'timeout_warning',
  'timeout_reached',
  'exam_requested',
  'exam_released',
  'voice_command_detected',
  'transcription_started',
  'transcription_completed',
  'feedback_generated',
  'simulation_completed',
  'error'
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  }

  try {
    const { simulationId, stationNumber, eventType, eventData } = req.body as EventRequest;
    
    // Validar dados obrigatórios
    if (!simulationId || !eventType) {
      return res.status(400).json({ 
        ok: false, 
        error: 'missing_required_fields',
        message: 'simulationId e eventType são obrigatórios'
      });
    }
    
    // Validar tipo de evento
    if (!VALID_EVENT_TYPES.includes(eventType)) {
      return res.status(400).json({ 
        ok: false, 
        error: 'invalid_event_type',
        message: `Tipo de evento inválido. Tipos válidos: ${VALID_EVENT_TYPES.join(', ')}`
      });
    }
    
    console.log(`📝 Registrando evento: ${eventType} para simulação ${simulationId}`);
    if (stationNumber) {
      console.log(`📍 Estação: ${stationNumber}`);
    }
    
    const supabase = getSupabaseAdmin();
    
    // Inserir evento
    const { data: event, error } = await supabase
      .from('simulation_events')
      .insert({
        simulation_id: simulationId,
        station_number: stationNumber,
        event_type: eventType,
        event_data: eventData || {}
      })
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    // Ações especiais baseadas no tipo de evento
    switch (eventType) {
      case 'simulation_started':
        // Atualizar status da simulação
        await supabase
          .from('simulations')
          .update({
            status: 'running',
            started_at: new Date().toISOString()
          })
          .eq('id', simulationId);
        break;
        
      case 'simulation_completed':
        // Atualizar status da simulação
        await supabase
          .from('simulations')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString()
          })
          .eq('id', simulationId);
        break;
        
      case 'station_started':
        // Atualizar estação atual
        if (stationNumber) {
          await supabase
            .from('simulations')
            .update({
              current_station: stationNumber
            })
            .eq('id', simulationId);
            
          await supabase
            .from('simulation_stations')
            .update({
              status: 'active',
              started_at: new Date().toISOString()
            })
            .eq('simulation_id', simulationId)
            .eq('station_order', stationNumber);
        }
        break;
        
      case 'station_completed':
        // Atualizar status da estação
        if (stationNumber) {
          await supabase
            .from('simulation_stations')
            .update({
              status: 'completed',
              completed_at: new Date().toISOString()
            })
            .eq('simulation_id', simulationId)
            .eq('station_order', stationNumber);
        }
        break;
        
      case 'timeout_warning':
        // Notificar frontend via Server-Sent Events
        console.log(`⏰ Aviso de timeout para estação ${stationNumber}`);
        break;
        
      case 'exam_requested':
        // Log do exame solicitado
        console.log(`🧪 Exame solicitado:`, eventData?.exam);
        break;
    }
    
    console.log(`✅ Evento registrado com sucesso: ${eventType} (ID: ${event.id})`);
    
    return res.status(200).json({
      ok: true,
      eventId: event.id,
      message: `Evento ${eventType} registrado com sucesso`
    });
    
  } catch (error) {
    console.error('💥 Erro ao registrar evento:', error);
    
    return res.status(500).json({
      ok: false,
      error: 'event_registration_failed',
      message: error instanceof Error ? error.message : 'Erro ao registrar evento'
    });
  }
}
