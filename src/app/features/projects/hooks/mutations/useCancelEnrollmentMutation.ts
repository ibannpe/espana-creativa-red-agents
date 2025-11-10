// ABOUTME: Hook de mutación para cancelar inscripción en un programa
// ABOUTME: Invalida el caché de programas y enrollments tras cancelar

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { projectService } from '../../data/services/project.service'

export function useCancelEnrollmentMutation() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (enrollmentId: string) => projectService.cancelEnrollment(enrollmentId),
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
      console.error('[useCancelEnrollmentMutation] Error canceling:', error)
    }
  })

  return {
    cancel: mutation.mutate,
    cancelAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
    isSuccess: mutation.isSuccess,
    reset: mutation.reset
  }
}
