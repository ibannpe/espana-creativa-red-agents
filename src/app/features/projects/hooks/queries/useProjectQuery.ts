// ABOUTME: Hook para obtener un programa específico por ID
// ABOUTME: Usa React Query para caching y revalidación

import { useQuery } from '@tanstack/react-query'
import { projectService } from '../../data/services/project.service'

export function useProjectQuery(id: string | undefined) {
  return useQuery({
    queryKey: ['project', id],
    queryFn: () => projectService.getProject(id!),
    enabled: !!id,
    staleTime: 1000 * 60 * 5 // 5 minutes
  })
}
