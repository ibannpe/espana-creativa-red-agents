# Backend Testing Strategy for España Creativa Red

## Executive Summary

This document outlines a comprehensive testing strategy for the España Creativa Red backend, built using hexagonal architecture with Express.js, TypeScript, and Supabase. The strategy prioritizes unit tests following the test pyramid model, with clear separation of concerns across architectural layers.

**Current Status**: Backend fully implemented (4 entities, 24 use cases, 4 repositories) - ZERO tests written
**Test Framework**: Vitest (configured)
**Target Coverage**: 80% lines/functions/branches/statements (already configured in vitest.config.ts)

---

## 1. Test Structure and Organization

### Directory Structure

```
server/
├── domain/
│   ├── entities/
│   │   ├── User.ts
│   │   ├── User.test.ts                    # Domain entity tests
│   │   ├── Connection.ts
│   │   ├── Connection.test.ts
│   │   ├── Opportunity.ts
│   │   ├── Opportunity.test.ts
│   │   ├── Message.ts
│   │   └── Message.test.ts
│   └── value-objects/
│       ├── Email.ts
│       ├── Email.test.ts                   # Value object tests
│       ├── UserId.ts
│       ├── UserId.test.ts
│       ├── CompletionPercentage.ts
│       └── CompletionPercentage.test.ts
├── application/
│   ├── use-cases/
│   │   ├── auth/
│   │   │   ├── SignUpUseCase.ts
│   │   │   ├── SignUpUseCase.test.ts       # Use case tests
│   │   │   ├── SignInUseCase.ts
│   │   │   └── SignInUseCase.test.ts
│   │   ├── users/
│   │   │   ├── GetUserProfileUseCase.test.ts
│   │   │   ├── UpdateUserProfileUseCase.test.ts
│   │   │   └── SearchUsersUseCase.test.ts
│   │   ├── network/
│   │   │   └── [7 use case test files]
│   │   ├── opportunities/
│   │   │   └── [6 use case test files]
│   │   └── messages/
│   │       └── [6 use case test files]
│   └── ports/
│       └── __mocks__/
│           ├── MockUserRepository.ts        # Shared test mocks
│           ├── MockAuthService.ts
│           ├── MockEmailService.ts
│           ├── MockConnectionRepository.ts
│           ├── MockOpportunityRepository.ts
│           └── MockMessageRepository.ts
├── infrastructure/
│   ├── adapters/
│   │   ├── repositories/
│   │   │   ├── SupabaseUserRepository.test.ts      # Repository tests
│   │   │   ├── SupabaseConnectionRepository.test.ts
│   │   │   ├── SupabaseOpportunityRepository.test.ts
│   │   │   └── SupabaseMessageRepository.test.ts
│   │   └── services/
│   │       ├── SupabaseAuthService.test.ts
│   │       └── ResendEmailService.test.ts
│   └── api/
│       └── routes/
│           ├── auth.routes.test.ts          # API route tests
│           ├── users.routes.test.ts
│           ├── connections.routes.test.ts
│           ├── opportunities.routes.test.ts
│           ├── email.routes.test.ts
│           └── messages.routes.test.ts
└── test/
    ├── builders/                            # Test data builders
    │   ├── UserBuilder.ts
    │   ├── ConnectionBuilder.ts
    │   ├── OpportunityBuilder.ts
    │   └── MessageBuilder.ts
    ├── fixtures/                            # Static test fixtures
    │   ├── users.fixtures.ts
    │   ├── connections.fixtures.ts
    │   ├── opportunities.fixtures.ts
    │   └── messages.fixtures.ts
    └── utils/                               # Test utilities
        ├── mockSupabaseClient.ts
        ├── mockExpressRequest.ts
        ├── mockExpressResponse.ts
        └── testHelpers.ts
```

### File Naming Convention

- Test files: `[ComponentName].test.ts` (placed alongside source file)
- Mock repositories: `Mock[Name]Repository.ts` (in `application/ports/__mocks__/`)
- Test builders: `[EntityName]Builder.ts` (in `server/test/builders/`)
- Fixtures: `[domain].fixtures.ts` (in `server/test/fixtures/`)

---

## 2. Layer-by-Layer Testing Strategy

### 2.1 Domain Layer Testing

**What to Test**: Business logic, invariant enforcement, state transitions

**Coverage Target**: 95%+ (critical business logic)

**Mocking Strategy**: NO mocking - pure unit tests, domain entities have no dependencies

#### Value Objects Tests

**Focus Areas**:
- Valid input acceptance
- Invalid input rejection (returns null or throws)
- Immutability enforcement
- Equality semantics
- Edge cases (boundaries, empty strings, special characters)

**Example: Email.test.ts**

```typescript
// ABOUTME: Unit tests for Email value object ensuring proper validation and immutability
// ABOUTME: Tests email format validation, case normalization, and equality semantics

import { describe, it, expect } from 'vitest'
import { Email } from './Email'

describe('Email Value Object', () => {
  describe('create', () => {
    it('should create valid email with proper format', () => {
      const email = Email.create('test@example.com')

      expect(email).not.toBeNull()
      expect(email!.getValue()).toBe('test@example.com')
    })

    it('should normalize email to lowercase', () => {
      const email = Email.create('TEST@EXAMPLE.COM')

      expect(email!.getValue()).toBe('test@example.com')
    })

    it('should trim whitespace from email', () => {
      const email = Email.create('  test@example.com  ')

      expect(email!.getValue()).toBe('test@example.com')
    })

    it('should reject email without @', () => {
      const email = Email.create('testexample.com')

      expect(email).toBeNull()
    })

    it('should reject email without domain', () => {
      const email = Email.create('test@')

      expect(email).toBeNull()
    })

    it('should reject email without local part', () => {
      const email = Email.create('@example.com')

      expect(email).toBeNull()
    })

    it('should reject email without TLD', () => {
      const email = Email.create('test@example')

      expect(email).toBeNull()
    })

    it('should reject empty string', () => {
      const email = Email.create('')

      expect(email).toBeNull()
    })

    it('should reject email with spaces', () => {
      const email = Email.create('test user@example.com')

      expect(email).toBeNull()
    })

    it('should accept email with plus addressing', () => {
      const email = Email.create('test+label@example.com')

      expect(email).not.toBeNull()
      expect(email!.getValue()).toBe('test+label@example.com')
    })

    it('should accept email with subdomain', () => {
      const email = Email.create('test@mail.example.com')

      expect(email).not.toBeNull()
      expect(email!.getValue()).toBe('test@mail.example.com')
    })
  })

  describe('equals', () => {
    it('should return true for identical emails', () => {
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
    it('should return email string', () => {
      const email = Email.create('test@example.com')!

      expect(email.toString()).toBe('test@example.com')
    })
  })

  describe('getValue', () => {
    it('should return normalized email value', () => {
      const email = Email.create('  TEST@Example.COM  ')!

      expect(email.getValue()).toBe('test@example.com')
    })
  })
})
```

**Test Count**: ~15-20 tests per value object
**Duration Target**: < 50ms total

#### Entity Tests

**Focus Areas**:
- Entity creation and validation
- Business logic methods (profile completion, role checks, status transitions)
- State mutation (updateProfile, accept, reject, block, etc.)
- Invariant enforcement (cannot connect to self, date validation, etc.)
- Edge cases and boundary conditions

**Example: Connection.test.ts**

