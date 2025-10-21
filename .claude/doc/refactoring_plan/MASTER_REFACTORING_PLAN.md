# Master Refactoring Plan - España Creativa Red

**Date**: 2025-10-21
**Author**: Claude Code
**Goal**: Refactor entire project to comply with CLAUDE.md rules and sub-agent architecture patterns

## Executive Summary

This is a complete architectural refactoring of the España Creativa Red project to:

1. ✅ Add ABOUTME comments to ALL files (100+ files)
2. ✅ Implement hexagonal architecture in backend
3. ✅ Implement feature-based architecture in frontend
4. ✅ Configure Vitest + React Testing Library
5. ✅ Write unit tests for all code (NO EXCEPTIONS)
6. ✅ Follow all sub-agent technology standards

**Estimated Effort**: 40-50 hours of development
**Risk Level**: HIGH (major architectural changes)

---

## Phase 1: Infrastructure & Testing Setup

### 1.1 Configure Vitest

**Files to Create:**
- `vitest.config.ts` - Main Vitest configuration
- `src/test/setup.ts` - Test setup file
- `src/test/utils.tsx` - Test utilities and custom renders
- `src/test/mocks/` - Mock files for common dependencies

**Dependencies to Install:**
```bash
npm install -D vitest @vitest/ui @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom msw
```

**Configuration:**
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react-swc'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'src/test/']
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
})
```

### 1.2 Update package.json Scripts

Add test scripts:
```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:run": "vitest run"
  }
}
```

---

## Phase 2: Backend Hexagonal Architecture Refactoring

### 2.1 New Backend Structure

```
server/
├── domain/                      # Pure business logic (NEW)
│   ├── entities/
│   │   ├── User.ts
│   │   ├── Project.ts
│   │   ├── Opportunity.ts
│   │   └── Message.ts
│   ├── value-objects/
│   │   ├── Email.ts
│   │   ├── UserId.ts
│   │   └── CompletionPercentage.ts
│   └── services/
│       └── ProfileCompletionService.ts
├── application/                 # Use cases & ports (NEW)
│   ├── use-cases/
│   │   ├── auth/
│   │   │   ├── SignUpUseCase.ts
│   │   │   ├── SignInUseCase.ts
│   │   │   └── SignOutUseCase.ts
│   │   ├── users/
│   │   │   ├── GetUserProfileUseCase.ts
│   │   │   ├── UpdateUserProfileUseCase.ts
│   │   │   └── SearchUsersUseCase.ts
│   │   └── email/
│   │       ├── SendWelcomeEmailUseCase.ts
│   │       └── SendNotificationEmailUseCase.ts
│   └── ports/
│       ├── repositories/
│       │   ├── IUserRepository.ts
│       │   ├── IProjectRepository.ts
│       │   └── IOpportunityRepository.ts
│       └── services/
│           ├── IEmailService.ts
│           └── IAuthService.ts
├── infrastructure/              # Adapters (NEW)
│   ├── adapters/
│   │   ├── repositories/
│   │   │   ├── SupabaseUserRepository.ts
│   │   │   ├── SupabaseProjectRepository.ts
│   │   │   └── SupabaseOpportunityRepository.ts
│   │   └── services/
│   │       ├── ResendEmailService.ts
│   │       └── SupabaseAuthService.ts
│   └── api/
│       ├── routes/
│       │   ├── auth.routes.ts
│       │   ├── users.routes.ts
│       │   └── email.routes.ts
│       └── middleware/
│           ├── errorHandler.ts
│           └── logger.ts
├── index.ts                     # Refactored entry point with DI
└── logger.js                    # Keep as is
```

### 2.2 Domain Layer Implementation

**Key Files to Create:**

1. **server/domain/entities/User.ts**
   ```typescript
   // ABOUTME: Domain entity representing a user in the España Creativa network
   // ABOUTME: Contains business logic for profile validation and completeness calculation

   export class User {
     private constructor(
       public readonly id: string,
       public readonly email: string,
       // ... other properties
     ) {}

     static create(props: UserProps): Result<User, DomainError> {
       // Validation logic
     }

     calculateCompletionPercentage(): number {
       // Business logic moved from DB trigger
     }
   }
   ```

2. **server/domain/value-objects/Email.ts**
   ```typescript
   // ABOUTME: Value object for email validation
   // ABOUTME: Ensures email format is valid according to business rules
   ```

### 2.3 Application Layer Implementation

**Use Case Pattern:**

```typescript
// ABOUTME: Use case for user sign up with email verification
// ABOUTME: Orchestrates user creation, role assignment, and welcome email

