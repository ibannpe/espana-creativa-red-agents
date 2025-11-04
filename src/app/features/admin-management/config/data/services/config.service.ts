// ABOUTME: Service layer for admin configuration API communication
// ABOUTME: Handles HTTP requests for roles, settings, and user role assignments with validation

import axios from '@/lib/axios'
import {
  rolesResponseSchema,
  roleResponseSchema,
  systemSettingsResponseSchema,
  systemSettingResponseSchema,
  userRoleResponseSchema,
  type CreateRoleRequest,
  type UpdateRoleRequest,
  type CreateSystemSettingRequest,
  type UpdateSystemSettingRequest
} from '../schemas/config.schema'

// ===== ROLES API =====

export const rolesService = {
  /**
   * Get all roles
   */
  async getAll() {
    const response = await axios.get('/admin/config/roles')
    const validated = rolesResponseSchema.parse(response.data)
    return validated.roles
  },

  /**
   * Create a new role
   */
  async create(data: CreateRoleRequest) {
    const response = await axios.post('/admin/config/roles', data)
    const validated = roleResponseSchema.parse(response.data)
    return validated.role
  },

  /**
   * Update a role
   */
  async update(id: number, data: UpdateRoleRequest) {
    const response = await axios.put(`/admin/config/roles/${id}`, data)
    const validated = roleResponseSchema.parse(response.data)
    return validated.role
  },

  /**
   * Delete a role
   */
  async delete(id: number) {
    await axios.delete(`/admin/config/roles/${id}`)
  }
}

// ===== SYSTEM SETTINGS API =====

export const systemSettingsService = {
  /**
   * Get all system settings
   */
  async getAll() {
    const response = await axios.get('/admin/config/settings')
    const validated = systemSettingsResponseSchema.parse(response.data)
    return validated.settings
  },

  /**
   * Get a specific system setting
   */
  async getByKey(key: string) {
    const response = await axios.get(`/admin/config/settings/${key}`)
    const validated = systemSettingResponseSchema.parse(response.data)
    return validated.setting
  },

  /**
   * Update a system setting
   */
  async update(key: string, data: UpdateSystemSettingRequest) {
    const response = await axios.put(`/admin/config/settings/${key}`, data)
    const validated = systemSettingResponseSchema.parse(response.data)
    return validated.setting
  },

  /**
   * Create a new system setting
   */
  async create(data: CreateSystemSettingRequest) {
    const response = await axios.post('/admin/config/settings', data)
    const validated = systemSettingResponseSchema.parse(response.data)
    return validated.setting
  }
}

// ===== USER ROLES ASSIGNMENT API =====

export const userRolesService = {
  /**
   * Assign a role to a user
   */
  async assign(userId: string, roleId: number) {
    const response = await axios.post(
      `/admin/config/users/${userId}/roles/${roleId}`
    )
    const validated = userRoleResponseSchema.parse(response.data)
    return validated.userRole
  },

  /**
   * Remove a role from a user
   */
  async remove(userId: string, roleId: number) {
    await axios.delete(`/admin/config/users/${userId}/roles/${roleId}`)
  }
}
