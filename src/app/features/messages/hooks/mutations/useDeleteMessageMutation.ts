// ABOUTME: React Query mutation hook for deleting messages
// ABOUTME: Invalidates conversations and conversation-messages queries on success

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { messageService } from '../../data/services/message.service'

/**
 * Mutation hook to delete a message
 *
 * Follows project convention: returns { action, isLoading, error, isSuccess, data }
 *
 * @returns Mutation object with standardized interface
 */
export const useDeleteMessageMutation = () => {
  const queryClient = useQueryClient()

  const mutation = useMutation<void, Error, string>({
    mutationFn: async (messageId: string) => {
      await messageService.deleteMessage(messageId)
    },
    onSuccess: () => {
      // Invalidate conversations list (last message may have been deleted)
      queryClient.invalidateQueries({ queryKey: ['conversations'] })

      // Invalidate all conversation messages
      queryClient.invalidateQueries({ queryKey: ['conversation-messages'] })
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
