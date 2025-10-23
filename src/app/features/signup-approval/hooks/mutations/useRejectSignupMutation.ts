// ABOUTME: React Query mutation for rejecting signup request
// ABOUTME: Returns standardized {action, isLoading, error, isSuccess} following project conventions

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { signupApprovalService } from '../../data/services/signup-approval.service'

interface RejectSignupParams {
  token: string
  adminId?: string
}

export function useRejectSignupMutation() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: ({ token, adminId }: RejectSignupParams) =>
      signupApprovalService.rejectSignup(token, adminId),
    onSuccess: () => {
      // Invalidate pending signups list and count
      queryClient.invalidateQueries({ queryKey: ['signupApproval', 'pendingSignups'] })
      queryClient.invalidateQueries({ queryKey: ['signupApproval', 'pendingCount'] })
    }
  })

  return {
    action: mutation.mutate,
    mutateAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error,
    isSuccess: mutation.isSuccess,
    data: mutation.data
  }
}
