// ABOUTME: React Query mutation for user sign up
// ABOUTME: Returns standardized {action, isLoading, error, isSuccess} following project conventions

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { authService } from '../../data/services/auth.service'
import { SignUpRequest } from '../../data/schemas/auth.schema'

export function useSignUpMutation() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (data: SignUpRequest) => authService.signUp(data),
    onSuccess: (response) => {
      // Update current user query cache
      queryClient.setQueryData(['auth', 'currentUser'], response.user)
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
