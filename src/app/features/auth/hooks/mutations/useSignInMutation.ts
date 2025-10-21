// ABOUTME: React Query mutation for user sign in
// ABOUTME: Returns standardized {action, isLoading, error, isSuccess} following project conventions

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { authService } from '../../data/services/auth.service'
import { SignInRequest } from '../../data/schemas/auth.schema'

export function useSignInMutation() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (data: SignInRequest) => authService.signIn(data),
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
