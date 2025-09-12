import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabaseAdmin } from '../_supabase.js';

const VALID_EVENT_TYPES = [
  'simulation_started','station_started','handoff_initiated','handoff_completed','handoff_failed','moderator_returned','station_completed','timeout_warning','timeout_reached','exam_requested','exam_released','voice_command_detected','transcription_started','transcription_completed','feedback_generated','simulation_completed','error'
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  try {
    const { simulationId, stationNumber, eventType, eventData } = req.body as any;
    if (!simulationId || !eventType) return res.status(400).json({ ok: false, error: 'missing_required_fields', message: 'simulationId e eventType são obrigatórios' });
    if (!VALID_EVENT_TYPES.includes(eventType)) return res.status(400).json({ ok: false, error: 'invalid_event_type', message: `Tipo de evento inválido. Tipos válidos: ${VALID_EVENT_TYPES.join(', ')}` });

    const supabase = getSupabaseAdmin();
    const { data: event, error } = await supabase.from('simulation_events').insert({ simulation_id: simulationId, station_number: stationNumber, event_type: eventType, event_data: eventData || {} }).select().single();
    if (error) throw error;

    switch (eventType) {
      case 'simulation_started':
        await supabase.from('simulations').update({ status: 'running', started_at: new Date().toISOString() }).eq('id', simulationId);
        break;
      case 'simulation_completed':
        await supabase.from('simulations').update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', simulationId);
        break;
      case 'station_started':
        if (stationNumber) {
          await supabase.from('simulations').update({ current_station: stationNumber }).eq('id', simulationId);
          await supabase.from('simulation_stations').update({ status: 'active', started_at: new Date().toISOString() }).eq('simulation_id', simulationId).eq('station_order', stationNumber);
        }
        break;
      case 'station_completed':
        if (stationNumber) await supabase.from('simulation_stations').update({ status: 'completed', completed_at: new Date().toISOString() }).eq('simulation_id', simulationId).eq('station_order', stationNumber);
        break;
      case 'timeout_warning':
        break;
      case 'exam_requested':
        break;
    }

    return res.status(200).json({ ok: true, eventId: event.id, message: `Evento ${eventType} registrado com sucesso` });
  } catch (error) {
    return res.status(500).json({ ok: false, error: 'event_registration_failed', message: error instanceof Error ? error.message : 'Erro ao registrar evento' });
  }
}