```typescript
// ABOUTME: Unit tests for Connection entity validating business rules and state transitions
// ABOUTME: Tests connection status lifecycle, user relationship logic, and invariant enforcement

import { describe, it, expect, beforeEach } from 'vitest'
import { Connection, ConnectionStatus } from './Connection'

describe('Connection Entity', () => {
  const validId = '123e4567-e89b-12d3-a456-426614174000'
  const requesterId = '123e4567-e89b-12d3-a456-426614174001'
  const addresseeId = '123e4567-e89b-12d3-a456-426614174002'
  const now = new Date()

  describe('create', () => {
    it('should create connection with valid props', () => {
      const connection = Connection.create({
        id: validId,
        requesterId,
        addresseeId,
        status: 'pending',
        createdAt: now,
        updatedAt: now
      })

      expect(connection.id).toBe(validId)
      expect(connection.requesterId).toBe(requesterId)
      expect(connection.addresseeId).toBe(addresseeId)
      expect(connection.status).toBe('pending')
    })

    it('should throw error when ID is empty', () => {
      expect(() => {
        Connection.create({
          id: '',
          requesterId,
          addresseeId,
          status: 'pending',
          createdAt: now,
          updatedAt: now
        })
      }).toThrow('Connection ID cannot be empty')
    })

    it('should throw error when requester ID is empty', () => {
      expect(() => {
        Connection.create({
          id: validId,
          requesterId: '',
          addresseeId,
          status: 'pending',
          createdAt: now,
          updatedAt: now
        })
      }).toThrow('Requester ID cannot be empty')
    })

    it('should throw error when addressee ID is empty', () => {
      expect(() => {
        Connection.create({
          id: validId,
          requesterId,
          addresseeId: '',
          status: 'pending',
          createdAt: now,
          updatedAt: now
        })
      }).toThrow('Addressee ID cannot be empty')
    })

    it('should throw error when trying to connect to self', () => {
      expect(() => {
        Connection.create({
          id: validId,
          requesterId,
          addresseeId: requesterId, // Same as requester
          status: 'pending',
          createdAt: now,
          updatedAt: now
        })
      }).toThrow('Cannot create connection with yourself')
    })

    it('should throw error when status is invalid', () => {
      expect(() => {
        Connection.create({
          id: validId,
          requesterId,
          addresseeId,
          status: 'invalid' as ConnectionStatus,
          createdAt: now,
          updatedAt: now
        })
      }).toThrow('Invalid connection status')
    })

    it('should throw error when createdAt is after updatedAt', () => {
      const later = new Date(now.getTime() + 10000)

      expect(() => {
        Connection.create({
          id: validId,
          requesterId,
          addresseeId,
          status: 'pending',
          createdAt: later,
          updatedAt: now
        })
      }).toThrow('Created date cannot be after updated date')
    })
  })

  describe('createRequest', () => {
    it('should create new pending connection', () => {
      const connection = Connection.createRequest(validId, requesterId, addresseeId)

      expect(connection.id).toBe(validId)
      expect(connection.requesterId).toBe(requesterId)
      expect(connection.addresseeId).toBe(addresseeId)
      expect(connection.status).toBe('pending')
      expect(connection.createdAt).toBeInstanceOf(Date)
      expect(connection.updatedAt).toBeInstanceOf(Date)
    })
  })

  describe('accept', () => {
    it('should accept pending connection', () => {
      const connection = Connection.createRequest(validId, requesterId, addresseeId)
      const originalUpdatedAt = connection.updatedAt

      connection.accept()

      expect(connection.status).toBe('accepted')
      expect(connection.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime())
    })

    it('should throw error when accepting already accepted connection', () => {
      const connection = Connection.createRequest(validId, requesterId, addresseeId)
      connection.accept()

      expect(() => connection.accept()).toThrow(
        "Cannot accept connection with status 'accepted'. Only 'pending' connections can be accepted."
      )
    })

    it('should throw error when accepting rejected connection', () => {
      const connection = Connection.createRequest(validId, requesterId, addresseeId)
      connection.reject()

      expect(() => connection.accept()).toThrow(
        "Cannot accept connection with status 'rejected'"
      )
    })

    it('should throw error when accepting blocked connection', () => {
      const connection = Connection.createRequest(validId, requesterId, addresseeId)
      connection.block()

      expect(() => connection.accept()).toThrow(
        "Cannot accept connection with status 'blocked'"
      )
    })
  })

  describe('reject', () => {
    it('should reject pending connection', () => {
      const connection = Connection.createRequest(validId, requesterId, addresseeId)

      connection.reject()

      expect(connection.status).toBe('rejected')
    })

    it('should throw error when rejecting accepted connection', () => {
      const connection = Connection.createRequest(validId, requesterId, addresseeId)
      connection.accept()

      expect(() => connection.reject()).toThrow(
        "Cannot reject connection with status 'accepted'"
      )
    })
  })

  describe('block', () => {
    it('should block connection from pending status', () => {
      const connection = Connection.createRequest(validId, requesterId, addresseeId)

      connection.block()

      expect(connection.status).toBe('blocked')
    })

    it('should block connection from accepted status', () => {
      const connection = Connection.createRequest(validId, requesterId, addresseeId)
      connection.accept()

      connection.block()

      expect(connection.status).toBe('blocked')
    })

    it('should block connection from rejected status', () => {
      const connection = Connection.createRequest(validId, requesterId, addresseeId)
      connection.reject()

      connection.block()

      expect(connection.status).toBe('blocked')
    })
  })

  describe('involvesUser', () => {
    it('should return true for requester', () => {
      const connection = Connection.createRequest(validId, requesterId, addresseeId)

      expect(connection.involvesUser(requesterId)).toBe(true)
    })

    it('should return true for addressee', () => {
      const connection = Connection.createRequest(validId, requesterId, addresseeId)

      expect(connection.involvesUser(addresseeId)).toBe(true)
    })

    it('should return false for other user', () => {
      const connection = Connection.createRequest(validId, requesterId, addresseeId)
      const otherId = '123e4567-e89b-12d3-a456-426614174099'

      expect(connection.involvesUser(otherId)).toBe(false)
    })
  })

  describe('getOtherUser', () => {
    it('should return addressee when given requester', () => {
      const connection = Connection.createRequest(validId, requesterId, addresseeId)

      expect(connection.getOtherUser(requesterId)).toBe(addresseeId)
    })

    it('should return requester when given addressee', () => {
      const connection = Connection.createRequest(validId, requesterId, addresseeId)

      expect(connection.getOtherUser(addresseeId)).toBe(requesterId)
    })

    it('should return null when given unrelated user', () => {
      const connection = Connection.createRequest(validId, requesterId, addresseeId)
      const otherId = '123e4567-e89b-12d3-a456-426614174099'

      expect(connection.getOtherUser(otherId)).toBeNull()
    })
  })

  describe('isRequester', () => {
    it('should return true for requester', () => {
      const connection = Connection.createRequest(validId, requesterId, addresseeId)

      expect(connection.isRequester(requesterId)).toBe(true)
    })

    it('should return false for addressee', () => {
      const connection = Connection.createRequest(validId, requesterId, addresseeId)

      expect(connection.isRequester(addresseeId)).toBe(false)
    })
  })

  describe('isAddressee', () => {
    it('should return true for addressee', () => {
      const connection = Connection.createRequest(validId, requesterId, addresseeId)

      expect(connection.isAddressee(addresseeId)).toBe(true)
    })

    it('should return false for requester', () => {
      const connection = Connection.createRequest(validId, requesterId, addresseeId)

      expect(connection.isAddressee(requesterId)).toBe(false)
    })
  })

  describe('isActive', () => {
    it('should return true for accepted connection', () => {
      const connection = Connection.createRequest(validId, requesterId, addresseeId)
      connection.accept()

      expect(connection.isActive()).toBe(true)
    })

    it('should return false for pending connection', () => {
      const connection = Connection.createRequest(validId, requesterId, addresseeId)

      expect(connection.isActive()).toBe(false)
    })

    it('should return false for rejected connection', () => {
      const connection = Connection.createRequest(validId, requesterId, addresseeId)
      connection.reject()

      expect(connection.isActive()).toBe(false)
    })

    it('should return false for blocked connection', () => {
      const connection = Connection.createRequest(validId, requesterId, addresseeId)
      connection.block()

      expect(connection.isActive()).toBe(false)
    })
  })

  describe('isPending', () => {
    it('should return true for pending connection', () => {
      const connection = Connection.createRequest(validId, requesterId, addresseeId)

      expect(connection.isPending()).toBe(true)
    })

    it('should return false for accepted connection', () => {
      const connection = Connection.createRequest(validId, requesterId, addresseeId)
      connection.accept()

      expect(connection.isPending()).toBe(false)
    })
  })

  describe('toObject', () => {
    it('should convert to plain object with all properties', () => {
      const connection = Connection.createRequest(validId, requesterId, addresseeId)
      const obj = connection.toObject()

      expect(obj).toEqual({
        id: validId,
        requesterId,
        addresseeId,
        status: 'pending',
        createdAt: connection.createdAt,
        updatedAt: connection.updatedAt
      })
    })
  })
})
```

