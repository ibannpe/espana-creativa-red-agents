// ABOUTME: Zod schemas for admin statistics data validation
// ABOUTME: Defines types and validation rules for platform metrics

import { z } from 'zod'

// Schema for platform statistics
export const statisticsSchema = z.object({
  totalUsers: z.number().int().min(0),
  usersByRole: z.record(z.string(), z.number().int().min(0)),
  totalOpportunities: z.number().int().min(0),
  activeConnections: z.number().int().min(0),
  pendingSignups: z.number().int().min(0)
})

// Schema for the API response
export const statisticsResponseSchema = z.object({
  statistics: statisticsSchema
})

// TypeScript types derived from schemas
export type Statistics = z.infer<typeof statisticsSchema>
export type StatisticsResponse = z.infer<typeof statisticsResponseSchema>
