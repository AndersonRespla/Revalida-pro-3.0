import { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabaseAdmin } from '../_supabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, limit = '20' } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const supabase = getSupabaseAdmin();

    // Buscar conquistas do usuário
    const { data: achievements, error } = await supabase
      .from('user_achievements')
      .select('*')
      .eq('user_id', userId)
      .order('earned_at', { ascending: false })
      .limit(parseInt(limit as string));

    if (error) {
      console.error('Error fetching user achievements:', error);
      return res.status(500).json({ error: 'Failed to fetch user achievements' });
    }

    return res.status(200).json({ 
      ok: true, 
      achievements: achievements || [] 
    });

  } catch (error) {
    console.error('Error in user/achievements:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