**Test Count**: ~30-50 tests per entity (depending on complexity)
**Duration Target**: < 100ms total per entity

---

### 2.2 Application Layer Testing (Use Cases)

**What to Test**: Orchestration logic, workflow coordination, authorization

**Coverage Target**: 90%+ (critical business workflows)

**Mocking Strategy**: Mock ALL ports (repositories, external services)

#### Use Case Test Pattern

**Focus Areas**:
- Happy path: Valid inputs produce expected outputs
- Validation errors: Invalid inputs return proper error messages
- Business rule enforcement: Edge cases respected
- Error handling: Repository/service failures handled gracefully
- Side effects: Ensure correct repository/service method calls
- Transaction boundaries: Rollback on failure (e.g., SignUpUseCase)

**Example: SignUpUseCase.test.ts**

```typescript
// ABOUTME: Unit tests for SignUpUseCase validating user registration workflow
// ABOUTME: Tests validation, repository interaction, email service integration, and error handling

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { SignUpUseCase, SignUpRequest } from './SignUpUseCase'
import { Email } from '../../../domain/value-objects/Email'
import { UserId } from '../../../domain/value-objects/UserId'
import { User } from '../../../domain/entities/User'

// Mock implementations
class MockAuthService {
  signUp = vi.fn()
  signIn = vi.fn()
  signOut = vi.fn()
  getCurrentUser = vi.fn()
  deleteUser = vi.fn()
}

class MockUserRepository {
  findByEmail = vi.fn()
  findById = vi.fn()
  save = vi.fn()
  update = vi.fn()
  delete = vi.fn()
  search = vi.fn()
  findAll = vi.fn()
}

class MockEmailService {
  sendWelcomeEmail = vi.fn()
  sendProfileReminder = vi.fn()
  sendMessageNotification = vi.fn()
  sendOpportunityNotification = vi.fn()
}

describe('SignUpUseCase', () => {
  let signUpUseCase: SignUpUseCase
  let mockAuthService: MockAuthService
  let mockUserRepository: MockUserRepository
  let mockEmailService: MockEmailService

  beforeEach(() => {
    mockAuthService = new MockAuthService()
    mockUserRepository = new MockUserRepository()
    mockEmailService = new MockEmailService()

    signUpUseCase = new SignUpUseCase(
      mockAuthService as any,
      mockUserRepository as any,
      mockEmailService as any
    )
  })

  describe('successful sign up', () => {
    it('should create user with valid inputs', async () => {
      // Arrange
      const request: SignUpRequest = {
        email: 'newuser@example.com',
        password: 'SecurePassword123',
        name: 'New User'
      }

      const userId = '123e4567-e89b-12d3-a456-426614174000'

      mockUserRepository.findByEmail.mockResolvedValue(null) // User doesn't exist
      mockAuthService.signUp.mockResolvedValue({
        user: { id: userId },
        error: null
      })
      mockUserRepository.save.mockResolvedValue(undefined)
      mockEmailService.sendWelcomeEmail.mockResolvedValue(undefined)

      // Act
      const result = await signUpUseCase.execute(request)

      // Assert
      expect(result.error).toBeNull()
      expect(result.user).not.toBeNull()
      expect(result.user!.getName()).toBe('New User')
      expect(result.user!.getEmail().getValue()).toBe('newuser@example.com')
      expect(result.user!.getRoleIds()).toEqual([3]) // Default emprendedor role

      // Verify repository called with correct user
      expect(mockUserRepository.save).toHaveBeenCalledTimes(1)
      const savedUser = mockUserRepository.save.mock.calls[0][0]
      expect(savedUser).toBeInstanceOf(User)
      expect(savedUser.getName()).toBe('New User')

      // Verify welcome email sent (fire and forget)
      expect(mockEmailService.sendWelcomeEmail).toHaveBeenCalledWith(
        expect.any(Email),
        'New User'
      )
    })
  })

  describe('validation errors', () => {
    it('should reject invalid email format', async () => {
      const request: SignUpRequest = {
        email: 'invalid-email',
        password: 'SecurePassword123',
        name: 'New User'
      }

      const result = await signUpUseCase.execute(request)

      expect(result.error).toBe('Invalid email format')
      expect(result.user).toBeNull()
      expect(mockAuthService.signUp).not.toHaveBeenCalled()
      expect(mockUserRepository.save).not.toHaveBeenCalled()
    })

    it('should reject password less than 8 characters', async () => {
      const request: SignUpRequest = {
        email: 'test@example.com',
        password: 'Short1',
        name: 'New User'
      }

      const result = await signUpUseCase.execute(request)

      expect(result.error).toBe('Password must be at least 8 characters')
      expect(result.user).toBeNull()
      expect(mockAuthService.signUp).not.toHaveBeenCalled()
    })

    it('should reject name less than 2 characters', async () => {
      const request: SignUpRequest = {
        email: 'test@example.com',
        password: 'SecurePassword123',
        name: 'A'
      }

      const result = await signUpUseCase.execute(request)

      expect(result.error).toBe('Name must be at least 2 characters')
      expect(result.user).toBeNull()
    })

    it('should reject empty name', async () => {
      const request: SignUpRequest = {
        email: 'test@example.com',
        password: 'SecurePassword123',
        name: ''
      }

      const result = await signUpUseCase.execute(request)

      expect(result.error).toBe('Name must be at least 2 characters')
      expect(result.user).toBeNull()
    })

    it('should reject whitespace-only name', async () => {
      const request: SignUpRequest = {
        email: 'test@example.com',
        password: 'SecurePassword123',
        name: '   '
      }

      const result = await signUpUseCase.execute(request)

      expect(result.error).toBe('Name must be at least 2 characters')
      expect(result.user).toBeNull()
    })
  })

  describe('duplicate user check', () => {
    it('should reject if user with email already exists', async () => {
      const request: SignUpRequest = {
        email: 'existing@example.com',
        password: 'SecurePassword123',
        name: 'New User'
      }

      const existingUser = User.create({
        id: UserId.create('123e4567-e89b-12d3-a456-426614174001')!,
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

      mockUserRepository.findByEmail.mockResolvedValue(existingUser)

      const result = await signUpUseCase.execute(request)

      expect(result.error).toBe('User with this email already exists')
      expect(result.user).toBeNull()
      expect(mockAuthService.signUp).not.toHaveBeenCalled()
    })
  })

  describe('auth service errors', () => {
    it('should handle auth service error', async () => {
      const request: SignUpRequest = {
        email: 'test@example.com',
        password: 'SecurePassword123',
        name: 'New User'
      }

      mockUserRepository.findByEmail.mockResolvedValue(null)
      mockAuthService.signUp.mockResolvedValue({
        user: null,
        error: { message: 'Email already registered in auth system' }
      })

      const result = await signUpUseCase.execute(request)

      expect(result.error).toBe('Email already registered in auth system')
      expect(result.user).toBeNull()
      expect(mockUserRepository.save).not.toHaveBeenCalled()
    })

    it('should handle auth service returning no user without error', async () => {
      const request: SignUpRequest = {
        email: 'test@example.com',
        password: 'SecurePassword123',
        name: 'New User'
      }

      mockUserRepository.findByEmail.mockResolvedValue(null)
      mockAuthService.signUp.mockResolvedValue({
        user: null,
        error: null
      })

      const result = await signUpUseCase.execute(request)

      expect(result.error).toBe('Failed to create user account')
      expect(result.user).toBeNull()
    })

    it('should handle invalid user ID from auth service', async () => {
      const request: SignUpRequest = {
        email: 'test@example.com',
        password: 'SecurePassword123',
        name: 'New User'
      }

      mockUserRepository.findByEmail.mockResolvedValue(null)
      mockAuthService.signUp.mockResolvedValue({
        user: { id: 'invalid-uuid' },
        error: null
      })

      const result = await signUpUseCase.execute(request)

      expect(result.error).toBe('Invalid user ID from auth service')
      expect(result.user).toBeNull()
    })
  })

  describe('repository errors and rollback', () => {
    it('should rollback auth user when repository save fails', async () => {
      const request: SignUpRequest = {
        email: 'test@example.com',
        password: 'SecurePassword123',
        name: 'New User'
      }

      const userId = '123e4567-e89b-12d3-a456-426614174000'

      mockUserRepository.findByEmail.mockResolvedValue(null)
      mockAuthService.signUp.mockResolvedValue({
        user: { id: userId },
        error: null
      })
      mockUserRepository.save.mockRejectedValue(new Error('Database connection failed'))

      const result = await signUpUseCase.execute(request)

      expect(result.error).toBe('Failed to create user profile')
      expect(result.user).toBeNull()

      // Verify rollback was attempted
      expect(mockAuthService.deleteUser).toHaveBeenCalledWith(
        expect.objectContaining({
          getValue: expect.any(Function)
        })
      )
    })
  })

  describe('email service errors', () => {
    it('should succeed even if welcome email fails (fire and forget)', async () => {
      const request: SignUpRequest = {
        email: 'test@example.com',
        password: 'SecurePassword123',
        name: 'New User'
      }

      const userId = '123e4567-e89b-12d3-a456-426614174000'

      mockUserRepository.findByEmail.mockResolvedValue(null)
      mockAuthService.signUp.mockResolvedValue({
        user: { id: userId },
        error: null
      })
      mockUserRepository.save.mockResolvedValue(undefined)
      mockEmailService.sendWelcomeEmail.mockRejectedValue(new Error('Email service down'))

      const result = await signUpUseCase.execute(request)

      // User creation should still succeed
      expect(result.error).toBeNull()
      expect(result.user).not.toBeNull()
    })
  })

  describe('edge cases', () => {
    it('should normalize email before checking duplicates', async () => {
      const request: SignUpRequest = {
        email: 'TEST@EXAMPLE.COM',
        password: 'SecurePassword123',
        name: 'New User'
      }

      mockUserRepository.findByEmail.mockResolvedValue(null)

      await signUpUseCase.execute(request)

      // Verify findByEmail was called with normalized (lowercase) email
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          getValue: expect.any(Function)
        })
      )
      const emailArg = mockUserRepository.findByEmail.mock.calls[0][0]
      expect(emailArg.getValue()).toBe('test@example.com')
    })

    it('should trim name before saving', async () => {
      const request: SignUpRequest = {
        email: 'test@example.com',
        password: 'SecurePassword123',
        name: '  New User  '
      }

      const userId = '123e4567-e89b-12d3-a456-426614174000'

      mockUserRepository.findByEmail.mockResolvedValue(null)
      mockAuthService.signUp.mockResolvedValue({
        user: { id: userId },
        error: null
      })
      mockUserRepository.save.mockResolvedValue(undefined)

      const result = await signUpUseCase.execute(request)

      expect(result.user!.getName()).toBe('  New User  ') // Name stored as-is
    })
  })
})
```

