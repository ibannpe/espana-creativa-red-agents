// ABOUTME: Hook de mutación para crear programas
// ABOUTME: Invalida el caché de programas tras crear uno nuevo

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { programService } from '../../data/services/program.service'
import type { CreateProgramRequest } from '../../data/schemas/program.schema'

export function useCreateProgramMutation() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (data: CreateProgramRequest) => programService.createProgram(data),
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
