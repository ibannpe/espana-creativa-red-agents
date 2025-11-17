// ABOUTME: React Query hook for fetching role change audit log
// ABOUTME: Supports filtering by user, role, action, and pagination

import { useQuery } from '@tanstack/react-query'
import { userRoleService } from '../../data/services/user-role.service'
import { AuditLogFilters, AuditLogResponse } from '../../data/schemas/user-role.schema'

export const useAuditLogQuery = (filters?: AuditLogFilters) => {
  return useQuery<AuditLogResponse>({
    queryKey: ['audit-log', 'roles', filters],
    queryFn: () => userRoleService.getAuditLog(filters),
    staleTime: 30 * 1000, // 30 seconds
    retry: 2
  })
}
