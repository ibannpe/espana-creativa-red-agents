// ABOUTME: Hook de mutación para actualizar programas
// ABOUTME: Invalida el caché de programas tras actualizar

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { projectService } from '../../data/services/project.service'
import type { UpdateProjectRequest } from '../../data/schemas/project.schema'

export function useUpdateProjectMutation() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProjectRequest }) =>
      projectService.updateProject(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programs'] })
      queryClient.invalidateQueries({ queryKey: ['project'] })
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
