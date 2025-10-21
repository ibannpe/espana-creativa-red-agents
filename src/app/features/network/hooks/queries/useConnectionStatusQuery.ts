// ABOUTME: React Query hook for checking connection status with a specific user
// ABOUTME: Returns current connection status (pending, accepted, rejected, blocked, or null)

import { useQuery } from '@tanstack/react-query'
import { networkService } from '../../data/services/network.service'

/**
 * Query hook to check connection status with a specific user
 *
 * @param userId - ID of the user to check connection status with
 * @param options - React Query options
 * @returns Query result with connection status
 */
export const useConnectionStatusQuery = (
  userId: string | undefined,
  options?: {
    enabled?: boolean
  }
) => {
  return useQuery<{ status: string | null }, Error>({
    queryKey: ['connection-status', userId],
    queryFn: async () => {
      if (!userId) {
        return { status: null }
      }
      return await networkService.getConnectionStatus(userId)
    },
    enabled: options?.enabled !== false && !!userId,
    staleTime: 1 * 60 * 1000, // 1 minute (status can change)
    gcTime: 5 * 60 * 1000 // 5 minutes
  })
}
