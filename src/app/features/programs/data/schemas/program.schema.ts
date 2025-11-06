// ABOUTME: Zod schemas for programs feature with validation
// ABOUTME: Defines types for program creation, updates, and filtering

import { z } from 'zod'

// Program type enum
export const programTypeSchema = z.enum([
  'aceleracion',
  'workshop',
  'bootcamp',
  'mentoria',
  'curso',
  'otro'
])

// Program status enum
export const programStatusSchema = z.enum([
  'upcoming',
  'active',
  'completed',
  'cancelled'
])

// Base program schema
export const programSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(val => String(val)),
  title: z.string(),
  description: z.string(),
  type: programTypeSchema,
  start_date: z.string(),
  end_date: z.string(),
  duration: z.string(),
  location: z.string().nullish(),
  participants: z.number(),
  max_participants: z.number().nullish(),
  instructor: z.string(),
  status: programStatusSchema,
  featured: z.boolean(),
  skills: z.array(z.string()),
  price: z.string().nullish(),
  image_url: z.string().nullish(),
  created_by: z.string().uuid(),
  created_at: z.string(),
  updated_at: z.string()
})

// Program with creator info
export const programWithCreatorSchema = programSchema.extend({
  creator: z.object({
    id: z.string().uuid(),
    name: z.string(),
    avatar_url: z.string().nullable().optional(),
    professional_title: z.string().nullable().optional()
  })
})

// Create program request
export const createProgramRequestSchema = z.object({
  title: z.string().min(5, 'El título debe tener al menos 5 caracteres').max(255, 'El título no puede superar 255 caracteres'),
  description: z.string().min(20, 'La descripción debe tener al menos 20 caracteres'),
  type: programTypeSchema,
  start_date: z.string(),
  end_date: z.string(),
  duration: z.string().min(1, 'La duración es requerida'),
  instructor: z.string().min(1, 'El instructor es requerido'),
  skills: z.array(z.string()).min(1, 'Debes especificar al menos una habilidad'),
  location: z.string().max(255).nullable().optional(),
  max_participants: z.number().positive().nullable().optional(),
  price: z.string().max(100).nullable().optional(),
  image_url: z.string().url().nullable().optional(),
  featured: z.boolean().optional()
})

// Update program request
export const updateProgramRequestSchema = z.object({
  title: z.string().min(5).max(255).optional(),
  description: z.string().min(20).optional(),
  type: programTypeSchema.optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  duration: z.string().optional(),
  location: z.string().max(255).nullable().optional(),
  max_participants: z.number().positive().nullable().optional(),
  instructor: z.string().optional(),
  status: programStatusSchema.optional(),
  featured: z.boolean().optional(),
  skills: z.array(z.string()).min(1).optional(),
  price: z.string().max(100).nullable().optional(),
  image_url: z.string().url().nullable().optional()
})

// Filter programs request
export const filterProgramsRequestSchema = z.object({
  type: programTypeSchema.optional(),
  status: programStatusSchema.optional(),
  skills: z.array(z.string()).optional(),
  featured: z.boolean().optional(),
  search: z.string().optional()
})

// Get program response
export const getProgramResponseSchema = z.object({
  program: programWithCreatorSchema
})

// Get programs response
export const getProgramsResponseSchema = z.object({
  programs: z.array(programWithCreatorSchema),
  total: z.number()
})

// Create program response
export const createProgramResponseSchema = z.object({
  program: programSchema
})

// Update program response
export const updateProgramResponseSchema = z.object({
  program: programSchema
})

// TypeScript types inferred from schemas
export type ProgramType = z.infer<typeof programTypeSchema>
export type ProgramStatus = z.infer<typeof programStatusSchema>
export type Program = z.infer<typeof programSchema>
export type ProgramWithCreator = z.infer<typeof programWithCreatorSchema>
export type CreateProgramRequest = z.infer<typeof createProgramRequestSchema>
export type UpdateProgramRequest = z.infer<typeof updateProgramRequestSchema>
export type FilterProgramsRequest = z.infer<typeof filterProgramsRequestSchema>
export type GetProgramResponse = z.infer<typeof getProgramResponseSchema>
export type GetProgramsResponse = z.infer<typeof getProgramsResponseSchema>
export type CreateProgramResponse = z.infer<typeof createProgramResponseSchema>
export type UpdateProgramResponse = z.infer<typeof updateProgramResponseSchema>
