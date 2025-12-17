// ABOUTME: Zod schemas for projects feature with validation
// ABOUTME: Defines types for project creation, updates, and filtering

import { z } from 'zod'

// Project type enum
export const projectTypeSchema = z.enum([
  'aceleracion',
  'workshop',
  'bootcamp',
  'mentoria',
  'curso',
  'proyecto',
  'otro'
])

// Project status enum
export const projectStatusSchema = z.enum([
  'upcoming',
  'active',
  'completed',
  'cancelled'
])

// Base project schema
export const projectSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(val => String(val)),
  title: z.string(),
  description: z.string(),
  type: projectTypeSchema,
  start_date: z.string(),
  end_date: z.string(),
  duration: z.string(),
  location: z.string().nullish(),
  participants: z.number(),
  max_participants: z.number().nullish(),
  instructor: z.string(),
  status: projectStatusSchema,
  featured: z.boolean(),
  skills: z.array(z.string()),
  price: z.string().nullish(),
  image_url: z.string().nullish(),
  more_info_url: z.string().nullish(),
  created_by: z.string().uuid(),
  created_at: z.string(),
  updated_at: z.string()
})

// Project with creator info
export const projectWithCreatorSchema = projectSchema.extend({
  creator: z.object({
    id: z.string().uuid(),
    name: z.string(),
    avatar_url: z.string().nullable().optional(),
    professional_title: z.string().nullable().optional()
  }),
  user_enrollment: z.object({
    id: z.string().uuid(),
    status: z.string()
  }).nullable().optional()
})

// Create project request
export const createProjectRequestSchema = z.object({
  title: z.string().min(5, 'El título debe tener al menos 5 caracteres').max(255, 'El título no puede superar 255 caracteres'),
  description: z.string().min(20, 'La descripción debe tener al menos 20 caracteres'),
  type: projectTypeSchema,
  start_date: z.string(),
  end_date: z.string(),
  duration: z.string().min(1, 'La duración es requerida'),
  instructor: z.string().min(1, 'El instructor es requerido'),
  skills: z.array(z.string()).min(1, 'Debes especificar al menos una habilidad'),
  location: z.string().max(255).nullable().optional(),
  max_participants: z.number().positive().nullable().optional(),
  price: z.string().max(100).nullable().optional(),
  image_url: z.string().url().nullable().optional(),
  more_info_url: z.string().url('Debe ser una URL válida').nullable().optional(),
  featured: z.boolean().optional()
})

// Update project request
export const updateProjectRequestSchema = z.object({
  title: z.string().min(5).max(255).optional(),
  description: z.string().min(20).optional(),
  type: projectTypeSchema.optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  duration: z.string().optional(),
  location: z.string().max(255).nullable().optional(),
  max_participants: z.number().positive().nullable().optional(),
  instructor: z.string().optional(),
  status: projectStatusSchema.optional(),
  featured: z.boolean().optional(),
  skills: z.array(z.string()).min(1).optional(),
  price: z.string().max(100).nullable().optional(),
  image_url: z.string().url().nullable().optional(),
  more_info_url: z.string().url('Debe ser una URL válida').nullable().optional()
})

// Filter projects request
export const filterProjectsRequestSchema = z.object({
  type: projectTypeSchema.optional(),
  status: projectStatusSchema.optional(),
  skills: z.array(z.string()).optional(),
  featured: z.boolean().optional(),
  search: z.string().optional()
})

// Get project response
export const getProjectResponseSchema = z.object({
  project: projectWithCreatorSchema
})

// Get projects response
export const getProjectsResponseSchema = z.object({
  projects: z.array(projectWithCreatorSchema),
  total: z.number()
})

// Create project response
export const createProjectResponseSchema = z.object({
  project: projectSchema
})

// Update project response
export const updateProjectResponseSchema = z.object({
  project: projectSchema
})

// TypeScript types inferred from schemas
export type ProjectType = z.infer<typeof projectTypeSchema>
export type ProjectStatus = z.infer<typeof projectStatusSchema>
export type Project = z.infer<typeof projectSchema>
export type ProjectWithCreator = z.infer<typeof projectWithCreatorSchema>
export type CreateProjectRequest = z.infer<typeof createProjectRequestSchema>
export type UpdateProjectRequest = z.infer<typeof updateProjectRequestSchema>
export type FilterProjectsRequest = z.infer<typeof filterProjectsRequestSchema>
export type GetProjectResponse = z.infer<typeof getProjectResponseSchema>
export type GetProjectsResponse = z.infer<typeof getProjectsResponseSchema>
export type CreateProjectResponse = z.infer<typeof createProjectResponseSchema>
export type UpdateProjectResponse = z.infer<typeof updateProjectResponseSchema>
