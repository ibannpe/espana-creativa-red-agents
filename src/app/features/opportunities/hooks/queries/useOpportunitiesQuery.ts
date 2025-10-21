// ABOUTME: React Query hook for fetching opportunities with optional filters
// ABOUTME: Returns list of opportunities with creator information

import { useQuery } from '@tanstack/react-query'
import { opportunityService } from '../../data/services/opportunity.service'
import type { OpportunityWithCreator, FilterOpportunitiesRequest } from '../../data/schemas/opportunity.schema'

/**
 * Query hook to fetch opportunities with optional filters
 *
 * @param filters - Optional filters (type, status, skills, remote, search)
 * @param options - React Query options
 * @returns Query result with array of opportunities and total count
 */
export const useOpportunitiesQuery = (
  filters?: FilterOpportunitiesRequest,
  options?: {
    enabled?: boolean
  }
) => {
  // Create stable query key from filters
  const queryKey = ['opportunities', filters || {}]

  return useQuery<{ opportunities: OpportunityWithCreator[]; total: number }, Error>({
    queryKey,
    queryFn: async () => {
      return await opportunityService.getOpportunities(filters)
    },
    enabled: options?.enabled !== false,
    staleTime: 2 * 60 * 1000, // 2 minutes (opportunities change moderately)
    gcTime: 5 * 60 * 1000 // 5 minutes
  })
}
