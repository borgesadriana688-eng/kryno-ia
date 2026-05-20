import Link from 'next/link'
import { AlertCircle, Bot } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md text-center space-y-6">
        <div className="w-20 h-20 mx-auto rounded-full bg-destructive/10 flex items-center justify-center">
          <AlertCircle className="w-10 h-10 text-destructive" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Erro de autenticação</h1>
          <p className="text-muted-foreground">
            Ocorreu um erro durante a autenticação. Por favor, tente novamente.
          </p>
        </div>

        <div className="flex items-center gap-3 justify-center pt-4">
          <Bot className="w-6 h-6 text-primary" />
          <span className="text-sm text-muted-foreground">Kryno</span>
        </div>

        <div className="flex flex-col gap-2">
          <Button asChild className="w-full">
            <Link href="/auth/login">Tentar novamente</Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/auth/sign-up">Criar nova conta</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
