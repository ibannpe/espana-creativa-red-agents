// ABOUTME: Unit tests for UserId value object
// ABOUTME: Tests UUID validation, creation, comparison, and string operations

import { describe, it, expect } from 'vitest'
import { UserId } from './UserId'

describe('UserId Value Object', () => {
  const validUuid = '550e8400-e29b-41d4-a716-446655440000'
  const anotherValidUuid = '6ba7b810-9dad-11d1-80b4-00c04fd430c8'

  describe('create', () => {
    it('should create UserId with valid UUID', () => {
      const userId = UserId.create(validUuid)

      expect(userId).not.toBeNull()
      expect(userId?.getValue()).toBe(validUuid)
    })

    it('should accept UUIDs in different cases', () => {
      const upperCaseUuid = validUuid.toUpperCase()
      const userId = UserId.create(upperCaseUuid)

      expect(userId).not.toBeNull()
      expect(userId?.getValue()).toBe(upperCaseUuid)
    })

    it('should return null for invalid UUID format', () => {
      const invalidUuids = [
        'not-a-uuid',
        '123',
        '',
        '   ',
        '550e8400-e29b-41d4-a716',  // Too short
        '550e8400-e29b-41d4-a716-446655440000-extra',  // Too long
        '550e8400-e29b-41d4-a716-44665544000g',  // Invalid character
        '550e8400e29b41d4a716446655440000',  // Missing dashes
        '550e8400-e29b-41d4-a716-446655440000 '  // With whitespace
      ]

      invalidUuids.forEach(invalid => {
        expect(UserId.create(invalid)).toBeNull()
      })
    })

    it('should accept valid UUID v4 format', () => {
      const validUuids = [
        '550e8400-e29b-41d4-a716-446655440000',
        '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
        'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        '00000000-0000-0000-0000-000000000000'
      ]

      validUuids.forEach(valid => {
        expect(UserId.create(valid)).not.toBeNull()
      })
    })
  })

  describe('equals', () => {
    it('should return true for equal user IDs', () => {
      const userId1 = UserId.create(validUuid)!
      const userId2 = UserId.create(validUuid)!

      expect(userId1.equals(userId2)).toBe(true)
    })

    it('should return false for different user IDs', () => {
      const userId1 = UserId.create(validUuid)!
      const userId2 = UserId.create(anotherValidUuid)!

      expect(userId1.equals(userId2)).toBe(false)
    })

    it('should be case-sensitive when comparing', () => {
      const lowerCaseUuid = validUuid.toLowerCase()
      const upperCaseUuid = validUuid.toUpperCase()

      const userId1 = UserId.create(lowerCaseUuid)!
      const userId2 = UserId.create(upperCaseUuid)!

      expect(userId1.equals(userId2)).toBe(false)
    })
  })

  describe('toString', () => {
    it('should return UUID as string', () => {
      const userId = UserId.create(validUuid)!

      expect(userId.toString()).toBe(validUuid)
    })
  })

  describe('getValue', () => {
    it('should return the UUID value', () => {
      const userId = UserId.create(validUuid)!

      expect(userId.getValue()).toBe(validUuid)
    })
  })
})
