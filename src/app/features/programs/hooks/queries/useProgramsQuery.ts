// ABOUTME: Hook para obtener programas con React Query
// ABOUTME: Soporte para filtros opcionales y revalidación automática

import { useQuery } from '@tanstack/react-query'
import { programService } from '../../data/services/program.service'
import type { FilterProgramsRequest } from '../../data/schemas/program.schema'

export function useProgramsQuery(filters?: FilterProgramsRequest) {
  return useQuery({
    queryKey: ['programs', filters],
    queryFn: () => programService.getPrograms(filters),
    staleTime: 1000 * 60 * 5 // 5 minutes
  })
}
