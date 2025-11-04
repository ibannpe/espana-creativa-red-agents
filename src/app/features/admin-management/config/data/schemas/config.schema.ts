// ABOUTME: Zod schemas for admin configuration management (roles, settings, user role assignments)
// ABOUTME: Provides type-safe validation for configuration data

import { z } from 'zod'

// Role Schema
export const roleSchema = z.object({
  id: z.number(),
  name: z.string().min(1),
  description: z.string().nullable(),
  created_at: z.string()
})

export type Role = z.infer<typeof roleSchema>

// Create Role Request Schema
export const createRoleSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().optional()
})

export type CreateRoleRequest = z.infer<typeof createRoleSchema>

// Update Role Request Schema
export const updateRoleSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().optional()
})

export type UpdateRoleRequest = z.infer<typeof updateRoleSchema>

// System Setting Schema
export const systemSettingSchema = z.object({
  key: z.string(),
  value: z.any(), // JSONB can be any type
  description: z.string().nullable(),
  data_type: z.enum(['boolean', 'number', 'string', 'text', 'json']),
  updated_at: z.string()
})

export type SystemSetting = z.infer<typeof systemSettingSchema>

// Create System Setting Request Schema
export const createSystemSettingSchema = z.object({
  key: z.string().min(1, 'La clave es requerida'),
  value: z.any(),
  description: z.string().optional(),
  data_type: z.enum(['boolean', 'number', 'string', 'text', 'json'])
})

export type CreateSystemSettingRequest = z.infer<typeof createSystemSettingSchema>

// Update System Setting Request Schema
export const updateSystemSettingSchema = z.object({
  value: z.any()
})

export type UpdateSystemSettingRequest = z.infer<typeof updateSystemSettingSchema>

// User Role Assignment Schema
export const userRoleSchema = z.object({
  user_id: z.string().uuid(),
  role_id: z.number(),
  created_at: z.string()
})

export type UserRole = z.infer<typeof userRoleSchema>

// API Response Schemas
export const rolesResponseSchema = z.object({
  roles: z.array(roleSchema)
})

export const roleResponseSchema = z.object({
  role: roleSchema
})

export const systemSettingsResponseSchema = z.object({
  settings: z.array(systemSettingSchema)
})

export const systemSettingResponseSchema = z.object({
  setting: systemSettingSchema
})

export const userRoleResponseSchema = z.object({
  userRole: userRoleSchema
})

export type RolesResponse = z.infer<typeof rolesResponseSchema>
export type RoleResponse = z.infer<typeof roleResponseSchema>
export type SystemSettingsResponse = z.infer<typeof systemSettingsResponseSchema>
export type SystemSettingResponse = z.infer<typeof systemSettingResponseSchema>
export type UserRoleResponse = z.infer<typeof userRoleResponseSchema>