**Test Count**: ~20-30 tests per use case
**Duration Target**: < 200ms total per use case

---

### 2.3 Infrastructure Layer Testing (Repositories)

**What to Test**: Data mapping, query construction, error translation

**Coverage Target**: 85%+

**Mocking Strategy**: Two approaches based on test type

#### Unit Tests (Preferred for most cases)

**Approach**: Mock Supabase client, verify query construction and data mapping

**Example: SupabaseUserRepository.test.ts**

```typescript
// ABOUTME: Unit tests for SupabaseUserRepository validating data persistence and retrieval
// ABOUTME: Tests Supabase query construction, entity mapping, and error handling

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { SupabaseUserRepository } from './SupabaseUserRepository'
import { User } from '../../../domain/entities/User'
import { UserId } from '../../../domain/value-objects/UserId'
import { Email } from '../../../domain/value-objects/Email'
import { createMockSupabaseClient } from '../../../test/utils/mockSupabaseClient'

describe('SupabaseUserRepository', () => {
  let repository: SupabaseUserRepository
  let mockSupabase: any

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient()
    repository = new SupabaseUserRepository(mockSupabase)
  })

  describe('findById', () => {
    it('should return user when found', async () => {
      const userId = UserId.create('123e4567-e89b-12d3-a456-426614174000')!

      const mockData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        name: 'Test User',
        avatar_url: null,
        bio: 'Test bio',
        location: 'Madrid',
        linkedin_url: null,
        website_url: null,
        skills: ['TypeScript'],
        interests: ['AI'],
        user_roles: [{ role_id: 3 }],
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockData, error: null })
      })

      const result = await repository.findById(userId)

      expect(result).not.toBeNull()
      expect(result!.getId().getValue()).toBe('123e4567-e89b-12d3-a456-426614174000')
      expect(result!.getName()).toBe('Test User')
      expect(result!.getRoleIds()).toEqual([3])

      // Verify correct query construction
      expect(mockSupabase.from).toHaveBeenCalledWith('users')
    })

    it('should return null when user not found', async () => {
      const userId = UserId.create('123e4567-e89b-12d3-a456-426614174000')!

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } })
      })

      const result = await repository.findById(userId)

      expect(result).toBeNull()
    })

    it('should handle database errors gracefully', async () => {
      const userId = UserId.create('123e4567-e89b-12d3-a456-426614174000')!

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Connection timeout' } })
      })

      const result = await repository.findById(userId)

      expect(result).toBeNull()
    })
  })

  describe('save', () => {
    it('should save user successfully', async () => {
      const user = User.create({
        id: UserId.create('123e4567-e89b-12d3-a456-426614174000')!,
        email: Email.create('test@example.com')!,
        name: 'Test User',
        avatarUrl: null,
        bio: null,
        location: null,
        linkedinUrl: null,
        websiteUrl: null,
        skills: [],
        interests: [],
        roleIds: [3],
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      })

      mockSupabase.from.mockReturnValue({
        upsert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: '123e4567-e89b-12d3-a456-426614174000' },
          error: null
        })
      })

      const result = await repository.save(user)

      expect(result).toBe(user)

      // Verify upsert was called with correct data including completion_pct
      const upsertCall = mockSupabase.from().upsert
      expect(upsertCall).toHaveBeenCalledWith(
        expect.objectContaining({
          id: '123e4567-e89b-12d3-a456-426614174000',
          email: 'test@example.com',
          name: 'Test User',
          completed_pct: 20 // Only name filled
        })
      )
    })

    it('should calculate and save profile completion percentage', async () => {
      const user = User.create({
        id: UserId.create('123e4567-e89b-12d3-a456-426614174000')!,
        email: Email.create('test@example.com')!,
        name: 'Test User',
        avatarUrl: null,
        bio: 'Comprehensive bio',
        location: 'Madrid',
        linkedinUrl: null,
        websiteUrl: null,
        skills: ['TypeScript', 'Node.js'],
        interests: ['AI', 'Web Dev'],
        roleIds: [3],
        createdAt: new Date(),
        updatedAt: new Date()
      })

      mockSupabase.from.mockReturnValue({
        upsert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: {}, error: null })
      })

      await repository.save(user)

      const upsertCall = mockSupabase.from().upsert
      expect(upsertCall).toHaveBeenCalledWith(
        expect.objectContaining({
          completed_pct: 100 // All fields filled
        })
      )
    })

    it('should save user roles in separate table', async () => {
      const user = User.create({
        id: UserId.create('123e4567-e89b-12d3-a456-426614174000')!,
        email: Email.create('test@example.com')!,
        name: 'Test User',
        avatarUrl: null,
        bio: null,
        location: null,
        linkedinUrl: null,
        websiteUrl: null,
        skills: [],
        interests: [],
        roleIds: [1, 2, 3], // Multiple roles
        createdAt: new Date(),
        updatedAt: new Date()
      })

      let upsertCallCount = 0
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            upsert: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: {}, error: null })
          }
        } else if (table === 'user_roles') {
          return {
            upsert: vi.fn().mockImplementation((roles: any[]) => {
              upsertCallCount++
              expect(roles).toEqual([
                { user_id: '123e4567-e89b-12d3-a456-426614174000', role_id: 1 },
                { user_id: '123e4567-e89b-12d3-a456-426614174000', role_id: 2 },
                { user_id: '123e4567-e89b-12d3-a456-426614174000', role_id: 3 }
              ])
              return Promise.resolve({ error: null })
            })
          }
        }
      })

      await repository.save(user)

      expect(upsertCallCount).toBe(1)
    })

    it('should rollback user insert if roles save fails', async () => {
      const user = User.create({
        id: UserId.create('123e4567-e89b-12d3-a456-426614174000')!,
        email: Email.create('test@example.com')!,
        name: 'Test User',
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

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            upsert: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: {}, error: null }),
            delete: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ error: null })
          }
        } else if (table === 'user_roles') {
          return {
            upsert: vi.fn().mockResolvedValue({ error: { message: 'Foreign key violation' } })
          }
        }
      })

      await expect(repository.save(user)).rejects.toThrow('Failed to save user roles')

      // Verify rollback was attempted
      expect(mockSupabase.from('users').delete).toHaveBeenCalled()
    })

    it('should throw error when user save fails', async () => {
      const user = User.create({
        id: UserId.create('123e4567-e89b-12d3-a456-426614174000')!,
        email: Email.create('test@example.com')!,
        name: 'Test User',
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

      mockSupabase.from.mockReturnValue({
        upsert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Unique constraint violation' }
        })
      })

      await expect(repository.save(user)).rejects.toThrow('Failed to save user')
    })
  })

  describe('search', () => {
    it('should search by query text in name and bio', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [],
          error: null
        })
      })

      await repository.search('developer', {})

      expect(mockSupabase.from().or).toHaveBeenCalledWith(
        expect.stringContaining('name.ilike.%developer%')
      )
    })

    it('should filter by location', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [],
          error: null
        })
      })

      await repository.search('', { location: 'Madrid' })

      expect(mockSupabase.from().ilike).toHaveBeenCalledWith('location', '%Madrid%')
    })

    it('should filter by skills using overlaps', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        overlaps: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [],
          error: null
        })
      })

      await repository.search('', { skills: ['TypeScript', 'React'] })

      expect(mockSupabase.from().overlaps).toHaveBeenCalledWith('skills', ['TypeScript', 'React'])
    })

    it('should limit results to 50', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [],
          error: null
        })
      })

      await repository.search('test', {})

      expect(mockSupabase.from().limit).toHaveBeenCalledWith(50)
    })

    it('should return empty array on error', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Query error' }
        })
      })

      const result = await repository.search('test', {})

      expect(result).toEqual([])
    })
  })
})
```

