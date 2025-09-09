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
    // Verificar sessão atual
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          setAuthState({ user: null, loading: false, error: error.message });
          return;
        }

        if (session?.user) {
          setAuthState({
            user: {
              id: session.user.id,
              email: session.user.email || '',
              full_name: session.user.user_metadata?.full_name,
              avatar_url: session.user.user_metadata?.avatar_url
            },
            loading: false,
            error: null
          });
        } else {
          setAuthState({ user: null, loading: false, error: null });
        }
      } catch (error) {
        console.error('Error in getInitialSession:', error);
        setAuthState({ user: null, loading: false, error: 'Failed to get session' });
      }
    };

    getInitialSession();

    // Escutar mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          setAuthState({
            user: {
              id: session.user.id,
              email: session.user.email || '',
              full_name: session.user.user_metadata?.full_name,
              avatar_url: session.user.user_metadata?.avatar_url
            },
            loading: false,
            error: null
          });
        } else if (event === 'SIGNED_OUT') {
          setAuthState({ user: null, loading: false, error: null });
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Função para confirmar email automaticamente via API
  const confirmEmailAutomatically = async (email: string) => {
    try {
      const response = await fetch('/api/confirm-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error confirming email:', error);
      return { success: false, error: 'Failed to confirm email' };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        // Tratar erros específicos de confirmação de email
        let errorMessage = error.message;
        if (error.message.includes('email not confirmed') || error.message.includes('Email not confirmed')) {
          // Tentar confirmar o email automaticamente via API
          try {
            const confirmResult = await confirmEmailAutomatically(email);
            if (confirmResult.success) {
              // Tentar login novamente após confirmação
              const retryResult = await supabase.auth.signInWithPassword({
                email,
                password
              });
              
              if (retryResult.error) {
                errorMessage = 'Email confirmado automaticamente. Tente fazer login novamente.';
              } else {
                // Login bem-sucedido após confirmação automática
                const authUser = retryResult.data.user;
                if (authUser) {
                  await supabase.from('users').upsert({
                    id: authUser.id,
                    auth_user_id: authUser.id,
                    email: authUser.email,
                    full_name: authUser.user_metadata?.full_name || '',
                    role: 'candidate'
                  });
                }
                return { success: true, data: retryResult.data };
              }
            } else {
              errorMessage = 'Não foi possível confirmar o email automaticamente. Tente novamente.';
            }
          } catch (confirmError) {
            errorMessage = 'Erro ao confirmar email. Tente fazer login novamente.';
          }
        } else if (error.message.includes('Invalid login credentials')) {
          errorMessage = 'Email ou senha incorretos.';
        }
        
        setAuthState(prev => ({ ...prev, loading: false, error: errorMessage }));
        return { success: false, error: errorMessage };
      }
      
      // Garantir que perfil exista
      const authUser = data.user;
      if (authUser) {
        await supabase.from('users').upsert({
          id: authUser.id,
          auth_user_id: authUser.id,
          email: authUser.email,
          full_name: authUser.user_metadata?.full_name || '',
          role: 'candidate'
        });
      }
      return { success: true, data };
    } catch (error) {
      const errorMessage = 'Erro ao fazer login. Tente novamente.';
      setAuthState(prev => ({ ...prev, loading: false, error: errorMessage }));
      return { success: false, error: errorMessage };
    }
  };

  const signUp = async (email: string, password: string, fullName?: string) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName
          }
        }
      });

      if (error) {
        // Tratar erros específicos de cadastro
        let errorMessage = error.message;
        if (error.message.includes('User already registered')) {
          errorMessage = 'Este email já está cadastrado. Tente fazer login.';
        } else if (error.message.includes('Password should be at least')) {
          errorMessage = 'A senha deve ter pelo menos 6 caracteres.';
        } else if (error.message.includes('Invalid email')) {
          errorMessage = 'Email inválido.';
        }
        
        setAuthState(prev => ({ ...prev, loading: false, error: errorMessage }));
        return { success: false, error: errorMessage };
      }
      
      // Upsert no perfil do usuário na tabela users
      const authUser = data.user;
      if (authUser) {
        await supabase.from('users').upsert({
          id: authUser.id,
          auth_user_id: authUser.id,
          email: authUser.email,
          full_name: fullName || authUser.user_metadata?.full_name || '',
          role: 'candidate'
        });
      }

      return { success: true, data };
    } catch (error) {
      const errorMessage = 'Erro ao criar conta. Tente novamente.';
      setAuthState(prev => ({ ...prev, loading: false, error: errorMessage }));
      return { success: false, error: errorMessage };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        setAuthState(prev => ({ ...prev, error: error.message }));
        return { success: false, error: error.message };
      }

      setAuthState({ user: null, loading: false, error: null });
      return { success: true };
    } catch (error) {
      const errorMessage = 'Failed to sign out';
      setAuthState(prev => ({ ...prev, error: errorMessage }));
      return { success: false, error: errorMessage };
    }
  };

  return {
    ...authState,
    signIn,
    signUp,
    signOut
  };
}
