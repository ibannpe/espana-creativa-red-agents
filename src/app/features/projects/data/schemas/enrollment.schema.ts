// ABOUTME: Zod schemas for program enrollments with validation
// ABOUTME: Defines types for enrollment operations and responses

import { z } from 'zod'
import { projectWithCreatorSchema } from './project.schema'

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
  project_id: z.string().uuid(),
  user_id: z.string().uuid(),
  status: enrollmentStatusSchema,
  enrolled_at: z.string(),
  completed_at: z.string().nullable().optional(),
  rating: z.number().min(1).max(5).nullable().optional(),
  feedback: z.string().max(2000).nullable().optional(),
  created_at: z.string(),
  updated_at: z.string()
})

// Enrollment with project details
export const enrollmentWithProjectSchema = enrollmentSchema.extend({
  project: projectWithCreatorSchema
})

// Enroll in program request
export const enrollInProjectRequestSchema = z.object({
  programId: z.string().uuid()
})

// Get enrollments response
export const getEnrollmentsResponseSchema = z.object({
  enrollments: z.array(enrollmentWithProjectSchema)
})

// Enroll in program response
export const enrollInProjectResponseSchema = z.object({
  enrollment: enrollmentSchema
})

// TypeScript types inferred from schemas
export type EnrollmentStatus = z.infer<typeof enrollmentStatusSchema>
export type Enrollment = z.infer<typeof enrollmentSchema>
export type EnrollmentWithProject = z.infer<typeof enrollmentWithProjectSchema>
export type EnrollInProjectRequest = z.infer<typeof enrollInProjectRequestSchema>
export type GetEnrollmentsResponse = z.infer<typeof getEnrollmentsResponseSchema>
export type EnrollInProjectResponse = z.infer<typeof enrollInProjectResponseSchema>
