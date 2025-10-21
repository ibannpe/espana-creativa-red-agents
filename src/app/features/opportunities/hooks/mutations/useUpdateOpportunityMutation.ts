// ABOUTME: React Query mutation hook for updating opportunities
// ABOUTME: Invalidates opportunity queries and updates cache on success

import { useMutation, useQueryClient } from '@tantml:react-query'
import { opportunityService } from '../../data/services/opportunity.service'
import type { UpdateOpportunityRequest, Opportunity } from '../../data/schemas/opportunity.schema'

/**
 * Mutation hook to update an existing opportunity
 *
 * Follows project convention: returns { action, isLoading, error, isSuccess, data }
 *
 * @param opportunityId - ID of the opportunity to update
 * @returns Mutation object with standardized interface
 */
export const useUpdateOpportunityMutation = (opportunityId: string) => {
  const queryClient = useQueryClient()

  const mutation = useMutation<Opportunity, Error, UpdateOpportunityRequest>({
    mutationFn: async (data: UpdateOpportunityRequest) => {
      const response = await opportunityService.updateOpportunity(opportunityId, data)
      return response.opportunity
    },
    onSuccess: (updatedOpportunity) => {
      // Invalidate opportunities lists
      queryClient.invalidateQueries({ queryKey: ['opportunities'] })
      queryClient.invalidateQueries({ queryKey: ['my-opportunities'] })

      // Update specific opportunity cache
      queryClient.setQueryData(['opportunity', opportunityId], updatedOpportunity)
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
