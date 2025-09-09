import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null
  });

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setAuthState({
          user: {
            id: session.user.id,
            email: session.user.email || '',
            full_name: session.user.user_metadata?.full_name,
            avatar_url: session.user.user_metadata?.avatar_url
          },
          loading: false,
          error: null,
        })
      } else {
        setAuthState({ user: null, loading: false, error: null })
      }
    }
    init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setAuthState({
          user: {
            id: session.user.id,
            email: session.user.email || '',
            full_name: session.user.user_metadata?.full_name,
            avatar_url: session.user.user_metadata?.avatar_url
          },
          loading: false,
          error: null,
        })
      } else {
        setAuthState({ user: null, loading: false, error: null })
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }))
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        const msg = error.message.includes('confirmed') ? 'Falha ao entrar. Recrie sua conta.' : error.message
        setAuthState(prev => ({ ...prev, loading: false, error: msg }))
        return { success: false, error: msg }
      }
      return { success: true, data }
    } catch (e) {
      const msg = 'Erro ao fazer login.'
      setAuthState(prev => ({ ...prev, loading: false, error: msg }))
      return { success: false, error: msg }
    }
  }

  const signUp = async (email: string, password: string, fullName?: string) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }))

      // Cria via Admin API no backend com email_confirm=true
      const resp = await fetch('/api/auth-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, full_name: fullName })
      })
      const json = await resp.json()
      if (!resp.ok || !json?.ok) {
        const msg = json?.error || 'Falha ao cadastrar'
        setAuthState(prev => ({ ...prev, loading: false, error: msg }))
        return { success: false, error: msg }
      }

      // Faz login imediatamente
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        const msg = error.message
        setAuthState(prev => ({ ...prev, loading: false, error: msg }))
        return { success: false, error: msg }
      }

      return { success: true, data }
    } catch (e) {
      const msg = 'Erro ao cadastrar.'
      setAuthState(prev => ({ ...prev, loading: false, error: msg }))
      return { success: false, error: msg }
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setAuthState({ user: null, loading: false, error: null })
    return { success: true }
  }

  return { ...authState, signIn, signUp, signOut }
}
