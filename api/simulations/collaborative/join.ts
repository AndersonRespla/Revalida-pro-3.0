import { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabaseAdmin } from '../../_supabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { simulationCode, userId, role = 'participant' } = req.body;

    if (!simulationCode || !userId) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const supabase = getSupabaseAdmin();

    // Buscar simulação pelo código
    const { data: simulation, error: simError } = await supabase
      .from('simulations')
      .select(`
        id,
        user_id,
        status,
        max_participants,
        metadata,
        simulation_stations (
          id,
          station_id,
          station_number,
          status
        )
      `)
      .eq('metadata->code', simulationCode)
      .single();

    if (simError || !simulation) {
      return res.status(404).json({ error: 'Simulation not found' });
    }

    if (simulation.status !== 'waiting') {
      return res.status(400).json({ error: 'Simulation is not accepting new participants' });
    }

    // Verificar se há vagas
    const currentParticipants = simulation.metadata?.participants?.length || 0;
    if (currentParticipants >= simulation.max_participants) {
      return res.status(400).json({ error: 'Simulation is full' });
    }

    // Adicionar participante
    const updatedParticipants = [
      ...(simulation.metadata?.participants || []),
      { userId, role, joinedAt: new Date().toISOString() }
    ];

    const { error: updateError } = await supabase
      .from('simulations')
      .update({
        metadata: {
          ...simulation.metadata,
          participants: updatedParticipants
        }
      })
      .eq('id', simulation.id);

    if (updateError) {
      console.error('Error updating simulation:', updateError);
      return res.status(500).json({ error: 'Failed to join simulation' });
    }

    return res.status(200).json({ 
      ok: true, 
      simulationId: simulation.id,
      selectedStations: simulation.simulation_stations?.map(s => s.station_id) || [],
      participants: updatedParticipants
    });

  } catch (error) {
    console.error('Error in simulations/collaborative/join:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
