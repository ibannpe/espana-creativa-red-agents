// ABOUTME: React Query hook for fetching single city by slug
// ABOUTME: Used in city opportunities page for city header

import { useQuery } from '@tanstack/react-query'
import { cityService } from '../../data/services/city.service'
import type { CityWithStats } from '../../data/schemas/city.schema'

/**
 * Query hook to fetch a city by slug with stats
 *
 * @param slug - City slug from URL params
 * @param options - React Query options
 * @returns Query result with city data
 */
export const useCityBySlugQuery = (
  slug: string,
  options?: {
    enabled?: boolean
  }
) => {
  return useQuery<CityWithStats, Error>({
    queryKey: ['cities', slug], // Include slug in key for caching
    queryFn: async () => {
      const response = await cityService.getCityBySlug(slug)
      return response.city
    },
    enabled: options?.enabled !== false && !!slug, // Solo si hay slug
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 1, // Solo 1 retry (404 es común si slug no existe)
    refetchOnWindowFocus: false
  })
}
