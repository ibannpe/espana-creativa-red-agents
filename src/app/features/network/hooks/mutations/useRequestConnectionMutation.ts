// ABOUTME: React Query mutation hook for sending connection requests
// ABOUTME: Invalidates connections and stats queries on success

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { networkService } from '../../data/services/network.service'
import type { RequestConnection, Connection } from '../../data/schemas/network.schema'

/**
 * Mutation hook to send a connection request to another user
 *
 * Follows project convention: returns { action, isLoading, error, isSuccess, data }
 *
 * @returns Mutation object with standardized interface
 */
export const useRequestConnectionMutation = () => {
  const queryClient = useQueryClient()

  const mutation = useMutation<Connection, Error, RequestConnection>({
    mutationFn: async (data: RequestConnection) => {
      const response = await networkService.requestConnection(data)
      return response.connection
    },
    onSuccess: () => {
      // Invalidate connections queries
      queryClient.invalidateQueries({ queryKey: ['connections'] })

      // Invalidate network stats
      queryClient.invalidateQueries({ queryKey: ['network-stats'] })

      // Invalidate connection status for this specific user
      queryClient.invalidateQueries({ queryKey: ['connection-status'] })
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
