# Backend Testing Quick Reference Guide

## Test Commands

```bash
# Run all tests
npm test

# Watch mode (re-run on file changes)
npm test -- --watch

# Coverage report
npm test -- --coverage

# Single file
npm test -- server/domain/entities/User.test.ts

# Specific layer
npm test -- server/domain
npm test -- server/application/use-cases

# CI mode (no watch)
npm test -- --run

# Verbose output
npm test -- --reporter=verbose

# Only failed tests
npm test -- --reporter=verbose --bail
```

## Test Structure Template

```typescript
// ABOUTME: What this test file validates
// ABOUTME: Key behaviors and edge cases covered

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

describe('ComponentName', () => {
  // Setup
  beforeEach(() => {
    // Reset state before each test
  })

  afterEach(() => {
    // Cleanup after each test
    vi.clearAllMocks()
  })

  describe('methodName or feature', () => {
    // Group related tests

    it('should [expected behavior] when [condition]', () => {
      // Arrange: Setup test data
      const input = createTestData()

      // Act: Execute the operation
      const result = functionUnderTest(input)

      // Assert: Verify expectations
      expect(result).toBe(expectedValue)
    })

    it('should throw error when [invalid condition]', () => {
      expect(() => {
        functionUnderTest(invalidInput)
      }).toThrow('Expected error message')
    })

    it('should handle async operation', async () => {
      const result = await asyncFunction()
      expect(result).toBeDefined()
    })
  })
})
```

## Common Vitest Assertions

```typescript
// Equality
expect(value).toBe(expectedValue)              // ===
expect(value).toEqual(expectedObject)          // Deep equality
expect(value).toStrictEqual(expected)          // Strict deep equality

// Truthiness
expect(value).toBeTruthy()
expect(value).toBeFalsy()
expect(value).toBeNull()
expect(value).toBeUndefined()
expect(value).toBeDefined()

// Numbers
expect(number).toBeGreaterThan(5)
expect(number).toBeGreaterThanOrEqual(5)
expect(number).toBeLessThan(10)
expect(number).toBeLessThanOrEqual(10)
expect(number).toBeCloseTo(3.14, 2)            // Floating point

// Strings
expect(string).toMatch(/pattern/)
expect(string).toContain('substring')

// Arrays
expect(array).toContain(item)
expect(array).toHaveLength(3)
expect(array).toEqual(expect.arrayContaining([item1, item2]))

// Objects
expect(obj).toHaveProperty('key')
expect(obj).toHaveProperty('key', value)
expect(obj).toMatchObject({ key: value })

// Exceptions
expect(() => fn()).toThrow()
expect(() => fn()).toThrow('error message')
expect(() => fn()).toThrow(ErrorClass)

// Async
await expect(promise).resolves.toBe(value)
await expect(promise).rejects.toThrow('error')

// Mocks
expect(mockFn).toHaveBeenCalled()
expect(mockFn).toHaveBeenCalledTimes(2)
expect(mockFn).toHaveBeenCalledWith(arg1, arg2)
expect(mockFn).toHaveBeenLastCalledWith(arg)
expect(mockFn).toHaveReturnedWith(value)
```

## Mocking Patterns

### Vi Mock Functions

```typescript
import { vi } from 'vitest'

// Create mock function
const mockFn = vi.fn()

// Mock with implementation
const mockFn = vi.fn((x) => x * 2)

// Mock return value
mockFn.mockReturnValue(42)
mockFn.mockReturnValueOnce(1).mockReturnValueOnce(2)

// Mock resolved/rejected promises
mockFn.mockResolvedValue(data)
mockFn.mockRejectedValue(new Error('Failed'))

// Mock implementation
mockFn.mockImplementation((x) => x + 1)
mockFn.mockImplementationOnce((x) => x * 2)

// Inspect calls
mockFn.mock.calls           // [[arg1, arg2], [arg3, arg4]]
mockFn.mock.calls[0][0]     // First argument of first call
mockFn.mock.results         // [{ type: 'return', value: 42 }]

// Reset
vi.clearAllMocks()          // Clear call history
vi.resetAllMocks()          // Reset implementation
vi.restoreAllMocks()        // Restore original
```

### Mock Objects

```typescript
// Simple mock object
const mockRepository = {
  findById: vi.fn(),
  save: vi.fn(),
  update: vi.fn()
}

// Class-based mock
class MockUserRepository {
  findById = vi.fn()
  save = vi.fn()
  update = vi.fn()

  // Helper methods
  clear() {
    this.findById.mockClear()
    this.save.mockClear()
    this.update.mockClear()
  }
}

// Usage
const repo = new MockUserRepository()
repo.findById.mockResolvedValue(user)
```

### Module Mocking

```typescript
// Mock entire module
vi.mock('./path/to/module', () => ({
  functionName: vi.fn(),
  ClassName: vi.fn()
}))

// Partial mock
vi.mock('./Container', () => ({
  Container: {
    getUserRepository: vi.fn(),
    getAuthService: vi.fn()
  }
}))

// Auto-mock with custom implementation
vi.mock('./supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis()
    }))
  }
}))
```

