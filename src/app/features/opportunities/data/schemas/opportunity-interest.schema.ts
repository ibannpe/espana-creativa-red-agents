// ABOUTME: Schema definitions and types for opportunity interest
// ABOUTME: Includes Zod schemas for API validation

import { z } from 'zod'

// Interest status enum
export const opportunityInterestStatusSchema = z.enum(['pending', 'accepted', 'rejected', 'withdrawn'])
export type OpportunityInterestStatus = z.infer<typeof opportunityInterestStatusSchema>

// OpportunityInterest entity schema
export const opportunityInterestSchema = z.object({
  id: z.string().uuid(),
  opportunityId: z.string().uuid(),
  userId: z.string().uuid(),
  message: z.string().nullable().optional(),
  status: opportunityInterestStatusSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
})
export type OpportunityInterest = z.infer<typeof opportunityInterestSchema>

// Express interest request
export const expressInterestRequestSchema = z.object({
  opportunityId: z.string().uuid(),
  message: z.string().optional()
})
export type ExpressInterestRequest = z.infer<typeof expressInterestRequestSchema>

// Express interest response
export const expressInterestResponseSchema = z.object({
  interest: opportunityInterestSchema
})
export type ExpressInterestResponse = z.infer<typeof expressInterestResponseSchema>
