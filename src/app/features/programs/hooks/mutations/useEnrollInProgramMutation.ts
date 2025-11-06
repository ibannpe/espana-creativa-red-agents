// ABOUTME: Hook de mutación para inscribirse en un programa
// ABOUTME: Invalida el caché de programas tras inscribirse

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { programService } from '../../data/services/program.service'

export function useEnrollInProgramMutation() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (programId: string) => programService.enrollInProgram(programId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programs'] })
      queryClient.invalidateQueries({ queryKey: ['enrollments'] })
    }
  })

  return {
    action: mutation.mutate,
    actionAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
    isSuccess: mutation.isSuccess
  }
}
