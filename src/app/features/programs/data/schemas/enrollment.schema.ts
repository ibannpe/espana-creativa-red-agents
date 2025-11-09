// ABOUTME: Zod schemas for program enrollments with validation
// ABOUTME: Defines types for enrollment operations and responses

import { z } from 'zod'
import { programWithCreatorSchema } from './program.schema'

// Enrollment status enum
export const enrollmentStatusSchema = z.enum([
  'enrolled',
  'completed',
  'dropped',
  'rejected'
])

// Base enrollment schema
export const enrollmentSchema = z.object({
  id: z.string(),
  program_id: z.string().uuid(),
  user_id: z.string().uuid(),
  status: enrollmentStatusSchema,
  enrolled_at: z.string(),
  completed_at: z.string().nullable().optional(),
  rating: z.number().min(1).max(5).nullable().optional(),
  feedback: z.string().max(2000).nullable().optional(),
  created_at: z.string(),
  updated_at: z.string()
})

// Enrollment with program details
export const enrollmentWithProgramSchema = enrollmentSchema.extend({
  program: programWithCreatorSchema
})

// Enroll in program request
export const enrollInProgramRequestSchema = z.object({
  programId: z.string().uuid()
})

// Get enrollments response
export const getEnrollmentsResponseSchema = z.object({
  enrollments: z.array(enrollmentWithProgramSchema)
})

// Enroll in program response
export const enrollInProgramResponseSchema = z.object({
  enrollment: enrollmentSchema
})

// TypeScript types inferred from schemas
export type EnrollmentStatus = z.infer<typeof enrollmentStatusSchema>
export type Enrollment = z.infer<typeof enrollmentSchema>
export type EnrollmentWithProgram = z.infer<typeof enrollmentWithProgramSchema>
export type EnrollInProgramRequest = z.infer<typeof enrollInProgramRequestSchema>
export type GetEnrollmentsResponse = z.infer<typeof getEnrollmentsResponseSchema>
export type EnrollInProgramResponse = z.infer<typeof enrollInProgramResponseSchema>
