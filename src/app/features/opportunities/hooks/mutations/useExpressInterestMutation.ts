// ABOUTME: React Query mutation hook for expressing interest in opportunities
// ABOUTME: Invalidates opportunity queries on success

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { opportunityInterestService } from '../../data/services/opportunity-interest.service'
import type { ExpressInterestRequest, OpportunityInterest } from '../../data/schemas/opportunity-interest.schema'

/**
 * Mutation hook to express interest in an opportunity
 *
 * Backend handles validation:
 * - User cannot express interest in their own opportunity
 * - User cannot express interest twice
 * - Opportunity must be open
 * - Sends email notification to opportunity creator
 *
 * Follows project convention: returns { action, isLoading, error, isSuccess, data }
 *
 * @returns Mutation object with standardized interface
 */
export const useExpressInterestMutation = () => {
  const queryClient = useQueryClient()

  const mutation = useMutation<OpportunityInterest, Error, ExpressInterestRequest>({
    mutationFn: async (data: ExpressInterestRequest) => {
      const response = await opportunityInterestService.expressInterest(data)
      return response.interest
    },
    onSuccess: (interest) => {
      // Invalidar la query de la oportunidad específica
      queryClient.invalidateQueries({
        queryKey: ['opportunity', interest.opportunityId]
      })

      // Invalidar queries de oportunidades
      queryClient.invalidateQueries({
        queryKey: ['opportunities']
      })

      // Invalidar mis intereses
      queryClient.invalidateQueries({
        queryKey: ['my-interests']
      })
    }
  })

  return {
    action: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error,
    isSuccess: mutation.isSuccess,
    data: mutation.data
  }
}
