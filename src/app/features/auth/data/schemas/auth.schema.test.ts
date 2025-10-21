// ABOUTME: Unit tests for auth Zod schemas
// ABOUTME: Tests validation rules for sign up, sign in, and user response schemas

import { describe, it, expect } from 'vitest'
import {
  signUpRequestSchema,
  signInRequestSchema,
  userResponseSchema,
  errorResponseSchema
} from './auth.schema'

describe('Auth Schemas', () => {
  describe('signUpRequestSchema', () => {
    it('should validate correct sign up data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      }

      const result = signUpRequestSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject invalid email', () => {
      const invalidData = {
        email: 'not-an-email',
        password: 'password123',
        name: 'Test User'
      }

      const result = signUpRequestSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Email inválido')
      }
    })

    it('should reject password shorter than 8 characters', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'short',
        name: 'Test User'
      }

      const result = signUpRequestSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('al menos 8 caracteres')
      }
    })

    it('should reject name shorter than 2 characters', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'A'
      }

      const result = signUpRequestSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('al menos 2 caracteres')
      }
    })

    it('should reject missing fields', () => {
      const invalidData = {
        email: 'test@example.com'
        // Missing password and name
      }

      const result = signUpRequestSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('signInRequestSchema', () => {
    it('should validate correct sign in data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'password123'
      }

      const result = signInRequestSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject invalid email', () => {
      const invalidData = {
        email: 'not-an-email',
        password: 'password123'
      }

      const result = signInRequestSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject empty password', () => {
      const invalidData = {
        email: 'test@example.com',
        password: ''
      }

      const result = signInRequestSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('requerida')
      }
    })
  })

  describe('userResponseSchema', () => {
    it('should validate correct user response', () => {
      const validUser = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'test@example.com',
        name: 'Test User',
        avatar_url: null,
        bio: null,
        location: null,
        linkedin_url: null,
        website_url: null,
        skills: ['JavaScript', 'TypeScript'],
        interests: ['Web Development'],
        completed_pct: 75,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }

      const result = userResponseSchema.safeParse(validUser)
      expect(result.success).toBe(true)
    })

    it('should reject invalid UUID', () => {
      const invalidUser = {
        id: 'not-a-uuid',
        email: 'test@example.com',
        name: 'Test User',
        avatar_url: null,
        bio: null,
        location: null,
        linkedin_url: null,
        website_url: null,
        skills: [],
        interests: [],
        completed_pct: 0,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }

      const result = userResponseSchema.safeParse(invalidUser)
      expect(result.success).toBe(false)
    })

    it('should reject completed_pct > 100', () => {
      const invalidUser = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'test@example.com',
        name: 'Test User',
        avatar_url: null,
        bio: null,
        location: null,
        linkedin_url: null,
        website_url: null,
        skills: [],
        interests: [],
        completed_pct: 150, // Invalid
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }

      const result = userResponseSchema.safeParse(invalidUser)
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
