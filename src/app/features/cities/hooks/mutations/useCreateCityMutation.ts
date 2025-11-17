// ABOUTME: React Query mutation hook for creating a new city
// ABOUTME: Invalidates cities query cache on success

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { cityService } from '../../data/services/city.service'
import type { CreateCityRequest } from '../../data/schemas/city.schema'

export function useCreateCityMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateCityRequest) => cityService.createCity(data),
    onSuccess: () => {
      // Invalidate and refetch cities list
      queryClient.invalidateQueries({ queryKey: ['cities'] })
    }
  })
}
