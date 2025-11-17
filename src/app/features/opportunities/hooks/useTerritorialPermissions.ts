// ABOUTME: Hook for checking territorial permissions based on user roles
// ABOUTME: Uses the backend endpoint to get cities where user can create opportunities

import { useMemo } from 'react'
import { useAllowedCitiesQuery } from './queries/useAllowedCitiesQuery'

/**
 * Hook to get cities where user can create opportunities
 *
 * Rules (enforced by backend):
 * - Admins can create in any city
 * - Users with a territorial role (role name = city name) can create in that city
 *
 * @returns Permission flags and allowed city IDs
 */
export const useTerritorialPermissions = () => {
  const { data: allowedCities, isLoading } = useAllowedCitiesQuery()

  const allowedCityIds = useMemo(() => {
    return allowedCities?.map(city => city.id) || []
  }, [allowedCities])

  const canCreateInCity = (cityId: number): boolean => {
    return allowedCityIds.includes(cityId)
  }

  const canCreateInAnyCity = allowedCityIds.length > 0

  return {
    allowedCityIds,
    allowedCities: allowedCities || [],
    canCreateInCity,
    canCreateInAnyCity,
    isLoading
  }
}
