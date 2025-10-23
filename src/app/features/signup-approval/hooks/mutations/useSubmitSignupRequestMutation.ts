// ABOUTME: React Query mutation for submitting signup request
// ABOUTME: Returns standardized {action, isLoading, error, isSuccess} following project conventions

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { signupApprovalService } from '../../data/services/signup-approval.service'
import { SubmitSignupRequest } from '../../data/schemas/signup-approval.schema'

export function useSubmitSignupRequestMutation() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (data: SubmitSignupRequest) => signupApprovalService.submitRequest(data),
    onSuccess: () => {
      // Invalidate pending count to reflect new submission
      queryClient.invalidateQueries({ queryKey: ['signupApproval', 'pendingCount'] })
      queryClient.invalidateQueries({ queryKey: ['signupApproval', 'pendingSignups'] })
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
