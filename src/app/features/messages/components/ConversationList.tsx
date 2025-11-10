// ABOUTME: Conversation list component displaying all user conversations
// ABOUTME: Shows user avatar, name, last message, and unread count badge

import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, MessageCircle, RefreshCw, AlertCircle } from 'lucide-react'
import { useConversationsQuery } from '../hooks/queries/useConversationsQuery'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

interface ConversationListProps {
  onSelectConversation?: (userId: string) => void
  selectedUserId?: string
}

export function ConversationList({ onSelectConversation, selectedUserId }: ConversationListProps) {
  const { data, isLoading, error, refetch } = useConversationsQuery()

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive" className="m-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="flex flex-col gap-2">
          <p className="text-sm">Error al cargar conversaciones</p>
          <p className="text-xs text-muted-foreground">{error.message}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="w-fit"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reintentar
          </Button>
        </AlertDescription>
      </Alert>
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
            className={`cursor-pointer transition-colors hover:bg-green-50 ${
              isSelected ? 'bg-green-50 border-green-500' : ''
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
                    <h4 className={`font-semibold text-sm truncate ${
                      isSelected ? 'text-green-900' : ''
                    }`}>
                      {conversation.user.name}
                    </h4>
                    {conversation.unread_count > 0 && (
                      <Badge variant="default" className="shrink-0">
                        {conversation.unread_count}
                      </Badge>
                    )}
                  </div>

                  <p className={`text-xs line-clamp-2 mb-1 ${
                    isSelected ? 'text-green-700' : 'text-muted-foreground'
                  }`}>
                    {conversation.last_message.content}
                  </p>

                  <p className={`text-xs ${
                    isSelected ? 'text-green-600' : 'text-muted-foreground'
                  }`}>
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
