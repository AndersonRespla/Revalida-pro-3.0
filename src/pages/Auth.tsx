import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/hooks/useAuth'
import { Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'

export default function AuthPage() {
  const { signInWithGoogle, loading, error, user } = useAuth()
  const [localError, setLocalError] = useState('')
  const [isProcessingOAuth, setIsProcessingOAuth] = useState(false)
  const navigate = useNavigate()

  // Processar tokens OAuth se estiverem na URL
  useEffect(() => {
    const processOAuthCallback = async () => {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      
      if (accessToken && refreshToken) {
        console.log('Processando tokens OAuth na página Auth...');
        setIsProcessingOAuth(true);
        
        try {
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });
          
          if (error) {
            console.error('Erro ao processar tokens OAuth:', error);
            setLocalError('Erro ao processar login');
            setIsProcessingOAuth(false);
            return;
          }
          
          console.log('Tokens processados com sucesso, redirecionando...');
          // Limpar URL e redirecionar
          window.history.replaceState({}, document.title, '/auth');
          navigate('/dashboard', { replace: true });
        } catch (err) {
          console.error('Erro inesperado:', err);
          setLocalError('Erro inesperado ao processar login');
          setIsProcessingOAuth(false);
        }
      }
    };

    processOAuthCallback();
  }, [navigate]);

  // Se já estiver logado, redirecionar para dashboard
  if (user) {
    navigate('/dashboard', { replace: true })
    return null
  }

  const handleGoogleSignIn = async () => {
    setLocalError('')
    const result = await signInWithGoogle()
    if (!result.success) {
      setLocalError(result.error || 'Falha ao fazer login com Google')
    }
    // OAuth redireciona automaticamente, não precisamos navegar manualmente
  }

  // Mostrar loading se estiver processando OAuth
  if (isProcessingOAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-slate-100 dark:from-slate-900 dark:to-slate-950 p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin mb-4" />
            <h3 className="text-lg font-semibold mb-2">Processando login...</h3>
            <p className="text-sm text-gray-600 text-center">
              Aguarde enquanto processamos sua autenticação com Google.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-slate-100 dark:from-slate-900 dark:to-slate-950 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl">Bem-vindo ao Revalida AI Coach</CardTitle>
          <CardDescription>Entre com sua conta Google para continuar</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {(error || localError) && (
            <div className="text-sm text-red-600 bg-red-50 dark:bg-red-950/40 p-3 rounded">
              {localError || error}
            </div>
          )}
          
          <Button 
            onClick={handleGoogleSignIn} 
            className="w-full" 
            disabled={loading}
            variant="outline"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Entrar com Google
          </Button>
          
          <p className="text-xs text-gray-500 text-center">
            Ao continuar, você concorda com nossos termos de uso e política de privacidade.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

