// ABOUTME: React Query hook for fetching admin user list with roles
// ABOUTME: Provides loading states, error handling, and automatic cache management

import { useQuery } from '@tanstack/react-query'
import { adminUsersService } from '../../data/services/admin-users.service'

export const ADMIN_USERS_QUERY_KEY = ['admin', 'users'] as const

export function useAdminUsersQuery() {
  return useQuery({
    queryKey: ADMIN_USERS_QUERY_KEY,
    queryFn: () => adminUsersService.getAllUsers(),
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1
  })
}
