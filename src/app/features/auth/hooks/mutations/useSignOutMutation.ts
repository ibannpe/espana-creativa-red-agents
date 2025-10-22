// ABOUTME: React Query mutation for user sign out
// ABOUTME: Clears auth cache, invalidates queries, and redirects to auth page on successful sign out

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { authService } from '../../data/services/auth.service'

export function useSignOutMutation() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: () => authService.signOut(),
    onSuccess: () => {
      // Clear current user from cache
      queryClient.setQueryData(['auth', 'currentUser'], null)
      // Invalidate all queries to force refetch
      queryClient.invalidateQueries()
      // Redirect to auth page after successful logout
      // Using window.location instead of navigate() because this mutation
      // is called from AuthProvider which is outside BrowserRouter
      window.location.href = '/auth'
    }
  })

  return {
    action: mutation.mutate,
    isLoading: mutation.isPending,
    error: mutation.error,
    isSuccess: mutation.isSuccess
  }
}
