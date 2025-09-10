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

  const normalizeAuthError = (message?: string) => {
    if (!message) return 'Ocorreu um erro. Tente novamente.';
    const m = message.toLowerCase();
    if (m.includes('invalid login credentials') || m.includes('invalid credentials')) {
      return 'Email ou senha incorretos';
    }
    if (m.includes('already registered') || m.includes('user already exists') || m.includes('user already registered')) {
      return 'Este email já está cadastrado';
    }
    if (m.includes('email not confirmed') || m.includes('confirm') || m.includes('confirmed')) {
      // Em projetos com confirmação desabilitada, pode aparecer por cache/estado antigo.
      return 'Tente novamente. Se o problema persistir, redefina a senha.';
    }
    return message;
  };

  const signIn = async (email: string, password: string) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        const msg = normalizeAuthError(error.message);
        setAuthState(prev => ({ ...prev, loading: false, error: msg }));
        return { success: false, error: msg } as const;
      }
      setAuthState(prev => ({ ...prev, loading: false, error: null }));
      return { success: true, data } as const;
    } catch (_e) {
      const msg = 'Erro ao fazer login.';
      setAuthState(prev => ({ ...prev, loading: false, error: msg }));
      return { success: false, error: msg } as const;
    }
  };

  const signUp = async (email: string, password: string, fullName?: string) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));

      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: fullName ? { full_name: fullName } : undefined,
        },
      });
      if (signUpError) {
        const msg = normalizeAuthError(signUpError.message);
        setAuthState(prev => ({ ...prev, loading: false, error: msg }));
        return { success: false, error: msg } as const;
      }

      // Com confirmações desabilitadas, o usuário já pode autenticar.
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        const msg = normalizeAuthError(error.message);
        setAuthState(prev => ({ ...prev, loading: false, error: msg }));
        return { success: false, error: msg } as const;
      }

      setAuthState(prev => ({ ...prev, loading: false, error: null }));
      return { success: true, data: data ?? signUpData } as const;
    } catch (_e) {
      const msg = 'Erro ao cadastrar.';
      setAuthState(prev => ({ ...prev, loading: false, error: msg }));
      return { success: false, error: msg } as const;
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setAuthState({ user: null, loading: false, error: null });
    return { success: true } as const;
  };

  return { ...authState, signIn, signUp, signOut };
}
