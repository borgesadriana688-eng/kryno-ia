import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { KrynoChat } from '@/components/kryno-chat'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  return <KrynoChat />
}
