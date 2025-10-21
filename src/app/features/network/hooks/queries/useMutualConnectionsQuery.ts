// ABOUTME: React Query hook for fetching mutual connections with another user
// ABOUTME: Shows shared connections between current user and specified user

import { useQuery } from '@tanstack/react-query'
import { networkService } from '../../data/services/network.service'
import type { UserProfile } from '@/app/features/profile/data/schemas/profile.schema'

/**
 * Query hook to fetch mutual connections with another user
 *
 * @param userId - ID of the user to check mutual connections with
 * @param options - React Query options
 * @returns Query result with array of mutual connection user profiles
 */
export const useMutualConnectionsQuery = (
  userId: string | undefined,
  options?: {
    enabled?: boolean
  }
) => {
  return useQuery<{ connections: UserProfile[]; count: number }, Error>({
    queryKey: ['mutual-connections', userId],
    queryFn: async () => {
      if (!userId) {
        throw new Error('User ID is required')
      }
      return await networkService.getMutualConnections(userId)
    },
    enabled: options?.enabled !== false && !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000 // 10 minutes
  })
}
