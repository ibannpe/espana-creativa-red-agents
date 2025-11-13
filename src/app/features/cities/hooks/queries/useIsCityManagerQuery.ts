// ABOUTME: React Query hook to check if user is city manager
// ABOUTME: Returns manager status and list of managed cities

import { useQuery } from '@tanstack/react-query'
import { cityService } from '../../data/services/city.service'
import { useAuthContext } from '@/app/features/auth/hooks/useAuthContext'

export interface ManagedCity {
  id: number
  name: string
  slug: string
}

export interface CityManagerInfo {
  isCityManager: boolean
  managedCities: ManagedCity[]
}

/**
 * Query hook to check if current user is a city manager
 * Returns list of cities they can manage
 *
 * @returns Query result with manager status and cities
 */
export const useIsCityManagerQuery = () => {
  const { isAuthenticated, user } = useAuthContext()

  return useQuery<CityManagerInfo, Error>({
    queryKey: ['city-manager', user?.id], // Invalidar si user cambia
    queryFn: async () => {
      return await cityService.getIsCityManager()
    },
    enabled: isAuthenticated, // Solo si está autenticado
    staleTime: 3 * 60 * 1000, // 3 minutos
    gcTime: 5 * 60 * 1000,
    // Este dato es crítico para permisos UI
    refetchOnWindowFocus: true // SI refetch para mantener permisos actualizados
  })
}
