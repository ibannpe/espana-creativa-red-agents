# Backend Implementation Plan: Recent Users Endpoint

**Feature**: `recent_users`
**Endpoint**: `GET /api/users/recent`
**Architecture**: Hexagonal (Ports & Adapters)
**Date**: 2025-10-25
**Status**: Design Phase

---

## 1. USE CASE: GetRecentUsersUseCase

### 1.1 File Location
```
server/application/use-cases/users/GetRecentUsersUseCase.ts
```

### 1.2 Responsibilities
- Orchestrate the retrieval of recent users
- Validate input parameters (days, limit)
- Delegate to repository for data fetching
- Return structured response with metadata

### 1.3 Method Signature

```typescript
export interface GetRecentUsersRequest {
  days?: number    // Optional, default: 30
  limit?: number   // Optional, default: 5
}

export interface GetRecentUsersResponse {
  users: User[]
  count: number
  daysFilter: number
  error: string | null
}

export class GetRecentUsersUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(request: GetRecentUsersRequest): Promise<GetRecentUsersResponse>
}
```

### 1.4 Business Logic

**Input Validation**:
1. **days parameter**:
   - Must be a positive integer
   - Minimum: 1 day
   - Maximum: 365 days (prevent abuse)
   - Default: 30 days if not provided or invalid

2. **limit parameter**:
   - Must be a positive integer
   - Minimum: 1 user
   - Maximum: 50 users (prevent large queries)
   - Default: 5 users if not provided or invalid

**Execution Flow**:
```
1. Validate and sanitize days parameter
2. Validate and sanitize limit parameter
3. Call repository.findRecentUsers(days, limit)
4. Return structured response with:
   - users: User[] (domain entities)
   - count: number (actual count returned)
   - daysFilter: number (applied filter value)
   - error: null | string
```

**Error Handling**:
- Invalid parameters → Return error response with explanation
- Repository throws → Catch and return error response
- Empty result → Return empty array with count: 0 (NOT an error)

### 1.5 Domain Logic Notes
- No complex business rules in this use case
- Primarily delegation to repository
- Focus on input validation and proper error handling
- Use existing `User` domain entity (no new entities needed)

---

## 2. REPOSITORY PORT: IUserRepository Extension

### 2.1 File Location
```
server/application/ports/repositories/IUserRepository.ts
```

### 2.2 Method to Add

```typescript
export interface IUserRepository {
  // ... existing methods ...

  /**
   * Find recent users registered within the last N days
   * @param days - Number of days to look back (e.g., 30)
   * @param limit - Maximum number of users to return (e.g., 5)
   * @returns Array of User entities sorted by created_at DESC
   */
  findRecentUsers(days: number, limit: number): Promise<User[]>
}
```

### 2.3 Contract Specification

**Input Constraints** (enforced by use case):
- `days`: Integer >= 1, <= 365
- `limit`: Integer >= 1, <= 50

**Output Guarantees**:
- Returns array of User domain entities
- Users are sorted by `created_at` in descending order (newest first)
- Array length is <= limit parameter
- Users must have `created_at >= (NOW() - INTERVAL 'days' days)`
- Each User entity includes role information (via `user_roles` join)

**Implementation Requirements**:
- Query must use database-native time functions (e.g., PostgreSQL `NOW()`, `INTERVAL`)
- Must join with `user_roles` table to populate `roleIds` in User entity
- Must handle timezone correctly (UTC storage, UTC comparison)

---

## 3. REPOSITORY IMPLEMENTATION: SupabaseUserRepository

### 3.1 File Location
```
server/infrastructure/adapters/repositories/SupabaseUserRepository.ts
```

### 3.2 Implementation Strategy

**Method to Add**:
```typescript
async findRecentUsers(days: number, limit: number): Promise<User[]> {
  // Implementation details below
}
```

### 3.3 Supabase Query Design

**Step 1: Date Filter Calculation**
```typescript
// Calculate cutoff date: NOW() - INTERVAL 'N days'
// Use PostgreSQL function to ensure timezone correctness
const cutoffDate = new Date()
cutoffDate.setDate(cutoffDate.getDate() - days)
const cutoffISOString = cutoffDate.toISOString()
```

