// ABOUTME: React Query mutation hook for deleting/removing a connection
// ABOUTME: Invalidates all connection-related queries on success

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { networkService } from '../../data/services/network.service'

/**
 * Mutation hook to delete/remove a connection
 *
 * Follows project convention: returns { action, isLoading, error, isSuccess, data }
 *
 * @returns Mutation object with standardized interface
 */
export const useDeleteConnectionMutation = () => {
  const queryClient = useQueryClient()

  const mutation = useMutation<void, Error, string>({
    mutationFn: async (connectionId: string) => {
      await networkService.deleteConnection(connectionId)
    },
    onSuccess: () => {
      // Invalidate all connection-related queries
      queryClient.invalidateQueries({ queryKey: ['connections'] })
      queryClient.invalidateQueries({ queryKey: ['network-stats'] })
      queryClient.invalidateQueries({ queryKey: ['connection-status'] })
      queryClient.invalidateQueries({ queryKey: ['mutual-connections'] })
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
