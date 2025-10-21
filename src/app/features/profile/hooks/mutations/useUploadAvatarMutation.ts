// ABOUTME: React Query mutation hook for uploading user avatar image
// ABOUTME: Handles file upload and invalidates profile queries on success

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { profileService } from '../../data/services/profile.service'
import type { UploadAvatarResponse } from '../../data/schemas/profile.schema'

/**
 * Mutation hook to upload user avatar
 *
 * Follows project convention: returns { action, isLoading, error, isSuccess, data }
 *
 * @param userId - ID of the user whose avatar to upload
 * @returns Mutation object with standardized interface
 */
export const useUploadAvatarMutation = (userId: string) => {
  const queryClient = useQueryClient()

  const mutation = useMutation<UploadAvatarResponse, Error, File>({
    mutationFn: async (file: File) => {
      return await profileService.uploadAvatar(userId, file)
    },
    onSuccess: (response) => {
      // Invalidate and refetch user profile query to get updated avatar
      queryClient.invalidateQueries({ queryKey: ['user-profile', userId] })

      // Invalidate current user query if uploading own avatar
      queryClient.invalidateQueries({ queryKey: ['current-user'] })

      // Invalidate search queries as user avatar changed
      queryClient.invalidateQueries({ queryKey: ['search-users'] })
      queryClient.invalidateQueries({ queryKey: ['all-users'] })
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
