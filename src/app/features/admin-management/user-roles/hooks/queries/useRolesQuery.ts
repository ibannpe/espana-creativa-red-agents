// ABOUTME: React Query hook for fetching all available roles
// ABOUTME: Used in role assignment UI to show available roles

import { useQuery } from '@tanstack/react-query'
import { userRoleService } from '../../data/services/user-role.service'
import { Role } from '../../data/schemas/user-role.schema'

export const useRolesQuery = () => {
  return useQuery<Role[]>({
    queryKey: ['roles', 'all'],
    queryFn: () => userRoleService.getAllRoles(),
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 2
  })
}