export class SignUpUseCase {
  constructor(
    private userRepository: IUserRepository,
    private authService: IAuthService,
    private emailService: IEmailService
  ) {}

  async execute(request: SignUpRequest): Promise<Result<User, ApplicationError>> {
    // 1. Validate input
    // 2. Create user via auth service
    // 3. Create user profile in repository
    // 4. Send welcome email
    // 5. Return result
  }
}
```

### 2.4 Infrastructure Layer Implementation

**Repository Adapter Pattern:**

```typescript
// ABOUTME: Supabase implementation of user repository port
// ABOUTME: Handles data persistence and retrieval using Supabase client

export class SupabaseUserRepository implements IUserRepository {
  constructor(private supabase: SupabaseClient) {}

  async findById(id: UserId): Promise<Option<User>> {
    // Supabase query implementation
    // Map database model to domain entity
  }
}
```

### 2.5 API Routes Refactoring

**Express routes with dependency injection:**

```typescript
// ABOUTME: Authentication routes for sign up, sign in, and sign out
// ABOUTME: Thin adapter layer delegating to use cases

export function createAuthRoutes(
  signUpUseCase: SignUpUseCase,
  signInUseCase: SignInUseCase
): Router {
  const router = express.Router()

  router.post('/signup', async (req, res, next) => {
    try {
      const result = await signUpUseCase.execute(req.body)
      // Map result to HTTP response
    } catch (error) {
      next(error)
    }
  })

  return router
}
```

---

## Phase 3: Frontend Feature-Based Architecture Refactoring

### 3.1 New Frontend Structure

```
src/
├── app/                         # App entry and routing (NEW)
│   ├── features/               # Feature modules (NEW)
│   │   ├── auth/
│   │   │   ├── components/
│   │   │   │   ├── LoginForm.tsx
│   │   │   │   ├── RegisterForm.tsx
│   │   │   │   └── ProtectedRoute.tsx
│   │   │   ├── data/
│   │   │   │   ├── schemas/
│   │   │   │   │   ├── auth.schema.ts
│   │   │   │   │   └── user.schema.ts
│   │   │   │   └── services/
│   │   │   │       └── auth.service.ts
│   │   │   ├── hooks/
│   │   │   │   ├── useAuthContext.tsx
│   │   │   │   ├── queries/
│   │   │   │   │   └── useCurrentUserQuery.ts
│   │   │   │   └── mutations/
│   │   │   │       ├── useSignUpMutation.ts
│   │   │   │       └── useSignInMutation.ts
│   │   │   └── pages/
│   │   │       └── AuthPage.tsx
│   │   ├── profile/
│   │   │   ├── components/
│   │   │   ├── data/
│   │   │   ├── hooks/
│   │   │   └── pages/
│   │   ├── network/
│   │   │   ├── components/
│   │   │   ├── data/
│   │   │   ├── hooks/
│   │   │   └── pages/
│   │   ├── opportunities/
│   │   └── messages/
│   ├── shared/                 # Shared utilities (NEW)
│   │   ├── components/
│   │   │   └── ui/            # Move shadcn components here
│   │   ├── hooks/
│   │   └── utils/
│   ├── providers/              # Global providers (NEW)
│   │   ├── QueryProvider.tsx
│   │   └── ThemeProvider.tsx
│   └── App.tsx
├── test/                       # Test utilities
└── main.tsx
```

### 3.2 Feature Module Pattern

**Each feature follows this structure:**

1. **Schemas** (Zod validation):
   ```typescript
   // ABOUTME: Zod schemas for authentication feature data validation
   // ABOUTME: Provides runtime type safety and TypeScript inference

   export const signUpSchema = z.object({
     email: z.string().email(),
     password: z.string().min(8),
     name: z.string().min(2)
   })

   export type SignUpRequest = z.infer<typeof signUpSchema>
   ```

2. **Services** (API communication):
   ```typescript
   // ABOUTME: Authentication service for API communication
   // ABOUTME: Pure async functions returning typed promises

   export const authService = {
     async signUp(data: SignUpRequest): Promise<SignUpResponse> {
       const validated = signUpSchema.parse(data)
       const response = await axios.post('/api/auth/signup', validated)
       return signUpResponseSchema.parse(response.data)
     }
   }
   ```

3. **Query Hooks**:
   ```typescript
   // ABOUTME: React Query hook for fetching current user
   // ABOUTME: Handles caching, loading, and error states

   export function useCurrentUserQuery() {
     return useQuery({
       queryKey: ['auth', 'currentUser'],
       queryFn: () => authService.getCurrentUser(),
       staleTime: 5 * 60 * 1000
     })
   }
   ```

4. **Mutation Hooks**:
   ```typescript
   // ABOUTME: React Query mutation for user sign up
   // ABOUTME: Returns standardized {action, isLoading, error, isSuccess}

   export function useSignUpMutation() {
     const queryClient = useQueryClient()

     const mutation = useMutation({
       mutationFn: authService.signUp,
       onSuccess: () => {
         queryClient.invalidateQueries(['auth', 'currentUser'])
       }
     })

     return {
       action: mutation.mutate,
       isLoading: mutation.isPending,
       error: mutation.error,
       isSuccess: mutation.isSuccess
     }
   }
   ```

5. **Context Hook**:
   ```typescript
   // ABOUTME: Auth feature context providing authentication state and operations
   // ABOUTME: Consumes query and mutation hooks to provide unified interface

   export function useAuthContext() {
     const { data: user, isLoading } = useCurrentUserQuery()
     const signUp = useSignUpMutation()
     const signIn = useSignInMutation()

     return {
       user,
       isLoading,
       signUp: signUp.action,
       signIn: signIn.action,
       isSigningUp: signUp.isLoading
     }
   }
   ```

### 3.3 Migration Strategy

**For each existing feature:**

1. Create new feature folder structure
2. Define Zod schemas for all data types
3. Create service layer with API calls
4. Implement query hooks for data fetching
5. Implement mutation hooks for data modifications
6. Create context hook to orchestrate operations
7. Refactor components to use new hooks
8. Delete old structure files

---

## Phase 4: Add ABOUTME Comments

### 4.1 Automation Script

Create script to help add ABOUTME comments:

```typescript
// scripts/add-aboutme-comments.ts
// ABOUTME: Script to add ABOUTME comment placeholders to all TypeScript files
// ABOUTME: Generates templates that developers must fill with actual descriptions

