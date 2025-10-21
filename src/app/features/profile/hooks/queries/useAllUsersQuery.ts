// ABOUTME: React Query hook for fetching all users in the network
// ABOUTME: Used for network/directory pages to display all members

import { useQuery } from '@tanstack/react-query'
import { profileService } from '../../data/services/profile.service'
import type { UserProfile } from '../../data/schemas/profile.schema'

/**
 * Query hook to fetch all users in the network
 *
 * @param options - React Query options
 * @returns Query result with array of all user profiles
 */
export const useAllUsersQuery = (options?: { enabled?: boolean }) => {
  return useQuery<UserProfile[], Error>({
    queryKey: ['all-users'],
    queryFn: async () => {
      const response = await profileService.getAllUsers()
      return response.users
    },
    enabled: options?.enabled !== false,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000 // 10 minutes
  })
}
