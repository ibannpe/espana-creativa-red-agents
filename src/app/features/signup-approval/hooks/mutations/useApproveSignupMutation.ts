// ABOUTME: React Query mutation for approving signup request
// ABOUTME: Returns standardized {action, isLoading, error, isSuccess} following project conventions

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { signupApprovalService } from '../../data/services/signup-approval.service'

interface ApproveSignupParams {
  token: string
  adminId?: string
}

export function useApproveSignupMutation() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: ({ token, adminId }: ApproveSignupParams) =>
      signupApprovalService.approveSignup(token, adminId),
    onSuccess: () => {
      // Invalidate pending signups list and count
      queryClient.invalidateQueries({ queryKey: ['signupApproval', 'pendingSignups'] })
      queryClient.invalidateQueries({ queryKey: ['signupApproval', 'pendingCount'] })
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
