// ABOUTME: React Query mutation hook for sending messages
// ABOUTME: Invalidates conversations and conversation-messages queries on success

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { messageService } from '../../data/services/message.service'
import type { SendMessageRequest, MessageWithUsers } from '../../data/schemas/message.schema'

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
    onSuccess: (_, variables) => {
      // Invalidate conversations list
      queryClient.invalidateQueries({ queryKey: ['conversations'] })

      // Invalidate specific conversation messages
      queryClient.invalidateQueries({
        queryKey: ['conversation-messages', variables.recipient_id]
      })

      // Invalidate unread count
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
