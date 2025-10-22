# Backend Architecture Plan: Admin Approval Registration System

## Executive Summary

This document provides comprehensive architectural guidance for implementing an admin-approval registration workflow in the España Creativa Red platform using hexagonal architecture with Domain-Driven Design principles.

**Key Decision**: Continue using the Express backend (not Supabase Edge Functions) for consistency with existing architecture and easier DI container integration.

---

## 1. Domain Layer Design

### 1.1 PendingSignup Entity

The `PendingSignup` entity is an **Aggregate Root** that encapsulates all business rules related to the approval workflow.

**File**: `server/domain/entities/PendingSignup.ts`

#### Entity Structure

```typescript
export interface PendingSignupProps {
  id: PendingSignupId
  email: Email
  name: string
  surname: string | null
  approvalToken: ApprovalToken
  status: SignupStatus
  createdAt: Date
  approvedAt: Date | null
  approvedBy: UserId | null
  rejectedAt: Date | null
  rejectedBy: UserId | null
  rejectionReason: string | null
  ipAddress: string | null
  userAgent: string | null
}

export class PendingSignup {
  private constructor(private readonly props: PendingSignupProps) {}

  static create(props: Omit<PendingSignupProps, 'id' | 'approvalToken' | 'status' | 'createdAt'>): PendingSignup
  static reconstitute(props: PendingSignupProps): PendingSignup

  // Business logic methods
  approve(adminId: UserId): PendingSignup
  reject(adminId: UserId, reason?: string): PendingSignup
  isExpired(expiryHours: number): boolean
  canBeApproved(): boolean
  canBeRejected(): boolean

  // Getters (all properties)
  getId(): PendingSignupId
  getEmail(): Email
  // ... etc

  toPrimitives(): object
}
```

#### Business Rules Enforced in Entity

1. **Approval Rule**: Can only approve if status is 'pending'
2. **Rejection Rule**: Can only reject if status is 'pending'
3. **Expiration Rule**: Token expires after configurable hours (default 48h)
4. **Immutability**: All state changes return new instances
5. **Status Transitions**:
   - `pending -> approved` (via `approve()`)
   - `pending -> rejected` (via `reject()`)
   - No other transitions allowed

#### Key Methods Implementation Logic

**`approve(adminId: UserId): PendingSignup`**
- Validates current status is 'pending'
- Throws `DomainException` if already approved/rejected
- Returns new instance with:
  - `status = 'approved'`
  - `approvedAt = new Date()`
  - `approvedBy = adminId`

**`reject(adminId: UserId, reason?: string): PendingSignup`**
- Validates current status is 'pending'
- Throws `DomainException` if already approved/rejected
- Returns new instance with:
  - `status = 'rejected'`
  - `rejectedAt = new Date()`
  - `rejectedBy = adminId`
  - `rejectionReason = reason`

**`isExpired(expiryHours: number): boolean`**
- Calculates hours since `createdAt`
- Returns true if exceeds `expiryHours` and status still 'pending'

**`canBeApproved(): boolean`**
- Returns `status === 'pending' && !this.isExpired(48)`

**`canBeRejected(): boolean`**
- Returns `status === 'pending'` (can reject even if expired)

---

### 1.2 Value Objects

#### PendingSignupId

**File**: `server/domain/value-objects/PendingSignupId.ts`

```typescript
export class PendingSignupId {
  private constructor(private readonly value: string) {}

  static create(value?: string): PendingSignupId | null {
    const id = value || crypto.randomUUID()
    // Validate UUID format
    if (!isValidUUID(id)) return null
    return new PendingSignupId(id)
  }

  getValue(): string
  equals(other: PendingSignupId): boolean
}
```

**Design Notes**:
- Similar pattern to existing `UserId`
- Uses UUID v4 for globally unique identifiers
- Validates UUID format on creation

---

#### ApprovalToken

**File**: `server/domain/value-objects/ApprovalToken.ts`

```typescript
export class ApprovalToken {
  private constructor(private readonly value: string) {}

  static create(value?: string): ApprovalToken {
    return new ApprovalToken(value || crypto.randomUUID())
  }

  getValue(): string
  equals(other: ApprovalToken): boolean
}
```

**Design Notes**:
- Separate from ID for security (token can be regenerated)
- Single-use: mark as used after approval/rejection
- Could be enhanced with HMAC signing for extra security

**Security Consideration**:
For production, consider signed tokens:
```typescript
static createSigned(email: string, secret: string): ApprovalToken {
  const hmac = crypto.createHmac('sha256', secret)
  hmac.update(`${email}:${Date.now()}`)
  return new ApprovalToken(hmac.digest('hex'))
}
```

---

#### SignupStatus

**File**: `server/domain/value-objects/SignupStatus.ts`

```typescript
export enum SignupStatusEnum {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected'
}

export class SignupStatus {
  private constructor(private readonly value: SignupStatusEnum) {}

  static create(value: string): SignupStatus | null {
    if (!Object.values(SignupStatusEnum).includes(value as SignupStatusEnum)) {
      return null
    }
    return new SignupStatus(value as SignupStatusEnum)
  }

  static pending(): SignupStatus {
    return new SignupStatus(SignupStatusEnum.PENDING)
  }

  static approved(): SignupStatus {
    return new SignupStatus(SignupStatusEnum.APPROVED)
  }

  static rejected(): SignupStatus {
    return new SignupStatus(SignupStatusEnum.REJECTED)
  }

  isPending(): boolean
  isApproved(): boolean
  isRejected(): boolean
  getValue(): SignupStatusEnum
  equals(other: SignupStatus): boolean
}
```

**Design Notes**:
- Encapsulates valid status transitions
- Provides type-safe status checking
- Prevents invalid status values

---

## 2. Application Layer Design

### 2.1 Port Interfaces

#### IPendingSignupRepository

**File**: `server/application/ports/repositories/IPendingSignupRepository.ts`

```typescript
export interface IPendingSignupRepository {
  /**
   * Save a new pending signup request
   */
  save(pendingSignup: PendingSignup): Promise<PendingSignup>

  /**
   * Update an existing pending signup (after approval/rejection)
   */
  update(pendingSignup: PendingSignup): Promise<PendingSignup>

  /**
   * Find by unique approval token
   */
  findByToken(token: ApprovalToken): Promise<PendingSignup | null>

  /**
   * Find by email (to check duplicates)
   */
  findByEmail(email: Email): Promise<PendingSignup | null>

  /**
   * Find by ID
   */
  findById(id: PendingSignupId): Promise<PendingSignup | null>

  /**
   * Get all pending signups (admin view)
   * Future: add pagination
   */
  findAllPending(): Promise<PendingSignup[]>

  /**
   * Get all signups with optional status filter
   */
  findAll(status?: SignupStatus): Promise<PendingSignup[]>

  /**
   * Delete expired pending signups (cleanup job)
   */
  deleteExpired(expiryHours: number): Promise<number>
}
```

**Design Rationale**:
- Clear separation of save (new) vs update (existing)
- Token-based lookup for approval/rejection flows
- Email-based lookup for duplicate prevention
- Admin-focused queries (`findAllPending`)
- Maintenance operation (`deleteExpired`)

---

#### IRateLimitService

**File**: `server/application/ports/services/IRateLimitService.ts`

```typescript
export interface RateLimitResult {
  allowed: boolean
  remainingAttempts: number
  resetAt: Date
  reason?: string
}

export interface IRateLimitService {
  /**
   * Check if signup request is allowed based on IP and email
   * @param ipAddress - Request IP address
   * @param email - Email being registered
   * @returns Result with allowed flag and metadata
   */
  checkSignupLimit(ipAddress: string, email: Email): Promise<RateLimitResult>

  /**
   * Record a signup attempt (call after allowing request)
   * @param ipAddress - Request IP address
   * @param email - Email being registered
   */
  recordSignupAttempt(ipAddress: string, email: Email): Promise<void>

  /**
   * Reset rate limit for specific IP/email (admin action)
   */
  resetLimit(ipAddress: string, email: Email): Promise<void>
}
```

**Rate Limiting Strategy**:
1. **IP-based**: 3 requests per hour per IP
2. **Email-based**: 1 request per email per 24 hours
3. **Combined check**: Both must pass

