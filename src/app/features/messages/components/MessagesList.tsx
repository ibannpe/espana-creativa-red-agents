// ABOUTME: Messages list component displaying conversation messages with auto-scroll
// ABOUTME: Shows messages in chronological order with MessageCard components

import { useEffect, useRef } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Loader2, MessageCircle } from 'lucide-react'
import { MessageCard } from './MessageCard'
import { useAuthContext } from '@/app/features/auth/hooks/useAuthContext'
import type { MessageWithUsers } from '../data/schemas/message.schema'

interface MessagesListProps {
  userId: string
  messages: MessageWithUsers[]
  isLoading?: boolean
  error?: Error | null
}

export function MessagesList({ userId, messages, isLoading, error }: MessagesListProps) {
  const { user } = useAuthContext()
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <MessageCircle className="h-12 w-12 text-destructive mb-4" />
        <p className="text-sm text-destructive font-medium mb-2">
          Error al cargar mensajes
        </p>
        <p className="text-xs text-muted-foreground">
          {error.message}
        </p>
      </div>
    )
  }

  if (!messages || messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <MessageCircle className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-sm text-muted-foreground">
          No hay mensajes aún. ¡Sé el primero en enviar un mensaje!
        </p>
      </div>
    )
  }

  return (
    <ScrollArea className="h-full" ref={scrollAreaRef}>
      <div className="p-4 space-y-4">
        {messages.map((message) => (
          <MessageCard
            key={message.id}
            message={message}
            currentUserId={user?.id || ''}
            showActions={true}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>
    </ScrollArea>
  )
}
