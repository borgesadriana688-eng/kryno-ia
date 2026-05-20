'use client'

import { useState, useRef, useEffect } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { Send, ImagePlus, X, Loader2, Bot, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Message } from '@/lib/types'
import ReactMarkdown from 'react-markdown'

interface ChatAreaProps {
  conversationId: string | null
  initialMessages?: Message[]
}

function getMessageText(msg: { parts?: Array<{ type: string; text?: string }> }): string {
  if (!msg.parts || !Array.isArray(msg.parts)) return ''
  return msg.parts
    .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
    .map((p) => p.text)
    .join('')
}

export function ChatArea({ conversationId, initialMessages = [] }: ChatAreaProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { messages, sendMessage, status, setMessages } = useChat({
    id: conversationId || undefined,
    transport: new DefaultChatTransport({
      api: '/api/chat',
      body: {
        conversationId,
        imageUrl: imagePreview,
      },
    }),
  })

  // Carregar mensagens iniciais
  useEffect(() => {
    if (initialMessages.length > 0) {
      const formattedMessages = initialMessages.map((msg) => ({
        id: msg.id,
        role: msg.role as 'user' | 'assistant',
        parts: [{ type: 'text' as const, text: msg.content }],
        ...(msg.image_url && { experimental_attachments: [{ url: msg.image_url, contentType: 'image/*' }] }),
      }))
      setMessages(formattedMessages)
    } else {
      setMessages([])
    }
  }, [conversationId, initialMessages, setMessages])

  // Scroll para baixo quando novas mensagens chegam
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() && !imagePreview) return
    if (!conversationId) return

    sendMessage({
      text: input,
    }, {
      body: {
        conversationId,
        imageUrl: imagePreview,
      },
    })

    setInput('')
    removeImage()
  }

  const isLoading = status === 'streaming' || status === 'submitted'

  if (!conversationId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
            <Bot className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">Olá! Sou o Kryno</h2>
          <p className="text-muted-foreground max-w-md">
            Crie uma nova conversa ou selecione uma do histórico para começar a conversar comigo.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col bg-background">
      {/* Área de mensagens */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                <Bot className="w-8 h-8 text-primary" />
              </div>
              <p className="text-muted-foreground">
                Envie uma mensagem para começar a conversa!
              </p>
            </div>
          </div>
        )}

        {messages.map((message) => {
          const text = getMessageText(message)
          const isUser = message.role === 'user'

          return (
            <div
              key={message.id}
              className={cn(
                'flex gap-3 max-w-3xl',
                isUser ? 'ml-auto flex-row-reverse' : ''
              )}
            >
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center shrink-0',
                  isUser ? 'bg-primary' : 'bg-secondary'
                )}
              >
                {isUser ? (
                  <User className="w-4 h-4 text-primary-foreground" />
                ) : (
                  <Bot className="w-4 h-4 text-secondary-foreground" />
                )}
              </div>

              <div
                className={cn(
                  'rounded-2xl px-4 py-3 max-w-[80%]',
                  isUser
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground'
                )}
              >
                {/* @ts-expect-error - experimental_attachments pode existir */}
                {message.experimental_attachments?.map((attachment, i) => (
                  <img
                    key={i}
                    src={attachment.url}
                    alt="Imagem anexada"
                    className="max-w-xs rounded-lg mb-2"
                  />
                ))}
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown>{text}</ReactMarkdown>
                </div>
              </div>
            </div>
          )
        })}

        {isLoading && messages[messages.length - 1]?.role === 'user' && (
          <div className="flex gap-3 max-w-3xl">
            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
              <Bot className="w-4 h-4 text-secondary-foreground" />
            </div>
            <div className="rounded-2xl px-4 py-3 bg-secondary">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Área de input */}
      <div className="border-t border-border p-4">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
          {imagePreview && (
            <div className="mb-3 relative inline-block">
              <img
                src={imagePreview}
                alt="Preview"
                className="max-h-32 rounded-lg"
              />
              <button
                type="button"
                onClick={removeImage}
                className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="flex gap-2 items-end">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageSelect}
              accept="image/*"
              className="hidden"
            />

            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              className="shrink-0"
            >
              <ImagePlus className="w-5 h-5" />
            </Button>

            <div className="flex-1 relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSubmit(e)
                  }
                }}
                placeholder="Digite sua mensagem..."
                rows={1}
                className="w-full resize-none rounded-xl border border-border bg-background px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-primary/50"
                style={{ minHeight: '48px', maxHeight: '200px' }}
              />
            </div>

            <Button
              type="submit"
              size="icon"
              disabled={isLoading || (!input.trim() && !imagePreview)}
              className="shrink-0"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