import fs from 'fs'
import path from 'path'

// Logic to find files without ABOUTME
// Add comment template at top
```

### 4.2 Manual Review Required

Each file needs meaningful ABOUTME comments. Categories:

- **Domain entities**: Explain business concept
- **Use cases**: Explain business operation
- **Services**: Explain external dependency
- **Components**: Explain UI purpose and user interaction
- **Hooks**: Explain state/effect purpose
- **Utilities**: Explain transformation/helper purpose

---

## Phase 5: Comprehensive Testing

### 5.1 Backend Tests Structure

```
server/
├── domain/
│   ├── entities/
│   │   ├── User.ts
│   │   └── User.test.ts         # Test domain logic
│   └── value-objects/
│       ├── Email.ts
│       └── Email.test.ts
├── application/
│   └── use-cases/
│       ├── auth/
│       │   ├── SignUpUseCase.ts
│       │   └── SignUpUseCase.test.ts  # Mock repositories
└── infrastructure/
    └── adapters/
        └── repositories/
            ├── SupabaseUserRepository.ts
            └── SupabaseUserRepository.test.ts  # Integration tests
```

### 5.2 Frontend Tests Structure

```
src/app/features/auth/
├── data/
│   ├── schemas/
│   │   ├── auth.schema.ts
│   │   └── auth.schema.test.ts
│   └── services/
│       ├── auth.service.ts
│       └── auth.service.test.ts
├── hooks/
│   ├── useAuthContext.tsx
│   ├── useAuthContext.test.tsx
│   └── mutations/
│       ├── useSignUpMutation.ts
│       └── useSignUpMutation.test.ts
└── components/
    ├── LoginForm.tsx
    └── LoginForm.test.tsx
