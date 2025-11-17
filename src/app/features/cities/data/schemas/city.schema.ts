// ABOUTME: Zod schemas for cities feature with validation
// ABOUTME: Defines types for city entities and API responses

import { z } from 'zod'

// City slug format validation (lowercase, hyphens, no spaces)
const citySlugSchema = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'El slug debe ser lowercase con guiones')
  .min(2, 'El slug debe tener al menos 2 caracteres')
  .max(100, 'El slug no puede superar 100 caracteres')

// Base city schema
export const citySchema = z.object({
  id: z.number(),
  name: z.string().min(2).max(100),
  slug: citySlugSchema,
  image_url: z.string().url('Debe ser una URL válida'),
  description: z.string().nullable(),
  active: z.boolean(),
  display_order: z.number().default(0),
  created_at: z.string(),
  updated_at: z.string()
})

// City with opportunities count
export const cityWithStatsSchema = citySchema.extend({
  opportunities_count: z.number().default(0),
  active_opportunities_count: z.number().default(0)
})

// City with managers info
export const cityWithManagersSchema = citySchema.extend({
  managers: z.array(z.object({
    id: z.string().uuid(),
    name: z.string(),
    avatar_url: z.string().nullable()
  }))
})

// API Response schemas
export const getCityResponseSchema = z.object({
  city: cityWithStatsSchema
})

export const getCitiesResponseSchema = z.object({
  cities: z.array(cityWithStatsSchema)
})

export const getIsCityManagerResponseSchema = z.object({
  isCityManager: z.boolean(),
  managedCities: z.array(z.object({
    id: z.number(),
    name: z.string(),
    slug: z.string()
  }))
})

// CRUD Request schemas
export const createCityRequestSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(100),
  slug: citySlugSchema,
  image_url: z.string().url('Debe ser una URL válida'),
  description: z.string().optional(),
  active: z.boolean().default(true),
  display_order: z.number().default(0)
})

export const updateCityRequestSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(100).optional(),
  image_url: z.string().url('Debe ser una URL válida').optional(),
  description: z.string().nullable().optional(),
  active: z.boolean().optional(),
  display_order: z.number().optional()
})

// CRUD Response schemas
export const createCityResponseSchema = z.object({
  city: citySchema
})

export const updateCityResponseSchema = z.object({
  city: citySchema
})

export const deleteCityResponseSchema = z.object({
  success: z.boolean()
})

// TypeScript types
export type City = z.infer<typeof citySchema>
export type CityWithStats = z.infer<typeof cityWithStatsSchema>
export type CityWithManagers = z.infer<typeof cityWithManagersSchema>
export type GetCityResponse = z.infer<typeof getCityResponseSchema>
export type GetCitiesResponse = z.infer<typeof getCitiesResponseSchema>
export type GetIsCityManagerResponse = z.infer<typeof getIsCityManagerResponseSchema>
export type CreateCityRequest = z.infer<typeof createCityRequestSchema>
export type UpdateCityRequest = z.infer<typeof updateCityRequestSchema>
export type CreateCityResponse = z.infer<typeof createCityResponseSchema>
export type UpdateCityResponse = z.infer<typeof updateCityResponseSchema>
export type DeleteCityResponse = z.infer<typeof deleteCityResponseSchema>
