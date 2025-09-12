import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabaseAdmin } from '../_supabase.js';

const AGENT_MAPPING: Record<string, string> = {
  'Cardiologia': 'agent_patient_card_001',
  'Pneumologia': 'agent_patient_pneu_001',
  'Gastroenterologia': 'agent_patient_gast_001',
  'Neurologia': 'agent_patient_neuro_001',
  'Endocrinologia': 'agent_patient_endo_001',
  'Ortopedia': 'agent_patient_orto_001',
  'Pediatria': 'agent_patient_ped_001',
  'Ginecologia': 'agent_patient_gine_001',
  'default': 'agent_patient_general_001'
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  try {
    const { simulationId } = req.body;
    if (!simulationId) return res.status(400).json({ ok: false, error: 'missing_simulation_id' });

    const supabase = getSupabaseAdmin();
    const { data: simulation, error: simError } = await supabase
      .from('simulations')
      .select(`*, simulation_stations (*, station:stations!station_id (*, criteria:station_criteria (*)))`)
      .eq('id', simulationId)
      .single();
    if (simError || !simulation) throw new Error('Simulação não encontrada');

    const stationContexts = simulation.simulation_stations
      .sort((a: any, b: any) => a.station_order - b.station_order)
      .map((simStation: any) => {
        const station = simStation.station;
        const targetAgentId = AGENT_MAPPING[station.specialty] || AGENT_MAPPING.default;
        return {
          station_number: simStation.station_order,
          station_id: station.id,
          target_agent_id: targetAgentId,
          specialty: station.specialty,
          criteria: station.criteria?.map((c: any) => ({ name: c.name, description: c.description, weight: c.weight })) || [],
          actor_instructions: station.actor_info,
          available_exams: station.available_exams
        };
      });

    return res.status(200).json({
      ok: true,
      context: {
        simulation_id: simulationId,
        total_stations: simulation.total_stations,
        stations: stationContexts,
        moderator_instructions: ''
      },
      publicContext: {
        simulation_id: simulationId,
        total_stations: simulation.total_stations,
        stations: stationContexts.map((s: any) => ({ station_number: s.station_number, specialty: s.specialty }))
      }
    });
  } catch (error) {
    console.error('💥 Erro ao gerar contexto:', error);
    return res.status(500).json({ ok: false, error: 'context_generation_failed', message: error instanceof Error ? error.message : 'Erro desconhecido' });
  }
}