**Step 2: Query Construction**
```typescript
const { data, error } = await this.supabase
  .from('users')
  .select(`
    *,
    user_roles!inner(
      role_id
    )
  `)
  .gte('created_at', cutoffISOString)  // Filter: created_at >= cutoff
  .order('created_at', { ascending: false })  // Sort: newest first
  .limit(limit)  // Limit results
```

**Step 3: JOIN with user_roles**
- Use `!inner` join to ensure we get role information
- Select `role_id` from `user_roles` table
- This populates the `user_roles` array in the response
- The existing `mapToEntity()` helper already handles this structure

**Step 4: Error Handling**
```typescript
if (error) {
  console.error('Failed to fetch recent users:', error)
  return []  // Return empty array on error
}

if (!data) {
  return []
}
```

**Step 5: Entity Mapping**
```typescript
return data.map(row => this.mapToEntity(row))
```

### 3.4 Timezone Considerations

**Current Setup**:
- Supabase stores timestamps in UTC (PostgreSQL default)
- JavaScript `Date` objects are timezone-aware
- `.toISOString()` returns UTC timestamp string

**Query Approach**:
- Use `.gte('created_at', cutoffISOString)` for date comparison
- Supabase/PostgreSQL will compare UTC timestamps correctly
- No timezone conversion needed (both sides are UTC)

**Alternative Approach** (if above fails):
- Use raw SQL with `NOW() - INTERVAL '${days} days'`
- Requires Supabase `.rpc()` call or raw SQL function

### 3.5 Performance Notes

**Index Requirement**:
- Verify index exists on `users.created_at` column
- Query: `CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);`
- This ensures fast filtering and sorting

**Query Performance**:
- Expected result set: 5-50 records (very small)
- Filter on indexed column (`created_at`)
- JOIN with `user_roles` is minimal (few rows per user)
- **Estimated query time**: < 50ms

**Optimization Opportunities**:
- None needed initially (query is already efficient)
- Can add Redis caching later if this becomes a hot path

---

## 4. HTTP ROUTE: Express Route Handler

### 4.1 File Location
```
server/infrastructure/api/routes/users.routes.ts
```

### 4.2 Route Registration

**CRITICAL: Route Order**
```typescript
export const createUsersRoutes = (): Router => {
  const router = Router()

  // ⚠️ IMPORTANT: /recent MUST come BEFORE /:id
  // Otherwise Express will treat "recent" as a user ID
  router.get('/recent', recentUsersHandler)  // ← ADD THIS FIRST

  router.get('/:id', getUserProfileHandler)  // ← Existing route
  // ... other routes
}
```

### 4.3 Route Handler Implementation

**Handler Function**:
```typescript
router.get('/recent', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // 1. Extract and parse query parameters
    const daysParam = req.query.days
    const limitParam = req.query.limit

    // 2. Convert to numbers (may be strings from query params)
    const days = daysParam ? parseInt(daysParam as string, 10) : undefined
    const limit = limitParam ? parseInt(limitParam as string, 10) : undefined

    // 3. Get use case from DI container
    const getRecentUsersUseCase = Container.getGetRecentUsersUseCase()

    // 4. Execute use case
    const result = await getRecentUsersUseCase.execute({ days, limit })

    // 5. Handle errors from use case
    if (result.error) {
      return res.status(400).json({
        error: result.error
      })
    }

    // 6. Map domain entities to API response format
    const usersResponse = result.users.map(user => {
      const primitives = user.toPrimitives()
      return {
        id: primitives.id,
        email: primitives.email,
        name: primitives.name,
        avatar_url: primitives.avatarUrl,
        bio: primitives.bio,
        location: primitives.location,
        linkedin_url: primitives.linkedinUrl,
        website_url: primitives.websiteUrl,
        skills: primitives.skills,
        interests: primitives.interests,
        completed_pct: user.calculateCompletionPercentage().getValue(),
        created_at: primitives.createdAt,
        updated_at: primitives.updatedAt
      }
    })

    // 7. Return successful response
    return res.status(200).json({
      users: usersResponse,
      count: result.count,
      days_filter: result.daysFilter
    })

  } catch (error) {
    // 8. Delegate unexpected errors to global error handler
    next(error)
  }
})
```

### 4.4 Query Parameter Validation

