// ABOUTME: React Query mutation hook for updating user profile
// ABOUTME: Invalidates profile queries on success and follows project mutation conventions

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { profileService } from '../../data/services/profile.service'
import type { UpdateProfileRequest, UserProfile } from '../../data/schemas/profile.schema'

/**
 * Mutation hook to update user profile
 *
 * Follows project convention: returns { action, isLoading, error, isSuccess, data }
 *
 * @param userId - ID of the user whose profile to update
 * @returns Mutation object with standardized interface
 */
export const useUpdateProfileMutation = (userId: string) => {
  const queryClient = useQueryClient()

  const mutation = useMutation<UserProfile, Error, UpdateProfileRequest>({
    mutationFn: async (data: UpdateProfileRequest) => {
      const response = await profileService.updateProfile(userId, data)
      return response.user
    },
    onSuccess: (updatedUser) => {
      // Invalidate and refetch user profile query
      queryClient.invalidateQueries({ queryKey: ['user-profile', userId] })

      // Invalidate current user query if updating own profile
      queryClient.invalidateQueries({ queryKey: ['current-user'] })

      // Invalidate search queries as user data changed
      queryClient.invalidateQueries({ queryKey: ['search-users'] })
      queryClient.invalidateQueries({ queryKey: ['all-users'] })

      // Optionally update the cache directly for instant UI update
      queryClient.setQueryData(['user-profile', userId], updatedUser)
    }
  })

  return {
    action: mutation.mutate,
    isLoading: mutation.isPending,
    error: mutation.error,
    isSuccess: mutation.isSuccess,
    data: mutation.data
  }
}
