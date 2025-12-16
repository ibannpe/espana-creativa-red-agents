// ABOUTME: React Query hook for fetching all users with their roles (admin only)
// ABOUTME: Used in user management UI to display users and their assigned roles

import { useQuery } from '@tanstack/react-query'
import { axiosInstance } from '@/lib/axios'

export interface UserWithRoles {
  id: string
  email: string
  name: string
  avatar_url: string | null
  bio: string | null
  location: string | null
  linkedin_url: string | null
  website_url: string | null
  skills: string[]
  interests: string[]
  roles: string[]
  completed_pct: number
  created_at: string
  updated_at: string
}

interface UsersResponse {
  users: UserWithRoles[]
  count: number
}

export const useAdminUsersQuery = () => {
  return useQuery<UsersResponse>({
    queryKey: ['admin', 'users'],
    queryFn: async () => {
      const response = await axiosInstance.get<UsersResponse>('/admin/users')
      return response.data
    },
    staleTime: 30 * 1000, // 30 seconds
    retry: 2
  })
}
