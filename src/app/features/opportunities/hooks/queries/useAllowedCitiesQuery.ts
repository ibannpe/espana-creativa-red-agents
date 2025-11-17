// ABOUTME: React Query hook to fetch cities where user can create opportunities
// ABOUTME: Uses the /api/opportunities/allowed-cities endpoint with territorial role validation

import { useQuery } from '@tanstack/react-query'
import { axiosInstance } from '@/lib/axios'
import type { City } from '@/app/features/cities/data/schemas/city.schema'

/**
 * Fetch allowed cities for current user from API
 */
const fetchAllowedCities = async (): Promise<City[]> => {
  const response = await axiosInstance.get<{ cities: City[] }>('/opportunities/allowed-cities')
  return response.data.cities
}

/**
 * Hook to get cities where the current user can create opportunities
 *
 * Returns:
 * - Empty array for non-authenticated users
 * - All cities for admins
 * - Only cities matching user's territorial roles for other users
 */
export const useAllowedCitiesQuery = () => {
  return useQuery({
    queryKey: ['opportunities', 'allowed-cities'],
    queryFn: fetchAllowedCities,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2
  })
}
