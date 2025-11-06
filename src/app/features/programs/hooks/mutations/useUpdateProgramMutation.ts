// ABOUTME: Hook de mutación para actualizar programas
// ABOUTME: Invalida el caché de programas tras actualizar

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { programService } from '../../data/services/program.service'
import type { UpdateProgramRequest } from '../../data/schemas/program.schema'

export function useUpdateProgramMutation() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProgramRequest }) =>
      programService.updateProgram(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programs'] })
      queryClient.invalidateQueries({ queryKey: ['program'] })
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
