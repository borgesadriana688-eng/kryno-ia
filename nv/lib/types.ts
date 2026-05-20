export interface Conversation {
  id: string
  user_id: string
  title: string
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  conversation_id: string
  role: 'user' | 'assistant'
  content: string
  image_url?: string | null
  created_at: string
}

export interface Profile {
  id: string
  display_name: string | null
  preferences: Record<string, unknown>
  created_at: string
  updated_at: string
}