**Validation Strategy**:
- Validation happens in **Use Case**, not in route handler
- Route handler only parses query strings to numbers
- Use case validates ranges and defaults

**Why this approach?**
- Keeps route handler thin (adapter layer)
- Business rules (min/max values) live in application layer
- Easier to test validation logic

### 4.5 Error Handling

**Error Types**:

1. **400 Bad Request**:
   - Invalid query parameters (e.g., `days=-5`)
   - Validation errors from use case
   - Response: `{ error: "..." }`

2. **500 Internal Server Error**:
   - Database connection failure
   - Unexpected errors
   - Handled by global error middleware (next(error))

**Success Response** (200 OK):
```json
{
  "users": [...],
  "count": 5,
  "days_filter": 30
}
```

### 4.6 Response Format Mapping

**Domain Entity → API Response**:
- Convert camelCase (domain) to snake_case (API)
- Include calculated `completed_pct` field
- Serialize dates to ISO strings (automatic with JSON.stringify)
- Flatten role information (already handled by existing code)

---

## 5. DI CONTAINER: Dependency Registration

### 5.1 File Location
```
server/infrastructure/di/Container.ts
```

### 5.2 Changes Required

**Step 1: Import Use Case**
```typescript
// Use Cases - Users
import { GetUserProfileUseCase } from '../../application/use-cases/users/GetUserProfileUseCase'
import { UpdateUserProfileUseCase } from '../../application/use-cases/users/UpdateUserProfileUseCase'
import { SearchUsersUseCase } from '../../application/use-cases/users/SearchUsersUseCase'
import { GetRecentUsersUseCase } from '../../application/use-cases/users/GetRecentUsersUseCase'  // ← ADD
```

**Step 2: Add Private Static Property**
```typescript
export class Container {
  // ... existing properties ...

  // Use Cases - Users
  private static getUserProfileUseCase: GetUserProfileUseCase
  private static updateUserProfileUseCase: UpdateUserProfileUseCase
  private static searchUsersUseCase: SearchUsersUseCase
  private static getRecentUsersUseCase: GetRecentUsersUseCase  // ← ADD
```

**Step 3: Initialize in initialize() Method**
```typescript
static initialize() {
  // ... existing initialization ...

  // After searchUsersUseCase initialization:
  this.searchUsersUseCase = new SearchUsersUseCase(
    this.userRepository
  )

  // ← ADD THIS
  this.getRecentUsersUseCase = new GetRecentUsersUseCase(
    this.userRepository
  )

  // ... rest of initialization ...
}
```

**Step 4: Add Getter Method**
```typescript
// Getters for use cases - Users
static getGetUserProfileUseCase(): GetUserProfileUseCase {
  return this.getUserProfileUseCase
}

static getUpdateUserProfileUseCase(): UpdateUserProfileUseCase {
  return this.updateUserProfileUseCase
}

static getSearchUsersUseCase(): SearchUsersUseCase {
  return this.searchUsersUseCase
}

// ← ADD THIS
static getGetRecentUsersUseCase(): GetRecentUsersUseCase {
  return this.getRecentUsersUseCase
}
```

### 5.3 Dependency Graph

```
GetRecentUsersUseCase
  ↓ depends on
IUserRepository (port)
  ↓ implemented by
SupabaseUserRepository (adapter)
  ↓ depends on
SupabaseClient (injected in constructor)
```

**Initialization Order**:
1. Create Supabase client
2. Create SupabaseUserRepository(supabaseClient)
3. Create GetRecentUsersUseCase(userRepository)
4. Store in container singleton

---

## 6. IMPORTANT CONSIDERATIONS

### 6.1 Authentication

**Decision**: This endpoint does NOT require authentication

**Reasoning**:
- Public data (showing recent members is a growth/community feature)
- No sensitive information exposed (avatar, name, bio are public)
- Similar to "Team" or "Community" pages on public websites
- Encourages network visibility and engagement

**Future Considerations**:
- If privacy concerns arise, can add authentication later
- Could add `is_public` flag to user profiles in future
- Could limit data returned (e.g., hide email for non-authenticated)

### 6.2 Timezone Handling

**Current Approach**:
- All timestamps stored in UTC (Supabase/PostgreSQL default)
- JavaScript Date calculations use local time → convert to ISO UTC string
- Comparison happens in UTC on database side

