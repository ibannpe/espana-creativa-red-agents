// ABOUTME: Business hook for city management permissions
// ABOUTME: Centralizes permission logic for city-related actions

import { useMemo } from 'react'
import { useUserRoles, ROLE_IDS } from '@/app/features/auth/hooks/useUserRoles'
import { useIsCityManagerQuery } from './queries/useIsCityManagerQuery'

/**
 * Hook to check city management permissions
 *
 * Combines admin role check with city manager status
 *
 * @param cityId - Optional city ID to check specific permissions
 * @returns Permission flags and managed cities list
 */
export const useCityPermissions = (cityId?: number) => {
  const { isAdmin } = useUserRoles()
  const { data: cityManagerInfo, isLoading } = useIsCityManagerQuery()

  // Memoize permissions to avoid recalculation
  const permissions = useMemo(() => {
    if (isLoading) {
      return {
        canManageAnyCity: false,
        canManageCity: false,
        managedCities: [],
        isLoading: true
      }
    }

    const isCityManager = cityManagerInfo?.isCityManager || false
    const managedCities = cityManagerInfo?.managedCities || []

    // Admin puede gestionar cualquier ciudad
    if (isAdmin) {
      return {
        canManageAnyCity: true,
        canManageCity: true,
        managedCities: [], // Admins no están en lista de gestores específicos
        isLoading: false
      }
    }

    // City manager solo puede gestionar sus ciudades asignadas
    const canManageSpecificCity = cityId
      ? managedCities.some(city => city.id === cityId)
      : false

    return {
      canManageAnyCity: isCityManager,
      canManageCity: cityId ? canManageSpecificCity : isCityManager,
      managedCities,
      isLoading: false
    }
  }, [isAdmin, cityManagerInfo, cityId, isLoading])

  return permissions
}
