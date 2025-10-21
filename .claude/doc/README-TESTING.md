# Backend Testing Documentation Index

## Overview

Complete testing strategy and infrastructure for España Creativa Red backend. Everything you need to implement 90%+ test coverage across all architectural layers.

## Quick Links

### 📖 Start Here

**New to the testing strategy?** Read these in order:

1. **[Testing Strategy Summary](./testing-strategy-summary.md)** ⭐ START HERE
   - Quick overview of the entire strategy
   - Implementation roadmap with phases
   - Your first test walkthrough
   - Progress checklist

2. **[Complete Testing Strategy](./backend-testing-strategy.md)**
   - Comprehensive 10,000+ word strategy document
   - Layer-by-layer testing approach with 50+ examples
   - Detailed mocking strategies
   - Test data builder patterns
   - Common pitfalls and solutions

3. **[Quick Reference Guide](./testing-quick-reference.md)**
   - Vitest commands cheat sheet
   - Common assertion patterns
   - Mocking patterns
   - Debugging techniques
   - Phase completion checklist

## Test Infrastructure

All test utilities are ready to use in `/server/test/`:

### Utilities (`/server/test/utils/`)

```typescript
// Mock Supabase client for repository tests
import { createMockSupabaseClient } from '../test/utils/mockSupabaseClient'

// Mock Express request/response for route tests
import { createMockRequest, createMockResponse } from '../test/utils/mockExpressRequest'

// Test helpers (UUIDs, dates, assertions)
import { generateTestId, dateFromNow } from '../test/utils/testHelpers'
```

### Builders (`/server/test/builders/`)

```typescript
// Fluent builders for test data creation
import { UserBuilder } from '../test/builders/UserBuilder'
import { ConnectionBuilder } from '../test/builders/ConnectionBuilder'
import { OpportunityBuilder } from '../test/builders/OpportunityBuilder'

// Usage
const user = new UserBuilder()
  .withEmail('test@example.com')
  .asAdmin()
  .asCompleteProfile()
  .build()
```

## What's Included

### Documentation
- ✅ Complete testing strategy (domain → routes)
- ✅ 50+ example test cases across all layers
- ✅ Mocking patterns and anti-patterns
- ✅ Phase-by-phase implementation plan
- ✅ Quick reference guide
- ✅ Coverage targets and metrics

### Test Infrastructure
- ✅ Mock Supabase client
- ✅ Mock Express request/response
- ✅ Test helper functions
- ✅ User entity builder
- ✅ Connection entity builder
- ✅ Opportunity entity builder

### Configuration
- ✅ Vitest configured (80% coverage thresholds)
- ✅ Test setup file
- ✅ TypeScript support
- ✅ Coverage reporting (HTML, LCOV, JSON)

## Quick Start

### 1. Verify Setup

```bash
# Check Vitest is installed
npm test -- --version

# Should output: vitest/3.2.4
```

### 2. Create Your First Test

Create `server/domain/value-objects/Email.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { Email } from './Email'

describe('Email Value Object', () => {
  it('should create valid email', () => {
    const email = Email.create('test@example.com')
    expect(email).not.toBeNull()
    expect(email!.getValue()).toBe('test@example.com')
  })

  it('should reject invalid email', () => {
    const email = Email.create('invalid')
    expect(email).toBeNull()
  })
})
```

### 3. Run It

```bash
npm test -- server/domain/value-objects/Email.test.ts
```

Expected output:
```
✓ Email Value Object (2)
  ✓ should create valid email
  ✓ should reject invalid email
```

### 4. Follow the Roadmap

See [Testing Strategy Summary](./testing-strategy-summary.md) for the complete 5-phase implementation plan.

## Implementation Roadmap

### Phase 1: Domain Layer (Days 1-3)
- Value Objects: Email, UserId, CompletionPercentage
- Entities: User, Connection, Opportunity, Message
- **Target**: 95% coverage

### Phase 2: Critical Use Cases (Days 4-7)
- SignUpUseCase, SignInUseCase
- UpdateUserProfile, RequestConnection
- **Target**: 90% coverage

### Phase 3: Remaining Use Cases (Days 8-11)
- Network, Opportunities, Messages
- **Target**: 90% coverage

### Phase 4: Infrastructure (Days 12-14)
- All 4 Supabase repositories
- **Target**: 85% coverage

### Phase 5: API Routes (Days 15-17)
- All 6 route files
- **Target**: 85% coverage

**Total**: 12-17 days for 90%+ coverage

## Testing Commands

```bash
# Watch mode (development)
npm test -- --watch

# Run specific file
npm test -- server/domain/entities/User.test.ts

# Run specific layer
npm test -- server/domain
npm test -- server/application

# Coverage report
npm test -- --coverage

# CI mode
npm test -- --run --coverage

# Verbose output
npm test -- --reporter=verbose
```

## Coverage Targets

| Layer | Lines | Functions | Branches | Statements |
|-------|-------|-----------|----------|------------|
| Domain | 95% | 95% | 95% | 95% |
| Use Cases | 90% | 90% | 85% | 90% |
| Repositories | 85% | 85% | 80% | 85% |
| API Routes | 85% | 85% | 80% | 85% |
| **Overall** | **90%** | **90%** | **85%** | **90%** |

