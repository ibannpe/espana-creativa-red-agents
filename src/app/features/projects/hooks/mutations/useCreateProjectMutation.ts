// ABOUTME: Hook de mutación para crear programas
// ABOUTME: Invalida el caché de programas tras crear uno nuevo

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { projectService } from '../../data/services/project.service'
import type { CreateProjectRequest } from '../../data/schemas/project.schema'

export function useCreateProjectMutation() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (data: CreateProjectRequest) => projectService.createProject(data),
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