**Potential Issues**:
- Users registered at 11:59 PM UTC may appear in "yesterday's" results for users in PST
- This is acceptable for this use case (rough time filtering)

**If Precise Timezone Needed**:
- Store user's registration timezone in `users` table
- Display "registered X hours ago" instead of absolute dates
- Use `dayjs` or `date-fns` for timezone-aware calculations

### 6.3 Caching Strategy

**Initial Implementation**: No caching

**Reasoning**:
- Query is fast (< 50ms estimated)
- Data changes frequently (new users register)
- Stale data is acceptable (5-minute delay okay)

**Future Caching** (if needed):
```typescript
// Redis cache with 5-minute TTL
const cacheKey = `recent_users:${days}:${limit}`
const cached = await redis.get(cacheKey)
if (cached) return JSON.parse(cached)

const result = await getRecentUsersUseCase.execute(...)
await redis.setex(cacheKey, 300, JSON.stringify(result))  // 5 min TTL
return result
```

### 6.4 Rate Limiting

**Not Implemented Initially**

**Considerations**:
- Public endpoint → potential for abuse
- Could be scraped by bots
- May want to add rate limiting later

**If Needed**:
- Use existing `RateLimitService` from Container
- Add middleware to route: `rateLimitMiddleware(10, 60)` (10 req/min)
- Return 429 Too Many Requests on limit exceeded

### 6.5 Performance Optimization

**Database Index**:
```sql
-- Verify this index exists (may already exist from schema)
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);

-- If queries are still slow, consider composite index:
CREATE INDEX IF NOT EXISTS idx_users_recent
ON users(created_at DESC, id)
WHERE created_at IS NOT NULL;
```

**Query Plan Analysis** (after implementation):
```sql
EXPLAIN ANALYZE
SELECT * FROM users
WHERE created_at >= NOW() - INTERVAL '30 days'
ORDER BY created_at DESC
LIMIT 5;
```

**Expected Plan**:
- Index Scan on `idx_users_created_at`
- Limit applied early (only scans 5 rows)
- No full table scan

---

## 7. TESTING STRATEGY

### 7.1 Unit Tests (Use Case)

**File**: `server/application/use-cases/users/GetRecentUsersUseCase.spec.ts`

**Test Cases**:
1. ✅ Returns users registered in last N days
2. ✅ Respects limit parameter
3. ✅ Uses default values (30 days, 5 limit) when not provided
4. ✅ Validates days parameter (min: 1, max: 365)
5. ✅ Validates limit parameter (min: 1, max: 50)
6. ✅ Returns error for invalid parameters
7. ✅ Returns empty array when no recent users found
8. ✅ Handles repository errors gracefully

**Mock Strategy**:
- Mock `IUserRepository.findRecentUsers()`
- Return pre-created User entities
- Verify correct parameters passed to repository

### 7.2 Integration Tests (Repository)

**File**: `server/infrastructure/adapters/repositories/SupabaseUserRepository.spec.ts`

**Test Cases**:
1. ✅ Fetches users created within date range
2. ✅ Orders by created_at DESC (newest first)
3. ✅ Respects limit parameter
4. ✅ Includes user_roles join
5. ✅ Maps database rows to User entities correctly
6. ✅ Handles empty result set
7. ✅ Handles database errors

**Test Setup**:
- Use test Supabase instance or local PostgreSQL
- Seed database with users having known `created_at` values
- Clean up after tests

### 7.3 E2E Tests (API Route)

**File**: `server/infrastructure/api/routes/users.routes.spec.ts`

**Test Cases**:
1. ✅ GET /api/users/recent returns recent users
2. ✅ Accepts days query parameter
3. ✅ Accepts limit query parameter
4. ✅ Returns 400 for invalid parameters
5. ✅ Returns 200 with empty array when no users
6. ✅ Returns correct JSON structure
7. ✅ Snake_case field names in response

**Test Tools**:
- `supertest` for HTTP testing
- Spin up Express app with test container
- Verify HTTP status codes and response format

---

## 8. IMPLEMENTATION CHECKLIST

### Phase 1: Core Implementation
- [ ] Create `GetRecentUsersUseCase.ts`
- [ ] Add `findRecentUsers()` to `IUserRepository` interface
- [ ] Implement `findRecentUsers()` in `SupabaseUserRepository`
- [ ] Add route handler in `users.routes.ts` (BEFORE `/:id` route)
- [ ] Register use case in `Container.ts`

