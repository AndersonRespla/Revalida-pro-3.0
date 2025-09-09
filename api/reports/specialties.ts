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

    // Buscar progresso por especialidade
    const { data: specialties, error } = await supabase
      .from('user_progress')
      .select(`
        specialty,
        total_simulations,
        completed_simulations,
        average_score,
        best_score,
        mastery_level,
        mastery_percentage,
        total_study_time_minutes,
        first_simulation_at,
        last_simulation_at
      `)
      .eq('user_id', userId)
      .order('average_score', { ascending: false });

    if (error) {
      console.error('Error fetching specialties data:', error);
      return res.status(500).json({ error: 'Failed to fetch specialties data' });
    }

    // Calcular estatísticas gerais
    const totalSpecialties = specialties?.length || 0;
    const masteredSpecialties = specialties?.filter(s => s.mastery_level === 'expert').length || 0;
    const totalStudyTime = specialties?.reduce((sum, s) => sum + (s.total_study_time_minutes || 0), 0) || 0;
    const overallAverage = specialties?.length > 0 
      ? specialties.reduce((sum, s) => sum + (s.average_score || 0), 0) / specialties.length 
      : 0;

    return res.status(200).json({ 
      ok: true, 
      specialties: {
        data: specialties || [],
        summary: {
          totalSpecialties,
          masteredSpecialties,
          totalStudyTime,
          overallAverage: Math.round(overallAverage * 100) / 100
        }
      }
    });

  } catch (error) {
    console.error('Error in reports/specialties:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
