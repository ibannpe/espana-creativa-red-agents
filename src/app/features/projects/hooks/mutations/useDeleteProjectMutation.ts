// ABOUTME: Hook de mutación para eliminar programas
// ABOUTME: Invalida el caché de programas tras eliminar

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { projectService } from '../../data/services/project.service'

export function useDeleteProjectMutation() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (id: string) => projectService.deleteProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programs'] })
    }
  })

  return {
    action: mutation.mutate,
    actionAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error
  }
}