### Phase 2: Testing
- [ ] Write unit tests for `GetRecentUsersUseCase`
- [ ] Write integration tests for `SupabaseUserRepository.findRecentUsers()`
- [ ] Write E2E tests for `GET /api/users/recent`
- [ ] Verify all tests pass

### Phase 3: Verification
- [ ] Test endpoint manually with Postman/curl
- [ ] Verify database query performance with EXPLAIN ANALYZE
- [ ] Check timezone handling with users in different timezones
- [ ] Test edge cases (days=0, limit=0, negative values)
- [ ] Verify route order (recent before :id)

### Phase 4: Documentation
- [ ] Add JSDoc comments to all new code
- [ ] Update API documentation (if exists)
- [ ] Add example requests/responses to README

---

## 9. EXAMPLE USAGE

### 9.1 Request Examples

**Default parameters**:
```bash
GET /api/users/recent
# Returns 5 users from last 30 days
```

**Custom parameters**:
```bash
GET /api/users/recent?days=7&limit=10
# Returns 10 users from last 7 days
```

**Edge cases**:
```bash
GET /api/users/recent?days=365&limit=50
# Returns max 50 users from last year
```

### 9.2 Response Examples

**Success (200 OK)**:
```json
{
  "users": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "email": "maria@example.com",
      "name": "María García",
      "avatar_url": "https://storage.supabase.co/avatars/maria.jpg",
      "bio": "Emprendedora social apasionada por la innovación",
      "location": "Madrid, España",
      "linkedin_url": "https://linkedin.com/in/mariagarcia",
      "website_url": null,
      "skills": ["Marketing Digital", "Community Building"],
      "interests": ["Sostenibilidad", "Tecnología"],
      "completed_pct": 90,
      "created_at": "2025-10-23T14:32:00.000Z",
      "updated_at": "2025-10-24T09:15:00.000Z"
    },
    {
      "id": "223e4567-e89b-12d3-a456-426614174001",
      "email": "juan@example.com",
      "name": "Juan Pérez",
      "avatar_url": null,
      "bio": "Mentor en transformación digital",
      "location": "Barcelona, España",
      "linkedin_url": "https://linkedin.com/in/juanperez",
      "website_url": "https://juanperez.com",
      "skills": ["Consultoría", "Estrategia"],
      "interests": ["Startups", "Mentoría"],
      "completed_pct": 75,
      "created_at": "2025-10-22T11:20:00.000Z",
      "updated_at": "2025-10-22T11:20:00.000Z"
    }
  ],
  "count": 2,
  "days_filter": 30
}
```

**Error (400 Bad Request)**:
```json
{
  "error": "Days parameter must be between 1 and 365"
}
```

**Empty Result (200 OK)**:
```json
{
  "users": [],
  "count": 0,
  "days_filter": 7
}
```

---

## 10. NOTES FOR IMPLEMENTATION

### 10.1 Critical Implementation Details

1. **Route Order is Critical**:
   - `/recent` MUST be registered before `/:id`
   - Express matches routes in registration order
   - If `/:id` comes first, "recent" will be treated as a user ID

2. **Use Existing mapToEntity() Helper**:
   - Don't duplicate entity mapping logic
   - The repository already has a working mapper
   - Ensure the query structure matches existing queries (same join format)

3. **Parameter Parsing**:
   - Query params are always strings: `req.query.days` → `"30"` (not `30`)
   - Use `parseInt(value, 10)` to convert
   - Handle `NaN` case (when parsing fails)

4. **Date Handling**:
   - Don't use `new Date(Date.now() - days * 24 * 60 * 60 * 1000)`
   - Use `setDate()` method for clarity
   - Always call `.toISOString()` before sending to Supabase

5. **Error Messages**:
   - Use clear, user-friendly error messages
   - Don't expose internal errors to API responses
   - Log detailed errors server-side for debugging

### 10.2 Common Pitfalls to Avoid

❌ **DON'T**:
- Don't add business logic to route handler
- Don't bypass the use case layer
- Don't hardcode defaults in repository (use case defines defaults)
- Don't return 404 for empty results (return 200 with empty array)
- Don't forget ABOUTME comments at top of files

