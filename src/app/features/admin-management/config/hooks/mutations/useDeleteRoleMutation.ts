// ABOUTME: React Query mutation hook for deleting a role
// ABOUTME: Handles role deletion with automatic cache invalidation

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { rolesService } from '../../data/services/config.service'
import { toast } from 'sonner'

export const useDeleteRoleMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => rolesService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'config', 'roles'] })
      toast.success('Rol eliminado exitosamente')
    },
    onError: (error: any) => {
      console.error('Error deleting role:', error)
      const errorMessage = error.response?.data?.error || 'Error al eliminar rol'
      toast.error(errorMessage)
    }
  })
}
