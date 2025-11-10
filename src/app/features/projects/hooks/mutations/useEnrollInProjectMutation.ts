// ABOUTME: Hook de mutación para inscribirse en un programa
// ABOUTME: Invalida el caché de programas tras inscribirse

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { projectService } from '../../data/services/project.service'

export function useEnrollInProjectMutation() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (programId: string) => projectService.enrollInProject(programId),
    onSuccess: async () => {
      // Invalidate and refetch, wait for completion to ensure UI updates
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['programs'] }),
        queryClient.invalidateQueries({ queryKey: ['my-programs'] }),
        queryClient.invalidateQueries({ queryKey: ['enrollments'] })
      ])
      // Force immediate refetch
      await queryClient.refetchQueries({ queryKey: ['my-programs'] })
    },
    onError: (error) => {
      console.error('[useEnrollInProjectMutation] Error enrolling:', error)
    }
  })

  return {
    enroll: mutation.mutate,
    enrollAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
    isSuccess: mutation.isSuccess,
    reset: mutation.reset
  }
}
