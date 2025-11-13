// ABOUTME: React Query hook for fetching cities managed by current user
// ABOUTME: Used in CreateOpportunity dialog for city selection

import { useIsCityManagerQuery } from './useIsCityManagerQuery'
import type { ManagedCity } from './useIsCityManagerQuery'

/**
 * Query hook to fetch only the cities managed by current user
 * Convenience wrapper around useIsCityManagerQuery
 *
 * @returns Query result with array of managed cities
 */
export const useMyCitiesQuery = () => {
  const {
    data: cityManagerInfo,
    isLoading,
    error
  } = useIsCityManagerQuery()

  return {
    data: cityManagerInfo?.managedCities || [] as ManagedCity[],
    isLoading,
    error,
    isCityManager: cityManagerInfo?.isCityManager || false
  }
}
