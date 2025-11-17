// ABOUTME: React Query mutation hook for deleting a city
// ABOUTME: Invalidates cities query cache on success

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { cityService } from '../../data/services/city.service'

export function useDeleteCityMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (cityId: number) => cityService.deleteCity(cityId),
    onSuccess: () => {
      // Invalidate and refetch cities list
      queryClient.invalidateQueries({ queryKey: ['cities'] })
    }
  })
}
