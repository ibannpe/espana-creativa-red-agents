// ABOUTME: Zod schemas for opportunities feature with validation
// ABOUTME: Defines types for opportunity creation, updates, and filtering

import { z } from 'zod'

// Opportunity type enum
export const opportunityTypeSchema = z.enum([
  'proyecto',
  'colaboracion',
  'empleo',
  'mentoria',
  'evento',
  'otro'
])

// Opportunity status enum
export const opportunityStatusSchema = z.enum([
  'abierta',
  'en_progreso',
  'cerrada',
  'cancelada'
])

// Base opportunity schema
export const opportunitySchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string(),
  type: opportunityTypeSchema,
  status: opportunityStatusSchema,
  skills_required: z.array(z.string()),
  created_by: z.string().uuid(),
  location: z.string().nullable(),
  remote: z.boolean(),
  duration: z.string().nullable(),
  compensation: z.string().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime()
})

// Opportunity with creator info
export const opportunityWithCreatorSchema = opportunitySchema.extend({
  creator: z.object({
    id: z.string().uuid(),
    name: z.string(),
    avatar_url: z.string().url().nullable()
  })
})

// Create opportunity request
export const createOpportunityRequestSchema = z.object({
  title: z.string().min(5, 'El título debe tener al menos 5 caracteres').max(100, 'El título no puede superar 100 caracteres'),
  description: z.string().min(20, 'La descripción debe tener al menos 20 caracteres').max(2000, 'La descripción no puede superar 2000 caracteres'),
  type: opportunityTypeSchema,
  skills_required: z.array(z.string()).min(1, 'Debes especificar al menos una habilidad'),
  location: z.string().max(100).nullable().optional(),
  remote: z.boolean().default(false),
  duration: z.string().max(100).nullable().optional(),
  compensation: z.string().max(200).nullable().optional()
})

// Update opportunity request
export const updateOpportunityRequestSchema = z.object({
  title: z.string().min(5).max(100).optional(),
  description: z.string().min(20).max(2000).optional(),
  type: opportunityTypeSchema.optional(),
  status: opportunityStatusSchema.optional(),
  skills_required: z.array(z.string()).min(1).optional(),
  location: z.string().max(100).nullable().optional(),
  remote: z.boolean().optional(),
  duration: z.string().max(100).nullable().optional(),
  compensation: z.string().max(200).nullable().optional()
})

// Filter opportunities request
export const filterOpportunitiesRequestSchema = z.object({
  type: opportunityTypeSchema.optional(),
  status: opportunityStatusSchema.optional(),
  skills: z.array(z.string()).optional(),
  remote: z.boolean().optional(),
  search: z.string().optional()
})

// Get opportunity response
export const getOpportunityResponseSchema = z.object({
  opportunity: opportunityWithCreatorSchema
})

// Get opportunities response
export const getOpportunitiesResponseSchema = z.object({
  opportunities: z.array(opportunityWithCreatorSchema),
  total: z.number()
})

// Create opportunity response
export const createOpportunityResponseSchema = z.object({
  opportunity: opportunitySchema
})

// Update opportunity response
export const updateOpportunityResponseSchema = z.object({
  opportunity: opportunitySchema
})

// TypeScript types inferred from schemas
export type OpportunityType = z.infer<typeof opportunityTypeSchema>
export type OpportunityStatus = z.infer<typeof opportunityStatusSchema>
export type Opportunity = z.infer<typeof opportunitySchema>
export type OpportunityWithCreator = z.infer<typeof opportunityWithCreatorSchema>
export type CreateOpportunityRequest = z.infer<typeof createOpportunityRequestSchema>
export type UpdateOpportunityRequest = z.infer<typeof updateOpportunityRequestSchema>
export type FilterOpportunitiesRequest = z.infer<typeof filterOpportunitiesRequestSchema>
export type GetOpportunityResponse = z.infer<typeof getOpportunityResponseSchema>
export type GetOpportunitiesResponse = z.infer<typeof getOpportunitiesResponseSchema>
export type CreateOpportunityResponse = z.infer<typeof createOpportunityResponseSchema>
export type UpdateOpportunityResponse = z.infer<typeof updateOpportunityResponseSchema>
