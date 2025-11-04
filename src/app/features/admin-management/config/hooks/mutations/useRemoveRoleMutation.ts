// ABOUTME: React Query mutation hook for removing a role from a user
// ABOUTME: Handles role removal with automatic cache invalidation

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { userRolesService } from '../../data/services/config.service'
import { toast } from 'sonner'

interface RemoveRoleVariables {
  userId: string
  roleId: string
}

export const useRemoveRoleMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, roleId }: RemoveRoleVariables) =>
      userRolesService.remove(userId, roleId),
    onSuccess: () => {
      // Invalidate both admin users and roles queries
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'config', 'roles'] })
      toast.success('Rol removido exitosamente')
    },
    onError: (error: any) => {
      console.error('Error removing role:', error)
      const errorMessage = error.response?.data?.error || 'Error al remover rol'
      toast.error(errorMessage)
    }
  })
}