### Spy on Methods

```typescript
// Spy on object method
const spy = vi.spyOn(object, 'methodName')

// Spy and mock implementation
vi.spyOn(object, 'method').mockImplementation(() => 'mocked')

// Spy and track calls without changing behavior
vi.spyOn(console, 'log').mockImplementation(() => {})

// Restore
spy.mockRestore()
```

## Testing Async Code

```typescript
// Test async/await
it('should fetch data', async () => {
  const data = await fetchData()
  expect(data).toBeDefined()
})

// Test promise resolution
it('should resolve with data', () => {
  return expect(fetchData()).resolves.toEqual(expectedData)
})

// Test promise rejection
it('should reject with error', () => {
  return expect(failingOperation()).rejects.toThrow('Error')
})

// Test callbacks (if needed)
it('should call callback', (done) => {
  fetchData((err, data) => {
    expect(data).toBe('result')
    done()
  })
})
```

## Testing Dates and Timers

```typescript
import { vi, beforeEach, afterEach } from 'vitest'

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

it('should advance time', () => {
  const startTime = Date.now()

  vi.advanceTimersByTime(1000) // Advance 1 second

  const endTime = Date.now()
  expect(endTime - startTime).toBe(1000)
})

it('should run all timers', () => {
  const callback = vi.fn()
  setTimeout(callback, 1000)

  vi.runAllTimers()

  expect(callback).toHaveBeenCalled()
})

it('should set system time', () => {
  const fixedDate = new Date('2024-01-01')
  vi.setSystemTime(fixedDate)

  expect(new Date().toISOString()).toBe(fixedDate.toISOString())
})
```

## Testing Error Scenarios

```typescript
// Synchronous errors
it('should throw error', () => {
  expect(() => {
    functionThatThrows()
  }).toThrow('Error message')
})

// Async errors
it('should reject promise', async () => {
  await expect(asyncFunctionThatFails()).rejects.toThrow('Error')
})

// Verify error type
it('should throw specific error type', () => {
  expect(() => {
    functionThatThrows()
  }).toThrow(ValidationError)
})

// Verify error properties
it('should throw error with message', () => {
  try {
    functionThatThrows()
    expect.fail('Should have thrown')
  } catch (error) {
    expect(error).toBeInstanceOf(CustomError)
    expect(error.message).toBe('Expected message')
    expect(error.code).toBe('VALIDATION_FAILED')
  }
})
```

## Test Data Builders

```typescript
// Builder pattern
class UserBuilder {
  private props = {
    id: 'default-id',
    email: 'test@example.com',
    name: 'Test User'
  }

  withId(id: string): this {
    this.props.id = id
    return this
  }

  withEmail(email: string): this {
    this.props.email = email
    return this
  }

  asAdmin(): this {
    this.props.roleIds = [1]
    return this
  }

  build(): User {
    return User.create(this.props)
  }
}

// Usage
const user = new UserBuilder()
  .withEmail('custom@example.com')
  .asAdmin()
  .build()

// Factory pattern
function createUser(overrides = {}) {
  return User.create({
    id: 'default-id',
    email: 'test@example.com',
    name: 'Test User',
    ...overrides
  })
}

// Usage
const user = createUser({ email: 'custom@example.com' })
```

## Coverage Analysis

```bash
# Generate coverage report
npm test -- --coverage

# View in browser
open coverage/index.html

# Coverage files
coverage/
  ├── index.html          # Interactive HTML report
  ├── lcov-report/        # Detailed line-by-line
  ├── coverage-final.json # JSON data
  └── lcov.info          # LCOV format (for CI)
```

### Coverage Thresholds (vitest.config.ts)

```typescript
coverage: {
  thresholds: {
    lines: 80,
    functions: 80,
    branches: 80,
    statements: 80
  }
}
```

## Common Testing Mistakes

### ❌ Don't Do This

```typescript
// 1. Testing implementation details
it('should call private method', () => {
  expect(obj['_privateMethod']).toHaveBeenCalled()
})

// 2. Shared state between tests
let sharedUser: User

it('test 1', () => {
  sharedUser = createUser()
})

it('test 2', () => {
  sharedUser.update() // Depends on test 1
})

// 3. Not resetting mocks
it('test 1', () => {
  mockFn.mockReturnValue(1)
})

it('test 2', () => {
  // mockFn still returns 1 from previous test!
})

// 4. Testing multiple things in one test
it('should do everything', () => {
  expect(user.getName()).toBe('Test')
  expect(user.getEmail()).toBe('test@example.com')
  expect(user.isAdmin()).toBe(false)
  expect(user.calculateCompletionPercentage()).toBe(80)
})

// 5. Unclear test names
it('works', () => { /* ... */ })
it('test user', () => { /* ... */ })
```

