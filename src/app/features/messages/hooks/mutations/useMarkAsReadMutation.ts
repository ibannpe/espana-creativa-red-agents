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
      console.log('[useMarkAsReadMutation] Sending request:', data)
      const result = await messageService.markAsRead(data)
      console.log('[useMarkAsReadMutation] Response:', result)
      return result
    },
    onSuccess: (data) => {
      console.log('[useMarkAsReadMutation] Success! Updated count:', data.updated_count)

      // Invalidate conversations (unread count may change)
      queryClient.invalidateQueries({ queryKey: ['conversations'] })

      // Invalidate conversation messages (read_at may change)
      queryClient.invalidateQueries({ queryKey: ['conversation-messages'] })

      // Invalidate unread count
      queryClient.invalidateQueries({ queryKey: ['unread-count'] })

      console.log('[useMarkAsReadMutation] Queries invalidated')
    },
    onError: (error) => {
      console.error('[useMarkAsReadMutation] Error marking messages as read:', error)
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
