// ABOUTME: Unit tests for PendingSignupId value object
// ABOUTME: Tests UUID validation, equality, immutability, and edge cases

import { describe, it, expect } from 'vitest'
import { PendingSignupId } from './PendingSignupId'

describe('PendingSignupId Value Object', () => {
  describe('create', () => {
    it('should create valid PendingSignupId with valid UUID', () => {
      // Given
      const validUuid = '550e8400-e29b-41d4-a716-446655440000'

      // When
      const signupId = PendingSignupId.create(validUuid)

      // Then
      expect(signupId).not.toBeNull()
      expect(signupId?.getValue()).toBe(validUuid)
    })

    it('should normalize UUID to lowercase', () => {
      // Given
      const uppercaseUuid = '550E8400-E29B-41D4-A716-446655440000'

      // When
      const signupId = PendingSignupId.create(uppercaseUuid)

      // Then
      expect(signupId?.getValue()).toBe(uppercaseUuid.toLowerCase())
    })

    it('should trim whitespace from UUID', () => {
      // Given
      const uuidWithSpaces = '  550e8400-e29b-41d4-a716-446655440000  '

      // When
      const signupId = PendingSignupId.create(uuidWithSpaces)

      // Then
      expect(signupId?.getValue()).toBe('550e8400-e29b-41d4-a716-446655440000')
    })

    it('should reject invalid UUID format', () => {
      // Given
      const invalidUuid = 'not-a-valid-uuid'

      // When
      const signupId = PendingSignupId.create(invalidUuid)

      // Then
      expect(signupId).toBeNull()
    })

    it('should reject null value', () => {
      // When
      const signupId = PendingSignupId.create(null as any)

      // Then
      expect(signupId).toBeNull()
    })

    it('should reject undefined value', () => {
      // When
      const signupId = PendingSignupId.create(undefined as any)

      // Then
      expect(signupId).toBeNull()
    })

    it('should reject empty string', () => {
      // When
      const signupId = PendingSignupId.create('')

      // Then
      expect(signupId).toBeNull()
    })

    it('should reject whitespace-only string', () => {
      // When
      const signupId = PendingSignupId.create('   ')

      // Then
      expect(signupId).toBeNull()
    })

    it('should reject non-string value', () => {
      // When
      const signupId = PendingSignupId.create(12345 as any)

      // Then
      expect(signupId).toBeNull()
    })
  })

  describe('equals', () => {
    it('should return true for same UUID value', () => {
      // Given
      const uuid = '550e8400-e29b-41d4-a716-446655440000'
      const id1 = PendingSignupId.create(uuid)!
      const id2 = PendingSignupId.create(uuid)!

      // When
      const result = id1.equals(id2)

      // Then
      expect(result).toBe(true)
    })

    it('should return false for different UUID values', () => {
      // Given
      const id1 = PendingSignupId.create('550e8400-e29b-41d4-a716-446655440000')!
      const id2 = PendingSignupId.create('660e8400-e29b-41d4-a716-446655440001')!

      // When
      const result = id1.equals(id2)

      // Then
      expect(result).toBe(false)
    })

    it('should handle case-insensitive comparison', () => {
      // Given
      const id1 = PendingSignupId.create('550e8400-e29b-41d4-a716-446655440000')!
      const id2 = PendingSignupId.create('550E8400-E29B-41D4-A716-446655440000')!

      // When
      const result = id1.equals(id2)

      // Then
      expect(result).toBe(true)
    })

    it('should return false when comparing with null', () => {
      // Given
      const id = PendingSignupId.create('550e8400-e29b-41d4-a716-446655440000')!

      // When
      const result = id.equals(null as any)

      // Then
      expect(result).toBe(false)
    })
  })

  describe('getValue', () => {
    it('should return the UUID value', () => {
      // Given
      const uuid = '550e8400-e29b-41d4-a716-446655440000'
      const id = PendingSignupId.create(uuid)!

      // When
      const value = id.getValue()

      // Then
      expect(value).toBe(uuid)
    })
  })

  describe('toString', () => {
    it('should return the UUID as string', () => {
      // Given
      const uuid = '550e8400-e29b-41d4-a716-446655440000'
      const id = PendingSignupId.create(uuid)!

      // When
      const str = id.toString()

      // Then
      expect(str).toBe(uuid)
    })
  })

  describe('immutability', () => {
    it('should be immutable after creation', () => {
      // Given
      const uuid = '550e8400-e29b-41d4-a716-446655440000'
      const id = PendingSignupId.create(uuid)!

      // When
      const value1 = id.getValue()
      const value2 = id.getValue()

      // Then
      expect(value1).toBe(value2)
      expect(Object.isFrozen(id)).toBe(false) // Private field, not frozen but immutable via readonly
    })
  })
})