## Document Structure

```
.claude/doc/
├── README-TESTING.md                  # This file (index)
├── testing-strategy-summary.md        # ⭐ Start here
├── backend-testing-strategy.md        # Complete strategy
└── testing-quick-reference.md         # Quick lookup
```

## Code Structure

```
server/
├── domain/
│   ├── entities/
│   │   ├── User.ts
│   │   └── User.test.ts              # Test alongside source
│   └── value-objects/
│       ├── Email.ts
│       └── Email.test.ts
├── application/
│   ├── use-cases/
│   │   └── auth/
│   │       ├── SignUpUseCase.ts
│   │       └── SignUpUseCase.test.ts
│   └── ports/
│       └── __mocks__/                # Shared mocks
│           ├── MockUserRepository.ts
│           └── MockAuthService.ts
├── infrastructure/
│   ├── adapters/
│   │   └── repositories/
│   │       ├── SupabaseUserRepository.ts
│   │       └── SupabaseUserRepository.test.ts
│   └── api/
│       └── routes/
│           ├── auth.routes.ts
│           └── auth.routes.test.ts
└── test/                             # Test infrastructure
    ├── builders/                     # Test data builders
    │   ├── UserBuilder.ts
    │   ├── ConnectionBuilder.ts
    │   └── OpportunityBuilder.ts
    └── utils/                        # Test utilities
        ├── mockSupabaseClient.ts
        ├── mockExpressRequest.ts
        ├── mockExpressResponse.ts
        └── testHelpers.ts
```

## Key Principles

1. **Test Pyramid**: Many unit tests, fewer integration tests
2. **AAA Pattern**: Arrange-Act-Assert in all tests
3. **Test Isolation**: Each test runs independently
4. **Mock at Boundaries**: Domain pure, mock repositories in use cases
5. **Behavior over Implementation**: Test what it does, not how

## Example Test Patterns

### Value Object Test
```typescript
describe('Email', () => {
  it('should create valid email', () => {
    const email = Email.create('test@example.com')
    expect(email).not.toBeNull()
  })

  it('should reject invalid email', () => {
    const email = Email.create('invalid')
    expect(email).toBeNull()
  })
})
```

### Entity Test
```typescript
describe('Connection', () => {
  it('should accept pending connection', () => {
    const connection = Connection.createRequest(id, requester, addressee)
    connection.accept()
    expect(connection.status).toBe('accepted')
  })

  it('should throw when accepting non-pending connection', () => {
    const connection = Connection.createRequest(id, requester, addressee)
    connection.accept()
    expect(() => connection.accept()).toThrow()
  })
})
```

### Use Case Test
```typescript
describe('SignUpUseCase', () => {
  let useCase: SignUpUseCase
  let mockRepository: MockUserRepository

  beforeEach(() => {
    mockRepository = new MockUserRepository()
    useCase = new SignUpUseCase(mockRepository as any, ...)
  })

  it('should create user with valid inputs', async () => {
    mockRepository.findByEmail.mockResolvedValue(null)
    mockRepository.save.mockResolvedValue(user)

    const result = await useCase.execute(validRequest)

    expect(result.error).toBeNull()
    expect(result.user).toBeDefined()
  })
})
```

### Repository Test
```typescript
describe('SupabaseUserRepository', () => {
  let repository: SupabaseUserRepository
  let mockSupabase: MockSupabaseClient

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient()
    repository = new SupabaseUserRepository(mockSupabase)
  })

  it('should return user when found', async () => {
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockData, error: null })
    })

    const result = await repository.findById(userId)

    expect(result).not.toBeNull()
    expect(result!.getName()).toBe('Test User')
  })
})
```

### Route Test
```typescript
import request from 'supertest'

describe('Auth Routes', () => {
  it('should return 201 on successful signup', async () => {
    const response = await request(app)
      .post('/api/auth/signup')
      .send({ email: 'test@example.com', password: 'password', name: 'Test' })
      .expect(201)

    expect(response.body.user).toBeDefined()
  })
})
```

## Resources

- **Vitest Documentation**: https://vitest.dev/
- **Supertest** (for route testing): https://github.com/ladjs/supertest
- **Testing Best Practices**: See `backend-testing-strategy.md` Section 7

## Support

For detailed examples and patterns, refer to:
- **Strategy Document**: Complete examples for every layer
- **Quick Reference**: Common patterns and commands
- **Test Infrastructure**: Pre-built mocks and builders

## Status

- ✅ Test framework configured (Vitest 3.2.4)
- ✅ Coverage thresholds set (80% minimum)
- ✅ Test infrastructure created (mocks, builders, helpers)
- ✅ Documentation complete (strategy, reference, summary)
- 🚀 Ready to implement tests (follow Phase 1)

## Next Steps

1. Read [Testing Strategy Summary](./testing-strategy-summary.md)
2. Create your first test (`Email.test.ts`)
3. Verify it passes
4. Follow Phase 1 implementation plan
5. Track progress with the checklist

---

**Everything you need is ready. Time to write tests!** 🧪

Start with [Testing Strategy Summary](./testing-strategy-summary.md) for the complete roadmap.
