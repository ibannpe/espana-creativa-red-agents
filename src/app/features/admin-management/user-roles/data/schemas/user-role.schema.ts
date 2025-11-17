// ABOUTME: Zod schemas for user role management API requests and responses
// ABOUTME: Defines validation for assigning/removing roles and audit log retrieval

import { z } from 'zod'

// Request schemas
export const assignRoleSchema = z.object({
  userId: z.string().uuid('ID de usuario inválido'),
  roleId: z.number().int().positive('ID de rol inválido')
})

export const removeRoleSchema = z.object({
  userId: z.string().uuid('ID de usuario inválido'),
  roleId: z.number().int().positive('ID de rol inválido')
})

export const auditLogFiltersSchema = z.object({
  userId: z.string().uuid().optional(),
  roleId: z.number().int().positive().optional(),
  action: z.enum(['assigned', 'removed']).optional(),
  limit: z.number().int().positive().optional(),
  offset: z.number().int().nonnegative().optional()
})

// Response schemas
export const roleSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable()
})

export const auditLogEntrySchema = z.object({
  id: z.number(),
  user_id: z.string(),
  user_name: z.string().nullable(),
  user_email: z.string(),
  role_id: z.number(),
  role_name: z.string(),
  action: z.enum(['assigned', 'removed']),
  performed_by: z.string().nullable(),
  performed_by_name: z.string().nullable(),
  reason: z.string().nullable(),
  created_at: z.string(),
  metadata: z.record(z.any())
})

export const auditLogResponseSchema = z.object({
  logs: z.array(auditLogEntrySchema),
  total: z.number()
})

// Type exports
export type AssignRoleRequest = z.infer<typeof assignRoleSchema>
export type RemoveRoleRequest = z.infer<typeof removeRoleSchema>
export type AuditLogFilters = z.infer<typeof auditLogFiltersSchema>
export type Role = z.infer<typeof roleSchema>
export type AuditLogEntry = z.infer<typeof auditLogEntrySchema>
export type AuditLogResponse = z.infer<typeof auditLogResponseSchema>
