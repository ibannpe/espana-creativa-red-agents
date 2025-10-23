// ABOUTME: Unit tests for signup approval Zod schemas
// ABOUTME: Tests validation rules for signup request, pending signup, and response schemas

import { describe, it, expect } from 'vitest'
import {
  submitSignupRequestSchema,
  submitSignupResponseSchema,
  pendingSignupSchema,
  getPendingSignupsResponseSchema,
  getPendingCountResponseSchema,
  approveRejectResponseSchema,
  errorResponseSchema
} from './signup-approval.schema'

describe('Signup Approval Schemas', () => {
  describe('submitSignupRequestSchema', () => {
    it('should validate correct signup request data', () => {
      const validData = {
        email: 'test@example.com',
        name: 'Test User',
        surname: 'Surname'
      }

      const result = submitSignupRequestSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should validate data without surname (optional)', () => {
      const validData = {
        email: 'test@example.com',
        name: 'Test User'
      }

      const result = submitSignupRequestSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject invalid email', () => {
      const invalidData = {
        email: 'not-an-email',
        name: 'Test User'
      }

      const result = submitSignupRequestSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Email inválido')
      }
    })

    it('should reject name shorter than 2 characters', () => {
      const invalidData = {
        email: 'test@example.com',
        name: 'A'
      }

      const result = submitSignupRequestSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('al menos 2 caracteres')
      }
    })

    it('should reject missing required fields', () => {
      const invalidData = {
        email: 'test@example.com'
        // Missing name
      }

      const result = submitSignupRequestSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('submitSignupResponseSchema', () => {
    it('should validate correct submit response', () => {
      const validResponse = {
        success: true,
        pendingSignupId: '550e8400-e29b-41d4-a716-446655440000',
        message: 'Signup request submitted successfully'
      }

      const result = submitSignupResponseSchema.safeParse(validResponse)
      expect(result.success).toBe(true)
    })

    it('should reject invalid UUID', () => {
      const invalidResponse = {
        success: true,
        pendingSignupId: 'not-a-uuid',
        message: 'Signup request submitted successfully'
      }

      const result = submitSignupResponseSchema.safeParse(invalidResponse)
      expect(result.success).toBe(false)
    })

    it('should reject missing fields', () => {
      const invalidResponse = {
        success: true
        // Missing pendingSignupId and message
      }

      const result = submitSignupResponseSchema.safeParse(invalidResponse)
      expect(result.success).toBe(false)
    })
  })

  describe('pendingSignupSchema', () => {
    it('should validate correct pending signup data', () => {
      const validSignup = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'test@example.com',
        name: 'Test User',
        surname: 'Surname',
        status: 'pending' as const,
        createdAt: '2024-01-01T00:00:00Z',
        approvedAt: null,
        approvedBy: null,
        rejectedAt: null,
        rejectedBy: null,
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0'
      }

      const result = pendingSignupSchema.safeParse(validSignup)
      expect(result.success).toBe(true)
    })

    it('should validate approved signup', () => {
      const approvedSignup = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'test@example.com',
        name: 'Test User',
        surname: null,
        status: 'approved' as const,
        createdAt: '2024-01-01T00:00:00Z',
        approvedAt: '2024-01-02T00:00:00Z',
        approvedBy: '660e8400-e29b-41d4-a716-446655440000',
        rejectedAt: null,
        rejectedBy: null,
        ipAddress: null,
        userAgent: null
      }

      const result = pendingSignupSchema.safeParse(approvedSignup)
      expect(result.success).toBe(true)
    })

    it('should validate rejected signup', () => {
      const rejectedSignup = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'test@example.com',
        name: 'Test User',
        surname: null,
        status: 'rejected' as const,
        createdAt: '2024-01-01T00:00:00Z',
        approvedAt: null,
        approvedBy: null,
        rejectedAt: '2024-01-02T00:00:00Z',
        rejectedBy: '660e8400-e29b-41d4-a716-446655440000',
        ipAddress: null,
        userAgent: null
      }

      const result = pendingSignupSchema.safeParse(rejectedSignup)
      expect(result.success).toBe(true)
    })

    it('should reject invalid status', () => {
      const invalidSignup = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'test@example.com',
        name: 'Test User',
        surname: null,
        status: 'invalid-status',
        createdAt: '2024-01-01T00:00:00Z',
        approvedAt: null,
        approvedBy: null,
        rejectedAt: null,
        rejectedBy: null,
        ipAddress: null,
        userAgent: null
      }

      const result = pendingSignupSchema.safeParse(invalidSignup)
      expect(result.success).toBe(false)
    })

    it('should reject invalid UUID', () => {
      const invalidSignup = {
        id: 'not-a-uuid',
        email: 'test@example.com',
        name: 'Test User',
        surname: null,
        status: 'pending' as const,
        createdAt: '2024-01-01T00:00:00Z',
        approvedAt: null,
        approvedBy: null,
        rejectedAt: null,
        rejectedBy: null,
        ipAddress: null,
        userAgent: null
      }

      const result = pendingSignupSchema.safeParse(invalidSignup)
      expect(result.success).toBe(false)
    })
  })

  describe('getPendingSignupsResponseSchema', () => {
    it('should validate correct list response', () => {
      const validResponse = {
        success: true,
        signups: [
          {
            id: '550e8400-e29b-41d4-a716-446655440000',
            email: 'test1@example.com',
            name: 'User 1',
            surname: null,
            status: 'pending' as const,
            createdAt: '2024-01-01T00:00:00Z',
            approvedAt: null,
            approvedBy: null,
            rejectedAt: null,
            rejectedBy: null,
            ipAddress: null,
            userAgent: null
          },
          {
            id: '660e8400-e29b-41d4-a716-446655440000',
            email: 'test2@example.com',
            name: 'User 2',
            surname: 'Surname',
            status: 'approved' as const,
            createdAt: '2024-01-01T00:00:00Z',
            approvedAt: '2024-01-02T00:00:00Z',
            approvedBy: '770e8400-e29b-41d4-a716-446655440000',
            rejectedAt: null,
            rejectedBy: null,
            ipAddress: null,
            userAgent: null
          }
        ],
        total: 2,
        limit: 20,
        offset: 0
      }

      const result = getPendingSignupsResponseSchema.safeParse(validResponse)
      expect(result.success).toBe(true)
    })

    it('should validate empty list', () => {
      const emptyResponse = {
        success: true,
        signups: [],
        total: 0,
        limit: 20,
        offset: 0
      }

      const result = getPendingSignupsResponseSchema.safeParse(emptyResponse)
      expect(result.success).toBe(true)
    })

    it('should reject invalid signup in array', () => {
      const invalidResponse = {
        success: true,
        signups: [
          {
            id: 'invalid-uuid',
            email: 'test@example.com'
            // Missing required fields
          }
        ],
        total: 1,
        limit: 20,
        offset: 0
      }

      const result = getPendingSignupsResponseSchema.safeParse(invalidResponse)
      expect(result.success).toBe(false)
    })
  })

  describe('getPendingCountResponseSchema', () => {
    it('should validate correct count response', () => {
      const validResponse = {
        success: true,
        count: 5
      }

      const result = getPendingCountResponseSchema.safeParse(validResponse)
      expect(result.success).toBe(true)
    })

    it('should validate zero count', () => {
      const zeroResponse = {
        success: true,
        count: 0
      }

      const result = getPendingCountResponseSchema.safeParse(zeroResponse)
      expect(result.success).toBe(true)
    })

    it('should reject non-number count', () => {
      const invalidResponse = {
        success: true,
        count: '5' // String instead of number
      }

      const result = getPendingCountResponseSchema.safeParse(invalidResponse)
      expect(result.success).toBe(false)
    })
  })

  describe('approveRejectResponseSchema', () => {
    it('should validate correct approve/reject response', () => {
      const validResponse = {
        success: true,
        message: 'Signup approved successfully'
      }

      const result = approveRejectResponseSchema.safeParse(validResponse)
      expect(result.success).toBe(true)
    })

    it('should reject missing message', () => {
      const invalidResponse = {
        success: true
        // Missing message
      }

      const result = approveRejectResponseSchema.safeParse(invalidResponse)
      expect(result.success).toBe(false)
    })
  })

  describe('errorResponseSchema', () => {
    it('should validate error response', () => {
      const validError = {
        error: 'Something went wrong'
      }

      const result = errorResponseSchema.safeParse(validError)
      expect(result.success).toBe(true)
    })

    it('should reject non-string error', () => {
      const invalidError = {
        error: 123
      }

      const result = errorResponseSchema.safeParse(invalidError)
      expect(result.success).toBe(false)
    })
  })
})
