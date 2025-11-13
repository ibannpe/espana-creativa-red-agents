// ABOUTME: Unit tests for city Zod schemas
// ABOUTME: Tests validation rules for cities, stats, managers, and API responses

import { describe, it, expect } from 'vitest'
import {
  citySchema,
  cityWithStatsSchema,
  cityWithManagersSchema,
  getCityResponseSchema,
  getCitiesResponseSchema,
  getIsCityManagerResponseSchema
} from './city.schema'

describe('City Schemas', () => {
  describe('citySchema', () => {
    it('should validate correct city data', () => {
      const validCity = {
        id: 1,
        name: 'Madrid',
        slug: 'madrid',
        image_url: 'https://example.com/madrid.jpg',
        description: 'Capital de España',
        active: true,
        display_order: 0,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }

      const result = citySchema.safeParse(validCity)
      expect(result.success).toBe(true)
    })

    it('should validate city with null description', () => {
      const validCity = {
        id: 1,
        name: 'Barcelona',
        slug: 'barcelona',
        image_url: 'https://example.com/barcelona.jpg',
        description: null,
        active: true,
        display_order: 1,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }

      const result = citySchema.safeParse(validCity)
      expect(result.success).toBe(true)
    })

    it('should reject invalid URL for image_url', () => {
      const invalidCity = {
        id: 1,
        name: 'Madrid',
        slug: 'madrid',
        image_url: 'not-a-url',
        description: null,
        active: true,
        display_order: 0,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }

      const result = citySchema.safeParse(invalidCity)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Debe ser una URL válida')
      }
    })

    it('should reject invalid slug format (with spaces)', () => {
      const invalidCity = {
        id: 1,
        name: 'Madrid',
        slug: 'madrid city',
        image_url: 'https://example.com/madrid.jpg',
        description: null,
        active: true,
        display_order: 0,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }

      const result = citySchema.safeParse(invalidCity)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('El slug debe ser lowercase con guiones')
      }
    })

    it('should reject invalid slug format (with uppercase)', () => {
      const invalidCity = {
        id: 1,
        name: 'Madrid',
        slug: 'Madrid',
        image_url: 'https://example.com/madrid.jpg',
        description: null,
        active: true,
        display_order: 0,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }

      const result = citySchema.safeParse(invalidCity)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('El slug debe ser lowercase con guiones')
      }
    })

    it('should accept valid slug with hyphens', () => {
      const validCity = {
        id: 1,
        name: 'Palma de Mallorca',
        slug: 'palma-de-mallorca',
        image_url: 'https://example.com/palma.jpg',
        description: null,
        active: true,
        display_order: 0,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }

      const result = citySchema.safeParse(validCity)
      expect(result.success).toBe(true)
    })

    it('should reject slug shorter than 2 characters', () => {
      const invalidCity = {
        id: 1,
        name: 'A',
        slug: 'a',
        image_url: 'https://example.com/a.jpg',
        description: null,
        active: true,
        display_order: 0,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }

      const result = citySchema.safeParse(invalidCity)
      expect(result.success).toBe(false)
      if (!result.success) {
        // Message might be in English by default
        expect(result.error.issues[0].message).toMatch(/2 character/)
      }
    })

    it('should reject slug longer than 100 characters', () => {
      const invalidCity = {
        id: 1,
        name: 'Long Name',
        slug: 'a'.repeat(101),
        image_url: 'https://example.com/long.jpg',
        description: null,
        active: true,
        display_order: 0,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }

      const result = citySchema.safeParse(invalidCity)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('no puede superar 100 caracteres')
      }
    })

    it('should reject name shorter than 2 characters', () => {
      const invalidCity = {
        id: 1,
        name: 'A',
        slug: 'aa',
        image_url: 'https://example.com/a.jpg',
        description: null,
        active: true,
        display_order: 0,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }

      const result = citySchema.safeParse(invalidCity)
      expect(result.success).toBe(false)
    })

    it('should reject name longer than 100 characters', () => {
      const invalidCity = {
        id: 1,
        name: 'A'.repeat(101),
        slug: 'long-name',
        image_url: 'https://example.com/long.jpg',
        description: null,
        active: true,
        display_order: 0,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }

      const result = citySchema.safeParse(invalidCity)
      expect(result.success).toBe(false)
    })
  })

  describe('cityWithStatsSchema', () => {
    it('should validate city with stats', () => {
      const validCity = {
        id: 1,
        name: 'Madrid',
        slug: 'madrid',
        image_url: 'https://example.com/madrid.jpg',
        description: 'Capital de España',
        active: true,
        display_order: 0,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        opportunities_count: 10,
        active_opportunities_count: 5
      }

      const result = cityWithStatsSchema.safeParse(validCity)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.opportunities_count).toBe(10)
        expect(result.data.active_opportunities_count).toBe(5)
      }
    })

    it('should default opportunities_count to 0 if not provided', () => {
      const validCity = {
        id: 1,
        name: 'Madrid',
        slug: 'madrid',
        image_url: 'https://example.com/madrid.jpg',
        description: null,
        active: true,
        display_order: 0,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }

      const result = cityWithStatsSchema.safeParse(validCity)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.opportunities_count).toBe(0)
        expect(result.data.active_opportunities_count).toBe(0)
      }
    })
  })

  describe('cityWithManagersSchema', () => {
    it('should validate city with managers', () => {
      const validCity = {
        id: 1,
        name: 'Madrid',
        slug: 'madrid',
        image_url: 'https://example.com/madrid.jpg',
        description: null,
        active: true,
        display_order: 0,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        managers: [
          {
            id: '550e8400-e29b-41d4-a716-446655440000',
            name: 'Manager 1',
            avatar_url: 'https://example.com/avatar1.jpg'
          },
          {
            id: '660e8400-e29b-41d4-a716-446655440000',
            name: 'Manager 2',
            avatar_url: null
          }
        ]
      }

      const result = cityWithManagersSchema.safeParse(validCity)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.managers).toHaveLength(2)
        expect(result.data.managers[0].id).toBe('550e8400-e29b-41d4-a716-446655440000')
      }
    })

    it('should validate city with empty managers array', () => {
      const validCity = {
        id: 1,
        name: 'Madrid',
        slug: 'madrid',
        image_url: 'https://example.com/madrid.jpg',
        description: null,
        active: true,
        display_order: 0,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        managers: []
      }

      const result = cityWithManagersSchema.safeParse(validCity)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.managers).toHaveLength(0)
      }
    })

    it('should reject manager with invalid UUID', () => {
      const invalidCity = {
        id: 1,
        name: 'Madrid',
        slug: 'madrid',
        image_url: 'https://example.com/madrid.jpg',
        description: null,
        active: true,
        display_order: 0,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        managers: [
          {
            id: 'not-a-uuid',
            name: 'Manager 1',
            avatar_url: null
          }
        ]
      }

      const result = cityWithManagersSchema.safeParse(invalidCity)
      expect(result.success).toBe(false)
    })
  })

  describe('getCityResponseSchema', () => {
    it('should validate get city response', () => {
      const validResponse = {
        city: {
          id: 1,
          name: 'Madrid',
          slug: 'madrid',
          image_url: 'https://example.com/madrid.jpg',
          description: null,
          active: true,
          display_order: 0,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          opportunities_count: 5,
          active_opportunities_count: 3
        }
      }

      const result = getCityResponseSchema.safeParse(validResponse)
      expect(result.success).toBe(true)
    })

    it('should reject response without city', () => {
      const invalidResponse = {}

      const result = getCityResponseSchema.safeParse(invalidResponse)
      expect(result.success).toBe(false)
    })
  })

  describe('getCitiesResponseSchema', () => {
    it('should validate get cities response', () => {
      const validResponse = {
        cities: [
          {
            id: 1,
            name: 'Madrid',
            slug: 'madrid',
            image_url: 'https://example.com/madrid.jpg',
            description: null,
            active: true,
            display_order: 0,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
            opportunities_count: 5,
            active_opportunities_count: 3
          },
          {
            id: 2,
            name: 'Barcelona',
            slug: 'barcelona',
            image_url: 'https://example.com/barcelona.jpg',
            description: 'Ciudad condal',
            active: true,
            display_order: 1,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
            opportunities_count: 3,
            active_opportunities_count: 2
          }
        ]
      }

      const result = getCitiesResponseSchema.safeParse(validResponse)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.cities).toHaveLength(2)
      }
    })

    it('should validate empty cities array', () => {
      const validResponse = {
        cities: []
      }

      const result = getCitiesResponseSchema.safeParse(validResponse)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.cities).toHaveLength(0)
      }
    })
  })

  describe('getIsCityManagerResponseSchema', () => {
    it('should validate is city manager response', () => {
      const validResponse = {
        isCityManager: true,
        managedCities: [
          {
            id: 1,
            name: 'Madrid',
            slug: 'madrid'
          },
          {
            id: 2,
            name: 'Barcelona',
            slug: 'barcelona'
          }
        ]
      }

      const result = getIsCityManagerResponseSchema.safeParse(validResponse)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.isCityManager).toBe(true)
        expect(result.data.managedCities).toHaveLength(2)
      }
    })

    it('should validate non-manager response', () => {
      const validResponse = {
        isCityManager: false,
        managedCities: []
      }

      const result = getIsCityManagerResponseSchema.safeParse(validResponse)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.isCityManager).toBe(false)
        expect(result.data.managedCities).toHaveLength(0)
      }
    })

    it('should reject invalid managed city structure', () => {
      const invalidResponse = {
        isCityManager: true,
        managedCities: [
          {
            // Missing required fields
            id: 1
          }
        ]
      }

      const result = getIsCityManagerResponseSchema.safeParse(invalidResponse)
      expect(result.success).toBe(false)
    })
  })
})