✅ **DO**:
- Keep route handler thin (delegate to use case)
- Validate in use case, not route handler
- Use dependency injection via Container
- Follow existing code style and patterns
- Write comprehensive JSDoc comments

### 10.3 Knowledge Updates for Implementation

**PostgreSQL Interval Syntax**:
```sql
-- This is the SQL equivalent of our filter
WHERE created_at >= NOW() - INTERVAL '30 days'

-- Supabase client uses >= comparison with ISO string
.gte('created_at', cutoffISOString)
```

**Supabase Query Builder**:
```typescript
// Inner join ensures users with roles are returned
.select('*, user_roles!inner(role_id)')

// Filter by date
.gte('created_at', cutoffDate)  // Greater than or equal

// Sort descending (newest first)
.order('created_at', { ascending: false })

// Limit results
.limit(5)
```

**TypeScript Type Inference**:
```typescript
// Query params are type: ParsedQs (from express)
const days = req.query.days as string | undefined
const daysNum = days ? parseInt(days, 10) : undefined
//    ^^^^^^^ number | undefined
```

---

## 11. FINAL ARCHITECTURE DIAGRAM

```
┌─────────────────────────────────────────────────────┐
│                  HTTP Layer                         │
│  GET /api/users/recent?days=30&limit=5              │
│         (users.routes.ts)                           │
└──────────────────┬──────────────────────────────────┘
                   │
                   │ delegates to
                   ▼
┌─────────────────────────────────────────────────────┐
│            Application Layer                        │
│      GetRecentUsersUseCase                          │
│  - Validate input (days, limit)                     │
│  - Apply defaults (30, 5)                           │
│  - Call repository                                  │
└──────────────────┬──────────────────────────────────┘
                   │
                   │ uses port (interface)
                   ▼
┌─────────────────────────────────────────────────────┐
│              Port (Interface)                       │
│         IUserRepository                             │
│  findRecentUsers(days, limit): Promise<User[]>      │
└──────────────────┬──────────────────────────────────┘
                   │
                   │ implemented by
                   ▼
┌─────────────────────────────────────────────────────┐
│         Infrastructure Layer                        │
│      SupabaseUserRepository                         │
│  - Build Supabase query                             │
│  - Join with user_roles                             │
│  - Map DB rows to User entities                     │
└──────────────────┬──────────────────────────────────┘
                   │
                   │ queries
                   ▼
┌─────────────────────────────────────────────────────┐
│              Database                               │
│         Supabase (PostgreSQL)                       │
│  - Filter by created_at                             │
│  - Sort DESC, LIMIT                                 │
└─────────────────────────────────────────────────────┘
```

**Dependency Flow** (all arrows point inward to domain):
```
Infrastructure → Application → Domain
   (adapters)      (use cases)    (entities)
```

**Key Principle**: Domain layer (User entity) has ZERO dependencies on infrastructure (Supabase).

---

## 12. CONCLUSION

This implementation follows hexagonal architecture principles:

1. ✅ **Domain Isolation**: User entity is framework-agnostic
2. ✅ **Port/Adapter Pattern**: Repository interface separates contract from implementation
3. ✅ **Dependency Inversion**: Use case depends on interface, not concrete implementation
4. ✅ **Single Responsibility**: Each layer has one clear purpose
5. ✅ **Testability**: Each component can be unit tested in isolation

**Estimated Implementation Time**: 2-3 hours (including tests)

**Complexity**: Low (follows existing patterns exactly)

**Risk**: Very low (no new dependencies, simple query, well-defined scope)

---

## 13. QUESTIONS FOR IBAN

Si tienes alguna duda durante la implementación, consulta:

1. **¿Necesitas autenticación después de todo?** (actualmente diseñado como público)
2. **¿Necesitas incluir información de roles en la respuesta?** (actualmente disponible pero no mapeado)
3. **¿Quieres limitar qué campos se exponen?** (actualmente retorna perfil completo)
4. **¿Necesitas caché desde el inicio?** (actualmente sin caché)
5. **¿Quieres rate limiting?** (actualmente sin límite de requests)

**Contacto**: Pregúntame antes de implementar si algo no está claro.

---

**END OF DESIGN DOCUMENT**