**Design Notes**:
- Returns structured result (not just boolean) for better UX
- Separate check vs record for transactional safety
- Admin reset capability for legitimate retries

---

#### ITokenService (Extension of existing IAuthService)

**File**: `server/application/ports/services/IAuthService.ts` (extend existing)

Add these methods to existing `IAuthService`:

```typescript
export interface IAuthService {
  // ... existing methods ...

  /**
   * Generate magic link for user onboarding (admin approval flow)
   * Uses Supabase Admin API to create magic link
   * @param email - User email
   * @returns Magic link URL and expiry time
   */
  generateMagicLink(email: Email): Promise<{
    actionLink: string | null
    error: Error | null
  }>

  /**
   * Create user account without password (for magic link flow)
   * @param email - User email
   * @param metadata - User metadata (name, etc)
   */
  createUserWithoutPassword(email: Email, metadata: Record<string, any>): Promise<{
    user: AuthUser | null
    error: Error | null
  }>
}
```

**Magic Link Strategy Decision**:

**RECOMMENDED: Use `auth.admin.generateLink({ type: 'magiclink', email })`**

**Rationale**:
1. ✅ Native Supabase feature (no custom JWT needed)
2. ✅ Built-in expiration (1 hour)
3. ✅ Automatic session creation on click
4. ✅ Works with existing auth flow
5. ✅ No password required initially

**Implementation** (in SupabaseAuthService):
```typescript
async generateMagicLink(email: Email): Promise<{ actionLink: string | null; error: Error | null }> {
  const { data, error } = await this.supabase.auth.admin.generateLink({
    type: 'magiclink',
    email: email.getValue(),
    options: {
      redirectTo: `${process.env.APP_URL || 'http://localhost:8080'}/dashboard`
    }
  })

  if (error) return { actionLink: null, error }
  return { actionLink: data.properties.action_link, error: null }
}
```

**Alternative Approaches** (Not Recommended):

❌ **Option B**: `createUser()` + password reset flow
- More complex
- Two emails instead of one
- User has to set password immediately

❌ **Option C**: Custom JWT tokens
- Requires custom implementation
- Security maintenance burden
- Duplicate functionality

---

### 2.2 Use Cases

#### SubmitSignupRequestUseCase

**File**: `server/application/use-cases/auth/SubmitSignupRequestUseCase.ts`

```typescript
export interface SubmitSignupRequestDTO {
  email: string
  name: string
  surname?: string
  ipAddress: string
  userAgent: string
}

export interface SubmitSignupRequestResponse {
  success: boolean
  message: string
  pendingSignupId?: string
  error?: string
}

export class SubmitSignupRequestUseCase {
  constructor(
    private readonly pendingSignupRepository: IPendingSignupRepository,
    private readonly userRepository: IUserRepository,
    private readonly rateLimitService: IRateLimitService,
    private readonly emailService: IEmailService
  ) {}

  async execute(request: SubmitSignupRequestDTO): Promise<SubmitSignupRequestResponse> {
    // 1. Validate email format
    // 2. Check rate limits
    // 3. Check if email already exists in auth.users
    // 4. Check if email already has pending signup
    // 5. Create PendingSignup entity
    // 6. Save to repository
    // 7. Record rate limit attempt
    // 8. Send admin notification email (fire-and-forget)
    // 9. Return success response
  }
}
```

**Orchestration Logic** (pseudo-code):

```typescript
async execute(request: SubmitSignupRequestDTO): Promise<SubmitSignupRequestResponse> {
  // Step 1: Validate email
  const email = Email.create(request.email)
  if (!email) {
    return { success: false, message: 'Invalid email format', error: 'INVALID_EMAIL' }
  }

  // Step 2: Check rate limits
  const rateLimitResult = await this.rateLimitService.checkSignupLimit(
    request.ipAddress,
    email
  )
  if (!rateLimitResult.allowed) {
    return {
      success: false,
      message: `Too many requests. Try again after ${rateLimitResult.resetAt.toLocaleString()}`,
      error: 'RATE_LIMIT_EXCEEDED'
    }
  }

  // Step 3: Check if user already exists
  const existingUser = await this.userRepository.findByEmail(email)
  if (existingUser) {
    return {
      success: false,
      message: 'An account with this email already exists',
      error: 'USER_EXISTS'
    }
  }

  // Step 4: Check for duplicate pending signup
  const existingPending = await this.pendingSignupRepository.findByEmail(email)
  if (existingPending && existingPending.getStatus().isPending()) {
    return {
      success: false,
      message: 'A signup request with this email is already pending approval',
      error: 'PENDING_EXISTS'
    }
  }

  // Step 5: Create entity
  const pendingSignup = PendingSignup.create({
    email,
    name: request.name,
    surname: request.surname || null,
    ipAddress: request.ipAddress,
    userAgent: request.userAgent,
    approvedAt: null,
    approvedBy: null,
    rejectedAt: null,
    rejectedBy: null,
    rejectionReason: null
  })

  // Step 6: Save
  const saved = await this.pendingSignupRepository.save(pendingSignup)

  // Step 7: Record attempt
  await this.rateLimitService.recordSignupAttempt(request.ipAddress, email)

  // Step 8: Send admin email (fire-and-forget)
  this.emailService.sendAdminSignupNotification(
    saved.getEmail(),
    saved.getName(),
    saved.getApprovalToken()
  ).catch(error => {
    console.error('[SubmitSignupRequestUseCase] Failed to send admin email:', error)
  })

  return {
    success: true,
    message: 'Signup request submitted successfully. You will receive an email once approved.',
    pendingSignupId: saved.getId().getValue()
  }
}
```

