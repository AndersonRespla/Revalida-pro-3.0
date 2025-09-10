import { useEffect, useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/hooks/useAuth'
import { Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function AuthPage() {
  const { signIn, signUp, loading, error } = useAuth()
  const [tab, setTab] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [localError, setLocalError] = useState('')
  const navigate = useNavigate()
  const lastClickRef = useRef<number>(0)

  useEffect(() => {
    setLocalError('')
  }, [tab])

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError('')
    if (!validateEmail(email)) return setLocalError('Email inválido')
    if (!validatePassword(password)) return setLocalError('A senha deve ter pelo menos 6 caracteres')
    const result = await signIn(email, password)
    if (!result.success) return setLocalError(result.error || 'Falha ao entrar')
    navigate('/dashboard', { replace: true })
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    const now = Date.now()
    if (now - lastClickRef.current < 3000) {
      setLocalError('Aguarde antes de tentar novamente')
      return
    }
    lastClickRef.current = now
    
    setLocalError('')
    if (!fullName.trim()) return setLocalError('Informe seu nome completo')
    if (!validateEmail(email)) return setLocalError('Email inválido')
    if (!validatePassword(password)) return setLocalError('A senha deve ter pelo menos 6 caracteres')
    const result = await signUp(email, password, fullName)
    if (!result.success) return setLocalError(result.error || 'Falha ao cadastrar')
    navigate('/dashboard', { replace: true })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-slate-100 dark:from-slate-900 dark:to-slate-950 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl">Bem-vindo ao Revalida AI Coach</CardTitle>
          <CardDescription>Entre ou crie sua conta para continuar</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={tab} onValueChange={(v:any)=>setTab(v)} className="w-full">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="signin">Entrar</TabsTrigger>
              <TabsTrigger value="signup">Cadastrar</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={email} onChange={e=>setEmail(e.target.value)} required disabled={loading} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <Input id="password" type="password" value={password} onChange={e=>setPassword(e.target.value)} required minLength={6} disabled={loading} />
                </div>
                {(error || localError) && (
                  <div className="text-sm text-red-600 bg-red-50 dark:bg-red-950/40 p-2 rounded">
                    {localError || error}
                  </div>
                )}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Entrar
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Nome completo</Label>
                  <Input id="fullName" value={fullName} onChange={e=>setFullName(e.target.value)} required disabled={loading} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email2">Email</Label>
                  <Input id="email2" type="email" value={email} onChange={e=>setEmail(e.target.value)} required disabled={loading} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password2">Senha</Label>
                  <Input id="password2" type="password" value={password} onChange={e=>setPassword(e.target.value)} required minLength={6} disabled={loading} />
                </div>
                {(error || localError) && (
                  <div className="text-sm text-red-600 bg-red-50 dark:bg-red-950/40 p-2 rounded">
                    {localError || error}
                  </div>
                )}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Cadastrar
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

function validateEmail(email: string) {
  // Validação simples
  return /.+@.+\..+/.test(email)
}

function validatePassword(password: string) {
  return (password || '').length >= 6
}
