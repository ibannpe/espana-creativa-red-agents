// ABOUTME: React Query hook for fetching recently registered users
// ABOUTME: Returns list of users registered in the last N days with caching

import { useQuery } from '@tanstack/react-query'
import { dashboardService } from '../../data/services/dashboard.service'
import type { DashboardUser, GetRecentUsersRequest } from '../../data/schemas/dashboard.schema'

/**
 * Query hook to fetch users registered within the last N days
 *
 * @param params - Optional parameters (days, limit)
 * @param options - React Query options
 * @returns Query result with array of recent users
 */
export const useRecentUsersQuery = (
  params?: GetRecentUsersRequest,
  options?: {
    enabled?: boolean
  }
) => {
  const days = params?.days || 30
  const limit = params?.limit || 5

  const queryKey = ['dashboard', 'recent-users', days, limit]

  return useQuery<DashboardUser[], Error>({
    queryKey,
    queryFn: async () => {
      const response = await dashboardService.getRecentUsers(params)
      return response.users
    },
    enabled: options?.enabled !== false,
    staleTime: 2 * 60 * 1000, // 2 minutes - data is relatively static
    gcTime: 10 * 60 * 1000, // 10 minutes - keep in cache longer
    refetchOnWindowFocus: false // Don't refetch when user returns to tab
  })
}