**Key Design Decisions**:
- Rate limit check BEFORE database operations (fail fast)
- Check existing user AND pending signup (prevent duplicates)
- Email sending is non-blocking (don't fail signup if email fails)
- Clear error codes for different failure scenarios

---

#### ApproveSignupUseCase

**File**: `server/application/use-cases/auth/ApproveSignupUseCase.ts`

```typescript
export interface ApproveSignupRequestDTO {
  token: string
  adminId: string
}

export interface ApproveSignupResponse {
  success: boolean
  message: string
  error?: string
}

export class ApproveSignupUseCase {
  constructor(
    private readonly pendingSignupRepository: IPendingSignupRepository,
    private readonly authService: IAuthService,
    private readonly userRepository: IUserRepository,
    private readonly emailService: IEmailService
  ) {}

  async execute(request: ApproveSignupRequestDTO): Promise<ApproveSignupResponse> {
    // 1. Find pending signup by token
    // 2. Validate can be approved (not expired, not already processed)
    // 3. Approve entity (domain logic)
    // 4. Generate magic link via Supabase Admin API
    // 5. Update pending signup status in DB
    // 6. Send magic link email to user
    // 7. Return success response
  }
}
```

**Orchestration Logic**:

```typescript
async execute(request: ApproveSignupRequestDTO): Promise<ApproveSignupResponse> {
  // Step 1: Parse token
  const token = ApprovalToken.create(request.token)
  const adminId = UserId.create(request.adminId)

  if (!adminId) {
    return { success: false, message: 'Invalid admin ID', error: 'INVALID_ADMIN' }
  }

  // Step 2: Find pending signup
  const pendingSignup = await this.pendingSignupRepository.findByToken(token)
  if (!pendingSignup) {
    return { success: false, message: 'Signup request not found', error: 'NOT_FOUND' }
  }

  // Step 3: Validate can be approved
  if (!pendingSignup.canBeApproved()) {
    const status = pendingSignup.getStatus()
    if (status.isApproved()) {
      return { success: false, message: 'Signup already approved', error: 'ALREADY_APPROVED' }
    }
    if (status.isRejected()) {
      return { success: false, message: 'Signup was rejected', error: 'ALREADY_REJECTED' }
    }
    if (pendingSignup.isExpired(48)) {
      return { success: false, message: 'Signup request expired', error: 'EXPIRED' }
    }
  }

  // Step 4: Generate magic link
  const { actionLink, error: magicLinkError } = await this.authService.generateMagicLink(
    pendingSignup.getEmail()
  )

  if (magicLinkError || !actionLink) {
    console.error('[ApproveSignupUseCase] Failed to generate magic link:', magicLinkError)
    return {
      success: false,
      message: 'Failed to generate access link',
      error: 'MAGIC_LINK_FAILED'
    }
  }

  // Step 5: Approve entity (domain logic)
  const approvedSignup = pendingSignup.approve(adminId)

  // Step 6: Update in DB
  await this.pendingSignupRepository.update(approvedSignup)

  // Step 7: Send magic link email
  await this.emailService.sendSignupApprovedEmail(
    approvedSignup.getEmail(),
    approvedSignup.getName(),
    actionLink
  )

  return {
    success: true,
    message: 'Signup approved successfully. User has been notified via email.'
  }
}
```

**Critical Flow**:
- Magic link generation MUST succeed before marking as approved
- If email sending fails, the user can't access the platform
- Consider: retry mechanism or admin notification on email failure

**Error Handling Strategy**:
- If magic link generation fails: return error, don't update status
- If email sending fails: log error, but consider signup "approved" (admin can resend)

---

#### RejectSignupUseCase

**File**: `server/application/use-cases/auth/RejectSignupUseCase.ts`

```typescript
export interface RejectSignupRequestDTO {
  token: string
  adminId: string
  reason?: string
}

export interface RejectSignupResponse {
  success: boolean
  message: string
  error?: string
}

export class RejectSignupUseCase {
  constructor(
    private readonly pendingSignupRepository: IPendingSignupRepository,
    private readonly emailService: IEmailService
  ) {}

  async execute(request: RejectSignupRequestDTO): Promise<RejectSignupResponse> {
    // 1. Find pending signup by token
    // 2. Validate can be rejected
    // 3. Reject entity (domain logic)
    // 4. Update in DB
    // 5. Send rejection email (optional, fire-and-forget)
    // 6. Return success response
  }
}
```

**Design Notes**:
- Simpler than approval (no magic link generation)
- Rejection email is optional (configurable)
- Can reject expired signups (unlike approval)

---

#### GetPendingSignupsUseCase

**File**: `server/application/use-cases/auth/GetPendingSignupsUseCase.ts`

```typescript
export interface GetPendingSignupsRequestDTO {
  adminId: string
  status?: 'pending' | 'approved' | 'rejected'
}

export interface PendingSignupDTO {
  id: string
  email: string
  name: string
  surname: string | null
  status: string
  createdAt: string
  approvedAt: string | null
  rejectedAt: string | null
  rejectionReason: string | null
}

export interface GetPendingSignupsResponse {
  success: boolean
  signups: PendingSignupDTO[]
  error?: string
}

export class GetPendingSignupsUseCase {
  constructor(
    private readonly pendingSignupRepository: IPendingSignupRepository,
    private readonly userRepository: IUserRepository
  ) {}

  async execute(request: GetPendingSignupsRequestDTO): Promise<GetPendingSignupsResponse> {
    // 1. Validate admin user
    // 2. Query repository with optional status filter
    // 3. Transform to DTOs
    // 4. Return response
  }
}
```

**Admin Validation**:
```typescript
const adminId = UserId.create(request.adminId)
if (!adminId) {
  return { success: false, signups: [], error: 'INVALID_ADMIN' }
}

const admin = await this.userRepository.findById(adminId)
if (!admin || !admin.isAdmin()) {
  return { success: false, signups: [], error: 'UNAUTHORIZED' }
}
```

**Query Strategy**:
- Default: return only `pending` status
- Optional: filter by specific status
- Future: add pagination, sorting, date filtering

---

## 3. Infrastructure Layer Design

### 3.1 SupabasePendingSignupRepository

**File**: `server/infrastructure/adapters/repositories/SupabasePendingSignupRepository.ts`

```typescript
export class SupabasePendingSignupRepository implements IPendingSignupRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async save(pendingSignup: PendingSignup): Promise<PendingSignup> {
    const primitives = pendingSignup.toPrimitives()

    const { data, error } = await this.supabase
      .from('pending_signups')
      .insert({
        id: primitives.id,
        email: primitives.email,
        name: primitives.name,
        surname: primitives.surname,
        approval_token: primitives.approvalToken,
        status: primitives.status,
        ip_address: primitives.ipAddress,
        user_agent: primitives.userAgent,
        created_at: primitives.createdAt
      })
      .select()
      .single()

    if (error) throw new Error(`Failed to save pending signup: ${error.message}`)

    return this.toDomain(data)
  }

  async update(pendingSignup: PendingSignup): Promise<PendingSignup> {
    const primitives = pendingSignup.toPrimitives()

    const { data, error } = await this.supabase
      .from('pending_signups')
      .update({
        status: primitives.status,
        approved_at: primitives.approvedAt,
        approved_by: primitives.approvedBy,
        rejected_at: primitives.rejectedAt,
        rejected_by: primitives.rejectedBy,
        rejection_reason: primitives.rejectionReason
      })
      .eq('id', primitives.id)
      .select()
      .single()

    if (error) throw new Error(`Failed to update pending signup: ${error.message}`)

    return this.toDomain(data)
  }

  async findByToken(token: ApprovalToken): Promise<PendingSignup | null> {
    const { data, error } = await this.supabase
      .from('pending_signups')
      .select('*')
      .eq('approval_token', token.getValue())
      .single()

    if (error || !data) return null

    return this.toDomain(data)
  }

  // ... other methods ...

  private toDomain(row: any): PendingSignup {
    return PendingSignup.reconstitute({
      id: PendingSignupId.create(row.id)!,
      email: Email.create(row.email)!,
      name: row.name,
      surname: row.surname,
      approvalToken: ApprovalToken.create(row.approval_token),
      status: SignupStatus.create(row.status)!,
      createdAt: new Date(row.created_at),
      approvedAt: row.approved_at ? new Date(row.approved_at) : null,
      approvedBy: row.approved_by ? UserId.create(row.approved_by)! : null,
      rejectedAt: row.rejected_at ? new Date(row.rejected_at) : null,
      rejectedBy: row.rejected_by ? UserId.create(row.rejected_by)! : null,
      rejectionReason: row.rejection_reason,
      ipAddress: row.ip_address,
      userAgent: row.user_agent
    })
  }
}
```

**Mapping Strategy**:
- `toPrimitives()`: Domain entity → plain object
- `toDomain()`: Database row → domain entity
- Snake_case (DB) ↔ camelCase (domain)

---

### 3.2 RateLimitService

**File**: `server/infrastructure/adapters/services/RateLimitService.ts`

```typescript
export class RateLimitService implements IRateLimitService {
  constructor(private readonly supabase: SupabaseClient) {}

  async checkSignupLimit(ipAddress: string, email: Email): Promise<RateLimitResult> {
    // Check IP-based limit (3 per hour)
    const ipResult = await this.checkIpLimit(ipAddress)
    if (!ipResult.allowed) {
      return ipResult
    }

    // Check email-based limit (1 per 24 hours)
    const emailResult = await this.checkEmailLimit(email)
    if (!emailResult.allowed) {
      return emailResult
    }

    return {
      allowed: true,
      remainingAttempts: Math.min(ipResult.remainingAttempts, emailResult.remainingAttempts),
      resetAt: new Date(Math.max(ipResult.resetAt.getTime(), emailResult.resetAt.getTime()))
    }
  }

  private async checkIpLimit(ipAddress: string): Promise<RateLimitResult> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)

    const { data, error } = await this.supabase
      .from('signup_rate_limits')
      .select('request_count, window_start')
      .eq('ip_address', ipAddress)
      .gte('window_start', oneHourAgo.toISOString())
      .maybeSingle()

    if (error) {
      console.error('[RateLimitService] Database error:', error)
      // Fail open (allow request) on DB errors
      return {
        allowed: true,
        remainingAttempts: 3,
        resetAt: new Date(Date.now() + 60 * 60 * 1000)
      }
    }

    if (!data) {
      // No record = no attempts yet
      return {
        allowed: true,
        remainingAttempts: 3,
        resetAt: new Date(Date.now() + 60 * 60 * 1000)
      }
    }

    const requestCount = data.request_count || 0
    const allowed = requestCount < 3

    return {
      allowed,
      remainingAttempts: Math.max(0, 3 - requestCount),
      resetAt: new Date(new Date(data.window_start).getTime() + 60 * 60 * 1000),
      reason: allowed ? undefined : 'IP rate limit exceeded (3 requests per hour)'
    }
  }

  private async checkEmailLimit(email: Email): Promise<RateLimitResult> {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)

    const { data, error } = await this.supabase
      .from('signup_rate_limits')
      .select('request_count, window_start')
      .eq('email', email.getValue())
      .gte('window_start', twentyFourHoursAgo.toISOString())
      .maybeSingle()

    if (error) {
      return {
        allowed: true,
        remainingAttempts: 1,
        resetAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      }
    }

    if (!data) {
      return {
        allowed: true,
        remainingAttempts: 1,
        resetAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      }
    }

    const requestCount = data.request_count || 0
    const allowed = requestCount < 1

    return {
      allowed,
      remainingAttempts: Math.max(0, 1 - requestCount),
      resetAt: new Date(new Date(data.window_start).getTime() + 24 * 60 * 60 * 1000),
      reason: allowed ? undefined : 'Email rate limit exceeded (1 request per 24 hours)'
    }
  }

  async recordSignupAttempt(ipAddress: string, email: Email): Promise<void> {
    // Upsert: increment if exists, insert if new
    await this.supabase.rpc('increment_signup_rate_limit', {
      p_ip_address: ipAddress,
      p_email: email.getValue()
    })
  }

  async resetLimit(ipAddress: string, email: Email): Promise<void> {
    await this.supabase
      .from('signup_rate_limits')
      .delete()
      .or(`ip_address.eq.${ipAddress},email.eq.${email.getValue()}`)
  }
}
```

**Database Function Required** (create in Supabase):

```sql
CREATE OR REPLACE FUNCTION increment_signup_rate_limit(
  p_ip_address INET,
  p_email VARCHAR
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO signup_rate_limits (ip_address, email, request_count, window_start)
  VALUES (p_ip_address, p_email, 1, NOW())
  ON CONFLICT (ip_address, email)
  DO UPDATE SET
    request_count = signup_rate_limits.request_count + 1,
    window_start = CASE
      WHEN signup_rate_limits.window_start < NOW() - INTERVAL '1 hour' THEN NOW()
      ELSE signup_rate_limits.window_start
    END;
END;
$$ LANGUAGE plpgsql;
```

**Design Notes**:
- **Fail Open**: On database errors, allow request (don't block users due to system issues)
- **Atomic Upsert**: Use database function to prevent race conditions
- **Sliding Window**: Reset window start if expired

---

### 3.3 Email Service Extensions

**File**: `server/application/ports/services/IEmailService.ts` (extend existing)

Add these methods:

```typescript
export interface IEmailService {
  // ... existing methods ...

  /**
   * Send email to admin when new signup request submitted
   */
  sendAdminSignupNotification(
    userEmail: Email,
    userName: string,
    approvalToken: ApprovalToken
  ): Promise<{ success: boolean; error?: Error }>

  /**
   * Send email to user when signup approved (includes magic link)
   */
  sendSignupApprovedEmail(
    userEmail: Email,
    userName: string,
    magicLink: string
  ): Promise<{ success: boolean; error?: Error }>

  /**
   * Send email to user when signup rejected (optional)
   */
  sendSignupRejectedEmail(
    userEmail: Email,
    userName: string,
    reason?: string
  ): Promise<{ success: boolean; error?: Error }>
}
```

**Implementation** (in ResendEmailService):

```typescript
async sendAdminSignupNotification(
  userEmail: Email,
  userName: string,
  approvalToken: ApprovalToken
): Promise<{ success: boolean; error?: Error }> {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@espanacreativa.dev'
  const appUrl = process.env.APP_URL || 'http://localhost:8080'

  const approveUrl = `${appUrl}/admin/approve-signup?token=${approvalToken.getValue()}`
  const rejectUrl = `${appUrl}/admin/reject-signup?token=${approvalToken.getValue()}`

  try {
    await this.resend.emails.send({
      from: 'España Creativa <noreply@espanacreativa.dev>',
      to: adminEmail,
      subject: '🔔 Nueva solicitud de registro - España Creativa',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #22c55e; color: white; padding: 20px; text-align: center; }
              .content { padding: 20px; background: #f9f9f9; }
              .button {
                display: inline-block;
                padding: 12px 24px;
                margin: 10px 5px;
                color: white;
                text-decoration: none;
                border-radius: 8px;
              }
              .approve { background: #22c55e; }
              .reject { background: #ef4444; }
              .info { background: white; padding: 15px; margin: 15px 0; border-left: 4px solid #22c55e; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Nueva Solicitud de Registro</h1>
              </div>
              <div class="content">
                <p>Hola Admin,</p>
                <p>Has recibido una nueva solicitud de registro en la plataforma España Creativa.</p>

                <div class="info">
                  <strong>Email:</strong> ${userEmail.getValue()}<br>
                  <strong>Nombre:</strong> ${userName}<br>
                  <strong>Fecha:</strong> ${new Date().toLocaleString('es-ES')}
                </div>

                <p>Por favor, revisa esta solicitud y toma una decisión:</p>

                <div style="text-align: center; margin: 30px 0;">
                  <a href="${approveUrl}" class="button approve">✅ Aprobar Solicitud</a>
                  <a href="${rejectUrl}" class="button reject">❌ Rechazar Solicitud</a>
                </div>

                <p style="color: #666; font-size: 12px;">
                  Este enlace expirará en 48 horas.
                </p>
              </div>
            </div>
          </body>
        </html>
      `
    })

    return { success: true }
  } catch (error) {
    return { success: false, error: error as Error }
  }
}

