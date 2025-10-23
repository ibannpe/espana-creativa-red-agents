// ABOUTME: Unit tests for SignupStatus value object
// ABOUTME: Tests status validation, transitions, and business rule enforcement

import { describe, it, expect } from 'vitest'
import { SignupStatus } from './SignupStatus'

describe('SignupStatus Value Object', () => {
  describe('create', () => {
    it('should create pending status', () => {
      const status = SignupStatus.create('pending')
      expect(status).not.toBeNull()
      expect(status?.getValue()).toBe('pending')
    })

    it('should create approved status', () => {
      const status = SignupStatus.create('approved')
      expect(status).not.toBeNull()
      expect(status?.getValue()).toBe('approved')
    })

    it('should create rejected status', () => {
      const status = SignupStatus.create('rejected')
      expect(status).not.toBeNull()
      expect(status?.getValue()).toBe('rejected')
    })

    it('should normalize to lowercase', () => {
      const status = SignupStatus.create('PENDING')
      expect(status?.getValue()).toBe('pending')
    })

    it('should trim whitespace', () => {
      const status = SignupStatus.create('  approved  ')
      expect(status?.getValue()).toBe('approved')
    })

    it('should reject invalid status', () => {
      const status = SignupStatus.create('invalid')
      expect(status).toBeNull()
    })

    it('should reject null', () => {
      const status = SignupStatus.create(null as any)
      expect(status).toBeNull()
    })

    it('should reject empty string', () => {
      const status = SignupStatus.create('')
      expect(status).toBeNull()
    })
  })

  describe('factory methods', () => {
    it('should create pending status via factory', () => {
      const status = SignupStatus.pending()
      expect(status.isPending()).toBe(true)
    })

    it('should create approved status via factory', () => {
      const status = SignupStatus.approved()
      expect(status.isApproved()).toBe(true)
    })

    it('should create rejected status via factory', () => {
      const status = SignupStatus.rejected()
      expect(status.isRejected()).toBe(true)
    })
  })

  describe('status checks', () => {
    it('should identify pending status correctly', () => {
      const status = SignupStatus.pending()
      expect(status.isPending()).toBe(true)
      expect(status.isApproved()).toBe(false)
      expect(status.isRejected()).toBe(false)
    })

    it('should identify approved status correctly', () => {
      const status = SignupStatus.approved()
      expect(status.isPending()).toBe(false)
      expect(status.isApproved()).toBe(true)
      expect(status.isRejected()).toBe(false)
    })

    it('should identify rejected status correctly', () => {
      const status = SignupStatus.rejected()
      expect(status.isPending()).toBe(false)
      expect(status.isApproved()).toBe(false)
      expect(status.isRejected()).toBe(true)
    })
  })

  describe('canTransitionTo', () => {
    it('should allow transition from pending to approved', () => {
      const pending = SignupStatus.pending()
      const approved = SignupStatus.approved()
      expect(pending.canTransitionTo(approved)).toBe(true)
    })

    it('should allow transition from pending to rejected', () => {
      const pending = SignupStatus.pending()
      const rejected = SignupStatus.rejected()
      expect(pending.canTransitionTo(rejected)).toBe(true)
    })

    it('should NOT allow transition from approved to rejected', () => {
      const approved = SignupStatus.approved()
      const rejected = SignupStatus.rejected()
      expect(approved.canTransitionTo(rejected)).toBe(false)
    })

    it('should NOT allow transition from rejected to approved', () => {
      const rejected = SignupStatus.rejected()
      const approved = SignupStatus.approved()
      expect(rejected.canTransitionTo(approved)).toBe(false)
    })

    it('should NOT allow transition from approved to pending', () => {
      const approved = SignupStatus.approved()
      const pending = SignupStatus.pending()
      expect(approved.canTransitionTo(pending)).toBe(false)
    })

    it('should NOT allow transition to same status', () => {
      const pending = SignupStatus.pending()
      const pending2 = SignupStatus.pending()
      expect(pending.canTransitionTo(pending2)).toBe(false)
    })
  })

  describe('equals', () => {
    it('should return true for same status', () => {
      const status1 = SignupStatus.pending()
      const status2 = SignupStatus.pending()
      expect(status1.equals(status2)).toBe(true)
    })

    it('should return false for different statuses', () => {
      const pending = SignupStatus.pending()
      const approved = SignupStatus.approved()
      expect(pending.equals(approved)).toBe(false)
    })

    it('should return false for null', () => {
      const status = SignupStatus.pending()
      expect(status.equals(null as any)).toBe(false)
    })
  })
})
