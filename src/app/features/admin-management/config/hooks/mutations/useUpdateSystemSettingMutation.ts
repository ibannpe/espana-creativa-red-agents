// ABOUTME: React Query mutation hook for updating a system setting
// ABOUTME: Handles setting updates with automatic cache invalidation

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { systemSettingsService } from '../../data/services/config.service'
import type { UpdateSystemSettingRequest } from '../../data/schemas/config.schema'
import { toast } from 'sonner'

interface UpdateSystemSettingVariables {
  key: string
  data: UpdateSystemSettingRequest
}

export const useUpdateSystemSettingMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ key, data }: UpdateSystemSettingVariables) =>
      systemSettingsService.update(key, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'config', 'settings'] })
      toast.success('Configuración actualizada exitosamente')
    },
    onError: (error: any) => {
      console.error('Error updating setting:', error)
      toast.error(error.response?.data?.error || 'Error al actualizar configuración')
    }
  })
}
