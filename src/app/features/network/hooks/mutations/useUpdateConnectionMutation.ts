// ABOUTME: React Query mutation hook for updating connection status (accept/reject)
// ABOUTME: Invalidates connections and stats queries on success

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { networkService } from '../../data/services/network.service'
import type { UpdateConnectionStatus, Connection } from '../../data/schemas/network.schema'

/**
 * Mutation hook to update connection status (accept/reject)
 *
 * Follows project convention: returns { action, isLoading, error, isSuccess, data }
 *
 * @returns Mutation object with standardized interface
 */
export const useUpdateConnectionMutation = () => {
  const queryClient = useQueryClient()

  const mutation = useMutation<Connection, Error, UpdateConnectionStatus>({
    mutationFn: async (data: UpdateConnectionStatus) => {
      const response = await networkService.updateConnectionStatus(data)
      return response.connection
    },
    onSuccess: () => {
      // Invalidate all connections queries
      queryClient.invalidateQueries({ queryKey: ['connections'] })

      // Invalidate network stats
      queryClient.invalidateQueries({ queryKey: ['network-stats'] })

      // Invalidate connection status
      queryClient.invalidateQueries({ queryKey: ['connection-status'] })

      // Invalidate mutual connections as accepting/rejecting might affect them
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
