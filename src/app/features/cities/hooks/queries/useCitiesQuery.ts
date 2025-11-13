// ABOUTME: React Query hook for fetching all cities with stats
// ABOUTME: Returns list of cities with opportunity counts

import { useQuery } from '@tanstack/react-query'
import { cityService } from '../../data/services/city.service'
import type { CityWithStats } from '../../data/schemas/city.schema'

/**
 * Query hook to fetch all active cities ordered by display_order
 *
 * @returns Query result with array of cities including stats
 */
export const useCitiesQuery = () => {
  return useQuery<CityWithStats[], Error>({
    queryKey: ['cities'], // Simple key - no filters
    queryFn: async () => {
      const response = await cityService.getCities()
      return response.cities
    },
    staleTime: 5 * 60 * 1000, // 5 minutos - ciudades no cambian frecuentemente
    gcTime: 10 * 60 * 1000,   // 10 minutos
    refetchOnWindowFocus: false // No refetch en focus (datos estables)
  })
}