async sendSignupApprovedEmail(
  userEmail: Email,
  userName: string,
  magicLink: string
): Promise<{ success: boolean; error?: Error }> {
  try {
    await this.resend.emails.send({
      from: 'España Creativa <noreply@espanacreativa.dev>',
      to: userEmail.getValue(),
      subject: '🎉 Tu cuenta ha sido aprobada - España Creativa',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #22c55e; color: white; padding: 30px; text-align: center; }
              .content { padding: 30px; background: #f9f9f9; }
              .button {
                display: inline-block;
                padding: 16px 32px;
                background: #22c55e;
                color: white;
                text-decoration: none;
                border-radius: 8px;
                font-weight: bold;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🎉 ¡Bienvenido a España Creativa!</h1>
              </div>
              <div class="content">
                <p>Hola ${userName},</p>
                <p>¡Buenas noticias! Tu solicitud de registro ha sido aprobada.</p>
                <p>Haz clic en el siguiente botón para acceder a tu cuenta:</p>

                <div style="text-align: center; margin: 30px 0;">
                  <a href="${magicLink}" class="button">Acceder a mi cuenta</a>
                </div>

                <p style="color: #666; font-size: 14px;">
                  Este enlace es válido por 1 hora. Si expira, contacta al administrador.
                </p>

                <p>Una vez dentro, podrás completar tu perfil y empezar a conectar con otros emprendedores y mentores.</p>

                <p>¡Te deseamos mucho éxito!</p>
                <p>El equipo de España Creativa</p>
              </div>
            </div>
          </body>
        </html>
      `
    })

    return { success: true }
  } catch (error) {
    return { success: false, error: error as Error }
  }
}
```

---

## 4. API Routes Design

### 4.1 Route Structure

**File**: `server/infrastructure/api/routes/auth.routes.ts` (extend existing)

Add these routes:

```typescript
export function createAuthRoutes(): Router {
  const router = Router()

  // ... existing routes (signup, signin, signout, me) ...

  // Public: Submit signup request
  router.post('/request-signup', async (req, res, next) => {
    try {
      const useCase = Container.getSubmitSignupRequestUseCase()

      const ipAddress = req.ip || req.socket.remoteAddress || 'unknown'
      const userAgent = req.headers['user-agent'] || 'unknown'

      const result = await useCase.execute({
        email: req.body.email,
        name: req.body.name,
        surname: req.body.surname,
        ipAddress,
        userAgent
      })

      if (!result.success) {
        return res.status(400).json(result)
      }

      res.status(201).json(result)
    } catch (error) {
      next(error)
    }
  })

  // Public: Approve signup (admin link from email)
  router.post('/approve-signup', async (req, res, next) => {
    try {
      const useCase = Container.getApproveSignupUseCase()

      const result = await useCase.execute({
        token: req.body.token,
        adminId: req.body.adminId // From auth token/session
      })

      if (!result.success) {
        return res.status(400).json(result)
      }

      res.status(200).json(result)
    } catch (error) {
      next(error)
    }
  })

  // Public: Reject signup
  router.post('/reject-signup', async (req, res, next) => {
    try {
      const useCase = Container.getRejectSignupUseCase()

      const result = await useCase.execute({
        token: req.body.token,
        adminId: req.body.adminId,
        reason: req.body.reason
      })

      if (!result.success) {
        return res.status(400).json(result)
      }

      res.status(200).json(result)
    } catch (error) {
      next(error)
    }
  })

  // Protected: Get pending signups (admin only)
  router.get('/pending-signups', authMiddleware, adminMiddleware, async (req, res, next) => {
    try {
      const useCase = Container.getGetPendingSignupsUseCase()

      const result = await useCase.execute({
        adminId: req.user.id, // From authMiddleware
        status: req.query.status as any
      })

      res.status(200).json(result)
    } catch (error) {
      next(error)
    }
  })

  return router
}
```

**New Middleware Required**: `adminMiddleware`

**File**: `server/infrastructure/api/middleware/admin.middleware.ts`

```typescript
export async function adminMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user?.id // Set by authMiddleware

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const userRepository = Container.getUserRepository()
    const user = await userRepository.findById(UserId.create(userId)!)

    if (!user || !user.isAdmin()) {
      return res.status(403).json({ error: 'Admin access required' })
    }

    next()
  } catch (error) {
    next(error)
  }
}
```

---

### 4.2 Route Security

**Public Routes** (no auth required):
- `POST /api/auth/request-signup` - Anyone can submit
- `POST /api/auth/approve-signup` - Token-based (from admin email)
- `POST /api/auth/reject-signup` - Token-based (from admin email)

**Protected Routes** (require auth + admin role):
- `GET /api/auth/pending-signups` - Admin dashboard

**Security Considerations**:
1. **Rate Limiting**: Applied at use case level (not middleware)
2. **Token Security**: UUIDs are sufficiently secure for this use case
3. **CSRF Protection**: Consider adding CSRF tokens for state-changing operations
4. **Audit Logging**: Log all approval/rejection actions with admin ID

---

## 5. Dependency Injection Updates

### 5.1 Container Registration

**File**: `server/infrastructure/di/Container.ts` (extend existing)

Add these registrations:

```typescript
export class Container {
  // ... existing properties ...

  // New repositories
  private static pendingSignupRepository: IPendingSignupRepository

  // New services
  private static rateLimitService: IRateLimitService

  // New use cases
  private static submitSignupRequestUseCase: SubmitSignupRequestUseCase
  private static approveSignupUseCase: ApproveSignupUseCase
  private static rejectSignupUseCase: RejectSignupUseCase
  private static getPendingSignupsUseCase: GetPendingSignupsUseCase

  static initialize() {
    // ... existing initialization ...

    // Initialize new repository
    this.pendingSignupRepository = new SupabasePendingSignupRepository(supabase)

    // Initialize new service
    this.rateLimitService = new RateLimitService(supabase)

    // Initialize new use cases
    this.submitSignupRequestUseCase = new SubmitSignupRequestUseCase(
      this.pendingSignupRepository,
      this.userRepository,
      this.rateLimitService,
      this.emailService
    )

    this.approveSignupUseCase = new ApproveSignupUseCase(
      this.pendingSignupRepository,
      this.authService,
      this.userRepository,
      this.emailService
    )

    this.rejectSignupUseCase = new RejectSignupUseCase(
      this.pendingSignupRepository,
      this.emailService
    )

    this.getPendingSignupsUseCase = new GetPendingSignupsUseCase(
      this.pendingSignupRepository,
      this.userRepository
    )
  }

  // Getters
  static getSubmitSignupRequestUseCase(): SubmitSignupRequestUseCase {
    return this.submitSignupRequestUseCase
  }

  static getApproveSignupUseCase(): ApproveSignupUseCase {
    return this.approveSignupUseCase
  }

  static getRejectSignupUseCase(): RejectSignupUseCase {
    return this.rejectSignupUseCase
  }

  static getGetPendingSignupsUseCase(): GetPendingSignupsUseCase {
    return this.getPendingSignupsUseCase
  }
}
```

---

## 6. Database Schema

### 6.1 Main Table

```sql
-- Create pending_signups table
CREATE TABLE public.pending_signups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  surname VARCHAR(255),
  approval_token UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID REFERENCES auth.users(id),
  rejected_at TIMESTAMP WITH TIME ZONE,
  rejected_by UUID REFERENCES auth.users(id),
  rejection_reason TEXT,
  ip_address INET,
  user_agent TEXT,

  -- Constraints
  CONSTRAINT unique_pending_email UNIQUE (email, status)
    WHERE status = 'pending' -- Only one pending signup per email
);

-- Indexes for performance
CREATE INDEX idx_pending_signups_email ON pending_signups(email);
CREATE INDEX idx_pending_signups_status ON pending_signups(status);
CREATE INDEX idx_pending_signups_token ON pending_signups(approval_token);
CREATE INDEX idx_pending_signups_created_at ON pending_signups(created_at);

-- Composite index for admin queries
CREATE INDEX idx_pending_signups_status_created
  ON pending_signups(status, created_at DESC);
```

**Key Design Decisions**:
- **Partial Unique Constraint**: Only enforce unique email for `pending` status (allows resubmission after rejection)
- **Token as UUID**: Globally unique, sufficient entropy (122 bits)
- **Audit Fields**: Track who approved/rejected and when
- **IP/User Agent**: For abuse detection and analytics

---

### 6.2 Rate Limiting Table

```sql
-- Create rate limiting table
CREATE TABLE public.signup_rate_limits (
  id SERIAL PRIMARY KEY,
  ip_address INET NOT NULL,
  email VARCHAR(255),
  request_count INTEGER DEFAULT 1 NOT NULL,
  window_start TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

  -- Unique constraint for upsert
  UNIQUE(ip_address, email)
);

-- Indexes
CREATE INDEX idx_rate_limits_ip ON signup_rate_limits(ip_address, window_start);
CREATE INDEX idx_rate_limits_email ON signup_rate_limits(email, window_start);

-- Cleanup function (call periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_rate_limits()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM signup_rate_limits
  WHERE window_start < NOW() - INTERVAL '24 hours';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;
```

**Maintenance**:
- Run `SELECT cleanup_expired_rate_limits();` daily via cron job or scheduled function

---

### 6.3 Row Level Security (RLS)

```sql
-- Enable RLS
ALTER TABLE public.pending_signups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signup_rate_limits ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can insert signup requests (rate limited in app logic)
CREATE POLICY "Allow public insert on pending_signups"
  ON public.pending_signups
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Policy: Admins can view all signups
CREATE POLICY "Admins can view pending_signups"
  ON public.pending_signups
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role_id = 1 -- Admin role
    )
  );

-- Policy: Admins can update signups (approve/reject)
CREATE POLICY "Admins can update pending_signups"
  ON public.pending_signups
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role_id = 1
    )
  );

-- Policy: Rate limits are managed by service role only
CREATE POLICY "Service role manages rate_limits"
  ON public.signup_rate_limits
  FOR ALL
  TO service_role
  USING (true);
```

**Security Note**: Backend uses service role key, so RLS is additional layer of defense (defense in depth).

---

## 7. Integration with Existing Auth System

### 7.1 Migration Strategy

**Option A: Deprecate Direct Signup (Recommended)**

1. Keep existing `SignUpUseCase` for backward compatibility
2. Update frontend to use new `SubmitSignupRequestUseCase`
3. Add feature flag: `SIGNUP_APPROVAL_REQUIRED=true`
4. Gradually migrate users to new flow

**Option B: Hybrid Approach**

1. Add whitelist of auto-approved domains (e.g., `@espanacreativa.org`)
2. Auto-approve whitelisted domains, require manual approval for others
3. Implement in `SubmitSignupRequestUseCase`:

```typescript
async execute(request: SubmitSignupRequestDTO): Promise<SubmitSignupRequestResponse> {
  // ... existing validation ...

  // Check whitelist
  const whitelistedDomains = ['@espanacreativa.org', '@espanacreativa.dev']
  const emailDomain = email.getValue().split('@')[1]

  if (whitelistedDomains.includes(`@${emailDomain}`)) {
    // Auto-approve: directly create user
    return this.signUpUseCase.execute({
      email: request.email,
      password: generateTemporaryPassword(), // Send via email
      name: request.name
    })
  }

  // Otherwise: require manual approval
  // ... continue with pending signup flow ...
}
```

---

### 7.2 User Profile Creation

**Question**: When to create `public.users` profile?

**Recommended Approach**: Create profile when user first logs in (after clicking magic link)

**Implementation**: Add to existing auth middleware or session handler:

```typescript
// In authMiddleware or session creation
const authUser = await supabase.auth.getUser()

if (authUser) {
  // Check if profile exists
  const profile = await userRepository.findById(UserId.create(authUser.id)!)

  if (!profile) {
    // Create profile from pending signup data
    const pendingSignup = await pendingSignupRepository.findByEmail(
      Email.create(authUser.email)!
    )

    if (pendingSignup && pendingSignup.getStatus().isApproved()) {
      const user = User.create({
        id: UserId.create(authUser.id)!,
        email: Email.create(authUser.email)!,
        name: pendingSignup.getName(),
        avatarUrl: null,
        bio: null,
        location: null,
        linkedinUrl: null,
        websiteUrl: null,
        skills: [],
        interests: [],
        roleIds: [3], // Default: emprendedor
        createdAt: new Date(),
        updatedAt: new Date()
      })

      await userRepository.save(user)
    }
  }
}
```

**Alternative**: Create profile immediately after magic link generation in `ApproveSignupUseCase` (more predictable, but user might not complete onboarding).

---

## 8. Rate Limiting Architecture Decision

### 8.1 Where to Implement?

**Recommended: Application Layer (Use Case)**

**Rationale**:
1. ✅ **Business Logic**: Rate limiting is a domain rule, not infrastructure concern
2. ✅ **Testability**: Easy to unit test with mocked `IRateLimitService`
3. ✅ **Flexibility**: Can adjust limits based on domain context
4. ✅ **Reusability**: Service can be used by multiple use cases
5. ✅ **Error Handling**: Can return structured errors with retry info

**Not Recommended: Middleware Layer**

**Reasons**:
1. ❌ Middleware is infrastructure concern (HTTP-specific)
2. ❌ Harder to test (requires mocking Express)
3. ❌ Less flexible (same limits for all endpoints)
4. ❌ Leaks infrastructure details into application layer

**Implementation**:
- Rate limit check in `SubmitSignupRequestUseCase.execute()` (as shown above)
- Service interface in application layer (`IRateLimitService`)
- Concrete implementation in infrastructure layer (`RateLimitService`)

---

### 8.2 Rate Limiting Configuration

**Environment Variables**:

```bash
# .env
RATE_LIMIT_SIGNUPS_PER_HOUR=3
RATE_LIMIT_SIGNUPS_PER_DAY_EMAIL=1
APPROVAL_TOKEN_EXPIRY_HOURS=48
ADMIN_EMAIL=admin@espanacreativa.dev
```

**Configuration Service** (optional):

```typescript
// server/infrastructure/config/RateLimitConfig.ts
export class RateLimitConfig {
  static getSignupsPerHour(): number {
    return parseInt(process.env.RATE_LIMIT_SIGNUPS_PER_HOUR || '3', 10)
  }

  static getSignupsPerDayPerEmail(): number {
    return parseInt(process.env.RATE_LIMIT_SIGNUPS_PER_DAY_EMAIL || '1', 10)
  }

  static getApprovalTokenExpiryHours(): number {
    return parseInt(process.env.APPROVAL_TOKEN_EXPIRY_HOURS || '48', 10)
  }
}
```

---

## 9. Architectural Risks and Concerns

### 9.1 High-Risk Areas

#### Risk 1: Magic Link Expiration

**Issue**: Supabase magic links expire after 1 hour. If user doesn't click immediately, they're locked out.

**Mitigation**:
1. **Clear Communication**: Email states "Valid for 1 hour"
2. **Resend Capability**: Admin can re-approve to generate new link
3. **Alternative**: Extend expiry by setting password flow as backup

**Implementation**:
```typescript
// In ApproveSignupUseCase
const { actionLink, error } = await this.authService.generateMagicLink(email)

if (!actionLink) {
  // Fallback: create user with temporary password
  const tempPassword = generateSecurePassword()
  await this.authService.createUserWithoutPassword(email, { name })
  await this.emailService.sendPasswordSetupEmail(email, tempPassword)
}
```

---

#### Risk 2: Email Delivery Failures

**Issue**: If approval email fails to send, user is approved but never notified.

**Mitigation**:
1. **Transaction Pattern**: Only mark as approved AFTER email sends successfully
2. **Retry Queue**: Store failed emails for retry
3. **Admin Dashboard**: Show "approved but not notified" status

**Revised ApproveSignupUseCase**:
```typescript
// Step 4: Generate magic link
const { actionLink, error: magicLinkError } = await this.authService.generateMagicLink(email)
if (magicLinkError || !actionLink) {
  return { success: false, error: 'MAGIC_LINK_FAILED' }
}

// Step 5: Send email (MUST succeed before updating status)
const emailResult = await this.emailService.sendSignupApprovedEmail(
  email,
  name,
  actionLink
)

if (!emailResult.success) {
  // Don't mark as approved if email fails
  return {
    success: false,
    message: 'Failed to send approval email. Please try again.',
    error: 'EMAIL_SEND_FAILED'
  }
}

// Step 6: Only now update status
const approvedSignup = pendingSignup.approve(adminId)
await this.pendingSignupRepository.update(approvedSignup)
```

---

#### Risk 3: Race Conditions in Rate Limiting

**Issue**: Concurrent requests might bypass rate limits.

**Mitigation**:
1. **Database-Level Locking**: Use `FOR UPDATE` in rate limit queries
2. **Atomic Upserts**: Use database functions (already implemented)
3. **Idempotency**: Check for duplicate pending signups

**Enhanced Implementation**:
```sql
-- Add row-level locking to rate limit check
SELECT * FROM signup_rate_limits
WHERE ip_address = $1
FOR UPDATE; -- Lock row during transaction
```

---

#### Risk 4: Admin Token Leakage

**Issue**: Approval tokens in email links could be intercepted or leaked.

**Mitigation**:
1. **Single-Use Tokens**: Mark token as used after first approval/rejection
2. **Expiration**: Tokens expire after 48 hours
3. **HTTPS Only**: Enforce HTTPS in production
4. **Signed URLs**: Add HMAC signature to token (future enhancement)

**Implementation**:
```typescript
// Add `token_used` field to pending_signups table
// In ApproveSignupUseCase:
const pendingSignup = await this.repository.findByToken(token)
if (pendingSignup.isTokenUsed()) {
  return { success: false, error: 'TOKEN_ALREADY_USED' }
}

// Mark as used
pendingSignup.markTokenAsUsed()
await this.repository.update(pendingSignup)
```

---

### 9.2 Medium-Risk Areas

#### Performance: N+1 Queries in GetPendingSignupsUseCase

**Issue**: Loading admin info for each signup separately.

**Solution**: Join query in repository:
```typescript
async findAllPending(): Promise<PendingSignup[]> {
  const { data } = await this.supabase
    .from('pending_signups')
    .select(`
      *,
      approved_admin:users!approved_by(name, email),
      rejected_admin:users!rejected_by(name, email)
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  return data.map(row => this.toDomain(row))
}
```

---

#### Scalability: Rate Limit Table Growth

**Issue**: Table grows indefinitely with every signup attempt.

**Solution**:
1. **Scheduled Cleanup**: Run daily cleanup job
2. **TTL Extension**: Use PostgreSQL table partitioning or pg_cron
3. **Alternative**: Use Redis for rate limiting (external dependency)

```sql
-- Create scheduled cleanup job (requires pg_cron extension)
SELECT cron.schedule(
  'cleanup-rate-limits',
  '0 3 * * *', -- Daily at 3 AM
  $$SELECT cleanup_expired_rate_limits()$$
);
```

---

## 10. Testing Strategy

### 10.1 Unit Tests

**Domain Layer**:
```typescript
// server/domain/entities/PendingSignup.test.ts
describe('PendingSignup Entity', () => {
  it('should approve pending signup', () => {
    const pending = PendingSignupBuilder.pending().build()
    const admin = UserId.create('admin-123')!

    const approved = pending.approve(admin)

    expect(approved.getStatus().isApproved()).toBe(true)
    expect(approved.getApprovedBy()).toEqual(admin)
    expect(approved.getApprovedAt()).toBeInstanceOf(Date)
  })

  it('should throw when approving already approved signup', () => {
    const approved = PendingSignupBuilder.approved().build()
    const admin = UserId.create('admin-123')!

    expect(() => approved.approve(admin)).toThrow(DomainException)
  })

  it('should detect expired signups', () => {
    const old = PendingSignupBuilder.pending()
      .withCreatedAt(new Date(Date.now() - 50 * 60 * 60 * 1000)) // 50 hours ago
      .build()

    expect(old.isExpired(48)).toBe(true)
  })
})
```

**Use Case Layer**:
```typescript
// server/application/use-cases/auth/ApproveSignupUseCase.test.ts
describe('ApproveSignupUseCase', () => {
  let useCase: ApproveSignupUseCase
  let mockRepo: jest.Mocked<IPendingSignupRepository>
  let mockAuthService: jest.Mocked<IAuthService>
  let mockEmailService: jest.Mocked<IEmailService>

  beforeEach(() => {
    mockRepo = createMockPendingSignupRepository()
    mockAuthService = createMockAuthService()
    mockEmailService = createMockEmailService()

    useCase = new ApproveSignupUseCase(
      mockRepo,
      mockAuthService,
      mockUserRepository,
      mockEmailService
    )
  })

  it('should approve valid pending signup', async () => {
    // Arrange
    const pending = PendingSignupBuilder.pending().build()
    mockRepo.findByToken.mockResolvedValue(pending)
    mockAuthService.generateMagicLink.mockResolvedValue({
      actionLink: 'https://magic-link',
      error: null
    })

    // Act
    const result = await useCase.execute({
      token: pending.getApprovalToken().getValue(),
      adminId: 'admin-123'
    })

    // Assert
    expect(result.success).toBe(true)
    expect(mockRepo.update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: expect.any(Object) // SignupStatus.approved()
      })
    )
    expect(mockEmailService.sendSignupApprovedEmail).toHaveBeenCalledWith(
      pending.getEmail(),
      pending.getName(),
      'https://magic-link'
    )
  })

  it('should fail if signup already approved', async () => {
    const approved = PendingSignupBuilder.approved().build()
    mockRepo.findByToken.mockResolvedValue(approved)

    const result = await useCase.execute({
      token: approved.getApprovalToken().getValue(),
      adminId: 'admin-123'
    })

    expect(result.success).toBe(false)
    expect(result.error).toBe('ALREADY_APPROVED')
  })

  it('should fail if magic link generation fails', async () => {
    const pending = PendingSignupBuilder.pending().build()
    mockRepo.findByToken.mockResolvedValue(pending)
    mockAuthService.generateMagicLink.mockResolvedValue({
      actionLink: null,
      error: new Error('Supabase error')
    })

    const result = await useCase.execute({
      token: pending.getApprovalToken().getValue(),
      adminId: 'admin-123'
    })

    expect(result.success).toBe(false)
    expect(result.error).toBe('MAGIC_LINK_FAILED')
    expect(mockRepo.update).not.toHaveBeenCalled() // Don't update if magic link fails
  })
})
```

---

### 10.2 Integration Tests

```typescript
// server/test/integration/auth/approve-signup.integration.test.ts
describe('Approve Signup Integration', () => {
  let supabase: SupabaseClient
  let container: Container

  beforeAll(async () => {
    // Setup test database
    supabase = createTestSupabaseClient()
    Container.initialize()
  })

  afterEach(async () => {
    // Clean up test data
    await supabase.from('pending_signups').delete().neq('id', '')
  })

  it('should complete full approval flow', async () => {
    // 1. Submit signup request
    const submitUseCase = Container.getSubmitSignupRequestUseCase()
    const submitResult = await submitUseCase.execute({
      email: 'test@example.com',
      name: 'Test User',
      surname: 'Surname',
      ipAddress: '127.0.0.1',
      userAgent: 'test-agent'
    })

    expect(submitResult.success).toBe(true)

    // 2. Get approval token from database
    const { data } = await supabase
      .from('pending_signups')
      .select('approval_token')
      .eq('email', 'test@example.com')
      .single()

    // 3. Approve signup
    const approveUseCase = Container.getApproveSignupUseCase()
    const approveResult = await approveUseCase.execute({
      token: data.approval_token,
      adminId: 'admin-test-id'
    })

    expect(approveResult.success).toBe(true)

    // 4. Verify status updated
    const { data: updated } = await supabase
      .from('pending_signups')
      .select('status, approved_at, approved_by')
      .eq('email', 'test@example.com')
      .single()

    expect(updated.status).toBe('approved')
    expect(updated.approved_at).not.toBeNull()
    expect(updated.approved_by).toBe('admin-test-id')
  })
})
```

---

## 11. Dependency Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         PRESENTATION LAYER                       │
│                     (Express API Routes)                        │
│                                                                 │
│  POST /api/auth/request-signup                                  │
│  POST /api/auth/approve-signup                                  │
│  POST /api/auth/reject-signup                                   │
│  GET  /api/auth/pending-signups [admin]                         │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      APPLICATION LAYER                          │
│                        (Use Cases)                              │
│                                                                 │
│  • SubmitSignupRequestUseCase ─────────┐                       │
│  • ApproveSignupUseCase ───────────────┤                       │
│  • RejectSignupUseCase ────────────────┤                       │
│  • GetPendingSignupsUseCase ───────────┤                       │
│                                        │                        │
│  ┌──────────────────────────────────┐  │                       │
│  │      Application Ports           │  │                       │
│  │  (Interfaces)                    │  │                       │
│  │                                  │  │                       │
│  │  • IPendingSignupRepository ◄────┤                       │
│  │  • IUserRepository ◄─────────────┤                       │
│  │  • IAuthService ◄────────────────┤                       │
│  │  • IEmailService ◄───────────────┤                       │
│  │  • IRateLimitService ◄───────────┤                       │
│  └──────────────────────────────────┘  │                       │
└────────────────────────────┬────────────┼────────────────────────┘
                             │            │
                             ▼            ▼
┌─────────────────────────────────────────────────────────────────┐
│                        DOMAIN LAYER                             │
│                     (Business Logic)                            │
│                                                                 │
│  Entities:                                                      │
│  • PendingSignup ─── approve()                                  │
│                  └── reject()                                   │
│                  └── isExpired()                                │
│                  └── canBeApproved()                            │
│  • User                                                         │
│                                                                 │
│  Value Objects:                                                 │
│  • Email                                                        │
│  • UserId                                                       │
│  • PendingSignupId                                              │
│  • ApprovalToken                                                │
│  • SignupStatus                                                 │
│                                                                 │
│  ⚠️  NO DEPENDENCIES ON OUTER LAYERS ⚠️                          │
└─────────────────────────────────────────────────────────────────┘
                             ▲
                             │
                             │ implements
                             │
┌─────────────────────────────────────────────────────────────────┐
│                    INFRASTRUCTURE LAYER                         │
│                       (Adapters)                                │
│                                                                 │
│  Repositories (Driven Adapters):                                │
│  • SupabasePendingSignupRepository ─► IPendingSignupRepository  │
│  • SupabaseUserRepository ──────────► IUserRepository           │
│                                                                 │
│  Services (Driven Adapters):                                    │
│  • SupabaseAuthService ─────────────► IAuthService              │
│  • ResendEmailService ──────────────► IEmailService             │
│  • RateLimitService ────────────────► IRateLimitService         │
│                                                                 │
│  External Dependencies:                                         │
│  • Supabase (PostgreSQL, Auth)                                  │
│  • Resend (Email delivery)                                      │
└─────────────────────────────────────────────────────────────────┘

DEPENDENCY RULE: Dependencies point INWARD
- Infrastructure depends on Application (implements ports)
- Application depends on Domain (uses entities/value objects)
- Domain depends on NOTHING (pure business logic)
```

---

## 12. File Structure Summary

```
server/
├── domain/
│   ├── entities/
│   │   ├── PendingSignup.ts ⭐ NEW
│   │   ├── PendingSignup.test.ts ⭐ NEW
│   │   └── User.ts (existing)
│   ├── value-objects/
│   │   ├── PendingSignupId.ts ⭐ NEW
│   │   ├── PendingSignupId.test.ts ⭐ NEW
│   │   ├── ApprovalToken.ts ⭐ NEW
│   │   ├── ApprovalToken.test.ts ⭐ NEW
│   │   ├── SignupStatus.ts ⭐ NEW
│   │   ├── SignupStatus.test.ts ⭐ NEW
│   │   ├── Email.ts (existing)
│   │   └── UserId.ts (existing)
│   └── exceptions/
│       └── DomainException.ts (existing or new)
│
├── application/
│   ├── use-cases/
│   │   └── auth/
│   │       ├── SubmitSignupRequestUseCase.ts ⭐ NEW
│   │       ├── SubmitSignupRequestUseCase.test.ts ⭐ NEW
│   │       ├── ApproveSignupUseCase.ts ⭐ NEW
│   │       ├── ApproveSignupUseCase.test.ts ⭐ NEW
│   │       ├── RejectSignupUseCase.ts ⭐ NEW
│   │       ├── RejectSignupUseCase.test.ts ⭐ NEW
│   │       ├── GetPendingSignupsUseCase.ts ⭐ NEW
│   │       ├── GetPendingSignupsUseCase.test.ts ⭐ NEW
│   │       ├── SignUpUseCase.ts (existing - keep for backward compat)
│   │       └── SignInUseCase.ts (existing)
│   └── ports/
│       ├── repositories/
│       │   ├── IPendingSignupRepository.ts ⭐ NEW
│       │   └── IUserRepository.ts (existing)
│       └── services/
│           ├── IAuthService.ts (extend with generateMagicLink) ⭐ MODIFY
│           ├── IEmailService.ts (extend with new email methods) ⭐ MODIFY
│           └── IRateLimitService.ts ⭐ NEW
│
├── infrastructure/
│   ├── adapters/
│   │   ├── repositories/
│   │   │   ├── SupabasePendingSignupRepository.ts ⭐ NEW
│   │   │   └── SupabaseUserRepository.ts (existing)
│   │   └── services/
│   │       ├── SupabaseAuthService.ts (extend) ⭐ MODIFY
│   │       ├── ResendEmailService.ts (extend) ⭐ MODIFY
│   │       └── RateLimitService.ts ⭐ NEW
│   ├── api/
│   │   ├── routes/
│   │   │   └── auth.routes.ts (extend) ⭐ MODIFY
│   │   └── middleware/
│   │       └── admin.middleware.ts ⭐ NEW
│   ├── di/
│   │   └── Container.ts (extend) ⭐ MODIFY
│   └── database/
│       └── migrations/
│           ├── 001_create_pending_signups.sql ⭐ NEW
│           ├── 002_create_rate_limits.sql ⭐ NEW
│           └── 003_add_rls_policies.sql ⭐ NEW
│
└── test/
    ├── builders/
    │   └── PendingSignupBuilder.ts ⭐ NEW
    └── integration/
        └── auth/
            ├── submit-signup-request.integration.test.ts ⭐ NEW
            └── approve-signup.integration.test.ts ⭐ NEW
```

**Legend**:
- ⭐ NEW: New file to create
- ⭐ MODIFY: Existing file to extend

---

## 13. Implementation Checklist

### Phase 1: Domain Layer (Start Here)
- [ ] Create `PendingSignupId` value object
- [ ] Create `ApprovalToken` value object
- [ ] Create `SignupStatus` value object
- [ ] Create `PendingSignup` entity with business logic
- [ ] Write unit tests for entity
- [ ] Create `PendingSignupBuilder` for tests

### Phase 2: Application Layer
- [ ] Define `IPendingSignupRepository` port
- [ ] Define `IRateLimitService` port
- [ ] Extend `IAuthService` with `generateMagicLink()`
- [ ] Extend `IEmailService` with approval email methods
- [ ] Implement `SubmitSignupRequestUseCase`
- [ ] Implement `ApproveSignupUseCase`
- [ ] Implement `RejectSignupUseCase`
- [ ] Implement `GetPendingSignupsUseCase`
- [ ] Write unit tests for all use cases

### Phase 3: Infrastructure Layer
- [ ] Implement `SupabasePendingSignupRepository`
- [ ] Implement `RateLimitService`
- [ ] Extend `SupabaseAuthService` with magic link generation
- [ ] Extend `ResendEmailService` with approval email templates
- [ ] Create admin middleware
- [ ] Extend auth routes

### Phase 4: Database
- [ ] Create `pending_signups` table
- [ ] Create `signup_rate_limits` table
- [ ] Add indexes
- [ ] Create RLS policies
- [ ] Create rate limit increment function
- [ ] Create cleanup function

### Phase 5: Dependency Injection
- [ ] Register new repositories in Container
- [ ] Register new services in Container
- [ ] Register new use cases in Container

### Phase 6: Integration Tests
- [ ] Write integration test for submit signup flow
- [ ] Write integration test for approve signup flow
- [ ] Write integration test for reject signup flow
- [ ] Write integration test for rate limiting

### Phase 7: Documentation
- [ ] Add API documentation (OpenAPI/Swagger)
- [ ] Update CLAUDE.md with new auth flow
- [ ] Create admin guide for approval process

---

## 14. Important Notes for Implementation

### Critical Success Factors

1. **Magic Link Must Work**
   - Test Supabase `auth.admin.generateLink()` thoroughly
   - Verify redirect URL configuration
   - Test email delivery end-to-end

2. **Rate Limiting Must Be Atomic**
   - Use database functions for atomic operations
   - Test concurrent request scenarios
   - Monitor for bypasses

3. **Email Delivery Is Critical**
   - Both admin notification and user approval emails must work
   - Implement retry logic or fallback
   - Monitor email service health

4. **Admin Access Must Be Secure**
   - Verify admin middleware works correctly
   - Test token security (no leakage)
   - Audit all approval/rejection actions

### Common Pitfalls to Avoid

1. ❌ **Don't mark as approved if email fails** - User will be stuck
2. ❌ **Don't skip rate limiting** - Open to abuse
3. ❌ **Don't use middleware for rate limiting** - Wrong layer
4. ❌ **Don't forget to clean up expired records** - Database bloat
5. ❌ **Don't allow concurrent approvals** - Race conditions

### Architecture Principles to Follow

1. ✅ **Domain logic in entities** - Not in use cases
2. ✅ **Use cases orchestrate** - Don't contain business rules
3. ✅ **Repositories return entities** - Not plain objects
4. ✅ **Services are injected** - Never instantiated directly
5. ✅ **Errors bubble up** - Don't swallow exceptions

---

## 15. Questions for Iban

Before proceeding with implementation, please clarify:

1. **Admin Email**: Single admin or multiple? (affects notification strategy)
2. **Approval Timeline**: Expected approval time? (affects UX messaging)
3. **Rejection Email**: Should rejected users receive email? (privacy consideration)
4. **Re-submission**: Can rejected users resubmit? (current design allows it)
5. **Feature Flag**: Should we keep direct signup as fallback? (migration strategy)
6. **Profile Creation**: When to create profile - on approval or first login?
7. **Whitelist**: Auto-approve certain email domains? (hybrid approach)
8. **Token Expiry**: 48 hours for approval token sufficient? (business requirement)

---

## Conclusion

This architectural plan provides a complete blueprint for implementing the admin-approval signup system using hexagonal architecture and DDD principles. The design maintains clear separation of concerns, ensures testability, and integrates seamlessly with the existing España Creativa Red codebase.

**Key Strengths**:
- Pure domain logic isolated from infrastructure
- Clear dependency flow (inward)
- Comprehensive error handling
- Production-ready security measures
- Full test coverage strategy

**Next Steps**:
1. Review this plan with Iban
2. Clarify open questions
3. Begin Phase 1 implementation (domain layer)
4. Proceed incrementally with tests at each phase

---

**Document Version**: 1.0
**Last Updated**: 2025-10-22
**Author**: hexagonal-backend-architect
**Status**: Ready for Review
