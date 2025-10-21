// ABOUTME: React Query hook for fetching a single opportunity by ID
// ABOUTME: Returns opportunity details with creator information

import { useQuery } from '@tanstack/react-query'
import { opportunityService } from '../../data/services/opportunity.service'
import type { OpportunityWithCreator } from '../../data/schemas/opportunity.schema'

/**
 * Query hook to fetch a single opportunity by ID
 *
 * @param opportunityId - ID of the opportunity to fetch
 * @param options - React Query options
 * @returns Query result with opportunity data
 */
export const useOpportunityQuery = (
  opportunityId: string | undefined,
  options?: {
    enabled?: boolean
  }
) => {
  return useQuery<OpportunityWithCreator, Error>({
    queryKey: ['opportunity', opportunityId],
    queryFn: async () => {
      if (!opportunityId) {
        throw new Error('Opportunity ID is required')
      }
      const response = await opportunityService.getOpportunity(opportunityId)
      return response.opportunity
    },
    enabled: options?.enabled !== false && !!opportunityId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000 // 10 minutes
  })
}
