import { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabaseAdmin } from './_supabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const supabase = getSupabaseAdmin();

    // Buscar usuário pelo email
    const { data: users, error: fetchError } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1000
    });

    if (fetchError) {
      console.error('Error fetching users:', fetchError);
      return res.status(500).json({ error: 'Failed to fetch users' });
    }

    // Encontrar o usuário pelo email
    const user = users.users.find(u => u.email === email);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Confirmar o email do usuário usando admin API
    const { data: confirmData, error: confirmError } = await supabase.auth.admin.updateUserById(
      user.id,
      {
        email_confirm: true
      }
    );

    if (confirmError) {
      console.error('Error confirming email:', confirmError);
      return res.status(500).json({ error: 'Failed to confirm email' });
    }

    return res.status(200).json({ 
      ok: true, 
      message: 'Email confirmed successfully',
      user: confirmData.user
    });

  } catch (error) {
    console.error('Error in confirm-email:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
