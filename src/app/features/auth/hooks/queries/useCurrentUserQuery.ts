// ABOUTME: React Query hook for fetching current authenticated user
// ABOUTME: Handles caching, loading states, and automatic refetching with stale-time optimization

import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
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
        // If not authenticated, return null instead of throwing
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          return null
        }
        throw error
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false
  })
}
