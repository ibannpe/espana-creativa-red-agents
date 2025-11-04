// ABOUTME: React Query mutation for requesting password reset email
// ABOUTME: Returns standardized {action, isLoading, error, isSuccess} following project conventions

import { useMutation } from '@tanstack/react-query'
import { authService } from '../../data/services/auth.service'
import { ForgotPasswordRequest } from '../../data/schemas/auth.schema'

export function useForgotPasswordMutation() {
  const mutation = useMutation({
    mutationFn: (data: ForgotPasswordRequest) => authService.forgotPassword(data)
  })

  return {
    action: mutation.mutate,
    isLoading: mutation.isPending,
    error: mutation.error,
    isSuccess: mutation.isSuccess,
    data: mutation.data
  }
}
