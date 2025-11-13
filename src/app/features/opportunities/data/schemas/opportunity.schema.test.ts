// ABOUTME: Unit tests for opportunity Zod schemas
// ABOUTME: Tests validation rules for opportunities, creation, updates, and filtering

import { describe, it, expect } from 'vitest'
import {
  opportunityTypeSchema,
  opportunityStatusSchema,
  opportunitySchema,
  opportunityWithCreatorSchema,
  createOpportunityRequestSchema,
  updateOpportunityRequestSchema,
  filterOpportunitiesRequestSchema,
  getOpportunityResponseSchema,
  getOpportunitiesResponseSchema,
  createOpportunityResponseSchema,
  updateOpportunityResponseSchema
} from './opportunity.schema'

describe('Opportunity Schemas', () => {
  describe('opportunityTypeSchema', () => {
    it('should validate all opportunity types', () => {
      const types = ['proyecto', 'colaboracion', 'empleo', 'mentoria', 'evento', 'otro']

      types.forEach(type => {
        const result = opportunityTypeSchema.safeParse(type)
        expect(result.success).toBe(true)
      })
    })

    it('should reject invalid type', () => {
      const result = opportunityTypeSchema.safeParse('invalid-type')
      expect(result.success).toBe(false)
    })
  })

  describe('opportunityStatusSchema', () => {
    it('should validate all opportunity statuses', () => {
      const statuses = ['abierta', 'en_progreso', 'cerrada', 'cancelada']

      statuses.forEach(status => {
        const result = opportunityStatusSchema.safeParse(status)
        expect(result.success).toBe(true)
      })
    })

    it('should reject invalid status', () => {
      const result = opportunityStatusSchema.safeParse('invalid-status')
      expect(result.success).toBe(false)
    })
  })

  describe('opportunitySchema', () => {
    it('should validate correct opportunity', () => {
      const validOpportunity = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        title: 'Full Stack Developer Position',
        description: 'We are looking for an experienced full stack developer',
        type: 'empleo',
        status: 'abierta',
        skills_required: ['JavaScript', 'TypeScript', 'React'],
        created_by: '550e8400-e29b-41d4-a716-446655440001',
        city_id: 1,
        location: 'Madrid',
        remote: true,
        duration: '3 months',
        compensation: '50k-60k EUR',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }

      const result = opportunitySchema.safeParse(validOpportunity)
      expect(result.success).toBe(true)
    })

    it('should require city_id field', () => {
      const invalidOpportunity = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        title: 'Test Opportunity',
        description: 'This is a test opportunity',
        type: 'proyecto',
        status: 'abierta',
        skills_required: ['JavaScript'],
        created_by: '550e8400-e29b-41d4-a716-446655440001',
        // Missing city_id
        location: null,
        remote: false,
        duration: null,
        compensation: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }

      const result = opportunitySchema.safeParse(invalidOpportunity)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('ciudad')
      }
    })

    it('should reject non-positive city_id', () => {
      const invalidOpportunity = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        title: 'Test Opportunity',
        description: 'This is a test opportunity',
        type: 'proyecto',
        status: 'abierta',
        skills_required: ['JavaScript'],
        created_by: '550e8400-e29b-41d4-a716-446655440001',
        city_id: 0, // Invalid
        location: null,
        remote: false,
        duration: null,
        compensation: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }

      const result = opportunitySchema.safeParse(invalidOpportunity)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('ciudad')
      }
    })

    it('should validate opportunity with null optional fields', () => {
      const validOpportunity = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        title: 'Test Opportunity',
        description: 'This is a test opportunity',
        type: 'proyecto',
        status: 'abierta',
        skills_required: ['JavaScript'],
        created_by: '550e8400-e29b-41d4-a716-446655440001',
        city_id: 1,
        location: null,
        remote: false,
        duration: null,
        compensation: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }

      const result = opportunitySchema.safeParse(validOpportunity)
      expect(result.success).toBe(true)
    })

    it('should reject invalid UUID', () => {
      const invalidOpportunity = {
        id: 'not-a-uuid',
        title: 'Test',
        description: 'Description',
        type: 'proyecto',
        status: 'abierta',
        skills_required: ['JavaScript'],
        created_by: '550e8400-e29b-41d4-a716-446655440001',
        city_id: 1,
        location: null,
        remote: false,
        duration: null,
        compensation: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }

      const result = opportunitySchema.safeParse(invalidOpportunity)
      expect(result.success).toBe(false)
    })
  })

  describe('createOpportunityRequestSchema', () => {
    it('should validate correct create request', () => {
      const validRequest = {
        title: 'New Opportunity',
        description: 'This is a detailed description of the opportunity',
        type: 'colaboracion',
        skills_required: ['React', 'Node.js'],
        city_id: 1,
        remote: true,
        duration: '6 months',
        compensation: 'Equity'
      }

      const result = createOpportunityRequestSchema.safeParse(validRequest)
      expect(result.success).toBe(true)
    })

    it('should require city_id in create request', () => {
      const invalidRequest = {
        title: 'New Opportunity',
        description: 'This is a detailed description of the opportunity',
        type: 'colaboracion',
        skills_required: ['React', 'Node.js'],
        // Missing city_id
        remote: true,
        duration: '6 months',
        compensation: 'Equity'
      }

      const result = createOpportunityRequestSchema.safeParse(invalidRequest)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('ciudad')
      }
    })

    it('should validate request with minimal required fields', () => {
      const validRequest = {
        title: 'Minimal Opportunity',
        description: 'Minimum viable description here',
        type: 'proyecto',
        skills_required: ['JavaScript'],
        city_id: 1
      }

      const result = createOpportunityRequestSchema.safeParse(validRequest)
      expect(result.success).toBe(true)
    })

    it('should set remote to false by default', () => {
      const request = {
        title: 'Test Opportunity',
        description: 'Test description here',
        type: 'proyecto',
        skills_required: ['JavaScript'],
        city_id: 1
      }

      const result = createOpportunityRequestSchema.safeParse(request)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.remote).toBe(false)
      }
    })

    it('should reject title shorter than 5 characters', () => {
      const invalidRequest = {
        title: 'Test',
        description: 'Valid description here',
        type: 'proyecto',
        skills_required: ['JavaScript'],
        city_id: 1
      }

      const result = createOpportunityRequestSchema.safeParse(invalidRequest)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('5 caracteres')
      }
    })

    it('should reject title longer than 100 characters', () => {
      const invalidRequest = {
        title: 'a'.repeat(101),
        description: 'Valid description',
        type: 'proyecto',
        skills_required: ['JavaScript'],
        city_id: 1
      }

      const result = createOpportunityRequestSchema.safeParse(invalidRequest)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('100 caracteres')
      }
    })

    it('should reject description shorter than 20 characters', () => {
      const invalidRequest = {
        title: 'Valid Title',
        description: 'Too short',
        type: 'proyecto',
        skills_required: ['JavaScript'],
        city_id: 1
      }

      const result = createOpportunityRequestSchema.safeParse(invalidRequest)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('20 caracteres')
      }
    })

    it('should reject description longer than 2000 characters', () => {
      const invalidRequest = {
        title: 'Valid Title',
        description: 'a'.repeat(2001),
        type: 'proyecto',
        skills_required: ['JavaScript'],
        city_id: 1
      }

      const result = createOpportunityRequestSchema.safeParse(invalidRequest)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('2000 caracteres')
      }
    })

    it('should reject empty skills_required array', () => {
      const invalidRequest = {
        title: 'Valid Title',
        description: 'Valid description here',
        type: 'proyecto',
        skills_required: [],
        city_id: 1
      }

      const result = createOpportunityRequestSchema.safeParse(invalidRequest)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('al menos una habilidad')
      }
    })
  })

  describe('updateOpportunityRequestSchema', () => {
    it('should validate partial update', () => {
      const validUpdate = {
        title: 'Updated Title'
      }

      const result = updateOpportunityRequestSchema.safeParse(validUpdate)
      expect(result.success).toBe(true)
    })

    it('should validate status update', () => {
      const validUpdate = {
        status: 'en_progreso'
      }

      const result = updateOpportunityRequestSchema.safeParse(validUpdate)
      expect(result.success).toBe(true)
    })

    it('should validate empty update object', () => {
      const validUpdate = {}

      const result = updateOpportunityRequestSchema.safeParse(validUpdate)
      expect(result.success).toBe(true)
    })

    it('should reject invalid status in update', () => {
      const invalidUpdate = {
        status: 'invalid-status'
      }

      const result = updateOpportunityRequestSchema.safeParse(invalidUpdate)
      expect(result.success).toBe(false)
    })
  })

  describe('filterOpportunitiesRequestSchema', () => {
    it('should validate all filters', () => {
      const validFilters = {
        type: 'proyecto',
        status: 'abierta',
        skills: ['JavaScript', 'React'],
        remote: true,
        search: 'developer',
        city_id: 1
      }

      const result = filterOpportunitiesRequestSchema.safeParse(validFilters)
      expect(result.success).toBe(true)
    })

    it('should validate filter by city_id', () => {
      const validFilters = {
        city_id: 1
      }

      const result = filterOpportunitiesRequestSchema.safeParse(validFilters)
      expect(result.success).toBe(true)
    })

    it('should validate empty filters', () => {
      const validFilters = {}

      const result = filterOpportunitiesRequestSchema.safeParse(validFilters)
      expect(result.success).toBe(true)
    })

    it('should validate partial filters', () => {
      const validFilters = {
        remote: true,
        search: 'frontend'
      }

      const result = filterOpportunitiesRequestSchema.safeParse(validFilters)
      expect(result.success).toBe(true)
    })
  })

  describe('opportunityWithCitySchema', () => {
    it('should validate opportunity with city info', () => {
      const validOpportunity = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        title: 'Test Opportunity',
        description: 'This is a test opportunity',
        type: 'proyecto',
        status: 'abierta',
        skills_required: ['JavaScript'],
        created_by: '550e8400-e29b-41d4-a716-446655440001',
        city_id: 1,
        location: null,
        remote: false,
        duration: null,
        compensation: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        city: {
          id: 1,
          name: 'Madrid',
          slug: 'madrid',
          image_url: 'https://example.com/madrid.jpg'
        },
        creator: {
          id: '550e8400-e29b-41d4-a716-446655440001',
          name: 'Test Creator',
          avatar_url: null,
          professional_title: null
        }
      }

      const result = opportunityWithCitySchema.safeParse(validOpportunity)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.city.name).toBe('Madrid')
        expect(result.data.city.slug).toBe('madrid')
        expect(result.data.creator.name).toBe('Test Creator')
      }
    })

    it('should reject opportunity with invalid city URL', () => {
      const invalidOpportunity = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        title: 'Test Opportunity',
        description: 'This is a test opportunity',
        type: 'proyecto',
        status: 'abierta',
        skills_required: ['JavaScript'],
        created_by: '550e8400-e29b-41d4-a716-446655440001',
        city_id: 1,
        location: null,
        remote: false,
        duration: null,
        compensation: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        city: {
          id: 1,
          name: 'Madrid',
          slug: 'madrid',
          image_url: 'not-a-url'
        },
        creator: {
          id: '550e8400-e29b-41d4-a716-446655440001',
          name: 'Test Creator',
          avatar_url: null,
          professional_title: null
        }
      }

      const result = opportunityWithCitySchema.safeParse(invalidOpportunity)
      expect(result.success).toBe(false)
    })
  })

  describe('Response Schemas', () => {
    it('should validate getOpportunityResponseSchema', () => {
      const validResponse = {
        opportunity: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          title: 'Test',
          description: 'Test description here',
          type: 'proyecto',
          status: 'abierta',
          skills_required: ['JavaScript'],
          created_by: '550e8400-e29b-41d4-a716-446655440001',
          location: null,
          remote: false,
          duration: null,
          compensation: null,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          creator: {
            id: '550e8400-e29b-41d4-a716-446655440001',
            name: 'Creator',
            avatar_url: null
          }
        }
      }

      const result = getOpportunityResponseSchema.safeParse(validResponse)
      expect(result.success).toBe(true)
    })

    it('should validate getOpportunitiesResponseSchema', () => {
      const validResponse = {
        opportunities: [],
        total: 0
      }

      const result = getOpportunitiesResponseSchema.safeParse(validResponse)
      expect(result.success).toBe(true)
    })

    it('should validate createOpportunityResponseSchema', () => {
      const validResponse = {
        opportunity: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          title: 'New Opportunity',
          description: 'Description here',
          type: 'proyecto',
          status: 'abierta',
          skills_required: ['JavaScript'],
          created_by: '550e8400-e29b-41d4-a716-446655440001',
          location: null,
          remote: false,
          duration: null,
          compensation: null,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        }
      }

      const result = createOpportunityResponseSchema.safeParse(validResponse)
      expect(result.success).toBe(true)
    })
  })
})
