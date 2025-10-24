// ABOUTME: React Query hook for fetching current authenticated user
// ABOUTME: Handles caching, loading states, and automatic refetching with stale-time optimization

import { useQuery } from '@tanstack/react-query'
import { authService } from '../../data/services/auth.service'
import { UserResponse } from '../../data/schemas/auth.schema'

export function useCurrentUserQuery() {
  return useQuery<UserResponse | null, Error>({
    queryKey: ['auth', 'currentUser'],
    queryFn: async () => {
      try {
        const response = await authService.getCurrentUser()
        return response.user
      } catch (error) {
        // If not authenticated (401), return null instead of throwing
        // The error is already handled silently by the axios interceptor
        if (error instanceof Error && error.message === 'Not authenticated') {
          return null
        }
        // Check for 401 status in response
        if ((error as any).response?.status === 401) {
          return null
        }
        throw error
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false
  })
}
