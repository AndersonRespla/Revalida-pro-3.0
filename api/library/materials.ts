import { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabaseAdmin } from '../_supabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      search = '', 
      category, 
      type, 
      specialty, 
      limit = '50', 
      offset = '0' 
    } = req.query;

    const supabase = getSupabaseAdmin();

    // Usar a função de busca do banco
    const { data: materials, error } = await supabase.rpc('search_library_materials', {
      p_search_term: search as string,
      p_category: category as string || null,
      p_type: type as string || null,
      p_specialty: specialty as string || null,
      p_limit: parseInt(limit as string),
      p_offset: parseInt(offset as string)
    });

    if (error) {
      console.error('Error fetching library materials:', error);
      return res.status(500).json({ error: 'Failed to fetch library materials' });
    }

    return res.status(200).json({ 
      ok: true, 
      materials: materials || [] 
    });

  } catch (error) {
    console.error('Error in library/materials:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
