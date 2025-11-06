// ABOUTME: React Query mutation hook for updating opportunities
// ABOUTME: Invalidates opportunity queries and updates cache on success

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { opportunityService } from '../../data/services/opportunity.service'
import type { UpdateOpportunityRequest, Opportunity } from '../../data/schemas/opportunity.schema'

interface UpdateOpportunityParams {
  id: string
  data: UpdateOpportunityRequest
}

/**
 * Mutation hook to update an existing opportunity
 *
 * Follows project convention: returns { action, isLoading, error, isSuccess, data }
 *
 * @returns Mutation object with standardized interface
 */
export const useUpdateOpportunityMutation = () => {
  const queryClient = useQueryClient()

  const mutation = useMutation<Opportunity, Error, UpdateOpportunityParams>({
    mutationFn: async ({ id, data }: UpdateOpportunityParams) => {
      const response = await opportunityService.updateOpportunity(id, data)
      return response.opportunity
    },
    onSuccess: (updatedOpportunity, { id }) => {
      // Invalidate opportunities lists
      queryClient.invalidateQueries({ queryKey: ['opportunities'] })
      queryClient.invalidateQueries({ queryKey: ['my-opportunities'] })

      // Invalidate specific opportunity cache to refetch with complete data (including creator)
      queryClient.invalidateQueries({ queryKey: ['opportunity', id] })
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
