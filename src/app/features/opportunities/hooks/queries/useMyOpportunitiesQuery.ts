// ABOUTME: React Query hook for fetching opportunities created by current user
// ABOUTME: Returns list of user's own opportunities

import { useQuery } from '@tanstack/react-query'
import { opportunityService } from '../../data/services/opportunity.service'
import type { OpportunityWithCreator } from '../../data/schemas/opportunity.schema'

/**
 * Query hook to fetch opportunities created by current user
 *
 * @param options - React Query options
 * @returns Query result with array of user's opportunities
 */
export const useMyOpportunitiesQuery = (options?: { enabled?: boolean }) => {
  return useQuery<{ opportunities: OpportunityWithCreator[]; total: number }, Error>({
    queryKey: ['my-opportunities'],
    queryFn: async () => {
      return await opportunityService.getMyOpportunities()
    },
    enabled: options?.enabled !== false,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000 // 5 minutes
  })
}
