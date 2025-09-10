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
      return 'Muitas tentativas. Aguarde alguns segundos e tente novamente.';
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
          await delay(600 * (attempt + 1));
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
    try {
      inFlight.current.signUp = true;
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      // Retry simples para 429 no signUp
      let attempt = 0;
      let signUpData: any = null;
      let signUpErr: any = null;
      while (attempt < 2) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: fullName ? { full_name: fullName } : undefined,
          },
        });
        if (!error) { signUpData = data; break; }
        signUpErr = error;
        // @ts-expect-error supabase error may have status
        const status = (error as any)?.status;
        if (status === 429 || String(error.message).toLowerCase().includes('too many requests')) {
          await delay(800 * (attempt + 1));
          attempt += 1;
          continue;
        }
        break;
      }
      if (signUpErr) {
        const msg = normalizeAuthError(signUpErr.message);
        setAuthState(prev => ({ ...prev, loading: false, error: msg }));
        inFlight.current.signUp = false;
        return { success: false, error: msg } as const;
      }

      // Com confirmações desabilitadas, o usuário já pode autenticar.
      let loginErr: any = null;
      attempt = 0;
      while (attempt < 2) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (!error) {
          setAuthState(prev => ({ ...prev, loading: false, error: null }));
          inFlight.current.signUp = false;
          return { success: true, data: data ?? signUpData } as const;
        }
        loginErr = error;
        // @ts-expect-error supabase error may have status
        const status = (error as any)?.status;
        if (status === 429 || String(error.message).toLowerCase().includes('too many requests')) {
          await delay(600 * (attempt + 1));
          attempt += 1;
          continue;
        }
        break;
      }
      const msg = normalizeAuthError(loginErr?.message || 'Erro ao cadastrar.');
      setAuthState(prev => ({ ...prev, loading: false, error: msg }));
      inFlight.current.signUp = false;
      return { success: false, error: msg } as const;
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
