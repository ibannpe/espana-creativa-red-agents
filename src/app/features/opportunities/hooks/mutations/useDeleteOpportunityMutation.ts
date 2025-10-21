// ABOUTME: React Query mutation hook for deleting opportunities
// ABOUTME: Invalidates all opportunity queries on success

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { opportunityService } from '../../data/services/opportunity.service'

/**
 * Mutation hook to delete an opportunity
 *
 * Follows project convention: returns { action, isLoading, error, isSuccess, data }
 *
 * @returns Mutation object with standardized interface
 */
export const useDeleteOpportunityMutation = () => {
  const queryClient = useQueryClient()

  const mutation = useMutation<void, Error, string>({
    mutationFn: async (opportunityId: string) => {
      await opportunityService.deleteOpportunity(opportunityId)
    },
    onSuccess: () => {
      // Invalidate all opportunity-related queries
      queryClient.invalidateQueries({ queryKey: ['opportunities'] })
      queryClient.invalidateQueries({ queryKey: ['my-opportunities'] })
      queryClient.invalidateQueries({ queryKey: ['opportunity'] })
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
