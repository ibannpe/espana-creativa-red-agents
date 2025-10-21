// ABOUTME: Message input component for composing and sending messages
// ABOUTME: Includes textarea, character counter, and send button with loading state

import { useState, FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Send, Loader2 } from 'lucide-react'
import { useSendMessageMutation } from '../hooks/mutations/useSendMessageMutation'

interface MessageInputProps {
  recipientId: string
  onMessageSent?: () => void
}

const MAX_MESSAGE_LENGTH = 5000

export function MessageInput({ recipientId, onMessageSent }: MessageInputProps) {
  const [content, setContent] = useState('')
  const { action: sendMessage, isLoading } = useSendMessageMutation()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (!content.trim() || isLoading) {
      return
    }

    sendMessage(
      {
        recipient_id: recipientId,
        content: content.trim()
      },
      {
        onSuccess: () => {
          setContent('')
          onMessageSent?.()
        }
      }
    )
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Send on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as unknown as FormEvent)
    }
  }

  const remainingChars = MAX_MESSAGE_LENGTH - content.length
  const isOverLimit = remainingChars < 0

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="relative">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Escribe un mensaje..."
          className="min-h-[100px] resize-none pr-20"
          disabled={isLoading}
          maxLength={MAX_MESSAGE_LENGTH}
        />

        {/* Character Counter */}
        <div className="absolute bottom-2 right-2">
          <span
            className={`text-xs ${
              isOverLimit
                ? 'text-destructive font-semibold'
                : remainingChars < 100
                  ? 'text-warning'
                  : 'text-muted-foreground'
            }`}
          >
            {remainingChars}
          </span>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <p className="text-xs text-muted-foreground">
          Presiona Enter para enviar, Shift+Enter para nueva línea
        </p>

        <Button type="submit" disabled={!content.trim() || isLoading || isOverLimit} size="sm">
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Enviar
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
