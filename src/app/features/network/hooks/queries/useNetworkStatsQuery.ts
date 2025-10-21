// ABOUTME: React Query hook for fetching network statistics
// ABOUTME: Returns total connections, pending requests, and mutual connections count

import { useQuery } from '@tanstack/react-query'
import { networkService } from '../../data/services/network.service'
import type { NetworkStats } from '../../data/schemas/network.schema'

/**
 * Query hook to fetch network stats for current user
 *
 * @param options - React Query options
 * @returns Query result with network statistics
 */
export const useNetworkStatsQuery = (options?: { enabled?: boolean }) => {
  return useQuery<NetworkStats, Error>({
    queryKey: ['network-stats'],
    queryFn: async () => {
      const response = await networkService.getNetworkStats()
      return response.stats
    },
    enabled: options?.enabled !== false,
    staleTime: 5 * 60 * 1000, // 5 minutes (stats don't change frequently)
    gcTime: 10 * 60 * 1000 // 10 minutes
  })
}
