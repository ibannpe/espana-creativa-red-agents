// ABOUTME: Zod schemas for dashboard feature with runtime validation
// ABOUTME: Defines types for recent users request/response with proper validation

import { z } from 'zod'
import { userProfileSchema } from '@/app/features/profile/data/schemas/profile.schema'

// Extended user schema with role_ids for dashboard
export const dashboardUserSchema = userProfileSchema.extend({
  role_ids: z.array(z.number())
})

// Get recent users request schema
export const getRecentUsersRequestSchema = z.object({
  days: z.number().int().min(1).max(365).optional().default(30),
  limit: z.number().int().min(1).max(50).optional().default(5)
})

// Get recent users response schema
export const getRecentUsersResponseSchema = z.object({
  users: z.array(dashboardUserSchema),
  count: z.number().int().min(0),
  days_filter: z.number().int().min(1).max(365)
})

// Type inference from schemas
export type DashboardUser = z.infer<typeof dashboardUserSchema>
export type GetRecentUsersRequest = z.infer<typeof getRecentUsersRequestSchema>
export type GetRecentUsersResponse = z.infer<typeof getRecentUsersResponseSchema>
