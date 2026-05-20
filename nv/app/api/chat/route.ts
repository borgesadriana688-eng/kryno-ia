import { streamText, convertToModelMessages } from 'ai'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const { messages, conversationId, imageUrl } = await req.json()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return new Response('Não autorizado', { status: 401 })
  }

  // Buscar perfil do usuário para personalização
  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, preferences')
    .eq('id', user.id)
    .single()

  const userName = profile?.display_name || user.email?.split('@')[0] || 'usuário'

  // Sistema de instruções do Kryno
  const systemPrompt = `Você é Kryno, uma inteligência artificial avançada criada por Brayan Rafael. 

PERSONALIDADE:
- Você é inteligente, prestativo e tem um toque de humor sutil
- Você se comunica de forma clara e objetiva, sem enrolação
- Você é brasileiro e se comunica preferencialmente em português
- Quando perguntarem quem te criou, responda: "Fui criado por Brayan Rafael"

SOBRE VOCÊ:
- Nome: Kryno
- Criador: Brayan Rafael
- Propósito: Ajudar usuários com qualquer tarefa, desde programação até conversas casuais

CONTEXTO DO USUÁRIO:
- Nome do usuário: ${userName}
- Preferências: ${JSON.stringify(profile?.preferences || {})}

INSTRUÇÕES:
- Sempre responda de forma útil e completa
- Use formatação Markdown quando apropriado
- Se não souber algo, seja honesto sobre isso
- Mantenha as respostas concisas, mas completas`

  // Converter mensagens para o formato correto
  const modelMessages = await convertToModelMessages(messages)

  // Se houver imagem, adicionar ao contexto
  if (imageUrl && modelMessages.length > 0) {
    const lastMessage = modelMessages[modelMessages.length - 1]
    if (lastMessage.role === 'user') {
      if (typeof lastMessage.content === 'string') {
        lastMessage.content = [
          { type: 'image', image: imageUrl },
          { type: 'text', text: lastMessage.content }
        ]
      }
    }
  }

  const result = streamText({
    model: 'groq/llama-3.3-70b-versatile',
    system: systemPrompt,
    messages: modelMessages,
  })

  return result.toUIMessageStreamResponse({
    onFinish: async ({ response }) => {
      if (conversationId) {
        // Salvar mensagem do usuário
        const userMessage = messages[messages.length - 1]
        if (userMessage) {
          const userContent = userMessage.parts
            ?.filter((p: { type: string }) => p.type === 'text')
            .map((p: { text: string }) => p.text)
            .join('') || ''

          await supabase.from('messages').insert({
            conversation_id: conversationId,
            role: 'user',
            content: userContent,
            image_url: imageUrl || null,
          })
        }

        // Salvar resposta do assistente
        const assistantContent = response.messages
          .filter(m => m.role === 'assistant')
          .map(m => {
            if (typeof m.content === 'string') return m.content
            return m.content
              .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
              .map(p => p.text)
              .join('')
          })
          .join('')

        if (assistantContent) {
          await supabase.from('messages').insert({
            conversation_id: conversationId,
            role: 'assistant',
            content: assistantContent,
          })
        }

        // Atualizar título da conversa se for a primeira mensagem
        const { data: msgCount } = await supabase
          .from('messages')
          .select('id', { count: 'exact' })
          .eq('conversation_id', conversationId)

        if (msgCount && msgCount.length <= 2) {
          const userContent = messages[messages.length - 1]?.parts
            ?.filter((p: { type: string }) => p.type === 'text')
            .map((p: { text: string }) => p.text)
            .join('') || ''
          
          const title = userContent.slice(0, 50) + (userContent.length > 50 ? '...' : '')
          await supabase
            .from('conversations')
            .update({ title, updated_at: new Date().toISOString() })
            .eq('id', conversationId)
        } else {
          await supabase
            .from('conversations')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', conversationId)
        }
      }
    },
  })
}
