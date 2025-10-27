// ABOUTME: React Query mutation hook for sending messages with optimistic updates
// ABOUTME: Shows message immediately before server response, rolls back on error

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { messageService } from '../../data/services/message.service'
import type { SendMessageRequest, MessageWithUsers, GetConversationMessagesResponse } from '../../data/schemas/message.schema'

/**
 * Mutation hook to send a new message
 *
 * Follows project convention: returns { action, isLoading, error, isSuccess, data }
 *
 * @returns Mutation object with standardized interface
 */
export const useSendMessageMutation = () => {
  const queryClient = useQueryClient()

  const mutation = useMutation<MessageWithUsers, Error, SendMessageRequest>({
    mutationFn: async (data: SendMessageRequest) => {
      const response = await messageService.sendMessage(data)
      return response.message
    },
    onMutate: async (newMessage) => {
      // Cancel any outgoing refetches to prevent overwriting optimistic update
      await queryClient.cancelQueries({
        queryKey: ['conversation-messages', newMessage.recipient_id]
      })

      // Snapshot the previous value - get all conversation-messages queries for this user
      const queryKey = ['conversation-messages', newMessage.recipient_id]
      const previousMessages = queryClient.getQueryData<GetConversationMessagesResponse>(queryKey)

      // Optimistically update to show the new message immediately
      if (previousMessages) {
        const optimisticMessage: MessageWithUsers = {
          id: `temp-${Date.now()}`, // Temporary ID
          content: newMessage.content,
          sender_id: '', // Will be filled by server
          recipient_id: newMessage.recipient_id,
          created_at: new Date().toISOString(),
          read_at: null,
          sender: {
            id: '',
            name: 'Enviando...', // Placeholder
            email: '',
            avatar_url: null,
            headline: null,
            bio: null,
            location: null,
            website: null,
            linkedin_url: null,
            twitter_url: null,
            github_url: null,
            skills: [],
            interests: [],
            completed_pct: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            status: 'pending_approval',
            approved_at: null,
            role: 'user'
          },
          recipient: previousMessages.messages[0]?.recipient || {
            id: newMessage.recipient_id,
            name: '',
            email: '',
            avatar_url: null,
            headline: null,
            bio: null,
            location: null,
            website: null,
            linkedin_url: null,
            twitter_url: null,
            github_url: null,
            skills: [],
            interests: [],
            completed_pct: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            status: 'pending_approval',
            approved_at: null,
            role: 'user'
          }
        }

        queryClient.setQueryData<GetConversationMessagesResponse>(
          ['conversation-messages', newMessage.recipient_id],
          {
            messages: [...previousMessages.messages, optimisticMessage]
          }
        )
      }

      // Return context with snapshot for rollback
      return { previousMessages }
    },
    onError: (err, newMessage, context) => {
      // Rollback to previous state on error
      if (context?.previousMessages) {
        queryClient.setQueryData(
          ['conversation-messages', newMessage.recipient_id],
          context.previousMessages
        )
      }
    },
    onSuccess: (_, variables) => {
      // Invalidate queries to get real data from server
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
      queryClient.invalidateQueries({
        queryKey: ['conversation-messages', variables.recipient_id]
      })
      queryClient.invalidateQueries({ queryKey: ['unread-count'] })
    }
  })

  return {
    action: mutation.mutate,
    isLoading: mutation.isPending,
    error: mutation.error,
    isSuccess: mutation.isSuccess,
    data: mutation.data
  }
}
