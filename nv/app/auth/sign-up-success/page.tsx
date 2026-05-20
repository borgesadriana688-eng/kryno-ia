import Link from 'next/link'
import { Bot, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function SignUpSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md text-center space-y-6">
        <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
          <Mail className="w-10 h-10 text-primary" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Verifique seu e-mail</h1>
          <p className="text-muted-foreground">
            Enviamos um link de confirmação para o seu e-mail. 
            Clique no link para ativar sua conta e começar a usar o Kryno.
          </p>
        </div>

        <div className="flex items-center gap-3 justify-center pt-4">
          <Bot className="w-6 h-6 text-primary" />
          <span className="text-sm text-muted-foreground">Kryno está te esperando!</span>
        </div>

        <Button asChild variant="outline" className="w-full">
          <Link href="/auth/login">Voltar para o login</Link>
        </Button>
      </div>
    </div>
  )
}
