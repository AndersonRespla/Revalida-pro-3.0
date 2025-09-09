import { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabaseAdmin } from '../_supabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, period = '30' } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const supabase = getSupabaseAdmin();
    const days = parseInt(period as string);

    // Buscar performance do usuário no período
    const { data: performance, error } = await supabase
      .from('user_sessions')
      .select(`
        id,
        session_type,
        started_at,
        duration_minutes,
        total_score,
        stations_completed,
        metadata
      `)
      .eq('user_id', userId)
      .eq('status', 'completed')
      .gte('started_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
      .order('started_at', { ascending: false });

    if (error) {
      console.error('Error fetching performance data:', error);
      return res.status(500).json({ error: 'Failed to fetch performance data' });
    }

    // Calcular estatísticas
    const totalSessions = performance?.length || 0;
    const totalStudyTime = performance?.reduce((sum, session) => sum + (session.duration_minutes || 0), 0) || 0;
    const averageScore = performance?.length > 0 
      ? performance.reduce((sum, session) => sum + (session.total_score || 0), 0) / performance.length 
      : 0;
    const completedStations = performance?.reduce((sum, session) => sum + (session.stations_completed || 0), 0) || 0;

    // Agrupar por tipo de sessão
    const sessionsByType = performance?.reduce((acc, session) => {
      const type = session.session_type;
      if (!acc[type]) {
        acc[type] = { count: 0, totalScore: 0, totalTime: 0 };
      }
      acc[type].count++;
      acc[type].totalScore += session.total_score || 0;
      acc[type].totalTime += session.duration_minutes || 0;
      return acc;
    }, {} as Record<string, { count: number; totalScore: number; totalTime: number }>) || {};

    // Calcular médias por tipo
    Object.keys(sessionsByType).forEach(type => {
      const data = sessionsByType[type];
      data.averageScore = data.count > 0 ? data.totalScore / data.count : 0;
      data.averageTime = data.count > 0 ? data.totalTime / data.count : 0;
    });

    return res.status(200).json({ 
      ok: true, 
      performance: {
        totalSessions,
        totalStudyTime,
        averageScore: Math.round(averageScore * 100) / 100,
        completedStations,
        sessionsByType,
        period: `${days} days`
      }
    });

  } catch (error) {
    console.error('Error in reports/performance:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