```

### 5.3 Test Coverage Requirements

- **Domain Layer**: 95%+ (pure business logic)
- **Application Layer**: 90%+ (use cases)
- **Infrastructure**: 80%+ (adapters)
- **Frontend Components**: 80%+ (user interactions)
- **Frontend Hooks**: 90%+ (state management)
- **Services**: 85%+ (API calls)

---

## Phase 6: Migration Execution Order

### Step-by-Step Execution:

1. **Week 1: Infrastructure Setup**
   - Day 1-2: Configure Vitest, create test utilities
   - Day 3-4: Set up MSW for API mocking
   - Day 5: Create testing documentation

2. **Week 2: Backend Domain Layer**
   - Day 1-2: Create domain entities
   - Day 3: Create value objects
   - Day 4-5: Write domain tests (TDD)

3. **Week 3: Backend Application Layer**
   - Day 1-2: Define repository ports
   - Day 3-4: Implement use cases
   - Day 5: Write use case tests

4. **Week 4: Backend Infrastructure**
   - Day 1-3: Implement Supabase repositories
   - Day 4: Implement email service adapter
   - Day 5: Write adapter tests

5. **Week 5: Backend API Refactoring**
   - Day 1-2: Refactor Express routes with DI
   - Day 3: Implement error handling middleware
   - Day 4-5: Integration tests for API

6. **Week 6: Frontend Auth Feature**
   - Day 1: Create auth schemas and services
   - Day 2: Implement query/mutation hooks
   - Day 3: Create auth context
   - Day 4-5: Refactor auth components + tests

7. **Week 7-8: Frontend Profile Feature**
   - Repeat feature pattern for profile

8. **Week 9-10: Frontend Network, Opportunities, Messages**
   - Repeat feature pattern for remaining features

9. **Week 11: ABOUTME Comments**
   - Add meaningful ABOUTME to all files
   - Review and update as needed

10. **Week 12: Final Testing & Documentation**
    - Achieve coverage targets
    - Update CLAUDE.md
    - Create migration documentation

---

## Technologies & Frameworks (Per Sub-Agents)

### Backend (hexagonal-backend-architect)
- ✅ TypeScript strict mode
- ✅ Express.js for API
- ✅ Dependency injection pattern
- ✅ Repository pattern with interfaces
- ✅ Domain-Driven Design entities
- ✅ Vitest for testing

### Frontend (frontend-developer)
- ✅ React 19 (upgrade from 18)
- ✅ TypeScript
- ✅ React Query (TanStack Query) - NEW (replacing Zustand for server state)
- ✅ Zod for validation - NEW
- ✅ Axios for API calls - NEW
- ✅ Feature-based architecture

### Testing (frontend-test-engineer, backend-test-architect)
- ✅ Vitest as test runner
- ✅ React Testing Library
- ✅ MSW for API mocking
- ✅ @testing-library/user-event
- ✅ AAA pattern (Arrange-Act-Assert)

---

## Risk Mitigation

### High-Risk Areas:
1. **Authentication flow changes** - Could break login
2. **Database queries refactoring** - Could affect data integrity
3. **State management migration** - Zustand → React Query
4. **Routing changes** - Could break navigation

### Mitigation Strategies:
1. Create feature flags for gradual rollout
2. Keep old code alongside new during migration
3. Write integration tests FIRST
4. Test in staging environment thoroughly
5. Have rollback plan for each phase

---

## Success Criteria

- [ ] 100% of files have meaningful ABOUTME comments
- [ ] Backend follows hexagonal architecture (domain/application/infrastructure)
- [ ] Frontend follows feature-based architecture
- [ ] Vitest configured and running
- [ ] Test coverage: Domain 95%, Application 90%, Infrastructure 80%, Frontend 80%
- [ ] All tests passing
- [ ] No regression in functionality
- [ ] Documentation updated
- [ ] CI/CD pipeline includes tests

---

## Next Steps

1. Get approval on this plan from Iban
2. Create feature branch: `refactor/hexagonal-architecture`
3. Start with Phase 1: Infrastructure & Testing Setup
4. Execute phases sequentially
5. Create PRs for each major phase for review

---

**IMPORTANT NOTES:**

- This is a MASSIVE refactoring (estimated 300+ hours total)
- Consider doing this incrementally over 3-4 months
- Each phase should be a separate PR
- Keep production stable during migration
- Document everything for future maintainers
