# Testing Strategy Summary for España Creativa Red Backend

## What I've Created for You

Iban, I've designed a comprehensive testing strategy for your backend with complete documentation and test infrastructure. Here's what's ready:

### 📚 Documentation Files

1. **backend-testing-strategy.md** (Main Strategy Document)
   - Complete layer-by-layer testing approach
   - 50+ example test cases across all layers
   - Detailed mocking strategies
   - Coverage targets and metrics
   - Phase-by-phase implementation plan (12-17 days)
   - Common patterns and anti-patterns

2. **testing-quick-reference.md** (Quick Lookup Guide)
   - All Vitest commands
   - Common assertion patterns
   - Mocking cheat sheet
   - Debugging techniques
   - Phase completion checklist

### 🛠️ Test Infrastructure (Ready to Use)

Created in `/server/test/`:

**Utilities** (`/utils/`)
- `mockSupabaseClient.ts` - Mock Supabase for repository tests
- `mockExpressRequest.ts` - Mock HTTP requests for route tests
- `mockExpressResponse.ts` - Mock HTTP responses for route tests
- `testHelpers.ts` - UUID generation, date helpers, assertions

**Builders** (`/builders/`)
- `UserBuilder.ts` - Fluent builder for User entities
- `ConnectionBuilder.ts` - Fluent builder for Connections
- `OpportunityBuilder.ts` - Fluent builder for Opportunities

## Quick Start: Your First Test

1. **Install test dependency** (if not already installed):
```bash
npm install -D supertest @types/supertest
```

2. **Create your first test** - `server/domain/value-objects/Email.test.ts`:
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

3. **Run it**:
```bash
npm test -- server/domain/value-objects/Email.test.ts
```

You should see:
```
✓ Email Value Object (2)
  ✓ should create valid email
  ✓ should reject invalid email

Test Files  1 passed (1)
     Tests  2 passed (2)
```

## Implementation Roadmap

### Phase 1: Domain Layer (Days 1-3) - 95% Coverage Target

**Value Objects** (Start here - easiest wins!)
- [ ] `Email.test.ts` - 15-20 tests
- [ ] `UserId.test.ts` - 15-20 tests
- [ ] `CompletionPercentage.test.ts` - 15-20 tests

**Entities**
- [ ] `User.test.ts` - 40-50 tests (most complex)
- [ ] `Connection.test.ts` - 40-50 tests
- [ ] `Opportunity.test.ts` - 40-50 tests
- [ ] `Message.test.ts` - 30-40 tests

**Why start here?** Pure business logic, no dependencies, fast feedback.

### Phase 2: Critical Use Cases (Days 4-7) - 90% Coverage Target

- [ ] `SignUpUseCase.test.ts` - 25-30 tests (includes rollback testing)
- [ ] `SignInUseCase.test.ts` - 20-25 tests
- [ ] `UpdateUserProfileUseCase.test.ts` - 20-25 tests
- [ ] `RequestConnectionUseCase.test.ts` - 20-25 tests
- [ ] `UpdateConnectionStatusUseCase.test.ts` - 20-25 tests

**Key pattern**: Mock all ports (repositories, services), test orchestration.

### Phase 3: Remaining Use Cases (Days 8-11) - 90% Coverage Target

**Network** (7 use cases)
- [ ] GetConnectionsUseCase
- [ ] DeleteConnectionUseCase
- [ ] GetNetworkStatsUseCase
- [ ] GetMutualConnectionsUseCase
- [ ] GetConnectionStatusUseCase

**Opportunities** (6 use cases)
- [ ] CreateOpportunityUseCase
- [ ] GetOpportunitiesUseCase
- [ ] GetOpportunityUseCase
- [ ] GetMyOpportunitiesUseCase
- [ ] UpdateOpportunityUseCase
- [ ] DeleteOpportunityUseCase

**Messages** (6 use cases)
- [ ] SendMessageUseCase
- [ ] GetConversationsUseCase
- [ ] GetConversationMessagesUseCase
- [ ] MarkMessagesAsReadUseCase
- [ ] DeleteMessageUseCase
- [ ] GetUnreadCountUseCase

### Phase 4: Infrastructure (Days 12-14) - 85% Coverage Target

**Repositories** (Unit tests with mocked Supabase)
- [ ] `SupabaseUserRepository.test.ts` - 20-25 tests
- [ ] `SupabaseConnectionRepository.test.ts` - 20-25 tests
- [ ] `SupabaseOpportunityRepository.test.ts` - 20-25 tests
- [ ] `SupabaseMessageRepository.test.ts` - 20-25 tests

**Key pattern**: Mock Supabase client, verify query construction and mapping.

### Phase 5: API Routes (Days 15-17) - 85% Coverage Target

**Routes** (Use Supertest for HTTP testing)
- [ ] `auth.routes.test.ts` - 20-25 tests
- [ ] `users.routes.test.ts` - 20-25 tests
- [ ] `connections.routes.test.ts` - 20-25 tests
- [ ] `opportunities.routes.test.ts` - 20-25 tests
- [ ] `messages.routes.test.ts` - 20-25 tests (create route first!)
- [ ] `email.routes.test.ts` - 15-20 tests

**Key pattern**: Mock use cases, test HTTP status codes and response formats.

## Test Execution Workflow

```bash
# During development - watch mode
npm test -- --watch

# Run specific layer
npm test -- server/domain
npm test -- server/application
npm test -- server/infrastructure

# Check coverage (do this after each phase)
npm test -- --coverage

# CI mode (before commits)
npm test -- --run --coverage
```