**Test Count**: ~15-25 tests per repository
**Duration Target**: < 150ms total per repository

#### Integration Tests (Optional, for critical paths)

**Approach**: Use real test Supabase instance or in-memory database

**When to Use**:
- Complex queries with multiple joins
- Full-text search validation
- Array operations (overlaps, contains)
- Critical data integrity scenarios

**Note**: Not implemented initially - focus on unit tests first

---

### 2.4 API Routes Testing

**What to Test**: HTTP request/response handling, status codes, error formatting

**Coverage Target**: 85%+

**Mocking Strategy**: Mock use cases and services, test Express middleware chain

**Example: auth.routes.test.ts**

```typescript
// ABOUTME: Integration tests for authentication HTTP routes
// ABOUTME: Tests request validation, response formatting, and error handling

import { describe, it, expect, beforeEach, vi } from 'vitest'
import request from 'supertest'
import express, { Express } from 'express'
import { createAuthRoutes } from './auth.routes'
import { Container } from '../../di/Container'

// Mock the DI container
vi.mock('../../di/Container', () => ({
  Container: {
    getSignUpUseCase: vi.fn(),
    getSignInUseCase: vi.fn(),
    getAuthService: vi.fn(),
    getGetUserProfileUseCase: vi.fn()
  }
}))

describe('Auth Routes', () => {
  let app: Express

  beforeEach(() => {
    app = express()
    app.use(express.json())
    app.use('/api/auth', createAuthRoutes())
  })

  describe('POST /api/auth/signup', () => {
    it('should return 201 and user on successful signup', async () => {
      const mockUser = {
        toPrimitives: () => ({
          id: '123e4567-e89b-12d3-a456-426614174000',
          email: 'test@example.com',
          name: 'Test User',
          avatarUrl: null,
          bio: null,
          location: null,
          linkedinUrl: null,
          websiteUrl: null,
          skills: [],
          interests: [],
          roleIds: [3],
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01')
        }),
        calculateCompletionPercentage: () => ({ getValue: () => 20 })
      }

      const mockUseCase = {
        execute: vi.fn().mockResolvedValue({
          user: mockUser,
          error: null
        })
      }

      vi.mocked(Container.getSignUpUseCase).mockReturnValue(mockUseCase as any)

      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'test@example.com',
          password: 'SecurePassword123',
          name: 'Test User'
        })

      expect(response.status).toBe(201)
      expect(response.body.user).toMatchObject({
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        name: 'Test User',
        completed_pct: 20
      })
      expect(mockUseCase.execute).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'SecurePassword123',
        name: 'Test User'
      })
    })

    it('should return 400 when email is missing', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          password: 'SecurePassword123',
          name: 'Test User'
        })

      expect(response.status).toBe(400)
      expect(response.body.error).toBe('Missing required fields: email, password, name')
    })

    it('should return 400 when password is missing', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'test@example.com',
          name: 'Test User'
        })

      expect(response.status).toBe(400)
      expect(response.body.error).toBe('Missing required fields: email, password, name')
    })

    it('should return 400 when name is missing', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'test@example.com',
          password: 'SecurePassword123'
        })

      expect(response.status).toBe(400)
      expect(response.body.error).toBe('Missing required fields: email, password, name')
    })

    it('should return 400 with use case validation error', async () => {
      const mockUseCase = {
        execute: vi.fn().mockResolvedValue({
          user: null,
          error: 'Invalid email format'
        })
      }

      vi.mocked(Container.getSignUpUseCase).mockReturnValue(mockUseCase as any)

      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'invalid-email',
          password: 'SecurePassword123',
          name: 'Test User'
        })

      expect(response.status).toBe(400)
      expect(response.body.error).toBe('Invalid email format')
    })

    it('should handle unexpected errors with 500', async () => {
      const mockUseCase = {
        execute: vi.fn().mockRejectedValue(new Error('Unexpected database error'))
      }

      vi.mocked(Container.getSignUpUseCase).mockReturnValue(mockUseCase as any)

      // Note: This requires error handler middleware
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'test@example.com',
          password: 'SecurePassword123',
          name: 'Test User'
        })

      // Without error handler, this might be 500 or unhandled
      // With error handler, should be 500 with proper error format
    })
  })

  describe('POST /api/auth/signin', () => {
    it('should return 200 and user with session on successful signin', async () => {
      const mockUser = {
        toPrimitives: () => ({
          id: '123e4567-e89b-12d3-a456-426614174000',
          email: 'test@example.com',
          name: 'Test User',
          avatarUrl: null,
          bio: null,
          location: null,
          linkedinUrl: null,
          websiteUrl: null,
          skills: [],
          interests: [],
          roleIds: [3],
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01')
        }),
        calculateCompletionPercentage: () => ({ getValue: () => 20 })
      }

      const mockSession = {
        access_token: 'mock-token',
        refresh_token: 'mock-refresh'
      }

      const mockUseCase = {
        execute: vi.fn().mockResolvedValue({
          user: mockUser,
          session: mockSession,
          error: null
        })
      }

      vi.mocked(Container.getSignInUseCase).mockReturnValue(mockUseCase as any)

      const response = await request(app)
        .post('/api/auth/signin')
        .send({
          email: 'test@example.com',
          password: 'SecurePassword123'
        })

      expect(response.status).toBe(200)
      expect(response.body.user).toBeDefined()
      expect(response.body.session).toEqual(mockSession)
    })

    it('should return 401 with invalid credentials error', async () => {
      const mockUseCase = {
        execute: vi.fn().mockResolvedValue({
          user: null,
          session: null,
          error: 'Invalid credentials'
        })
      }

      vi.mocked(Container.getSignInUseCase).mockReturnValue(mockUseCase as any)

      const response = await request(app)
        .post('/api/auth/signin')
        .send({
          email: 'test@example.com',
          password: 'WrongPassword'
        })

      expect(response.status).toBe(401)
      expect(response.body.error).toBe('Invalid credentials')
    })

    it('should return 400 when email is missing', async () => {
      const response = await request(app)
        .post('/api/auth/signin')
        .send({
          password: 'SecurePassword123'
        })

      expect(response.status).toBe(400)
      expect(response.body.error).toBe('Missing required fields: email, password')
    })
  })

  describe('POST /api/auth/signout', () => {
    it('should return 200 on successful signout', async () => {
      const mockAuthService = {
        signOut: vi.fn().mockResolvedValue({ error: null })
      }

      vi.mocked(Container.getAuthService).mockReturnValue(mockAuthService as any)

      const response = await request(app).post('/api/auth/signout')

      expect(response.status).toBe(200)
      expect(response.body.message).toBe('Signed out successfully')
    })

    it('should return 500 on signout error', async () => {
      const mockAuthService = {
        signOut: vi.fn().mockResolvedValue({
          error: { message: 'Session not found' }
        })
      }

      vi.mocked(Container.getAuthService).mockReturnValue(mockAuthService as any)

      const response = await request(app).post('/api/auth/signout')

      expect(response.status).toBe(500)
      expect(response.body.error).toBe('Session not found')
    })
  })

  describe('GET /api/auth/me', () => {
    it('should return 200 and user profile when authenticated', async () => {
      const mockAuthService = {
        getCurrentUser: vi.fn().mockResolvedValue({
          id: '123e4567-e89b-12d3-a456-426614174000'
        })
      }

      const mockUser = {
        toPrimitives: () => ({
          id: '123e4567-e89b-12d3-a456-426614174000',
          email: 'test@example.com',
          name: 'Test User',
          avatarUrl: null,
          bio: null,
          location: null,
          linkedinUrl: null,
          websiteUrl: null,
          skills: [],
          interests: [],
          roleIds: [3],
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01')
        })
      }

      const mockGetUserProfileUseCase = {
        execute: vi.fn().mockResolvedValue({
          user: mockUser,
          completionPercentage: 20,
          error: null
        })
      }

      vi.mocked(Container.getAuthService).mockReturnValue(mockAuthService as any)
      vi.mocked(Container.getGetUserProfileUseCase).mockReturnValue(mockGetUserProfileUseCase as any)

      const response = await request(app).get('/api/auth/me')

      expect(response.status).toBe(200)
      expect(response.body.user).toMatchObject({
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com'
      })
    })

    it('should return 401 when not authenticated', async () => {
      const mockAuthService = {
        getCurrentUser: vi.fn().mockResolvedValue(null)
      }

      vi.mocked(Container.getAuthService).mockReturnValue(mockAuthService as any)

      const response = await request(app).get('/api/auth/me')

      expect(response.status).toBe(401)
      expect(response.body.error).toBe('Not authenticated')
    })

    it('should return 404 when user profile not found', async () => {
      const mockAuthService = {
        getCurrentUser: vi.fn().mockResolvedValue({
          id: '123e4567-e89b-12d3-a456-426614174000'
        })
      }

      const mockGetUserProfileUseCase = {
        execute: vi.fn().mockResolvedValue({
          user: null,
          completionPercentage: 0,
          error: 'User not found'
        })
      }

      vi.mocked(Container.getAuthService).mockReturnValue(mockAuthService as any)
      vi.mocked(Container.getGetUserProfileUseCase).mockReturnValue(mockGetUserProfileUseCase as any)

      const response = await request(app).get('/api/auth/me')

      expect(response.status).toBe(404)
      expect(response.body.error).toBe('User not found')
    })
  })
})
```

