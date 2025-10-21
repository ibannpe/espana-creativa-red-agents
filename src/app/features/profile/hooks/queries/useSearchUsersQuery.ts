// ABOUTME: React Query hook for searching users with filters
// ABOUTME: Returns list of users matching search criteria with caching

import { useQuery } from '@tanstack/react-query'
import { profileService } from '../../data/services/profile.service'
import type { UserProfile, SearchUsersRequest } from '../../data/schemas/profile.schema'

/**
 * Query hook to search users with filters
 *
 * @param searchParams - Search filters (query, location, skills, role)
 * @param options - React Query options
 * @returns Query result with array of user profiles
 */
export const useSearchUsersQuery = (
  searchParams: SearchUsersRequest = {},
  options?: {
    enabled?: boolean
  }
) => {
  // Create a stable query key from search params
  const queryKey = ['search-users', searchParams]

  return useQuery<UserProfile[], Error>({
    queryKey,
    queryFn: async () => {
      const response = await profileService.searchUsers(searchParams)
      return response.users
    },
    enabled: options?.enabled !== false,
    staleTime: 1 * 60 * 1000, // 1 minute (searches may change frequently)
    gcTime: 5 * 60 * 1000 // 5 minutes
  })
}
