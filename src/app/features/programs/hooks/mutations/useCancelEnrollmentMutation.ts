// ABOUTME: Hook de mutación para cancelar inscripción en un programa
// ABOUTME: Invalida el caché de programas y enrollments tras cancelar

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { programService } from '../../data/services/program.service'

export function useCancelEnrollmentMutation() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (enrollmentId: string) => programService.cancelEnrollment(enrollmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programs'] })
      queryClient.invalidateQueries({ queryKey: ['enrollments'] })
    }
  })

  return {
    cancel: mutation.mutate,
    cancelAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
    isSuccess: mutation.isSuccess
  }
}
