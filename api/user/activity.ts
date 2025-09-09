import { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabaseAdmin } from '../_supabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, limit = '10' } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const supabase = getSupabaseAdmin();

    // Buscar atividades do usuário
    const { data: activities, error } = await supabase
      .from('user_activity_timeline')
      .select('*')
      .eq('user_id', userId)
      .order('started_at', { ascending: false })
      .limit(parseInt(limit as string));

    if (error) {
      console.error('Error fetching user activities:', error);
      return res.status(500).json({ error: 'Failed to fetch user activities' });
    }

    return res.status(200).json({ 
      ok: true, 
      activities: activities || [] 
    });

  } catch (error) {
    console.error('Error in user/activity:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
