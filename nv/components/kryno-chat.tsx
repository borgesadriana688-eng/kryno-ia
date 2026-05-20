'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/sidebar'
import { ChatArea } from '@/components/chat-area'
import { createClient } from '@/lib/supabase/client'
import type { Conversation, Message } from '@/lib/types'

export function KrynoChat() {
  const router = useRouter()
  const supabase = createClient()

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)
  const [currentMessages, setCurrentMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Carregar conversas
  const loadConversations = useCallback(async () => {
    const res = await fetch('/api/conversations')
    if (res.ok) {
      const data = await res.json()
      setConversations(data)
    }
  }, [])

  // Carregar mensagens de uma conversa
  const loadMessages = useCallback(async (conversationId: string) => {
    const res = await fetch(`/api/conversations/${conversationId}/messages`)
    if (res.ok) {
      const data = await res.json()
      setCurrentMessages(data)
    }
  }, [])

  // Carregar conversas ao montar
  useEffect(() => {
    loadConversations()
  }, [loadConversations])

  // Carregar mensagens quando mudar a conversa
  useEffect(() => {
    if (currentConversationId) {
      loadMessages(currentConversationId)
    } else {
      setCurrentMessages([])
    }
  }, [currentConversationId, loadMessages])

  const handleNewConversation = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/conversations', { method: 'POST' })
      if (res.ok) {
        const newConversation = await res.json()
        setConversations((prev) => [newConversation, ...prev])
        setCurrentConversationId(newConversation.id)
        setCurrentMessages([])
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectConversation = (id: string) => {
    setCurrentConversationId(id)
  }

  const handleDeleteConversation = async (id: string) => {
    const res = await fetch(`/api/conversations?id=${id}`, { method: 'DELETE' })
    if (res.ok) {
      setConversations((prev) => prev.filter((c) => c.id !== id))
      if (currentConversationId === id) {
        setCurrentConversationId(null)
        setCurrentMessages([])
      }
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar
        conversations={conversations}
        currentConversationId={currentConversationId}
        onSelectConversation={handleSelectConversation}
        onNewConversation={handleNewConversation}
        onDeleteConversation={handleDeleteConversation}
        onLogout={handleLogout}
        isLoading={isLoading}
      />

      <ChatArea
        conversationId={currentConversationId}
        initialMessages={currentMessages}
      />
    </div>
  )
}
