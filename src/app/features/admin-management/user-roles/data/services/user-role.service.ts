// ABOUTME: Service for user role management API communication
// ABOUTME: Handles role assignment, removal, and audit log retrieval

import { axiosInstance } from '@/lib/axios'
import {
  AssignRoleRequest,
  RemoveRoleRequest,
  AuditLogFilters,
  AuditLogResponse,
  Role
} from '../schemas/user-role.schema'

export const userRoleService = {
  /**
   * Assign a role to a user
   */
  async assignRole(data: AssignRoleRequest): Promise<{ success: boolean; message: string }> {
    const response = await axiosInstance.post('/api/user-roles/assign', data)
    return response.data
  },

  /**
   * Remove a role from a user
   */
  async removeRole(data: RemoveRoleRequest): Promise<{ success: boolean; message: string }> {
    const response = await axiosInstance.post('/api/user-roles/remove', data)
    return response.data
  },

  /**
   * Get audit log for role changes
   */
  async getAuditLog(filters?: AuditLogFilters): Promise<AuditLogResponse> {
    const response = await axiosInstance.get('/api/user-roles/audit-log', {
      params: filters
    })
    return response.data
  },

  /**
   * Get all available roles
   */
  async getAllRoles(): Promise<Role[]> {
    const response = await axiosInstance.get('/api/admin/config/roles')
    return response.data.roles
  }
}