**Test Count**: ~15-25 tests per route file
**Duration Target**: < 300ms total per route file

---

## 3. Test Data Builders and Fixtures

### 3.1 Builder Pattern (Preferred)

**Purpose**: Flexible test data creation with default values and method chaining

**Example: UserBuilder.ts**

```typescript
// ABOUTME: Test data builder for User entities with fluent interface
// ABOUTME: Provides flexible test data creation with sensible defaults

import { User } from '../../domain/entities/User'
import { UserId } from '../../domain/value-objects/UserId'
import { Email } from '../../domain/value-objects/Email'

export class UserBuilder {
  private id: UserId = UserId.create('123e4567-e89b-12d3-a456-426614174000')!
  private email: Email = Email.create('test@example.com')!
  private name: string = 'Test User'
  private avatarUrl: string | null = null
  private bio: string | null = 'Test bio'
  private location: string | null = 'Madrid, Spain'
  private linkedinUrl: string | null = null
  private websiteUrl: string | null = null
  private skills: string[] = ['TypeScript']
  private interests: string[] = ['AI']
  private roleIds: number[] = [3] // Default: emprendedor
  private createdAt: Date = new Date('2024-01-01')
  private updatedAt: Date = new Date('2024-01-01')

  withId(id: string): this {
    this.id = UserId.create(id)!
    return this
  }

  withEmail(email: string): this {
    this.email = Email.create(email)!
    return this
  }

  withName(name: string): this {
    this.name = name
    return this
  }

  withBio(bio: string | null): this {
    this.bio = bio
    return this
  }

  withLocation(location: string | null): this {
    this.location = location
    return this
  }

  withSkills(skills: string[]): this {
    this.skills = skills
    return this
  }

  withInterests(interests: string[]): this {
    this.interests = interests
    return this
  }

  withRoleIds(roleIds: number[]): this {
    this.roleIds = roleIds
    return this
  }

  asIncompleteProfile(): this {
    this.bio = null
    this.location = null
    this.skills = []
    this.interests = []
    return this
  }

  asCompleteProfile(): this {
    this.bio = 'Comprehensive bio about the user'
    this.location = 'Madrid, Spain'
    this.skills = ['TypeScript', 'React', 'Node.js']
    this.interests = ['AI', 'Web Development', 'Startups']
    return this
  }

  asAdmin(): this {
    this.roleIds = [1]
    return this
  }

  asMentor(): this {
    this.roleIds = [2]
    return this
  }

  asEmprendedor(): this {
    this.roleIds = [3]
    return this
  }

  build(): User {
    return User.create({
      id: this.id,
      email: this.email,
      name: this.name,
      avatarUrl: this.avatarUrl,
      bio: this.bio,
      location: this.location,
      linkedinUrl: this.linkedinUrl,
      websiteUrl: this.websiteUrl,
      skills: this.skills,
      interests: this.interests,
      roleIds: this.roleIds,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    })
  }
}

// Usage examples:
// const user = new UserBuilder().build()
// const admin = new UserBuilder().asAdmin().withName('Admin User').build()
// const incomplete = new UserBuilder().asIncompleteProfile().build()
```

### 3.2 Fixtures (For Static Data)

**Purpose**: Pre-defined test data for common scenarios

**Example: connections.fixtures.ts**

```typescript
// ABOUTME: Static test fixtures for Connection entities
// ABOUTME: Provides pre-configured connections for various test scenarios

import { Connection } from '../../domain/entities/Connection'

export const pendingConnection = Connection.createRequest(
  'conn-001',
  'user-001',
  'user-002'
)

export const acceptedConnection = (() => {
  const conn = Connection.createRequest('conn-002', 'user-001', 'user-003')
  conn.accept()
  return conn
})()

export const rejectedConnection = (() => {
  const conn = Connection.createRequest('conn-003', 'user-001', 'user-004')
  conn.reject()
  return conn
})()

export const blockedConnection = (() => {
  const conn = Connection.createRequest('conn-004', 'user-001', 'user-005')
  conn.block()
  return conn
})()
```

