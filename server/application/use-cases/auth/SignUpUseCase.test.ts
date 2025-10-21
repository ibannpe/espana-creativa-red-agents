// ABOUTME: Unit tests for SignUpUseCase
// ABOUTME: Tests user registration with mocked auth service, repository, and email service

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SignUpUseCase, SignUpRequest } from './SignUpUseCase'
import { IAuthService } from '../../ports/services/IAuthService'
import { IUserRepository } from '../../ports/repositories/IUserRepository'
import { IEmailService } from '../../ports/services/IEmailService'
import { User } from '../../../domain/entities/User'
import { Email } from '../../../domain/value-objects/Email'
import { UserId } from '../../../domain/value-objects/UserId'

describe('SignUpUseCase', () => {
  let useCase: SignUpUseCase
  let mockAuthService: IAuthService
  let mockUserRepository: IUserRepository
  let mockEmailService: IEmailService

  beforeEach(() => {
    // Create mock services
    mockAuthService = {
      signUp: vi.fn(),
      signIn: vi.fn(),
      signOut: vi.fn(),
      getUser: vi.fn(),
      deleteUser: vi.fn()
    } as unknown as IAuthService

    mockUserRepository = {
      findByEmail: vi.fn(),
      findById: vi.fn(),
      save: vi.fn(),
      update: vi.fn(),
      search: vi.fn()
    } as unknown as IUserRepository

    mockEmailService = {
      sendWelcomeEmail: vi.fn(),
      sendEmail: vi.fn(),
      sendProfileReminderEmail: vi.fn(),
      sendMessageNotification: vi.fn(),
      sendOpportunityNotification: vi.fn()
    } as unknown as IEmailService

    useCase = new SignUpUseCase(mockAuthService, mockUserRepository, mockEmailService)
  })

  describe('execute - successful sign up', () => {
    it('should create user account successfully', async () => {
      const request: SignUpRequest = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      }

      const userId = '550e8400-e29b-41d4-a716-446655440000'

      // Mock no existing user
      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(null)

      // Mock successful auth service signup
      vi.mocked(mockAuthService.signUp).mockResolvedValue({
        user: { id: userId, email: request.email },
        error: null
      })

      // Mock successful repository save
      vi.mocked(mockUserRepository.save).mockResolvedValue(undefined)

      // Mock email service (fire and forget)
      vi.mocked(mockEmailService.sendWelcomeEmail).mockResolvedValue(undefined)

      const result = await useCase.execute(request)

      expect(result.error).toBeNull()
      expect(result.user).not.toBeNull()
      expect(result.user?.getEmail().getValue()).toBe('test@example.com')
      expect(result.user?.getName()).toBe('Test User')
      expect(result.user?.getRoleIds()).toEqual([3]) // Emprendedor
    })

    it('should send welcome email after signup', async () => {
      const request: SignUpRequest = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      }

      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(null)
      vi.mocked(mockAuthService.signUp).mockResolvedValue({
        user: { id: '550e8400-e29b-41d4-a716-446655440000', email: request.email },
        error: null
      })
      vi.mocked(mockUserRepository.save).mockResolvedValue(undefined)
      vi.mocked(mockEmailService.sendWelcomeEmail).mockResolvedValue(undefined)

      await useCase.execute(request)

      expect(mockEmailService.sendWelcomeEmail).toHaveBeenCalledWith(
        expect.objectContaining({ getValue: expect.any(Function) }),
        request.name
      )
    })
  })

  describe('execute - validation errors', () => {
    it('should reject invalid email format', async () => {
      const request: SignUpRequest = {
        email: 'invalid-email',
        password: 'password123',
        name: 'Test User'
      }

      const result = await useCase.execute(request)

      expect(result.error).toBe('Invalid email format')
      expect(result.user).toBeNull()
      expect(mockAuthService.signUp).not.toHaveBeenCalled()
    })

    it('should reject password shorter than 8 characters', async () => {
      const request: SignUpRequest = {
        email: 'test@example.com',
        password: 'short',
        name: 'Test User'
      }

      const result = await useCase.execute(request)

      expect(result.error).toBe('Password must be at least 8 characters')
      expect(result.user).toBeNull()
      expect(mockAuthService.signUp).not.toHaveBeenCalled()
    })

    it('should reject empty name', async () => {
      const request: SignUpRequest = {
        email: 'test@example.com',
        password: 'password123',
        name: ''
      }

      const result = await useCase.execute(request)

      expect(result.error).toBe('Name must be at least 2 characters')
      expect(result.user).toBeNull()
    })

    it('should reject name shorter than 2 characters', async () => {
      const request: SignUpRequest = {
        email: 'test@example.com',
        password: 'password123',
        name: 'A'
      }

      const result = await useCase.execute(request)

      expect(result.error).toBe('Name must be at least 2 characters')
      expect(result.user).toBeNull()
    })

    it('should reject whitespace-only name', async () => {
      const request: SignUpRequest = {
        email: 'test@example.com',
        password: 'password123',
        name: '   '
      }

      const result = await useCase.execute(request)

      expect(result.error).toBe('Name must be at least 2 characters')
      expect(result.user).toBeNull()
    })
  })

  describe('execute - business rule errors', () => {
    it('should reject if user already exists', async () => {
      const request: SignUpRequest = {
        email: 'existing@example.com',
        password: 'password123',
        name: 'Test User'
      }

      // Mock existing user
      const existingUser = User.create({
        id: UserId.create('550e8400-e29b-41d4-a716-446655440000')!,
        email: Email.create('existing@example.com')!,
        name: 'Existing User',
        avatarUrl: null,
        bio: null,
        location: null,
        linkedinUrl: null,
        websiteUrl: null,
        skills: [],
        interests: [],
        roleIds: [3],
        createdAt: new Date(),
        updatedAt: new Date()
      })

      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(existingUser)

      const result = await useCase.execute(request)

      expect(result.error).toBe('User with this email already exists')
      expect(result.user).toBeNull()
      expect(mockAuthService.signUp).not.toHaveBeenCalled()
    })
  })

  describe('execute - auth service errors', () => {
    it('should handle auth service failure', async () => {
      const request: SignUpRequest = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      }

      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(null)
      vi.mocked(mockAuthService.signUp).mockResolvedValue({
        user: null,
        error: { message: 'Auth service unavailable' }
      })

      const result = await useCase.execute(request)

      expect(result.error).toBe('Auth service unavailable')
      expect(result.user).toBeNull()
    })

    it('should handle missing error message from auth service', async () => {
      const request: SignUpRequest = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      }

      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(null)
      vi.mocked(mockAuthService.signUp).mockResolvedValue({
        user: null,
        error: null
      })

      const result = await useCase.execute(request)

      expect(result.error).toBe('Failed to create user account')
      expect(result.user).toBeNull()
    })
  })

  describe('execute - repository errors', () => {
    it('should rollback auth user if repository save fails', async () => {
      const request: SignUpRequest = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      }

      const userId = '550e8400-e29b-41d4-a716-446655440000'

      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(null)
      vi.mocked(mockAuthService.signUp).mockResolvedValue({
        user: { id: userId, email: request.email },
        error: null
      })

      // Mock repository failure
      vi.mocked(mockUserRepository.save).mockRejectedValue(new Error('Database error'))

      const result = await useCase.execute(request)

      expect(result.error).toBe('Failed to create user profile')
      expect(result.user).toBeNull()

      // Verify rollback was called
      expect(mockAuthService.deleteUser).toHaveBeenCalledWith(
        expect.objectContaining({ getValue: expect.any(Function) })
      )
    })
  })

  describe('execute - email service errors', () => {
    it('should not fail if welcome email sending fails', async () => {
      const request: SignUpRequest = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      }

      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(null)
      vi.mocked(mockAuthService.signUp).mockResolvedValue({
        user: { id: '550e8400-e29b-41d4-a716-446655440000', email: request.email },
        error: null
      })
      vi.mocked(mockUserRepository.save).mockResolvedValue(undefined)

      // Mock email failure (should be caught and not fail the signup)
      vi.mocked(mockEmailService.sendWelcomeEmail).mockRejectedValue(new Error('Email service down'))

      const result = await useCase.execute(request)

      // Signup should still succeed
      expect(result.error).toBeNull()
      expect(result.user).not.toBeNull()
    })
  })
})
