import { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabaseAdmin } from '../../_supabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { simulationId } = req.query;

    if (!simulationId) {
      return res.status(400).json({ error: 'simulationId is required' });
    }

    const supabase = getSupabaseAdmin();

    // Buscar status da simulação
    const { data: simulation, error } = await supabase
      .from('simulations')
      .select(`
        id,
        status,
        metadata,
        simulation_stations (
          id,
          station_id,
          station_number,
          status
        )
      `)
      .eq('id', simulationId)
      .single();

    if (error || !simulation) {
      return res.status(404).json({ error: 'Simulation not found' });
    }

    return res.status(200).json({ 
      ok: true, 
      simulation: {
        id: simulation.id,
        status: simulation.status,
        participants: simulation.metadata?.participants || [],
        currentStationIndex: simulation.metadata?.currentStationIndex || 0,
        selectedStations: simulation.simulation_stations?.map(s => s.station_id) || [],
        stations: simulation.simulation_stations || []
      }
    });

  } catch (error) {
    console.error('Error in simulations/hybrid/status:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
