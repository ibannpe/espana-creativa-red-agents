// ABOUTME: React Query mutation hook for updating an existing role
// ABOUTME: Handles role updates with automatic cache invalidation

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { rolesService } from '../../data/services/config.service'
import type { UpdateRoleRequest } from '../../data/schemas/config.schema'
import { toast } from 'sonner'

interface UpdateRoleVariables {
  id: string
  data: UpdateRoleRequest
}

export const useUpdateRoleMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: UpdateRoleVariables) => rolesService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'config', 'roles'] })
      toast.success('Rol actualizado exitosamente')
    },
    onError: (error: any) => {
      console.error('Error updating role:', error)
      toast.error(error.response?.data?.error || 'Error al actualizar rol')
    }
  })
}