## Coverage Metrics to Track

After each phase, run coverage and verify:

```bash
npm test -- --coverage
```

Target metrics:
- **Domain**: 95%+ (critical business logic)
- **Use Cases**: 90%+ (workflows)
- **Repositories**: 85%+ (data layer)
- **Routes**: 85%+ (HTTP layer)
- **Overall**: 90%+ (project-wide)

## Example Test Using Builders

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { UpdateUserProfileUseCase } from './UpdateUserProfileUseCase'
import { UserBuilder } from '../../../test/builders/UserBuilder'

class MockUserRepository {
  findById = vi.fn()
  update = vi.fn()
}

describe('UpdateUserProfileUseCase', () => {
  let useCase: UpdateUserProfileUseCase
  let mockRepository: MockUserRepository

  beforeEach(() => {
    mockRepository = new MockUserRepository()
    useCase = new UpdateUserProfileUseCase(mockRepository as any)
  })

  it('should update user profile successfully', async () => {
    // Arrange - Use builder for test data
    const user = new UserBuilder()
      .withEmail('test@example.com')
      .asIncompleteProfile()
      .build()

    mockRepository.findById.mockResolvedValue(user)
    mockRepository.update.mockImplementation(u => Promise.resolve(u))

    // Act
    const result = await useCase.execute({
      userId: user.getId().getValue(),
      updates: { bio: 'Updated bio' }
    })

    // Assert
    expect(result.error).toBeNull()
    expect(result.user).not.toBeNull()
    expect(result.user!.getBio()).toBe('Updated bio')
  })
})
```

## Key Testing Principles

1. **Test Behavior, Not Implementation**
   - ✅ "should accept pending connection"
   - ❌ "should call private validate method"

2. **Arrange-Act-Assert (AAA) Pattern**
   ```typescript
   // Arrange: Setup test data and mocks
   const user = new UserBuilder().build()
   mockRepo.findById.mockResolvedValue(user)

   // Act: Execute the operation
   const result = await useCase.execute(request)

   // Assert: Verify expectations
   expect(result.error).toBeNull()
   expect(result.user).toBeDefined()
   ```

3. **Test Independence**
   - Each test must run in isolation
   - Use `beforeEach` to reset state
   - Don't share mutable data between tests

4. **Mock at Boundaries**
   - Domain layer: No mocks (pure logic)
   - Use cases: Mock repositories and services
   - Repositories: Mock Supabase client
   - Routes: Mock use cases

## Common Patterns from Strategy Document

### Testing Exceptions
```typescript
it('should throw error for invalid input', () => {
  expect(() => {
    Connection.create({ requesterId: '', ... })
  }).toThrow('Requester ID cannot be empty')
})
```

### Testing Async Operations
```typescript
it('should handle repository error', async () => {
  mockRepository.save.mockRejectedValue(new Error('DB error'))

  const result = await useCase.execute(request)

  expect(result.error).toBeTruthy()
})
```

### Verifying Mock Calls
```typescript
it('should call repository with correct data', async () => {
  await useCase.execute(request)

  expect(mockRepository.save).toHaveBeenCalledTimes(1)
  const savedUser = mockRepository.save.mock.calls[0][0]
  expect(savedUser.getName()).toBe('Expected Name')
})
```

## Files Reference

All test infrastructure is in:
```
server/test/
├── builders/
│   ├── UserBuilder.ts           # User entity builder
│   ├── ConnectionBuilder.ts     # Connection builder
│   └── OpportunityBuilder.ts    # Opportunity builder
└── utils/
    ├── mockSupabaseClient.ts    # Supabase mock
    ├── mockExpressRequest.ts    # Express request mock
    ├── mockExpressResponse.ts   # Express response mock
    └── testHelpers.ts           # Helper functions
```

Strategy documents:
```
.claude/doc/
├── backend-testing-strategy.md       # Complete strategy (10,000+ words)
├── testing-quick-reference.md        # Quick lookup guide
└── testing-strategy-summary.md       # This file
```

## Next Steps

1. **Review the strategy document** (`backend-testing-strategy.md`) - read Section 2 for detailed examples
2. **Create your first test** - Start with `Email.test.ts` (5 minutes)
3. **Run it and see it pass** - Validate your setup works
4. **Follow Phase 1** - Complete all value objects and entities (2-3 days)
5. **Track progress** - Use the checklist in `testing-quick-reference.md`

## Need Help?

- **Detailed examples**: See `backend-testing-strategy.md` Section 2
- **Quick syntax lookup**: See `testing-quick-reference.md`
- **Builder usage**: See comments in `server/test/builders/*.ts`
- **Mock patterns**: See `server/test/utils/*.ts`

## Remember

- **Start simple**: Value objects first, then entities
- **One test at a time**: Make it pass before moving on
- **Check coverage frequently**: `npm test -- --coverage`
- **Don't skip error cases**: Test failures as much as successes
- **Keep tests fast**: Domain tests should run in milliseconds

You have everything you need to implement comprehensive backend tests. The strategy is proven, the infrastructure is ready, and the examples are clear.

**Ready to start? Create `Email.test.ts` and run your first test!**

---

**Estimated Total Effort**: 12-17 days for complete backend test coverage (90%+)

**Priority**: Start with Phase 1 (Domain Layer) - it's the foundation everything else depends on.

Good luck, Iban! You've got this. 💪
