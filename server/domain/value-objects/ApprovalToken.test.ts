// ABOUTME: Unit tests for ApprovalToken value object
// ABOUTME: Tests token validation, uniqueness, immutability, and security edge cases

import { describe, it, expect } from 'vitest'
import { ApprovalToken } from './ApprovalToken'

describe('ApprovalToken Value Object', () => {
  describe('create', () => {
    it('should create valid ApprovalToken with valid UUID', () => {
      // Given
      const validUuid = '99a9b5c0-1234-5678-90ab-cdef12345678'

      // When
      const token = ApprovalToken.create(validUuid)

      // Then
      expect(token).not.toBeNull()
      expect(token?.getValue()).toBe(validUuid)
    })

    it('should normalize UUID to lowercase', () => {
      // Given
      const uppercaseUuid = '99A9B5C0-1234-5678-90AB-CDEF12345678'

      // When
      const token = ApprovalToken.create(uppercaseUuid)

      // Then
      expect(token?.getValue()).toBe(uppercaseUuid.toLowerCase())
    })

    it('should trim whitespace from UUID', () => {
      // Given
      const uuidWithSpaces = '  99a9b5c0-1234-5678-90ab-cdef12345678  '

      // When
      const token = ApprovalToken.create(uuidWithSpaces)

      // Then
      expect(token?.getValue()).toBe('99a9b5c0-1234-5678-90ab-cdef12345678')
    })

    it('should reject invalid UUID format', () => {
      // Given
      const invalidToken = 'invalid-token-format'

      // When
      const token = ApprovalToken.create(invalidToken)

      // Then
      expect(token).toBeNull()
    })

    it('should reject null value', () => {
      // When
      const token = ApprovalToken.create(null as any)

      // Then
      expect(token).toBeNull()
    })

    it('should reject undefined value', () => {
      // When
      const token = ApprovalToken.create(undefined as any)

      // Then
      expect(token).toBeNull()
    })

    it('should reject empty string', () => {
      // When
      const token = ApprovalToken.create('')

      // Then
      expect(token).toBeNull()
    })

    it('should reject malicious injection attempts', () => {
      // Given
      const maliciousInput = "'; DROP TABLE pending_signups; --"

      // When
      const token = ApprovalToken.create(maliciousInput)

      // Then
      expect(token).toBeNull()
    })
  })

  describe('equals', () => {
    it('should return true for same token value', () => {
      // Given
      const uuid = '99a9b5c0-1234-5678-90ab-cdef12345678'
      const token1 = ApprovalToken.create(uuid)!
      const token2 = ApprovalToken.create(uuid)!

      // When
      const result = token1.equals(token2)

      // Then
      expect(result).toBe(true)
    })

    it('should return false for different token values', () => {
      // Given
      const token1 = ApprovalToken.create('99a9b5c0-1234-5678-90ab-cdef12345678')!
      const token2 = ApprovalToken.create('11b1c6d1-9999-1111-22bb-def123456789')!

      // When
      const result = token1.equals(token2)

      // Then
      expect(result).toBe(false)
    })

    it('should handle case-insensitive comparison', () => {
      // Given
      const token1 = ApprovalToken.create('99a9b5c0-1234-5678-90ab-cdef12345678')!
      const token2 = ApprovalToken.create('99A9B5C0-1234-5678-90AB-CDEF12345678')!

      // When
      const result = token1.equals(token2)

      // Then
      expect(result).toBe(true)
    })

    it('should return false when comparing with null', () => {
      // Given
      const token = ApprovalToken.create('99a9b5c0-1234-5678-90ab-cdef12345678')!

      // When
      const result = token.equals(null as any)

      // Then
      expect(result).toBe(false)
    })
  })

  describe('getValue', () => {
    it('should return the token value', () => {
      // Given
      const uuid = '99a9b5c0-1234-5678-90ab-cdef12345678'
      const token = ApprovalToken.create(uuid)!

      // When
      const value = token.getValue()

      // Then
      expect(value).toBe(uuid)
    })
  })

  describe('toString', () => {
    it('should return the token as string', () => {
      // Given
      const uuid = '99a9b5c0-1234-5678-90ab-cdef12345678'
      const token = ApprovalToken.create(uuid)!

      // When
      const str = token.toString()

      // Then
      expect(str).toBe(uuid)
    })
  })
})
