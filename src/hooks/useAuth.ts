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
  const inFlight = useRef<{ signIn: boolean; signUp: boolean }>({ signIn: false, signUp: false });

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

  const signIn = async (email: string, password: string) => {
    if (inFlight.current.signIn) {
      return { success: false, error: 'Operação em andamento. Aguarde.' } as const;
    }
    try {
      inFlight.current.signIn = true;
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      // Retry simples para 429
      let attempt = 0;
      let lastError: any = null;
      while (attempt < 2) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (!error) {
          setAuthState(prev => ({ ...prev, loading: false, error: null }));
          inFlight.current.signIn = false;
          return { success: true, data } as const;
        }
        lastError = error;
        // @ts-expect-error supabase error may have status
        const status = (error as any)?.status;
        if (status === 429 || String(error.message).toLowerCase().includes('too many requests')) {
          await delay(3000 * (attempt + 1)); // Delay maior para 429
          attempt += 1;
          continue;
        }
        break;
      }
      if (lastError) {
        const msg = normalizeAuthError(lastError.message);
        setAuthState(prev => ({ ...prev, loading: false, error: msg }));
        inFlight.current.signIn = false;
        return { success: false, error: msg } as const;
      }
      inFlight.current.signIn = false;
      return { success: false, error: 'Erro ao fazer login.' } as const;
    } catch (_e) {
      const msg = 'Erro ao fazer login.';
      setAuthState(prev => ({ ...prev, loading: false, error: msg }));
      inFlight.current.signIn = false;
      return { success: false, error: msg } as const;
    }
  };

  const signUp = async (email: string, password: string, fullName?: string) => {
    if (inFlight.current.signUp) {
      return { success: false, error: 'Operação em andamento. Aguarde.' } as const;
    }
    
    // Verificar cache local para evitar tentativas desnecessárias
    const cacheKey = `signup_attempt_${email}`;
    const lastAttempt = localStorage.getItem(cacheKey);
    if (lastAttempt) {
      const timeDiff = Date.now() - parseInt(lastAttempt);
      if (timeDiff < 300000) { // 5 minutos
        return { success: false, error: 'Muitas tentativas para este email. Aguarde 5 minutos.' } as const;
      }
    }
    
    try {
      inFlight.current.signUp = true;
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      
      // Primeiro, tentar fazer login para verificar se já existe
      const { data: existingUser } = await supabase.auth.signInWithPassword({ email, password });
      if (existingUser.user) {
        // Usuário já existe, fazer login normalmente
        setAuthState(prev => ({ ...prev, loading: false, error: null }));
        inFlight.current.signUp = false;
        return { success: true, data: existingUser } as const;
      }
      
      // Se não existe, tentar cadastrar (apenas 1 tentativa para evitar 429)
      localStorage.setItem(cacheKey, Date.now().toString());
      
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
        inFlight.current.signUp = false;
        return { success: false, error: msg } as const;
      }

      // Com confirmações desabilitadas, tentar login imediatamente
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({ email, password });
      if (loginError) {
        const msg = normalizeAuthError(loginError.message);
        setAuthState(prev => ({ ...prev, loading: false, error: msg }));
        inFlight.current.signUp = false;
        return { success: false, error: msg } as const;
      }

      setAuthState(prev => ({ ...prev, loading: false, error: null }));
      inFlight.current.signUp = false;
      return { success: true, data: loginData ?? signUpData } as const;
    } catch (_e) {
      const msg = 'Erro ao cadastrar.';
      setAuthState(prev => ({ ...prev, loading: false, error: msg }));
      inFlight.current.signUp = false;
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
