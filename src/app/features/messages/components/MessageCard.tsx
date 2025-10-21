// ABOUTME: Message card component displaying individual message bubbles
// ABOUTME: Shows sender avatar, message content, timestamp, and read status

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { useDeleteMessageMutation } from '../hooks/mutations/useDeleteMessageMutation'
import type { MessageWithUsers } from '../data/schemas/message.schema'

interface MessageCardProps {
  message: MessageWithUsers
  currentUserId: string
  showActions?: boolean
}

export function MessageCard({ message, currentUserId, showActions = false }: MessageCardProps) {
  const { action: deleteMessage, isLoading: isDeleting } = useDeleteMessageMutation()

  const isOwnMessage = message.sender_id === currentUserId
  const displayUser = isOwnMessage ? message.sender : message.sender

  const handleDelete = () => {
    if (confirm('¿Estás seguro de que quieres eliminar este mensaje?')) {
      deleteMessage(message.id)
    }
  }

  const messageTime = formatDistanceToNow(new Date(message.created_at), {
    addSuffix: true,
    locale: es
  })

  return (
    <div className={`flex gap-3 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Sender Avatar */}
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarImage src={displayUser.avatar_url || undefined} alt={displayUser.name} />
        <AvatarFallback>{displayUser.name?.charAt(0)?.toUpperCase()}</AvatarFallback>
      </Avatar>

      {/* Message Bubble */}
      <div className={`flex flex-col gap-1 max-w-[70%] ${isOwnMessage ? 'items-end' : 'items-start'}`}>
        <div
          className={`rounded-lg px-4 py-2 ${
            isOwnMessage
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground'
          }`}
        >
          <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
        </div>

        {/* Message Info */}
        <div className="flex items-center gap-2 px-1">
          <p className="text-xs text-muted-foreground">{messageTime}</p>

          {isOwnMessage && message.read_at && (
            <p className="text-xs text-muted-foreground">· Leído</p>
          )}

          {showActions && isOwnMessage && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              disabled={isDeleting}
              className="h-6 px-2"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
