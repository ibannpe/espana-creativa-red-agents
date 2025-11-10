// ABOUTME: Hook de mutación para inscribirse en un programa
// ABOUTME: Invalida el caché de programas tras inscribirse

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { programService } from '../../data/services/program.service'

export function useEnrollInProgramMutation() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (programId: string) => programService.enrollInProgram(programId),
    onSuccess: () => {
      // Invalidate and refetch in parallel, not sequentially
      queryClient.invalidateQueries({ queryKey: ['programs'] })
      queryClient.invalidateQueries({ queryKey: ['my-programs'] })
      queryClient.invalidateQueries({ queryKey: ['enrollments'] })
    },
    onError: (error) => {
      console.error('[useEnrollInProgramMutation] Error enrolling:', error)
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
