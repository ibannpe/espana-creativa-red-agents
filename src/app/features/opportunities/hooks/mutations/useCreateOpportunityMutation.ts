// ABOUTME: React Query mutation hook for creating opportunities
// ABOUTME: Invalidates opportunities queries on success

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { opportunityService } from '../../data/services/opportunity.service'
import type { CreateOpportunityRequest, Opportunity } from '../../data/schemas/opportunity.schema'

/**
 * Mutation hook to create a new opportunity
 *
 * IMPORTANT: Backend validates city manager permissions
 * Frontend should only show button if user has permissions
 *
 * Follows project convention: returns { action, isLoading, error, isSuccess, data }
 *
 * @returns Mutation object with standardized interface
 */
export const useCreateOpportunityMutation = () => {
  const queryClient = useQueryClient()

  const mutation = useMutation<Opportunity, Error, CreateOpportunityRequest>({
    mutationFn: async (data: CreateOpportunityRequest) => {
      // Backend validará que user es gestor de data.city_id
      const response = await opportunityService.createOpportunity(data)
      return response.opportunity
    },
    onSuccess: (newOpportunity) => {
      // Invalidar queries de la ciudad específica
      queryClient.invalidateQueries({
        queryKey: ['opportunities', 'by-city', newOpportunity.city_id]
      })

      // También invalidar queries generales
      queryClient.invalidateQueries({ queryKey: ['opportunities'] })
      queryClient.invalidateQueries({ queryKey: ['my-opportunities'] })

      // Invalidar stats de la ciudad (contador)
      queryClient.invalidateQueries({
        queryKey: ['cities']
      })
    }
  })

  return {
    action: mutation.mutateAsync,  // Usar mutateAsync para poder await
    isLoading: mutation.isPending,
    error: mutation.error,
    isSuccess: mutation.isSuccess,
    data: mutation.data
  }
}
