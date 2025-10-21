// ABOUTME: React Query hook for fetching user connections
// ABOUTME: Returns list of connections with optional status filter

import { useQuery } from '@tanstack/react-query'
import { networkService } from '../../data/services/network.service'
import type { ConnectionWithUser, GetConnectionsRequest } from '../../data/schemas/network.schema'

/**
 * Query hook to fetch connections for current user
 *
 * @param params - Optional filters (status)
 * @param options - React Query options
 * @returns Query result with array of connections
 */
export const useConnectionsQuery = (
  params?: GetConnectionsRequest,
  options?: {
    enabled?: boolean
  }
) => {
  const queryKey = params?.status
    ? ['connections', params.status]
    : ['connections', 'all']

  return useQuery<ConnectionWithUser[], Error>({
    queryKey,
    queryFn: async () => {
      const response = await networkService.getConnections(params)
      return response.connections
    },
    enabled: options?.enabled !== false,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000 // 5 minutes
  })
}
