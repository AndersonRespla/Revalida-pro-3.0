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

    // Buscar estatísticas do usuário
    const { data: stats, error } = await supabase
      .from('user_stats_summary')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching user stats:', error);
      return res.status(500).json({ error: 'Failed to fetch user stats' });
    }

    if (!stats) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.status(200).json({ 
      ok: true, 
      stats 
    });

  } catch (error) {
    console.error('Error in user/stats:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
