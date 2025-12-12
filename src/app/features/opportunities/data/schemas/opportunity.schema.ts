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
  id: z.union([z.string(), z.number()]).transform(val => String(val)),
  title: z.string(),
  description: z.string(),
  type: opportunityTypeSchema,
  status: opportunityStatusSchema,
  skills_required: z.array(z.string()),
  created_by: z.string().uuid(),

  // City relation (REQUIRED)
  city_id: z.number().positive('La oportunidad debe estar asignada a una ciudad'),

  // Contact fields (REQUIRED)
  contact_email: z.string().email('Debe ser un email válido'),
  contact_phone: z.string().min(1, 'El teléfono es obligatorio'),

  // DEPRECATED - Mantener para retrocompatibilidad
  location: z.string().nullish().optional(),

  remote: z.boolean(),
  duration: z.string().nullish(),
  compensation: z.string().nullish(),
  created_at: z.string(),
  updated_at: z.string()
})

// Opportunity with creator info
export const opportunityWithCreatorSchema = opportunitySchema.extend({
  creator: z.object({
    id: z.string().uuid(),
    name: z.string(),
    avatar_url: z.string().nullable().optional(),
    professional_title: z.string().nullable().optional()
  }),
  city: z.object({
    id: z.number(),
    name: z.string(),
    slug: z.string()
  })
})

// Opportunity with city info populated
export const opportunityWithCitySchema = opportunitySchema.extend({
  city: z.object({
    id: z.number(),
    name: z.string(),
    slug: z.string(),
    image_url: z.string().url()
  }),
  creator: z.object({
    id: z.string().uuid(),
    name: z.string(),
    avatar_url: z.string().nullable().optional(),
    professional_title: z.string().nullable().optional()
  })
})

// Create opportunity request
export const createOpportunityRequestSchema = z.object({
  title: z.string().min(5, 'El título debe tener al menos 5 caracteres').max(100, 'El título no puede superar 100 caracteres'),
  description: z.string().min(20, 'La descripción debe tener al menos 20 caracteres').max(2000, 'La descripción no puede superar 2000 caracteres'),
  type: opportunityTypeSchema,
  skills_required: z.array(z.string()).min(1, 'Debes especificar al menos una habilidad'),

  // Ciudad obligatoria
  city_id: z.number().positive('Debes seleccionar una ciudad'),

  // Contacto obligatorio
  contact_email: z.string().email('Debe ser un email válido'),
  contact_phone: z.string().min(9, 'El teléfono debe tener al menos 9 caracteres').max(50, 'El teléfono no puede superar 50 caracteres'),

  // Campos opcionales
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
  contact_email: z.string().email('Debe ser un email válido').optional(),
  contact_phone: z.string().min(9).max(50).optional(),
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
  search: z.string().optional(),
  city_id: z.number().optional(), // Filtrar por ciudad
  limit: z.number().optional()
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
export type OpportunityWithCity = z.infer<typeof opportunityWithCitySchema>
export type CreateOpportunityRequest = z.infer<typeof createOpportunityRequestSchema>
export type UpdateOpportunityRequest = z.infer<typeof updateOpportunityRequestSchema>
export type FilterOpportunitiesRequest = z.infer<typeof filterOpportunitiesRequestSchema>
export type GetOpportunityResponse = z.infer<typeof getOpportunityResponseSchema>
export type GetOpportunitiesResponse = z.infer<typeof getOpportunitiesResponseSchema>
export type CreateOpportunityResponse = z.infer<typeof createOpportunityResponseSchema>
export type UpdateOpportunityResponse = z.infer<typeof updateOpportunityResponseSchema>
