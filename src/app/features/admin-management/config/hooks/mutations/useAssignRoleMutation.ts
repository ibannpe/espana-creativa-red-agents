// ABOUTME: React Query mutation hook for assigning a role to a user
// ABOUTME: Handles role assignment with automatic cache invalidation

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { userRolesService } from '../../data/services/config.service'
import { toast } from 'sonner'

interface AssignRoleVariables {
  userId: string
  roleId: string
}

export const useAssignRoleMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, roleId }: AssignRoleVariables) =>
      userRolesService.assign(userId, roleId),
    onSuccess: () => {
      // Invalidate both admin users and roles queries
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'config', 'roles'] })
      toast.success('Rol asignado exitosamente')
    },
    onError: (error: any) => {
      console.error('Error assigning role:', error)
      toast.error(error.response?.data?.error || 'Error al asignar rol')
    }
  })
}
