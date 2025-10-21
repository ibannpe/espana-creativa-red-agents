// ABOUTME: Zod schemas for profile feature with runtime validation
// ABOUTME: Defines types for profile updates, user searches, and profile responses

import { z } from 'zod'

// Base user schema (shared with auth)
export const userProfileSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string(),
  avatar_url: z.string().url().nullable(),
  bio: z.string().nullable(),
  location: z.string().nullable(),
  linkedin_url: z.string().url().nullable(),
  website_url: z.string().url().nullable(),
  skills: z.array(z.string()),
  interests: z.array(z.string()),
  completed_pct: z.number().min(0).max(100),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime()
})

// Update profile request schema
export const updateProfileRequestSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').optional(),
  bio: z.string().max(500, 'La biografía no puede superar 500 caracteres').nullable().optional(),
  location: z.string().max(100, 'La ubicación no puede superar 100 caracteres').nullable().optional(),
  linkedin_url: z.string().url('URL de LinkedIn inválida').nullable().optional(),
  website_url: z.string().url('URL del sitio web inválida').nullable().optional(),
  skills: z.array(z.string()).optional(),
  interests: z.array(z.string()).optional()
})

// Upload avatar request (FormData will be handled separately)
export const uploadAvatarResponseSchema = z.object({
  avatar_url: z.string().url()
})

// Search users request schema
export const searchUsersRequestSchema = z.object({
  query: z.string().optional(),
  location: z.string().optional(),
  skills: z.array(z.string()).optional(),
  role: z.string().optional()
})

// Search users response schema
export const searchUsersResponseSchema = z.object({
  users: z.array(userProfileSchema)
})

// Get profile response schema
export const getProfileResponseSchema = z.object({
  user: userProfileSchema
})

// Update profile response schema
export const updateProfileResponseSchema = z.object({
  user: userProfileSchema
})

// Error response schema
export const profileErrorResponseSchema = z.object({
  error: z.string()
})

// TypeScript types inferred from schemas
export type UserProfile = z.infer<typeof userProfileSchema>
export type UpdateProfileRequest = z.infer<typeof updateProfileRequestSchema>
export type UploadAvatarResponse = z.infer<typeof uploadAvatarResponseSchema>
export type SearchUsersRequest = z.infer<typeof searchUsersRequestSchema>
export type SearchUsersResponse = z.infer<typeof searchUsersResponseSchema>
export type GetProfileResponse = z.infer<typeof getProfileResponseSchema>
export type UpdateProfileResponse = z.infer<typeof updateProfileResponseSchema>
export type ProfileErrorResponse = z.infer<typeof profileErrorResponseSchema>
