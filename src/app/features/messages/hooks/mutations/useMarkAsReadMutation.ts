// ABOUTME: React Query mutation hook for marking messages as read
// ABOUTME: Invalidates conversations and unread count queries on success

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { messageService } from '../../data/services/message.service'
import type { MarkAsReadRequest } from '../../data/schemas/message.schema'

/**
 * Mutation hook to mark messages as read
 *
 * Follows project convention: returns { action, isLoading, error, isSuccess, data }
 *
 * @returns Mutation object with standardized interface
 */
export const useMarkAsReadMutation = () => {
  const queryClient = useQueryClient()

  const mutation = useMutation<{ updated_count: number }, Error, MarkAsReadRequest>({
    mutationFn: async (data: MarkAsReadRequest) => {
      return await messageService.markAsRead(data)
    },
    onSuccess: () => {
      // Invalidate conversations (unread count may change)
      queryClient.invalidateQueries({ queryKey: ['conversations'] })

      // Invalidate conversation messages (read_at may change)
      queryClient.invalidateQueries({ queryKey: ['conversation-messages'] })

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
