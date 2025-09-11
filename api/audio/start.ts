import { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabaseAdmin } from '../_supabase.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { simulationId, station, totalStations, userId, sessionType } = req.body;

    if (!simulationId || !station || !userId) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const supabase = getSupabaseAdmin();

    // Criar registro de gravação no banco
    const { data: recording, error } = await supabase
      .from('audio_recordings')
      .insert({
        simulation_id: simulationId,
        station: station,
        total_stations: totalStations || 1,
        user_id: userId,
        session_type: sessionType || 'simulation',
        status: 'recording',
        started_at: new Date().toISOString()
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error creating recording:', error);
      return res.status(500).json({ error: 'Failed to create recording' });
    }

    return res.status(200).json({ 
      ok: true, 
      recordingId: recording.id 
    });

  } catch (error) {
    console.error('Error in audio/start:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
