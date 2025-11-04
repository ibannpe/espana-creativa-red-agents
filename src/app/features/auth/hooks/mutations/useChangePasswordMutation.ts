// ABOUTME: React Query mutation for changing user password
// ABOUTME: Returns standardized {action, isLoading, error, isSuccess} following project conventions

import { useMutation } from '@tanstack/react-query'
import { authService } from '../../data/services/auth.service'
import { ChangePasswordRequest } from '../../data/schemas/auth.schema'

export function useChangePasswordMutation() {
  const mutation = useMutation({
    mutationFn: (data: ChangePasswordRequest) => authService.changePassword(data)
  })

  return {
    action: mutation.mutate,
    isLoading: mutation.isPending,
    error: mutation.error,
    isSuccess: mutation.isSuccess,
    data: mutation.data
  }
}
