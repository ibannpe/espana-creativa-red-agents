// ABOUTME: Zod schemas for authentication feature data validation
// ABOUTME: Provides runtime type safety and TypeScript inference for auth requests and responses

import { z } from 'zod'

// Sign Up Request Schema
export const signUpRequestSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres')
})

export type SignUpRequest = z.infer<typeof signUpRequestSchema>

// Sign In Request Schema
export const signInRequestSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'La contraseña es requerida')
})

export type SignInRequest = z.infer<typeof signInRequestSchema>

// User Response Schema (from API)
export const userResponseSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().nullable(),
  avatar_url: z.string().nullable(),
  bio: z.string().nullable(),
  location: z.string().nullable(),
  linkedin_url: z.string().nullable(),
  website_url: z.string().nullable(),
  skills: z.array(z.string()),
  interests: z.array(z.string()),
  completed_pct: z.number().min(0).max(100),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime()
})

export type UserResponse = z.infer<typeof userResponseSchema>

// Sign Up Response Schema
export const signUpResponseSchema = z.object({
  user: userResponseSchema
})

export type SignUpResponse = z.infer<typeof signUpResponseSchema>

// Sign In Response Schema
export const signInResponseSchema = z.object({
  user: userResponseSchema,
  session: z.any().nullable()
})

export type SignInResponse = z.infer<typeof signInResponseSchema>

// Current User Response Schema
export const currentUserResponseSchema = z.object({
  user: userResponseSchema
})

export type CurrentUserResponse = z.infer<typeof currentUserResponseSchema>

// Error Response Schema
export const errorResponseSchema = z.object({
  error: z.string()
})

export type ErrorResponse = z.infer<typeof errorResponseSchema>
