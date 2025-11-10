// ABOUTME: Hook para obtener proyectos con React Query
// ABOUTME: Soporte para filtros opcionales y revalidación automática

import { useQuery } from '@tanstack/react-query'
import { projectService } from '../../data/services/project.service'
import type { FilterProjectsRequest } from '../../data/schemas/project.schema'

export function useProjectsQuery(filters?: FilterProjectsRequest) {
  return useQuery({
    queryKey: ['programs', filters],
    queryFn: () => projectService.getProjects(filters),
    staleTime: 1000 * 60 * 5 // 5 minutes
  })
}
