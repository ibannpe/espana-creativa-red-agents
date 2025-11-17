// ABOUTME: React Query mutation hook for updating an existing city
// ABOUTME: Invalidates cities query cache on success

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { cityService } from '../../data/services/city.service'
import type { UpdateCityRequest } from '../../data/schemas/city.schema'

export interface UpdateCityMutationVariables {
  cityId: number
  data: UpdateCityRequest
}

export function useUpdateCityMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ cityId, data }: UpdateCityMutationVariables) =>
      cityService.updateCity(cityId, data),
    onSuccess: () => {
      // Invalidate and refetch cities list
      queryClient.invalidateQueries({ queryKey: ['cities'] })
    }
  })
}
