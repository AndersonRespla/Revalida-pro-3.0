import { VercelRequest, VercelResponse } from '@vercel/node'
import { getSupabaseAdmin } from '../_supabase.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'method_not_allowed' })
  }

  try {
    const { email, password, fullName } = req.body

    if (!email || !password || !fullName) {
      return res.status(400).json({ 
        ok: false, 
        error: 'missing_fields',
        details: 'Email, senha e nome completo são obrigatórios'
      })
    }

    const supabase = getSupabaseAdmin()

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: {
        full_name: fullName
      },
      email_confirm: true
    })

    if (authError) {
      console.error('Erro ao criar usuário:', authError)
      return res.status(400).json({ 
        ok: false, 
        error: 'auth_error',
        details: authError.message
      })
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        email: email,
        full_name: fullName,
        created_at: new Date().toISOString()
      })

    if (profileError) {
      console.error('Erro ao criar perfil:', profileError)
    }

    return res.status(200).json({
      ok: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        full_name: fullName
      }
    })

  } catch (error: any) {
    console.error('Erro no signup:', error)
    return res.status(500).json({ 
      ok: false, 
      error: 'internal_error',
      details: 'Erro interno do servidor'
    })
  }
}


