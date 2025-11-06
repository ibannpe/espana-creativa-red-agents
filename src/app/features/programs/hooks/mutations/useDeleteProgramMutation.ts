// ABOUTME: Hook de mutación para eliminar programas
// ABOUTME: Invalida el caché de programas tras eliminar

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { programService } from '../../data/services/program.service'

export function useDeleteProgramMutation() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (id: string) => programService.deleteProgram(id),
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
