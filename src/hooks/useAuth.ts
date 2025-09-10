import { useState, useEffect, useRef } from 'react';
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
  const inFlight = useRef<{ signIn: boolean }>({ signIn: false });

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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
    if (m.includes('too many requests') || m.includes('rate limit')) {
      return 'Limite de cadastros atingido. Supabase permite apenas 2 cadastros por hora. Tente novamente mais tarde.';
    }
    if (m.includes('email not confirmed') || m.includes('confirm') || m.includes('confirmed')) {
      // Em projetos com confirmação desabilitada, pode aparecer por cache/estado antigo.
      return 'Tente novamente. Se o problema persistir, redefina a senha.';
    }
    return message;
  };

  const signInWithGoogle = async () => {
    if (inFlight.current.signIn) {
      return { success: false, error: 'Operação em andamento. Aguarde.' } as const;
    }
    try {
      inFlight.current.signIn = true;
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`
        }
      });
      
      if (error) {
        const msg = normalizeAuthError(error.message);
        setAuthState(prev => ({ ...prev, loading: false, error: msg }));
        inFlight.current.signIn = false;
        return { success: false, error: msg } as const;
      }
      
      // OAuth redireciona automaticamente, então não precisamos retornar dados aqui
      inFlight.current.signIn = false;
      return { success: true, data } as const;
    } catch (_e) {
      const msg = 'Erro ao fazer login com Google.';
      setAuthState(prev => ({ ...prev, loading: false, error: msg }));
      inFlight.current.signIn = false;
      return { success: false, error: msg } as const;
    }
  };

  // Função removida - agora usamos apenas Google OAuth

  const signOut = async () => {
    await supabase.auth.signOut();
    setAuthState({ user: null, loading: false, error: null });
    return { success: true } as const;
  };

  return { ...authState, signInWithGoogle, signOut };
}
