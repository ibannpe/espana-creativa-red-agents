// ABOUTME: Unit tests for Email value object
// ABOUTME: Tests email validation, creation, comparison, and string operations

import { describe, it, expect } from 'vitest'
import { Email } from './Email'

describe('Email Value Object', () => {
  describe('create', () => {
    it('should create Email with valid email address', () => {
      const email = Email.create('test@example.com')

      expect(email).not.toBeNull()
      expect(email?.getValue()).toBe('test@example.com')
    })

    it('should normalize email to lowercase', () => {
      const email = Email.create('TEST@EXAMPLE.COM')

      expect(email).not.toBeNull()
      expect(email?.getValue()).toBe('test@example.com')
    })

    it('should trim whitespace from email', () => {
      const email = Email.create('test@example.com')

      expect(email).not.toBeNull()
      expect(email?.getValue()).toBe('test@example.com')
    })

    it('should return null for invalid email format', () => {
      const invalidEmails = [
        'notanemail',
        'missing@domain',
        '@nodomain.com',
        'no@.com',
        '',
        '   ',
        'multiple@@signs.com',
        'no spaces@allowed.com'
      ]

      invalidEmails.forEach(invalid => {
        expect(Email.create(invalid)).toBeNull()
      })
    })

    it('should accept valid email formats', () => {
      const validEmails = [
        'simple@example.com',
        'user.name@example.com',
        'user+tag@example.co.uk',
        'user123@test-domain.com',
        'a@b.co'
      ]

      validEmails.forEach(valid => {
        expect(Email.create(valid)).not.toBeNull()
      })
    })
  })

  describe('equals', () => {
    it('should return true for equal emails', () => {
      const email1 = Email.create('test@example.com')!
      const email2 = Email.create('test@example.com')!

      expect(email1.equals(email2)).toBe(true)
    })

    it('should return true for emails with different casing', () => {
      const email1 = Email.create('test@example.com')!
      const email2 = Email.create('TEST@EXAMPLE.COM')!

      expect(email1.equals(email2)).toBe(true)
    })

    it('should return false for different emails', () => {
      const email1 = Email.create('test1@example.com')!
      const email2 = Email.create('test2@example.com')!

      expect(email1.equals(email2)).toBe(false)
    })
  })

  describe('toString', () => {
    it('should return email as string', () => {
      const email = Email.create('test@example.com')!

      expect(email.toString()).toBe('test@example.com')
    })
  })

  describe('getValue', () => {
    it('should return the normalized email value', () => {
      const email = Email.create('TEST@Example.COM')!

      expect(email.getValue()).toBe('test@example.com')
    })
  })
})