---

## 4. Mocking Strategy

### 4.1 What to Mock

| Layer | Mock | Don't Mock |
|-------|------|------------|
| **Domain** | Nothing | Everything (pure logic) |
| **Application** | Repositories, Services | Use cases themselves, Domain entities |
| **Infrastructure** | External services (Supabase, Resend) | Data mapping logic |
| **API Routes** | Use cases, Services | Express framework, Request/Response objects |

### 4.2 Mock Repository Pattern

```typescript
// server/application/ports/__mocks__/MockUserRepository.ts
export class MockUserRepository implements IUserRepository {
  private users: Map<string, User> = new Map()

  async findById(id: UserId): Promise<User | null> {
    return this.users.get(id.getValue()) || null
  }

  async findByEmail(email: Email): Promise<User | null> {
    return Array.from(this.users.values()).find(
      u => u.getEmail().equals(email)
    ) || null
  }

  async save(user: User): Promise<User> {
    this.users.set(user.getId().getValue(), user)
    return user
  }

  async update(user: User): Promise<User> {
    this.users.set(user.getId().getValue(), user)
    return user
  }

  async delete(id: UserId): Promise<void> {
    this.users.delete(id.getValue())
  }

  async search(query: string, filters?: SearchFilters): Promise<User[]> {
    // Simplified in-memory search
    return Array.from(this.users.values())
  }

  async findAll(): Promise<User[]> {
    return Array.from(this.users.values())
  }

  // Test helpers
  clear(): void {
    this.users.clear()
  }

  seed(users: User[]): void {
    users.forEach(u => this.users.set(u.getId().getValue(), u))
  }
}
```

### 4.3 Vitest Mock Functions

For simpler scenarios, use Vitest's built-in mocks:

```typescript
import { vi } from 'vitest'

const mockUserRepository = {
  findById: vi.fn(),
  findByEmail: vi.fn(),
  save: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  search: vi.fn(),
  findAll: vi.fn()
}
```

---

## 5. Coverage Targets and Metrics

### Overall Coverage Goals

```
Minimum: 80% (configured in vitest.config.ts)
Target:  90%+
```

### Layer-Specific Targets

| Layer | Lines | Functions | Branches | Statements | Priority |
|-------|-------|-----------|----------|------------|----------|
| **Domain Entities** | 95% | 95% | 95% | 95% | CRITICAL |
| **Domain Value Objects** | 95% | 95% | 95% | 95% | CRITICAL |
| **Use Cases** | 90% | 90% | 85% | 90% | HIGH |
| **Repositories** | 85% | 85% | 80% | 85% | MEDIUM |
| **API Routes** | 85% | 85% | 80% | 85% | MEDIUM |
| **Services** | 80% | 80% | 75% | 80% | LOW |

### What NOT to Test (Acceptable Exclusions)

- Type definitions (`.d.ts` files)
- Configuration files (`*.config.*`)
- Mock data files
- DI container (covered indirectly)
- Logger middleware (unless critical logic)

---

## 6. Test Execution Strategy

### Priority Order for Implementation

1. **Phase 1: Domain Layer** (Foundational)
   - Start: Value Objects (Email, UserId, CompletionPercentage)
   - Then: User Entity (most complex business logic)
   - Then: Connection, Opportunity, Message entities
   - **Goal**: 95% domain coverage
   - **Duration**: 2-3 days

2. **Phase 2: Critical Use Cases** (Core Workflows)
   - SignUpUseCase (complex with rollback)
   - SignInUseCase
   - UpdateUserProfileUseCase
   - RequestConnectionUseCase
   - UpdateConnectionStatusUseCase
   - **Goal**: 90% use case coverage for critical paths
   - **Duration**: 3-4 days

3. **Phase 3: Remaining Use Cases** (Feature Completion)
   - All network use cases
   - All opportunity use cases
   - All message use cases
   - **Goal**: 90% use case coverage overall
   - **Duration**: 3-4 days

4. **Phase 4: Infrastructure** (Data Layer)
   - SupabaseUserRepository
   - SupabaseConnectionRepository
   - SupabaseOpportunityRepository
   - SupabaseMessageRepository
   - **Goal**: 85% repository coverage
   - **Duration**: 2-3 days

5. **Phase 5: API Routes** (Interface Layer)
   - auth.routes
   - users.routes
   - connections.routes
   - opportunities.routes
   - messages.routes (to be created)
   - email.routes
   - **Goal**: 85% route coverage
   - **Duration**: 2-3 days

**Total Estimated Duration**: 12-17 days

### Test Execution Commands

```bash
# Run all tests
npm test

# Run tests in watch mode (during development)
npm test -- --watch

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test -- server/domain/entities/User.test.ts

# Run tests for specific layer
npm test -- server/domain
npm test -- server/application
npm test -- server/infrastructure

# Run tests in CI mode (no watch)
npm test -- --run
```

### CI/CD Integration

```yaml
# .github/workflows/test.yml (example)
name: Backend Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test -- --run --coverage
      - name: Check coverage thresholds
        run: |
          # Vitest will fail if below 80% (configured threshold)
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
```

---

## 7. Common Testing Patterns and Solutions

### Pattern 1: Testing Async Methods

```typescript
it('should handle async operation', async () => {
  const result = await useCase.execute(request)
  expect(result).toBeDefined()
})
```

### Pattern 2: Testing Exceptions

```typescript
it('should throw error for invalid input', () => {
  expect(() => {
    User.create({ ...invalidProps })
  }).toThrow('Expected error message')
})

// For async throws
it('should reject promise for invalid operation', async () => {
  await expect(repository.save(invalidUser)).rejects.toThrow('Error message')
})
```

### Pattern 3: Testing Date/Time Sensitive Logic

```typescript
it('should update timestamp on status change', () => {
  const connection = Connection.createRequest(id, requester, addressee)
  const originalTime = connection.updatedAt.getTime()

  // Wait or mock Date
  vi.useFakeTimers()
  vi.advanceTimersByTime(1000)

  connection.accept()

  expect(connection.updatedAt.getTime()).toBeGreaterThan(originalTime)

  vi.useRealTimers()
})
```

### Pattern 4: Testing Fire-and-Forget Side Effects

```typescript
it('should attempt to send email but not fail if email fails', async () => {
  mockEmailService.sendWelcomeEmail.mockRejectedValue(new Error('Email down'))

  const result = await signUpUseCase.execute(validRequest)

  expect(result.error).toBeNull() // Main operation succeeded
  expect(result.user).not.toBeNull()
})
```

### Pattern 5: Verifying Mock Call Arguments

```typescript
it('should call repository with correct user data', async () => {
  await useCase.execute(request)

  expect(mockRepository.save).toHaveBeenCalledTimes(1)
  const savedUser = mockRepository.save.mock.calls[0][0]
  expect(savedUser.getName()).toBe('Expected Name')
})
```

### Pattern 6: Testing Array Immutability

```typescript
it('should return copy of skills array, not original', () => {
  const user = new UserBuilder().withSkills(['TypeScript']).build()
  const skills = user.getSkills()

  skills.push('React')

  expect(user.getSkills()).toEqual(['TypeScript']) // Original unchanged
})
```

---

## 8. Common Pitfalls and Solutions

### Pitfall 1: Testing Implementation Instead of Behavior

**Wrong**:
```typescript
it('should call private method', () => {
  // Testing internal implementation
  expect(connection['validate']).toHaveBeenCalled()
})
```

**Right**:
```typescript
it('should throw error when creating connection with invalid data', () => {
  // Testing observable behavior
  expect(() => Connection.create(invalidProps)).toThrow('Validation error')
})
```

### Pitfall 2: Overly Broad Mocking

