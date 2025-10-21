// ABOUTME: Conversation list component displaying all user conversations
// ABOUTME: Shows user avatar, name, last message, and unread count badge

import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Loader2, MessageCircle } from 'lucide-react'
import { useConversationsQuery } from '../hooks/queries/useConversationsQuery'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

interface ConversationListProps {
  onSelectConversation?: (userId: string) => void
  selectedUserId?: string
}

export function ConversationList({ onSelectConversation, selectedUserId }: ConversationListProps) {
  const { data, isLoading, error } = useConversationsQuery()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 text-center text-sm text-destructive">
        Error al cargar conversaciones: {error.message}
      </div>
    )
  }

  if (!data || data.conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <MessageCircle className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-sm text-muted-foreground">No tienes conversaciones aún</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {data.conversations.map((conversation) => {
        const isSelected = selectedUserId === conversation.user.id
        const lastMessageTime = formatDistanceToNow(new Date(conversation.last_message.created_at), {
          addSuffix: true,
          locale: es
        })

        return (
          <Card
            key={conversation.user.id}
            className={`cursor-pointer transition-colors hover:bg-accent ${
              isSelected ? 'bg-accent border-primary' : ''
            }`}
            onClick={() => onSelectConversation?.(conversation.user.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                {/* User Avatar */}
                <Avatar className="h-12 w-12">
                  <AvatarImage
                    src={conversation.user.avatar_url || undefined}
                    alt={conversation.user.name}
                  />
                  <AvatarFallback>
                    {conversation.user.name?.charAt(0)?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                {/* Conversation Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h4 className="font-semibold text-sm truncate">
                      {conversation.user.name}
                    </h4>
                    {conversation.unread_count > 0 && (
                      <Badge variant="default" className="shrink-0">
                        {conversation.unread_count}
                      </Badge>
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground line-clamp-2 mb-1">
                    {conversation.last_message.content}
                  </p>

                  <p className="text-xs text-muted-foreground">
                    {lastMessageTime}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
