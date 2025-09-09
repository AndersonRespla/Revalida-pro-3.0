import { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabaseAdmin } from '../_supabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      userId, 
      sessionType, 
      startedAt, 
      endedAt, 
      durationMinutes, 
      stationsCompleted, 
      totalScore, 
      averageScore, 
      feedback,
      metadata = {}
    } = req.body;

    if (!userId || !sessionType) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const supabase = getSupabaseAdmin();

    // Criar sessão
    const { data: session, error: sessionError } = await supabase
      .from('user_sessions')
      .insert({
        user_id: userId,
        session_type: sessionType,
        started_at: startedAt || new Date().toISOString(),
        ended_at: endedAt,
        duration_minutes: durationMinutes,
        stations_completed: stationsCompleted || 0,
        total_score: totalScore,
        average_score: averageScore,
        feedback: feedback,
        metadata: metadata,
        status: 'completed'
      })
      .select('id')
      .single();

    if (sessionError) {
      console.error('Error creating session:', sessionError);
      return res.status(500).json({ error: 'Failed to create session' });
    }

    // Atualizar tempo de estudo diário
    if (durationMinutes && durationMinutes > 0) {
      const studyDate = new Date().toISOString().split('T')[0];
      
      await supabase.rpc('update_daily_study_time', {
        p_user_id: userId,
        p_date: studyDate,
        p_session_type: sessionType,
        p_minutes: durationMinutes
      });
    }

    // Atualizar progresso por especialidade se houver score
    if (averageScore && metadata.specialty) {
      await supabase.rpc('update_user_progress', {
        p_user_id: userId,
        p_specialty: metadata.specialty,
        p_score: averageScore,
        p_simulation_completed: true
      });
    }

    return res.status(200).json({ 
      ok: true, 
      sessionId: session.id 
    });

  } catch (error) {
    console.error('Error in sessions/save:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
