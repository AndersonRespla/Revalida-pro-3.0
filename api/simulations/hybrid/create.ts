import { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabaseAdmin } from '../../_supabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      userId, 
      selectedStations, 
      sessionType = 'hybrid',
      maxParticipants = 2 
    } = req.body;

    if (!userId || !selectedStations || !Array.isArray(selectedStations)) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const supabase = getSupabaseAdmin();

    // Gerar código único para a simulação
    const simulationCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    // Criar simulação
    const { data: simulation, error: simError } = await supabase
      .from('simulations')
      .insert({
        user_id: userId,
        session_type: sessionType,
        status: 'waiting',
        max_participants: maxParticipants,
        metadata: {
          code: simulationCode,
          selectedStations,
          currentStationIndex: 0,
          participants: [{ userId, role: 'creator', joinedAt: new Date().toISOString() }]
        }
      })
      .select('id')
      .single();

    if (simError) {
      console.error('Error creating simulation:', simError);
      return res.status(500).json({ error: 'Failed to create simulation' });
    }

    // Criar registros de estações da simulação
    const stationInserts = selectedStations.map((stationId: string, index: number) => ({
      simulation_id: simulation.id,
      station_id: stationId,
      station_number: index + 1,
      status: index === 0 ? 'current' : 'pending'
    }));

    const { error: stationsError } = await supabase
      .from('simulation_stations')
      .insert(stationInserts);

    if (stationsError) {
      console.error('Error creating simulation stations:', stationsError);
      return res.status(500).json({ error: 'Failed to create simulation stations' });
    }

    return res.status(200).json({ 
      ok: true, 
      simulationId: simulation.id,
      simulationCode,
      selectedStations
    });

  } catch (error) {
    console.error('Error in simulations/hybrid/create:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
