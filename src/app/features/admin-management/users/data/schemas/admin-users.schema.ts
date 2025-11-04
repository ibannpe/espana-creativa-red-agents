// ABOUTME: Zod schemas for admin user management data validation
// ABOUTME: Defines types and validation rules for admin user queries and responses

import { z } from 'zod'

// Schema for a user with roles (admin view)
export const adminUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string(),
  avatar_url: z.string().nullable().optional(),
  bio: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  linkedin_url: z.string().nullable().optional(),
  website_url: z.string().nullable().optional(),
  skills: z.array(z.string()).default([]),
  interests: z.array(z.string()).default([]),
  roles: z.array(z.string()).default([]),
  completed_pct: z.number().min(0).max(100),
  created_at: z.string(),
  updated_at: z.string()
})

// Schema for the API response
export const adminUsersResponseSchema = z.object({
  users: z.array(adminUserSchema),
  count: z.number()
})

// TypeScript types derived from schemas
export type AdminUser = z.infer<typeof adminUserSchema>
export type AdminUsersResponse = z.infer<typeof adminUsersResponseSchema>
