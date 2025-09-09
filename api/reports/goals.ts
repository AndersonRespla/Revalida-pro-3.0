import { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabaseAdmin } from '../_supabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const supabase = getSupabaseAdmin();

    // Buscar dados de tempo de estudo dos últimos 30 dias
    const { data: studyTime, error: studyError } = await supabase
      .from('study_time_tracking')
      .select('*')
      .eq('user_id', userId)
      .gte('study_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .order('study_date', { ascending: false });

    if (studyError) {
      console.error('Error fetching study time data:', studyError);
      return res.status(500).json({ error: 'Failed to fetch study time data' });
    }

    // Buscar conquistas recentes
    const { data: achievements, error: achievementsError } = await supabase
      .from('user_achievements')
      .select('*')
      .eq('user_id', userId)
      .gte('earned_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .order('earned_at', { ascending: false });

    if (achievementsError) {
      console.error('Error fetching achievements data:', achievementsError);
      return res.status(500).json({ error: 'Failed to fetch achievements data' });
    }

    // Calcular metas e progresso
    const totalStudyTime = studyTime?.reduce((sum, day) => sum + (day.total_minutes || 0), 0) || 0;
    const averageDailyStudy = totalStudyTime / 30;
    const studyGoal = 120; // 2 horas por dia
    const studyProgress = Math.min((averageDailyStudy / studyGoal) * 100, 100);

    const totalAchievements = achievements?.length || 0;
    const achievementGoal = 10; // 10 conquistas por mês
    const achievementProgress = Math.min((totalAchievements / achievementGoal) * 100, 100);

    // Calcular dias ativos
    const activeDays = studyTime?.filter(day => day.total_minutes > 0).length || 0;
    const activityGoal = 20; // 20 dias ativos por mês
    const activityProgress = Math.min((activeDays / activityGoal) * 100, 100);

    return res.status(200).json({ 
      ok: true, 
      goals: {
        study: {
          current: Math.round(averageDailyStudy),
          goal: studyGoal,
          progress: Math.round(studyProgress),
          totalMinutes: totalStudyTime
        },
        achievements: {
          current: totalAchievements,
          goal: achievementGoal,
          progress: Math.round(achievementProgress)
        },
        activity: {
          current: activeDays,
          goal: activityGoal,
          progress: Math.round(activityProgress)
        },
        recentAchievements: achievements || []
      }
    });

  } catch (error) {
    console.error('Error in reports/goals:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
