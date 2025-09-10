import { useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

type AuthModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function AuthModal({ open, onOpenChange, onSuccess }: AuthModalProps) {
  const navigate = useNavigate()
  const { user } = useAuth()

  useEffect(() => {
    if (open && user) {
      onOpenChange(false)
      onSuccess?.()
    }
  }, [open, user, onOpenChange, onSuccess])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Entrar ou Cadastrar</DialogTitle>
          <DialogDescription>
            Você será redirecionado para a página de autenticação para continuar.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={() => { onOpenChange(false); navigate('/auth'); }}>Ir para /auth</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}


