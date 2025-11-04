// ABOUTME: React Query mutation for resetting password with token
// ABOUTME: Returns standardized {action, isLoading, error, isSuccess} following project conventions

import { useMutation } from '@tanstack/react-query'
import { authService } from '../../data/services/auth.service'
import { ResetPasswordRequest } from '../../data/schemas/auth.schema'

export function useResetPasswordMutation() {
  const mutation = useMutation({
    mutationFn: (data: ResetPasswordRequest) => authService.resetPassword(data)
  })

  return {
    action: mutation.mutate,
    isLoading: mutation.isPending,
    error: mutation.error,
    isSuccess: mutation.isSuccess,
    data: mutation.data
  }
}
