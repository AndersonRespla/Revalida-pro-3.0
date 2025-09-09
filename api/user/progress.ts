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

    // Buscar progresso do usuário por especialidade
    const { data: progress, error } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', userId)
      .order('average_score', { ascending: false });

    if (error) {
      console.error('Error fetching user progress:', error);
      return res.status(500).json({ error: 'Failed to fetch user progress' });
    }

    return res.status(200).json({ 
      ok: true, 
      progress: progress || [] 
    });

  } catch (error) {
    console.error('Error in user/progress:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
