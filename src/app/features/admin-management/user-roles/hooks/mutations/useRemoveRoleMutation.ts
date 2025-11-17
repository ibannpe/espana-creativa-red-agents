// ABOUTME: React Query mutation hook for removing roles from users
// ABOUTME: Invalidates user and audit log queries on success

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { userRoleService } from '../../data/services/user-role.service'
import { RemoveRoleRequest } from '../../data/schemas/user-role.schema'
import { toast } from 'sonner'

export const useRemoveRoleMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: RemoveRoleRequest) => userRoleService.removeRole(data),
    onSuccess: (_, variables) => {
      // Invalidate audit log
      queryClient.invalidateQueries({ queryKey: ['audit-log', 'roles'] })
      // Invalidate user list to refresh roles
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
      // Invalidate specific user if needed
      queryClient.invalidateQueries({ queryKey: ['users', variables.userId] })

      toast.success('Rol removido correctamente')
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || 'Error al remover el rol'
      toast.error(message)
    }
  })
}
