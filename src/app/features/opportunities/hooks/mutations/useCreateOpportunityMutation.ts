// ABOUTME: React Query mutation hook for creating opportunities
// ABOUTME: Invalidates opportunities queries on success

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { opportunityService } from '../../data/services/opportunity.service'
import type { CreateOpportunityRequest, Opportunity } from '../../data/schemas/opportunity.schema'

/**
 * Mutation hook to create a new opportunity
 *
 * Follows project convention: returns { action, isLoading, error, isSuccess, data }
 *
 * @returns Mutation object with standardized interface
 */
export const useCreateOpportunityMutation = () => {
  const queryClient = useQueryClient()

  const mutation = useMutation<Opportunity, Error, CreateOpportunityRequest>({
    mutationFn: async (data: CreateOpportunityRequest) => {
      const response = await opportunityService.createOpportunity(data)
      return response.opportunity
    },
    onSuccess: () => {
      // Invalidate opportunities queries
      queryClient.invalidateQueries({ queryKey: ['opportunities'] })
      queryClient.invalidateQueries({ queryKey: ['my-opportunities'] })
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
