// ABOUTME: Hook para obtener un programa específico por ID
// ABOUTME: Usa React Query para caching y revalidación

import { useQuery } from '@tanstack/react-query'
import { programService } from '../../data/services/program.service'

export function useProgramQuery(id: string | undefined) {
  return useQuery({
    queryKey: ['program', id],
    queryFn: () => programService.getProgram(id!),
    enabled: !!id,
    staleTime: 1000 * 60 * 5 // 5 minutes
  })
}
