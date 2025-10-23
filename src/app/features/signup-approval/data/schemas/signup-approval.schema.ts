// ABOUTME: Zod schemas for signup approval feature data validation
// ABOUTME: Provides runtime type safety and TypeScript inference for signup approval requests and responses

import { z } from 'zod'

// Submit Signup Request Schema
export const submitSignupRequestSchema = z.object({
  email: z.string().email('Email inválido'),
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  surname: z.string().optional()
})

export type SubmitSignupRequest = z.infer<typeof submitSignupRequestSchema>

// Submit Signup Response Schema
export const submitSignupResponseSchema = z.object({
  success: z.boolean(),
  pendingSignupId: z.string().uuid(),
  message: z.string()
})

export type SubmitSignupResponse = z.infer<typeof submitSignupResponseSchema>

// Pending Signup Object Schema
export const pendingSignupSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string(),
  surname: z.string().nullable(),
  status: z.enum(['pending', 'approved', 'rejected']),
  createdAt: z.string().datetime(),
  approvedAt: z.string().datetime().nullable(),
  approvedBy: z.string().uuid().nullable(),
  rejectedAt: z.string().datetime().nullable(),
  rejectedBy: z.string().uuid().nullable(),
  ipAddress: z.string().nullable(),
  userAgent: z.string().nullable()
})

export type PendingSignup = z.infer<typeof pendingSignupSchema>

// Get Pending Signups Response Schema
export const getPendingSignupsResponseSchema = z.object({
  success: z.boolean(),
  signups: z.array(pendingSignupSchema),
  total: z.number(),
  limit: z.number(),
  offset: z.number()
})

export type GetPendingSignupsResponse = z.infer<typeof getPendingSignupsResponseSchema>

// Get Pending Count Response Schema
export const getPendingCountResponseSchema = z.object({
  success: z.boolean(),
  count: z.number()
})

export type GetPendingCountResponse = z.infer<typeof getPendingCountResponseSchema>

// Approve/Reject Response Schema
export const approveRejectResponseSchema = z.object({
  success: z.boolean(),
  message: z.string()
})

export type ApproveRejectResponse = z.infer<typeof approveRejectResponseSchema>

// Error Response Schema
export const errorResponseSchema = z.object({
  error: z.string()
})

export type ErrorResponse = z.infer<typeof errorResponseSchema>