### ✅ Do This Instead

```typescript
// 1. Test observable behavior
it('should throw error when creating user with invalid email', () => {
  expect(() => createUser({ email: 'invalid' })).toThrow('Invalid email')
})

// 2. Independent tests with setup
beforeEach(() => {
  user = createUser() // Fresh instance each test
})

// 3. Reset mocks in beforeEach/afterEach
beforeEach(() => {
  vi.clearAllMocks()
})

// 4. One assertion per test (or closely related assertions)
it('should return user name', () => {
  expect(user.getName()).toBe('Test User')
})

it('should calculate profile completion percentage', () => {
  expect(user.calculateCompletionPercentage().getValue()).toBe(80)
})

// 5. Descriptive test names
it('should accept pending connection when called by addressee', () => {
  // Clear what's being tested
})
```

## Debugging Tests

```typescript
// Print values during test
it('should process data', () => {
  console.log('Input:', input)
  const result = process(input)
  console.log('Result:', result)
  expect(result).toBe(expected)
})

// Use debugger
it('should work', () => {
  debugger // Execution pauses here
  const result = fn()
  expect(result).toBe(expected)
})

// Run single test with --reporter=verbose
npm test -- path/to/test.ts --reporter=verbose

// Use .only to run single test
it.only('should run only this test', () => {
  // Only this test runs
})

// Skip tests temporarily
it.skip('not ready yet', () => {
  // This test is skipped
})

// Conditional skip
it.skipIf(condition)('should run unless condition is true', () => {
  // ...
})
```

## Express Route Testing with Supertest

```bash
# Install supertest
npm install -D supertest @types/supertest
```

```typescript
import request from 'supertest'
import express, { Express } from 'express'
import { createAuthRoutes } from './auth.routes'

describe('Auth Routes', () => {
  let app: Express

  beforeEach(() => {
    app = express()
    app.use(express.json())
    app.use('/api/auth', createAuthRoutes())
  })

  it('should return 200 on successful login', async () => {
    const response = await request(app)
      .post('/api/auth/signin')
      .send({ email: 'test@example.com', password: 'password' })
      .expect(200)
      .expect('Content-Type', /json/)

    expect(response.body.user).toBeDefined()
    expect(response.body.user.email).toBe('test@example.com')
  })

  it('should return 400 for missing fields', async () => {
    const response = await request(app)
      .post('/api/auth/signin')
      .send({ email: 'test@example.com' }) // Missing password
      .expect(400)

    expect(response.body.error).toBe('Missing required fields: email, password')
  })
})
```

## Phase-by-Phase Checklist

### Phase 1: Domain Layer ✓
- [ ] Email.test.ts (15-20 tests)
- [ ] UserId.test.ts (15-20 tests)
- [ ] CompletionPercentage.test.ts (15-20 tests)
- [ ] User.test.ts (40-50 tests)
- [ ] Connection.test.ts (40-50 tests)
- [ ] Opportunity.test.ts (40-50 tests)
- [ ] Message.test.ts (30-40 tests)
- [ ] **Target**: 95%+ coverage

### Phase 2: Critical Use Cases ✓
- [ ] SignUpUseCase.test.ts (25-30 tests)
- [ ] SignInUseCase.test.ts (20-25 tests)
- [ ] UpdateUserProfileUseCase.test.ts (20-25 tests)
- [ ] RequestConnectionUseCase.test.ts (20-25 tests)
- [ ] UpdateConnectionStatusUseCase.test.ts (20-25 tests)
- [ ] **Target**: 90%+ coverage for critical paths

### Phase 3: Remaining Use Cases ✓
- [ ] Network use cases (6 files × 15-20 tests)
- [ ] Opportunity use cases (6 files × 15-20 tests)
- [ ] Message use cases (6 files × 15-20 tests)
- [ ] **Target**: 90%+ overall use case coverage

### Phase 4: Infrastructure ✓
- [ ] SupabaseUserRepository.test.ts (20-25 tests)
- [ ] SupabaseConnectionRepository.test.ts (20-25 tests)
- [ ] SupabaseOpportunityRepository.test.ts (20-25 tests)
- [ ] SupabaseMessageRepository.test.ts (20-25 tests)
- [ ] **Target**: 85%+ coverage

### Phase 5: API Routes ✓
- [ ] auth.routes.test.ts (20-25 tests)
- [ ] users.routes.test.ts (20-25 tests)
- [ ] connections.routes.test.ts (20-25 tests)
- [ ] opportunities.routes.test.ts (20-25 tests)
- [ ] messages.routes.test.ts (20-25 tests)
- [ ] email.routes.test.ts (15-20 tests)
- [ ] **Target**: 85%+ coverage

## Quick Win: First Test Example

Create your first test to validate setup:

```typescript
// server/domain/value-objects/Email.test.ts
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

Run it:
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

Congratulations! Your testing infrastructure is working. Now follow the phase plan to complete all tests.