**Wrong**:
```typescript
// Mocking domain entities in use case tests
const mockUser = { getName: () => 'Test', getEmail: () => 'test@example.com' }
```

**Right**:
```typescript
// Use real domain entities, mock only ports
const user = new UserBuilder().build()
mockRepository.findById.mockResolvedValue(user)
```

### Pitfall 3: Not Testing Error Paths

**Wrong**:
```typescript
describe('SignUpUseCase', () => {
  it('should create user successfully', async () => {
    // Only happy path tested
  })
})
```

**Right**:
```typescript
describe('SignUpUseCase', () => {
  it('should create user successfully', async () => { /* ... */ })
  it('should reject invalid email', async () => { /* ... */ })
  it('should reject short password', async () => { /* ... */ })
  it('should handle repository errors', async () => { /* ... */ })
  it('should rollback on failure', async () => { /* ... */ })
})
```

### Pitfall 4: Test Interdependence

**Wrong**:
```typescript
let sharedUser: User

it('should create user', () => {
  sharedUser = new UserBuilder().build()
})

it('should update user', () => {
  sharedUser.updateProfile({ name: 'Updated' }) // Depends on previous test
})
```

**Right**:
```typescript
it('should create user', () => {
  const user = new UserBuilder().build()
  expect(user).toBeDefined()
})

it('should update user', () => {
  const user = new UserBuilder().build() // Independent
  const updated = user.updateProfile({ name: 'Updated' })
  expect(updated.getName()).toBe('Updated')
})
```

### Pitfall 5: Ignoring Vitest Configuration

**Wrong**:
```typescript
// Importing from wrong path
import { User } from '../../../server/domain/entities/User'
```

**Right**:
```typescript
// Won't work for backend tests - no @ alias configured
// Use relative paths for server-side code
import { User } from '../../../domain/entities/User'
```

---

## 9. Test File Templates

### Template 1: Value Object Test

```typescript
// ABOUTME: [Brief description of value object]
// ABOUTME: [What business rules it enforces]

import { describe, it, expect } from 'vitest'
import { [ValueObject] } from './[ValueObject]'

describe('[ValueObject] Value Object', () => {
  describe('create', () => {
    it('should create valid [value object] with proper format', () => {
      // Arrange & Act
      const vo = [ValueObject].create(validInput)

      // Assert
      expect(vo).not.toBeNull()
      expect(vo!.getValue()).toBe(expectedValue)
    })

    it('should reject invalid input', () => {
      const vo = [ValueObject].create(invalidInput)
      expect(vo).toBeNull()
    })

    // More validation tests...
  })

  describe('equals', () => {
    it('should return true for equal values', () => {
      const vo1 = [ValueObject].create(value)!
      const vo2 = [ValueObject].create(value)!
      expect(vo1.equals(vo2)).toBe(true)
    })
  })

  describe('getValue', () => {
    it('should return the encapsulated value', () => {
      const vo = [ValueObject].create(value)!
      expect(vo.getValue()).toBe(expectedValue)
    })
  })
})
```

### Template 2: Entity Test

```typescript
// ABOUTME: [Brief description of entity]
// ABOUTME: [Key business rules and invariants]

import { describe, it, expect, beforeEach } from 'vitest'
import { [Entity] } from './[Entity]'

describe('[Entity] Entity', () => {
  describe('create', () => {
    it('should create entity with valid props', () => {
      const entity = [Entity].create(validProps)
      expect(entity).toBeDefined()
    })

    it('should enforce invariant: [describe invariant]', () => {
      expect(() => {
        [Entity].create(invalidProps)
      }).toThrow('Expected error message')
    })

    // More creation tests...
  })

  describe('[businessMethod]', () => {
    it('should perform expected operation', () => {
      // Arrange
      const entity = [Entity].create(props)

      // Act
      entity.[businessMethod](params)

      // Assert
      expect(entity.[getter]()).toBe(expectedValue)
    })

    it('should throw error when preconditions not met', () => {
      const entity = [Entity].create(props)
      expect(() => entity.[businessMethod](invalid)).toThrow('Error')
    })
  })

  describe('toObject', () => {
    it('should convert to plain object with all properties', () => {
      const entity = [Entity].create(props)
      const obj = entity.toObject()
      expect(obj).toMatchObject(expectedObject)
    })
  })
})
```

### Template 3: Use Case Test

```typescript
// ABOUTME: [Brief description of use case]
// ABOUTME: [What business workflow it orchestrates]

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { [UseCase] } from './[UseCase]'

// Mock classes
class Mock[Repository] {
  [method] = vi.fn()
}

class Mock[Service] {
  [method] = vi.fn()
}

describe('[UseCase]', () => {
  let useCase: [UseCase]
  let mockRepository: Mock[Repository]
  let mockService: Mock[Service]

  beforeEach(() => {
    mockRepository = new Mock[Repository]()
    mockService = new Mock[Service]()
    useCase = new [UseCase](mockRepository as any, mockService as any)
  })

  describe('successful execution', () => {
    it('should execute workflow with valid inputs', async () => {
      // Arrange
      mockRepository.[method].mockResolvedValue(mockData)

      // Act
      const result = await useCase.execute(validRequest)

      // Assert
      expect(result.error).toBeNull()
      expect(result.[property]).toBeDefined()
      expect(mockRepository.[method]).toHaveBeenCalledWith(expectedArgs)
    })
  })

  describe('validation errors', () => {
    it('should reject invalid input with proper error message', async () => {
      const result = await useCase.execute(invalidRequest)
      expect(result.error).toBe('Expected validation error')
    })
  })

  describe('error handling', () => {
    it('should handle repository failures gracefully', async () => {
      mockRepository.[method].mockRejectedValue(new Error('DB error'))
      const result = await useCase.execute(validRequest)
      expect(result.error).toBeTruthy()
    })
  })
})
```

---

## 10. Next Steps and Recommendations

### Immediate Actions for Iban

1. **Start with Value Objects** (Easiest wins)
   - Create `Email.test.ts`
   - Create `UserId.test.ts`
   - Create `CompletionPercentage.test.ts`
   - Run tests and verify 95%+ coverage

2. **Build Test Infrastructure**
   - Create `UserBuilder.ts` in `server/test/builders/`
   - Create `MockUserRepository.ts` in `application/ports/__mocks__/`
   - Create reusable `mockSupabaseClient.ts` in `server/test/utils/`

3. **Tackle User Entity** (Most complex domain logic)
   - Create `User.test.ts` with all business logic tests
   - Test profile completion calculation thoroughly
   - Test role checking methods

4. **Implement Critical Use Case Tests**
   - `SignUpUseCase.test.ts` (includes rollback testing)
   - `SignInUseCase.test.ts`
   - Verify orchestration and error handling

5. **Iterate and Expand**
   - Follow phase-by-phase approach outlined in Section 6
   - Run coverage reports after each phase
   - Adjust as needed based on findings

### Tools and Resources

- **Vitest Documentation**: https://vitest.dev/
- **Testing Library**: Already configured for frontend, not needed for backend
- **Supertest**: For HTTP route testing (install: `npm install -D supertest @types/supertest`)

### Quality Metrics to Track

- **Coverage %** (target: 90%+)
- **Test execution time** (target: <5 seconds for all backend tests)
- **Test failures** (target: 0 in main branch)
- **Code review feedback** (ensure tests are reviewed for quality)

---

## Conclusion

This testing strategy provides a comprehensive, layer-by-layer approach to achieving 90%+ test coverage for the España Creativa Red backend. By prioritizing domain layer tests first and following hexagonal architecture principles (pure domain, mocked ports in use cases, unit-tested repositories), we ensure the critical business logic is thoroughly validated while maintaining fast, isolated tests.

The key to success is:
1. **Start simple** (value objects and entities)
2. **Build momentum** (use builders and fixtures)
3. **Test behavior, not implementation**
4. **Follow the phase plan systematically**
5. **Review coverage metrics regularly**

With this strategy, Iban can confidently deliver a well-tested backend that supports safe refactoring, prevents regressions, and documents expected behavior through comprehensive test cases.
