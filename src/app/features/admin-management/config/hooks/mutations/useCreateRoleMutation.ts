// ABOUTME: React Query mutation hook for creating a new role
// ABOUTME: Handles role creation with automatic cache invalidation

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { rolesService } from '../../data/services/config.service'
import type { CreateRoleRequest } from '../../data/schemas/config.schema'
import { toast } from 'sonner'

export const useCreateRoleMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateRoleRequest) => rolesService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'config', 'roles'] })
      toast.success('Rol creado exitosamente')
    },
    onError: (error: any) => {
      console.error('Error creating role:', error)
      toast.error(error.response?.data?.error || 'Error al crear rol')
    }
  })
}
