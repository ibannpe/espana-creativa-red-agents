// ABOUTME: Zod schemas for authentication feature data validation
// ABOUTME: Provides runtime type safety and TypeScript inference for auth requests and responses

import { z } from 'zod'

// Password validation schema with security requirements
const passwordSchema = z.string()
  .min(8, 'La contraseña debe tener al menos 8 caracteres')
  .regex(/[a-z]/, 'La contraseña debe contener al menos una letra minúscula')
  .regex(/[A-Z]/, 'La contraseña debe contener al menos una letra mayúscula')
  .regex(/[0-9]/, 'La contraseña debe contener al menos un número')

// Sign Up Request Schema
export const signUpRequestSchema = z.object({
  email: z.string().email('Email inválido'),
  password: passwordSchema,
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
  role_ids: z.array(z.number()),
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

// Change Password Request Schema
export const changePasswordRequestSchema = z.object({
  currentPassword: z.string().min(1, 'La contraseña actual es requerida'),
  newPassword: passwordSchema,
  confirmPassword: z.string().min(1, 'Debes confirmar la nueva contraseña')
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword']
})

export type ChangePasswordRequest = z.infer<typeof changePasswordRequestSchema>

// Change Password Response Schema
export const changePasswordResponseSchema = z.object({
  message: z.string()
})

export type ChangePasswordResponse = z.infer<typeof changePasswordResponseSchema>

// Forgot Password Request Schema
export const forgotPasswordRequestSchema = z.object({
  email: z.string().email('Email inválido')
})

export type ForgotPasswordRequest = z.infer<typeof forgotPasswordRequestSchema>

// Forgot Password Response Schema
export const forgotPasswordResponseSchema = z.object({
  message: z.string()
})

export type ForgotPasswordResponse = z.infer<typeof forgotPasswordResponseSchema>

// Reset Password Request Schema
// Note: Token is optional because Supabase handles it via session automatically
export const resetPasswordRequestSchema = z.object({
  password: passwordSchema
})

export type ResetPasswordRequest = z.infer<typeof resetPasswordRequestSchema>

// Reset Password Response Schema
export const resetPasswordResponseSchema = z.object({
  message: z.string()
})

export type ResetPasswordResponse = z.infer<typeof resetPasswordResponseSchema>

// Error Response Schema
export const errorResponseSchema = z.object({
  error: z.string()
})

export type ErrorResponse = z.infer<typeof errorResponseSchema>
