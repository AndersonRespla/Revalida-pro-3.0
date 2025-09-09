import { VercelRequest, VercelResponse } from '@vercel/node'
import { getSupabaseAdmin } from './_supabase'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'method_not_allowed' })
  }

  try {
    const { email, password, full_name } = req.body || {}
    if (!email || !password) {
      return res.status(400).json({ ok: false, error: 'missing_params' })
    }

    const supabase = getSupabaseAdmin()

    // Criar usuário via Admin API
    const { data: created, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name }
    })

    if (createError || !created?.user) {
      return res.status(400).json({ ok: false, error: createError?.message || 'create_failed' })
    }

    // Upsert no perfil
    await supabase.from('users').upsert({
      id: created.user.id,
      auth_user_id: created.user.id,
      email: created.user.email,
      full_name: full_name || created.user.user_metadata?.full_name || '',
      role: 'candidate'
    })

    return res.status(200).json({ ok: true, user: created.user })
  } catch (e: any) {
    return res.status(500).json({ ok: false, error: 'server_error', detail: String(e?.message || e) })
  }
}
