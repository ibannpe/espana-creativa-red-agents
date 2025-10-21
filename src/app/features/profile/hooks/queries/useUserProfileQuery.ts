// ABOUTME: React Query hook for fetching a specific user profile by ID
// ABOUTME: Returns user profile data with caching and automatic refetching

import { useQuery } from '@tanstack/react-query'
import { profileService } from '../../data/services/profile.service'
import type { UserProfile } from '../../data/schemas/profile.schema'

/**
 * Query hook to fetch a user profile by ID
 *
 * @param userId - The ID of the user to fetch
 * @param options - React Query options
 * @returns Query result with user profile data
 */
export const useUserProfileQuery = (
  userId: string | undefined,
  options?: {
    enabled?: boolean
  }
) => {
  return useQuery<UserProfile, Error>({
    queryKey: ['user-profile', userId],
    queryFn: async () => {
      if (!userId) {
        throw new Error('User ID is required')
      }
      const response = await profileService.getProfile(userId)
      return response.user
    },
    enabled: options?.enabled !== false && !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000 // 10 minutes (formerly cacheTime)
  })
}
