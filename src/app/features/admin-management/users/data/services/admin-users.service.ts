// ABOUTME: Service layer for admin user management API communication
// ABOUTME: Handles HTTP requests to admin endpoints with proper validation and error handling

import { axiosInstance } from '@/lib/axios'
import { adminUsersResponseSchema, type AdminUsersResponse } from '../schemas/admin-users.schema'

export const adminUsersService = {
  /**
   * Get all users with their roles (admin only)
   */
  async getAllUsers(): Promise<AdminUsersResponse> {
    const response = await axiosInstance.get('/admin/users')
    return adminUsersResponseSchema.parse(response.data)
  }
}
