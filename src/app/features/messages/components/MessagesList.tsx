// ABOUTME: Messages list component displaying conversation messages with smart scroll
// ABOUTME: Shows messages in chronological order with MessageCard components and auto-mark-as-read

import { useEffect, useRef, useState } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, MessageCircle, ArrowDown, RefreshCw, AlertCircle } from 'lucide-react'
import { MessageCard } from './MessageCard'
import { useAuthContext } from '@/app/features/auth/hooks/useAuthContext'
import { useMarkAsReadMutation } from '../hooks/mutations/useMarkAsReadMutation'
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
  const { action: markAsRead } = useMarkAsReadMutation()
  const [showScrollButton, setShowScrollButton] = useState(false)
  const previousMessagesLength = useRef(messages.length)

  // Smart scroll: only auto-scroll if user is near bottom
  useEffect(() => {
    if (!messagesEndRef.current || !scrollAreaRef.current) {
      return
    }

    // Only auto-scroll when:
    // 1. New messages arrive (length changed)
    // 2. User is near the bottom (within 100px)
    const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
    if (!scrollContainer) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
      return
    }

    const isNearBottom =
      scrollContainer.scrollHeight - scrollContainer.scrollTop - scrollContainer.clientHeight < 100

    // If new messages arrived
    if (messages.length !== previousMessagesLength.current) {
      if (isNearBottom) {
        // User is at bottom, auto-scroll
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
        setShowScrollButton(false)
      } else {
        // User is reading old messages, show "New messages" button
        setShowScrollButton(true)
      }
      previousMessagesLength.current = messages.length
    }
  }, [messages])

  const handleScrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
      setShowScrollButton(false)
    }
  }

  // Auto-mark messages as read when opening conversation
  useEffect(() => {
    if (!userId || !messages || messages.length === 0) {
      return
    }

    // Find unread messages from the other user
    const unreadMessages = messages.filter(
      (msg) => msg.recipient_id === user?.id && msg.sender_id === userId && !msg.read_at
    )

    if (unreadMessages.length > 0) {
      // Mark all unread messages from this user as read
      markAsRead({ sender_id: userId })
    }
  }, [userId, messages, user?.id, markAsRead])

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className={`flex gap-3 ${i % 2 === 0 ? 'flex-row-reverse' : 'flex-row'}`}>
            <Skeleton className="h-8 w-8 rounded-full shrink-0" />
            <div className="flex flex-col gap-1 max-w-[70%]">
              <Skeleton className="h-16 w-48 rounded-lg" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex flex-col gap-2">
            <p className="text-sm font-medium">Error al cargar mensajes</p>
            <p className="text-xs">{error.message}</p>
          </AlertDescription>
        </Alert>
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
    <div className="relative h-full">
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

      {/* Scroll to bottom button */}
      {showScrollButton && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
          <Button
            onClick={handleScrollToBottom}
            size="sm"
            className="shadow-lg"
          >
            <ArrowDown className="h-4 w-4 mr-2" />
            Nuevos mensajes
          </Button>
        </div>
      )}
    </div>
  )
}
