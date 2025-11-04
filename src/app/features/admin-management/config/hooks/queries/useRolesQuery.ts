// ABOUTME: React Query hook for fetching all roles
// ABOUTME: Provides caching and automatic refetching of roles data

import { useQuery } from '@tanstack/react-query'
import { rolesService } from '../../data/services/config.service'

export const useRolesQuery = () => {
  return useQuery({
    queryKey: ['admin', 'config', 'roles'],
    queryFn: () => rolesService.getAll(),
    staleTime: 1000 * 60 * 5 // 5 minutes
  })
}
