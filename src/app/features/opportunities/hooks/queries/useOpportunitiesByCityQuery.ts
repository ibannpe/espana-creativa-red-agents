// ABOUTME: React Query hook for fetching opportunities filtered by city
// ABOUTME: Used in CityOpportunitiesPage to show city-specific opportunities

import { useQuery } from '@tanstack/react-query'
import { opportunityService } from '../../data/services/opportunity.service'
import type {
  OpportunityWithCreator,
  FilterOpportunitiesRequest
} from '../../data/schemas/opportunity.schema'

/**
 * Query hook to fetch opportunities for a specific city
 *
 * @param cityId - ID of the city to filter by
 * @param filters - Optional additional filters (type, status, skills)
 * @param options - React Query options
 * @returns Query result with opportunities filtered by city
 */
export const useOpportunitiesByCityQuery = (
  cityId: number,
  filters?: Omit<FilterOpportunitiesRequest, 'city_id'>,
  options?: {
    enabled?: boolean
  }
) => {
  // Query key incluye cityId y filters para cache granular
  const queryKey = ['opportunities', 'by-city', cityId, filters || {}]

  return useQuery<
    { opportunities: OpportunityWithCreator[]; total: number },
    Error
  >({
    queryKey,
    queryFn: async () => {
      return await opportunityService.getOpportunitiesByCity(cityId, filters)
    },
    enabled: options?.enabled !== false && !!cityId,
    staleTime: 2 * 60 * 1000, // 2 minutos
    gcTime: 5 * 60 * 1000
  })
}
