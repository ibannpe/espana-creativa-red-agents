# Hexagonal Backend Architecture Review & Implementation Guide

## Executive Summary

This document provides a comprehensive architectural review of the España Creativa Red backend implementation and detailed guidance for completing the missing components. The backend follows hexagonal architecture (ports and adapters) with Domain-Driven Design principles.

**Overall Architecture Grade: 8/10**

The implementation demonstrates strong adherence to hexagonal architecture principles with clean separation of concerns. However, there are critical database schema mismatches and missing components that need to be addressed before production deployment.

---

## Table of Contents

1. [Architecture Review](#1-architecture-review)
2. [Database Schema Analysis](#2-database-schema-analysis)
3. [Messages Routes Specification](#3-messages-routes-specification)
4. [Authentication Middleware Recommendation](#4-authentication-middleware-recommendation)
5. [Error Handling Standardization](#5-error-handling-standardization)
6. [Architectural Improvements](#6-architectural-improvements)
7. [Testing Strategy](#7-testing-strategy)
8. [Deployment Considerations](#8-deployment-considerations)

---

## 1. Architecture Review

### 1.1 Hexagonal Architecture Validation

#### ✅ EXCELLENT: Layer Separation

The codebase demonstrates exemplary separation between layers:

```
server/
├── domain/              # Pure business logic (0 dependencies)
│   ├── entities/       # User, Connection, Opportunity, Message
│   └── value-objects/  # Email, UserId, CompletionPercentage
├── application/        # Use cases & ports
│   ├── ports/          # Repository & service interfaces
│   └── use-cases/      # 24 single-purpose use cases
└── infrastructure/     # Framework & external dependencies
    ├── adapters/       # Supabase & Resend implementations
    ├── api/            # Express routes & middleware
    └── di/             # Dependency injection container
```

**Validation:**
- ✅ Domain layer has ZERO framework dependencies
- ✅ All dependencies point INWARD (dependency inversion)
- ✅ Infrastructure depends on application, not vice versa
- ✅ Use cases orchestrate domain logic without infrastructure knowledge

#### ✅ EXCELLENT: Domain Entities

All domain entities (`User`, `Connection`, `Opportunity`, `Message`) demonstrate rich business logic:

**Example: Connection Entity**
```typescript
// Business rules enforced in domain
- Cannot connect with yourself
- Status transitions validated (pending -> accepted/rejected)
- Only addressee can accept/reject
- Anyone involved can block
```

**Example: Opportunity Entity**
```typescript
// Domain validations
- Title: 5-100 characters
- Description: 20-2000 characters
- At least one skill required
- Status lifecycle: abierta -> en_progreso -> cerrada/cancelada
```

**Example: Message Entity**
```typescript
// Domain invariants
- Cannot send message to yourself
- Content: 1-5000 characters
- Read status immutable once set
```

This is **textbook DDD** - all business rules live in the domain, not in use cases or routes.

#### ✅ EXCELLENT: Repository Pattern

All repositories follow the ports and adapters pattern correctly:

1. **Port (Interface)** defined in application layer
2. **Adapter (Implementation)** in infrastructure layer
3. **Domain entities** returned, not database rows
4. **No leaky abstractions** - Supabase details hidden

Example:
```typescript
// Application layer defines contract
interface MessageRepository {
  findById(id: string): Promise<Message | null>
  create(message: Message): Promise<Message>
}

// Infrastructure implements contract
class SupabaseMessageRepository implements MessageRepository {
  // Converts DB rows to domain entities
  private toDomain(row: MessageRow): Message
  private toRow(message: Message): MessageRow
}
```

#### ✅ GOOD: Use Case Pattern

All 24 use cases follow single responsibility principle:

**Auth Use Cases (2):**
- `SignUpUseCase` - Register user + send welcome email
- `SignInUseCase` - Authenticate user + return session

**Users Use Cases (3):**
- `GetUserProfileUseCase` - Fetch user by ID
- `UpdateUserProfileUseCase` - Update user data
- `SearchUsersUseCase` - Search with filters

**Network Use Cases (7):**
- `RequestConnectionUseCase` - Create connection request
- `UpdateConnectionStatusUseCase` - Accept/reject/block
- `GetConnectionsUseCase` - List connections with filters
- `DeleteConnectionUseCase` - Remove connection
- `GetNetworkStatsUseCase` - Connection statistics
- `GetMutualConnectionsUseCase` - Find mutual connections
- `GetConnectionStatusUseCase` - Check status with user

**Opportunities Use Cases (6):**
- `CreateOpportunityUseCase`
- `GetOpportunitiesUseCase` - List with filters
- `GetOpportunityUseCase` - Get single by ID
- `GetMyOpportunitiesUseCase` - User's opportunities
- `UpdateOpportunityUseCase`
- `DeleteOpportunityUseCase`

**Messages Use Cases (6):**
- `SendMessageUseCase` - Send new message
- `GetConversationsUseCase` - List conversations
- `GetConversationMessagesUseCase` - Get messages with pagination
- `MarkMessagesAsReadUseCase` - Bulk mark as read
- `DeleteMessageUseCase` - Delete own message
- `GetUnreadCountUseCase` - Unread count for badges

**Pattern Compliance:**
- ✅ Each use case has single purpose
- ✅ DTOs for input/output (not domain entities directly)
- ✅ Use cases orchestrate, don't contain business logic
- ✅ Repository interfaces injected via constructor

#### ✅ EXCELLENT: Dependency Injection

The `Container` class manages all dependencies with proper lifecycle:

```typescript
class Container {
  // Singleton instances
  private static userRepository: IUserRepository
  private static connectionRepository: ConnectionRepository
  // ... all repositories, services, use cases

  static initialize() {
    // Create Supabase client
    const supabase = createClient(url, key)

    // Initialize repositories
    this.userRepository = new SupabaseUserRepository(supabase)

    // Initialize services
    this.authService = new SupabaseAuthService(supabase)

    // Initialize use cases with dependencies
    this.signUpUseCase = new SignUpUseCase(
      this.authService,
      this.userRepository,
      this.emailService
    )
  }
}
```

**Benefits:**
- Single source of truth for dependencies
- Easy to swap implementations (e.g., mock for testing)
- Clear dependency graph
- Fails fast on initialization if misconfigured

#### ⚠️ NEEDS IMPROVEMENT: Route Handlers

Route handlers are thin (good) but have some anti-patterns:

**Current Pattern (from connections.routes.ts):**
```typescript
router.get('/', async (req, res, next) => {
  try {
    const userId = (req as any).user?.id  // ❌ Type casting

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const getConnectionsUseCase = Container.getGetConnectionsUseCase()
    const connections = await getConnectionsUseCase.execute({ userId })

    // Manual mapping from domain to HTTP response
    return res.status(200).json({
      connections: connections.map((c) => ({
        id: c.connection.id,
        status: c.connection.status,
        // ... manual field mapping
      }))
    })
  } catch (error) {
    next(error)
  }
})
```

**Issues:**
1. `(req as any).user?.id` - No type safety, manual auth check
2. Manual field mapping from domain to HTTP response
3. Inconsistent error handling across routes
4. No request validation

**Recommendation:** See sections 4 and 5 for improvements.

### 1.2 Domain-Driven Design Assessment

#### ✅ EXCELLENT: Tactical Patterns

**Entities:**
- User (aggregate root)
- Connection (aggregate root)
- Opportunity (aggregate root)
- Message (aggregate root)

All entities have:
- Identity (id field)
- Lifecycle (created_at, updated_at)
- Business logic methods
- Validation rules
- State transitions

**Value Objects:**
- `Email` - Validates email format
- `UserId` - Type-safe user identifier
- `CompletionPercentage` - Ensures 0-100 range

**Aggregate Boundaries:**
- User aggregate: User + roles
- Connection aggregate: Connection (no nested entities)
- Opportunity aggregate: Opportunity (no nested entities)
- Message aggregate: Message (no nested entities)

Boundaries are well-defined - each aggregate is independently consistent.

#### ✅ GOOD: Ubiquitous Language

Spanish business terms used consistently:
- `emprendedor` (entrepreneur)
- `mentor`
- `proyecto`, `colaboracion`, `empleo`, `mentoria`, `evento`
- `abierta`, `en_progreso`, `cerrada`, `cancelada`

This matches the Spanish-speaking user domain.

#### ⚠️ MISSING: Domain Services

Some operations might benefit from domain services:
- Matching algorithm (users with similar interests/skills)
- Connection recommendation logic
- Notification preferences

Currently these would go in use cases, but they contain domain logic that should be in the domain layer.

#### ⚠️ MISSING: Specification Pattern

Complex queries (e.g., SearchUsersUseCase) could benefit from specification pattern:

```typescript
// Could be implemented as:
interface UserSpecification {
  isSatisfiedBy(user: User): boolean
}

class UserWithSkillsSpecification implements UserSpecification {
  constructor(private skills: string[]) {}

  isSatisfiedBy(user: User): boolean {
    return user.getSkills().some(s => this.skills.includes(s))
  }
}
```

This would move complex query logic from repository to domain.

---

## 2. Database Schema Analysis

### 2.1 Current Schema State

#### ✅ GOOD: Users Table
```sql
users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  avatar_url TEXT,
  bio TEXT,
  location VARCHAR(255),
  linkedin_url TEXT,
  website_url TEXT,
  skills TEXT[],
  interests TEXT[],
  completed_pct INTEGER CHECK (0-100),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```
**Status:** ✅ Matches domain entity perfectly

#### ✅ GOOD: Connections Table (Migration 001)
```sql
connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  requester_id UUID NOT NULL REFERENCES users(id),
  addressee_id UUID NOT NULL REFERENCES users(id),
  status VARCHAR(20) CHECK (pending, accepted, rejected, blocked),
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL,
  CONSTRAINT different_users CHECK (requester_id != addressee_id),
  CONSTRAINT unique_connection UNIQUE (requester_id, addressee_id)
)
```
**Status:** ✅ Matches domain entity perfectly

#### ✅ GOOD: Opportunities Table (Migration 002)
```sql
opportunities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(100) CHECK (length >= 5 AND length <= 100),
  description TEXT CHECK (length >= 20 AND length <= 2000),
  type VARCHAR(20) CHECK (proyecto, colaboracion, empleo, mentoria, evento, otro),
  status VARCHAR(20) DEFAULT 'abierta' CHECK (abierta, en_progreso, cerrada, cancelada),
  skills_required TEXT[] NOT NULL CHECK (array_length > 0),
  location VARCHAR(255),
  remote BOOLEAN DEFAULT FALSE,
  duration VARCHAR(100),
  compensation VARCHAR(100),
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL
)
```
**Status:** ✅ Matches domain entity perfectly

#### ❌ CRITICAL: Messages Table Schema Mismatch

**Current Schema (supabase-schema.sql):**
```sql
messages (
  id BIGSERIAL PRIMARY KEY,              -- ❌ Code expects UUID string
  sender_id UUID REFERENCES users(id),
  receiver_id UUID REFERENCES users(id), -- ❌ Code expects recipient_id
  body TEXT NOT NULL,                    -- ❌ Code expects content
  is_public BOOLEAN DEFAULT FALSE,       -- ❌ Code doesn't use this
  created_at TIMESTAMP
  -- MISSING: read_at TIMESTAMP
  -- MISSING: updated_at TIMESTAMP
)
```

**Expected by Domain Entity:**
```typescript
interface MessageProps {
  id: string                // ✅ Works with BIGSERIAL if converted to string
  senderId: string          // ✅ Matches sender_id
  recipientId: string       // ❌ MISMATCH: DB has receiver_id
  content: string           // ❌ MISMATCH: DB has body
  readAt: Date | null       // ❌ MISSING in DB
  createdAt: Date           // ✅ Matches created_at
  updatedAt: Date           // ❌ MISSING in DB
}
```

**Expected by Repository (SupabaseMessageRepository.ts):**
```typescript
interface MessageRow {
  id: string
  sender_id: string
  recipient_id: string   // ❌ DB has receiver_id
  content: string        // ❌ DB has body
  read_at: string | null // ❌ DB missing column
  created_at: string
  updated_at: string     // ❌ DB missing column
}
```

### 2.2 Required Database Migration

**CRITICAL: Messages table must be updated before implementing messages routes.**

Create migration: `migrations/003_update_messages_table.sql`

```sql
-- ABOUTME: Migration to update messages table to match domain entity schema
-- ABOUTME: Renames columns, adds read_at and updated_at, removes unused is_public

-- Step 1: Drop the old table (development only)
DROP TABLE IF EXISTS messages CASCADE;

-- Step 2: Recreate with correct schema
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL CHECK (length(content) >= 1 AND length(content) <= 5000),
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

    -- Business rule: Can't send message to yourself
    CONSTRAINT different_users CHECK (sender_id != recipient_id)
);

-- Step 3: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient ON messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);

-- Index for finding conversations
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(sender_id, recipient_id, created_at DESC);

-- Index for unread messages
CREATE INDEX IF NOT EXISTS idx_messages_unread ON messages(recipient_id, read_at) WHERE read_at IS NULL;

-- Step 4: Enable Row Level Security
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Step 5: RLS Policies
-- Users can view messages they sent or received
CREATE POLICY "Users can view their messages" ON messages
    FOR SELECT
    USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

-- Users can send messages (as sender)
CREATE POLICY "Users can send messages" ON messages
    FOR INSERT
    WITH CHECK (auth.uid() = sender_id);

-- Recipients can update messages (for marking as read)
CREATE POLICY "Recipients can update messages" ON messages
    FOR UPDATE
    USING (auth.uid() = recipient_id);

-- Senders can delete their own messages
CREATE POLICY "Senders can delete messages" ON messages
    FOR DELETE
    USING (auth.uid() = sender_id);

-- Step 6: Trigger to update updated_at
CREATE TRIGGER update_messages_updated_at
    BEFORE UPDATE ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Step 7: Add comments
COMMENT ON TABLE messages IS 'Private messages between users';
COMMENT ON COLUMN messages.sender_id IS 'User who sent the message';
COMMENT ON COLUMN messages.recipient_id IS 'User who received the message';
COMMENT ON COLUMN messages.content IS 'Message content (1-5000 characters)';
COMMENT ON COLUMN messages.read_at IS 'Timestamp when message was read (null if unread)';
```

**Note:** The `update_updated_at_column()` function should already exist from previous migrations. If not, create it:

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### 2.3 Schema Verification Checklist

Before deploying messages feature, verify:

- [ ] Run migration `003_update_messages_table.sql` on Supabase
- [ ] Verify `messages` table has `recipient_id` column (not `receiver_id`)
- [ ] Verify `messages` table has `content` column (not `body`)
- [ ] Verify `messages` table has `read_at` column
- [ ] Verify `messages` table has `updated_at` column
- [ ] Verify `messages` table has `id` as UUID (not BIGSERIAL)
- [ ] Verify indexes created successfully
- [ ] Verify RLS policies active
- [ ] Verify trigger `update_messages_updated_at` exists
- [ ] Test inserting a message via Supabase dashboard
- [ ] Test RLS by querying as different users

---

## 3. Messages Routes Specification

### 3.1 Missing File

**File to create:** `server/infrastructure/api/routes/messages.routes.ts`

### 3.2 Required Endpoints

Based on the 6 message use cases, the routes file must expose:

| Method | Endpoint | Use Case | Description |
|--------|----------|----------|-------------|
| POST | `/api/messages` | SendMessageUseCase | Send a new message |
| GET | `/api/messages/conversations` | GetConversationsUseCase | List all conversations |
| GET | `/api/messages/conversations/:userId` | GetConversationMessagesUseCase | Get messages with specific user |
| GET | `/api/messages/unread/count` | GetUnreadCountUseCase | Get unread message count |
| PUT | `/api/messages/read` | MarkMessagesAsReadUseCase | Mark messages as read |
| DELETE | `/api/messages/:id` | DeleteMessageUseCase | Delete a message |

### 3.3 Detailed Specification

#### 3.3.1 POST /api/messages - Send Message

**Request:**
```typescript
{
  recipient_id: string  // Required: User ID to send to
  content: string       // Required: Message content (1-5000 chars)
}
```

**Response (201):**
```typescript
{
  message: {
    id: string
    sender_id: string
    recipient_id: string
    content: string
    read_at: null
    created_at: string  // ISO 8601
    updated_at: string  // ISO 8601
  }
}
```

**Errors:**
- 400: Missing required fields
- 400: Cannot send message to yourself (domain validation)
- 400: Content too long/short (domain validation)
- 401: Unauthorized (no userId)
- 500: Database error

**Implementation Notes:**
- Use `SendMessageUseCase` with `{ senderId: userId, recipientId, content }`
- Domain entity validates content length and self-sending
- Returns created message entity

#### 3.3.2 GET /api/messages/conversations - List Conversations

**Request:**
```
No body or query params
```

**Response (200):**
```typescript
{
  conversations: [
    {
      user: {
        id: string
        name: string
        avatar_url: string | null
      },
      last_message: {
        id: string
        sender_id: string
        recipient_id: string
        content: string
        read_at: string | null
        created_at: string
        updated_at: string
      },
      unread_count: number
    }
  ]
}
```

**Errors:**
- 401: Unauthorized

**Implementation Notes:**
- Use `GetConversationsUseCase` with `{ userId }`
- Repository groups messages by other user
- Returns list sorted by last message date (newest first)
- Includes unread count per conversation

#### 3.3.3 GET /api/messages/conversations/:userId - Get Conversation Messages

**Request:**
```
Path: :userId (other user's ID)
Query: ?limit=50&offset=0
```

**Response (200):**
```typescript
{
  messages: [
    {
      message: {
        id: string
        sender_id: string
        recipient_id: string
        content: string
        read_at: string | null
        created_at: string
        updated_at: string
      },
      sender: {
        id: string
        name: string
        avatar_url: string | null
      },
      recipient: {
        id: string
        name: string
        avatar_url: string | null
      }
    }
  ]
}
```

**Errors:**
- 400: Invalid userId parameter
- 401: Unauthorized

**Implementation Notes:**
- Use `GetConversationMessagesUseCase` with `{ userId, otherUserId, limit, offset }`
- Supports pagination (default: limit=50, offset=0)
- Returns messages sorted newest first
- Includes sender and recipient user info for display

#### 3.3.4 GET /api/messages/unread/count - Get Unread Count

**Request:**
```
No body or query params
```

**Response (200):**
```typescript
{
  count: number
}
```

**Errors:**
- 401: Unauthorized

**Implementation Notes:**
- Use `GetUnreadCountUseCase` with `{ userId }`
- Returns total unread messages for current user
- Used for notification badges in UI

#### 3.3.5 PUT /api/messages/read - Mark Messages as Read

**Request:**
```typescript
{
  message_ids: string[]  // Array of message IDs to mark as read
}
```

**Response (200):**
```typescript
{
  updated_count: number  // Number of messages marked as read
}
```

**Errors:**
- 400: No message IDs provided
- 403: Unauthorized - only recipient can mark as read
- 404: Message not found
- 401: Unauthorized

**Implementation Notes:**
- Use `MarkMessagesAsReadUseCase` with `{ messageIds, userId }`
- Validates user is recipient for ALL messages
- Only updates messages that are currently unread
- Returns count of actually updated messages

#### 3.3.6 DELETE /api/messages/:id - Delete Message

**Request:**
```
Path: :id (message ID)
```

**Response (204):**
```
No content
```

**Errors:**
- 403: Unauthorized - only sender can delete
- 404: Message not found
- 401: Unauthorized

**Implementation Notes:**
- Use `DeleteMessageUseCase` with `{ messageId, userId }`
- Only sender can delete their own messages
- Returns 204 No Content on success

### 3.4 Complete Implementation Template

**File:** `server/infrastructure/api/routes/messages.routes.ts`

```typescript
// ABOUTME: Messages HTTP routes for private messaging between users
// ABOUTME: Thin adapter layer delegating to message use cases with authentication middleware

import { Router, Request, Response, NextFunction } from 'express'
import { Container } from '../../di/Container'

export const createMessagesRoutes = (): Router => {
  const router = Router()

  // All routes require authentication
  // NOTE: Authentication middleware should be applied in main app

  // POST /api/messages - Send a new message
  router.post('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const senderId = (req as any).user?.id
      const { recipient_id, content } = req.body

      if (!senderId) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      if (!recipient_id || !content) {
        return res.status(400).json({
          error: 'Missing required fields: recipient_id, content'
        })
      }

      const sendMessageUseCase = Container.getSendMessageUseCase()
      const message = await sendMessageUseCase.execute({
        senderId,
        recipientId: recipient_id,
        content
      })

      return res.status(201).json({
        message: {
          id: message.id,
          sender_id: message.senderId,
          recipient_id: message.recipientId,
          content: message.content,
          read_at: message.readAt ? message.readAt.toISOString() : null,
          created_at: message.createdAt.toISOString(),
          updated_at: message.updatedAt.toISOString()
        }
      })
    } catch (error: any) {
      if (error.message.includes('yourself')) {
        return res.status(400).json({ error: error.message })
      }
      if (error.message.includes('cannot exceed')) {
        return res.status(400).json({ error: error.message })
      }
      next(error)
    }
  })

  // GET /api/messages/conversations - Get all conversations
  router.get('/conversations', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?.id

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      const getConversationsUseCase = Container.getGetConversationsUseCase()
      const conversations = await getConversationsUseCase.execute({ userId })

      return res.status(200).json({
        conversations: conversations.map((conv) => ({
          user: conv.user,
          last_message: {
            id: conv.lastMessage.id,
            sender_id: conv.lastMessage.senderId,
            recipient_id: conv.lastMessage.recipientId,
            content: conv.lastMessage.content,
            read_at: conv.lastMessage.readAt ? conv.lastMessage.readAt.toISOString() : null,
            created_at: conv.lastMessage.createdAt.toISOString(),
            updated_at: conv.lastMessage.updatedAt.toISOString()
          },
          unread_count: conv.unreadCount
        }))
      })
    } catch (error) {
      next(error)
    }
  })

  // GET /api/messages/conversations/:userId - Get conversation with specific user
  router.get('/conversations/:userId', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?.id
      const otherUserId = req.params.userId

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      if (!otherUserId) {
        return res.status(400).json({ error: 'User ID is required' })
      }

      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0

      const getConversationMessagesUseCase = Container.getGetConversationMessagesUseCase()
      const messages = await getConversationMessagesUseCase.execute({
        userId,
        otherUserId,
        limit,
        offset
      })

      return res.status(200).json({
        messages: messages.map((m) => ({
          message: {
            id: m.message.id,
            sender_id: m.message.senderId,
            recipient_id: m.message.recipientId,
            content: m.message.content,
            read_at: m.message.readAt ? m.message.readAt.toISOString() : null,
            created_at: m.message.createdAt.toISOString(),
            updated_at: m.message.updatedAt.toISOString()
          },
          sender: m.sender,
          recipient: m.recipient
        }))
      })
    } catch (error) {
      next(error)
    }
  })

  // GET /api/messages/unread/count - Get unread message count
  router.get('/unread/count', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?.id

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      const getUnreadCountUseCase = Container.getGetUnreadCountUseCase()
      const count = await getUnreadCountUseCase.execute({ userId })

      return res.status(200).json({
        count
      })
    } catch (error) {
      next(error)
    }
  })

  // PUT /api/messages/read - Mark messages as read
  router.put('/read', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?.id
      const { message_ids } = req.body

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      if (!message_ids || !Array.isArray(message_ids) || message_ids.length === 0) {
        return res.status(400).json({ error: 'message_ids array is required' })
      }

      const markMessagesAsReadUseCase = Container.getMarkMessagesAsReadUseCase()
      const updatedCount = await markMessagesAsReadUseCase.execute({
        messageIds: message_ids,
        userId
      })

      return res.status(200).json({
        updated_count: updatedCount
      })
    } catch (error: any) {
      if (error.message.includes('not found')) {
        return res.status(404).json({ error: error.message })
      }
      if (error.message.includes('Unauthorized')) {
        return res.status(403).json({ error: error.message })
      }
      next(error)
    }
  })

  // DELETE /api/messages/:id - Delete a message
  router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?.id
      const messageId = req.params.id

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      const deleteMessageUseCase = Container.getDeleteMessageUseCase()
      await deleteMessageUseCase.execute({
        messageId,
        userId
      })

      return res.status(204).send()
    } catch (error: any) {
      if (error.message.includes('not found')) {
        return res.status(404).json({ error: error.message })
      }
      if (error.message.includes('Unauthorized')) {
        return res.status(403).json({ error: error.message })
      }
      next(error)
    }
  })

  return router
}
```

### 3.5 Container Updates Required

**File:** `server/infrastructure/di/Container.ts`

Add to imports:
```typescript
// Use Cases - Messages
import { SendMessageUseCase } from '../../application/use-cases/messages/SendMessageUseCase'
import { GetConversationsUseCase } from '../../application/use-cases/messages/GetConversationsUseCase'
import { GetConversationMessagesUseCase } from '../../application/use-cases/messages/GetConversationMessagesUseCase'
import { MarkMessagesAsReadUseCase } from '../../application/use-cases/messages/MarkMessagesAsReadUseCase'
import { DeleteMessageUseCase } from '../../application/use-cases/messages/DeleteMessageUseCase'
import { GetUnreadCountUseCase } from '../../application/use-cases/messages/GetUnreadCountUseCase'

// Repositories
import { SupabaseMessageRepository } from '../adapters/repositories/SupabaseMessageRepository'
import { MessageRepository } from '../../application/ports/MessageRepository'
```

Add to class properties:
```typescript
// Repositories
private static messageRepository: MessageRepository

// Use Cases - Messages
private static sendMessageUseCase: SendMessageUseCase
private static getConversationsUseCase: GetConversationsUseCase
private static getConversationMessagesUseCase: GetConversationMessagesUseCase
private static markMessagesAsReadUseCase: MarkMessagesAsReadUseCase
private static deleteMessageUseCase: DeleteMessageUseCase
private static getUnreadCountUseCase: GetUnreadCountUseCase
```

Add to initialize() method:
```typescript
// Initialize message repository
this.messageRepository = new SupabaseMessageRepository(supabase)

// Initialize message use cases
this.sendMessageUseCase = new SendMessageUseCase(
  this.messageRepository
)

this.getConversationsUseCase = new GetConversationsUseCase(
  this.messageRepository
)

this.getConversationMessagesUseCase = new GetConversationMessagesUseCase(
  this.messageRepository
)

this.markMessagesAsReadUseCase = new MarkMessagesAsReadUseCase(
  this.messageRepository
)

this.deleteMessageUseCase = new DeleteMessageUseCase(
  this.messageRepository
)

this.getUnreadCountUseCase = new GetUnreadCountUseCase(
  this.messageRepository
)
```

Add getter methods:
```typescript
// Getters for use cases - Messages
static getSendMessageUseCase(): SendMessageUseCase {
  return this.sendMessageUseCase
}

static getGetConversationsUseCase(): GetConversationsUseCase {
  return this.getConversationsUseCase
}

static getGetConversationMessagesUseCase(): GetConversationMessagesUseCase {
  return this.getConversationMessagesUseCase
}

static getMarkMessagesAsReadUseCase(): MarkMessagesAsReadUseCase {
  return this.markMessagesAsReadUseCase
}

static getDeleteMessageUseCase(): DeleteMessageUseCase {
  return this.deleteMessageUseCase
}

static getGetUnreadCountUseCase(): GetUnreadCountUseCase {
  return this.getUnreadCountUseCase
}
```

### 3.6 Server Index Updates Required

**File:** `server/index.ts`

Add import:
```typescript
import { createMessagesRoutes } from './infrastructure/api/routes/messages.routes'
```

Add route registration (after opportunities):
```typescript
app.use('/api/messages', createMessagesRoutes())
```

---

## 4. Authentication Middleware Recommendation

### 4.1 Current Problem

Every route manually checks authentication:
```typescript
const userId = (req as any).user?.id
if (!userId) {
  return res.status(401).json({ error: 'Unauthorized' })
}
```

**Issues:**
- Type casting `(req as any)` is not type-safe
- Repeated code in every route handler
- Easy to forget the check
- User data not validated or typed

### 4.2 Recommended Solution

Create proper authentication middleware using Supabase JWT verification.

**File:** `server/infrastructure/api/middleware/auth.middleware.ts`

```typescript
// ABOUTME: Authentication middleware for verifying Supabase JWT tokens
// ABOUTME: Extracts user from JWT, validates, and attaches to request object

import { Request, Response, NextFunction } from 'express'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Extend Express Request type to include authenticated user
export interface AuthenticatedRequest extends Request {
  user: {
    id: string
    email: string
  }
}

/**
 * Authentication Middleware
 *
 * Verifies Supabase JWT token from Authorization header.
 * Extracts user info and attaches to request.
 */
export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Missing or invalid Authorization header' })
      return
    }

    const token = authHeader.substring(7) // Remove 'Bearer ' prefix

    // Create Supabase client for verification
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase configuration')
    }

    const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey)

    // Verify JWT token
    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error || !user) {
      res.status(401).json({ error: 'Invalid or expired token' })
      return
    }

    // Attach user to request
    (req as AuthenticatedRequest).user = {
      id: user.id,
      email: user.email!
    }

    next()
  } catch (error) {
    console.error('Authentication error:', error)
    res.status(401).json({ error: 'Authentication failed' })
  }
}

/**
 * Optional Authentication Middleware
 *
 * Same as requireAuth but allows requests without token.
 * Useful for endpoints that have different behavior for authenticated users.
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token, continue without user
      next()
      return
    }

    const token = authHeader.substring(7)

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      next()
      return
    }

    const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey)

    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (!error && user) {
      (req as AuthenticatedRequest).user = {
        id: user.id,
        email: user.email!
      }
    }

    next()
  } catch (error) {
    // Silently fail for optional auth
    next()
  }
}
```

### 4.3 Usage in Routes

**Before (current):**
```typescript
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id  // ❌ Manual check

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    // ... rest of handler
  } catch (error) {
    next(error)
  }
})
```

**After (with middleware):**
```typescript
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.middleware'

router.get('/', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as AuthenticatedRequest).user.id  // ✅ Type-safe

    // ... rest of handler (no manual check needed)
  } catch (error) {
    next(error)
  }
})
```

### 4.4 Apply to All Routes

**Option 1: Per-Route Basis**
```typescript
// Apply to specific routes that need auth
router.get('/my', requireAuth, handler)
router.post('/', requireAuth, handler)
```

**Option 2: Router-Level (Recommended)**
```typescript
export const createConnectionsRoutes = (): Router => {
  const router = Router()

  // Apply auth to ALL routes in this router
  router.use(requireAuth)

  // All handlers now have authenticated user
  router.get('/', async (req: Request, res: Response) => {
    const userId = (req as AuthenticatedRequest).user.id
    // ...
  })

  return router
}
```

**Option 3: App-Level for Specific Paths**
```typescript
// In server/index.ts
import { requireAuth } from './infrastructure/api/middleware/auth.middleware'

// Apply auth to specific API paths
app.use('/api/users', requireAuth, createUsersRoutes())
app.use('/api/connections', requireAuth, createConnectionsRoutes())
app.use('/api/opportunities', requireAuth, createOpportunitiesRoutes())
app.use('/api/messages', requireAuth, createMessagesRoutes())

// No auth required
app.use('/api/auth', createAuthRoutes())
app.use('/api/email', createEmailRoutes())
```

### 4.5 Benefits

1. **Type Safety:** `AuthenticatedRequest` provides proper typing
2. **DRY Principle:** Authentication logic in one place
3. **Testability:** Easy to mock middleware in tests
4. **Consistency:** All routes have same auth pattern
5. **Security:** Centralized token validation
6. **Flexibility:** `requireAuth` vs `optionalAuth` for different needs

---

## 5. Error Handling Standardization

### 5.1 Current State

Error handling is inconsistent across routes:

**connections.routes.ts:**
```typescript
} catch (error: any) {
  if (error.message.includes('already exists')) {
    return res.status(409).json({ error: error.message })
  }
  if (error.message.includes('yourself')) {
    return res.status(400).json({ error: error.message })
  }
  next(error)
}
```

**opportunities.routes.ts:**
```typescript
} catch (error: any) {
  if (error.message.includes('must be at least')) {
    return res.status(400).json({ error: error.message })
  }
  next(error)
}
```

**Issues:**
- Fragile string matching on error messages
- Inconsistent error response format
- Domain errors leak to HTTP layer
- No structured error types

### 5.2 Recommended Solution: Result Pattern

Implement Result pattern in use cases to avoid throwing exceptions for business rule violations.

**Create:** `server/application/common/Result.ts`

```typescript
// ABOUTME: Result pattern for handling success/failure without exceptions
// ABOUTME: Improves type safety and explicit error handling in use cases

export class Result<T, E = Error> {
  private constructor(
    private readonly success: boolean,
    private readonly value?: T,
    private readonly error?: E
  ) {}

  static ok<T, E = Error>(value: T): Result<T, E> {
    return new Result<T, E>(true, value)
  }

  static fail<T, E = Error>(error: E): Result<T, E> {
    return new Result<T, E>(false, undefined, error)
  }

  isSuccess(): boolean {
    return this.success
  }

  isFailure(): boolean {
    return !this.success
  }

  getValue(): T {
    if (!this.success) {
      throw new Error('Cannot get value from failed result')
    }
    return this.value!
  }

  getError(): E {
    if (this.success) {
      throw new Error('Cannot get error from successful result')
    }
    return this.error!
  }

  map<U>(fn: (value: T) => U): Result<U, E> {
    if (this.isFailure()) {
      return Result.fail(this.error!)
    }
    return Result.ok(fn(this.value!))
  }

  mapError<F>(fn: (error: E) => F): Result<T, F> {
    if (this.isSuccess()) {
      return Result.ok(this.value!)
    }
    return Result.fail(fn(this.error!))
  }
}
```

**Create:** `server/application/common/DomainError.ts`

```typescript
// ABOUTME: Domain-specific error types for business rule violations
// ABOUTME: Provides structured errors with HTTP status code mapping

export enum ErrorCode {
  // Validation errors (400)
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',

  // Authorization errors (401, 403)
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',

  // Not found errors (404)
  NOT_FOUND = 'NOT_FOUND',

  // Conflict errors (409)
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  CONFLICT = 'CONFLICT',

  // Business rule errors (422)
  BUSINESS_RULE_VIOLATION = 'BUSINESS_RULE_VIOLATION',

  // Internal errors (500)
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR'
}

export class DomainError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    public readonly statusCode: number = 500,
    public readonly details?: any
  ) {
    super(message)
    Object.setPrototypeOf(this, DomainError.prototype)
  }

  static validationError(message: string, details?: any): DomainError {
    return new DomainError(ErrorCode.VALIDATION_ERROR, message, 400, details)
  }

  static unauthorized(message: string = 'Unauthorized'): DomainError {
    return new DomainError(ErrorCode.UNAUTHORIZED, message, 401)
  }

  static forbidden(message: string = 'Forbidden'): DomainError {
    return new DomainError(ErrorCode.FORBIDDEN, message, 403)
  }

  static notFound(resource: string, id?: string): DomainError {
    const message = id ? `${resource} with id '${id}' not found` : `${resource} not found`
    return new DomainError(ErrorCode.NOT_FOUND, message, 404)
  }

  static conflict(message: string, details?: any): DomainError {
    return new DomainError(ErrorCode.CONFLICT, message, 409, details)
  }

  static businessRuleViolation(message: string): DomainError {
    return new DomainError(ErrorCode.BUSINESS_RULE_VIOLATION, message, 422)
  }

  toJSON() {
    return {
      code: this.code,
      message: this.message,
      ...(this.details && { details: this.details })
    }
  }
}
```

### 5.3 Update Use Cases to Return Result

**Before:**
```typescript
export class RequestConnectionUseCase {
  async execute(dto: RequestConnectionDTO): Promise<Connection> {
    // Throws on error
    const connection = Connection.createRequest(...)
    return await this.connectionRepository.create(connection)
  }
}
```

**After:**
```typescript
export class RequestConnectionUseCase {
  async execute(dto: RequestConnectionDTO): Promise<Result<Connection, DomainError>> {
    try {
      // Check if connection already exists
      const existing = await this.connectionRepository.findBetweenUsers(
        dto.requesterId,
        dto.addresseeId
      )

      if (existing) {
        return Result.fail(
          DomainError.conflict('Connection already exists')
        )
      }

      // Domain validation happens here
      const connection = Connection.createRequest(
        uuidv4(),
        dto.requesterId,
        dto.addresseeId
      )

      const created = await this.connectionRepository.create(connection)
      return Result.ok(created)
    } catch (error: any) {
      // Domain validation errors
      if (error.message.includes('yourself')) {
        return Result.fail(DomainError.validationError(error.message))
      }

      // Unexpected errors
      return Result.fail(
        new DomainError(ErrorCode.INTERNAL_ERROR, 'Failed to create connection', 500, error)
      )
    }
  }
}
```

### 5.4 Update Route Handlers

**Before:**
```typescript
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const connection = await requestConnectionUseCase.execute(...)
    return res.status(201).json({ connection })
  } catch (error: any) {
    if (error.message.includes('already exists')) {
      return res.status(409).json({ error: error.message })
    }
    next(error)
  }
})
```

**After:**
```typescript
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await requestConnectionUseCase.execute(...)

    if (result.isFailure()) {
      const error = result.getError()
      return res.status(error.statusCode).json(error.toJSON())
    }

    const connection = result.getValue()
    return res.status(201).json({ connection })
  } catch (error) {
    next(error)
  }
})
```

### 5.5 Update Error Handler Middleware

**File:** `server/infrastructure/api/middleware/errorHandler.ts`

```typescript
import { DomainError } from '../../../application/common/DomainError'

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  // Handle DomainError
  if (err instanceof DomainError) {
    serverLogger.error('DOMAIN_ERROR', err.message, {
      path: req.path,
      method: req.method,
      code: err.code,
      statusCode: err.statusCode
    })

    return res.status(err.statusCode).json(err.toJSON())
  }

  // Handle generic errors
  const statusCode = (err as any).statusCode || 500
  const message = err.message || 'Internal Server Error'

  serverLogger.error('ERROR_HANDLER', message, {
    path: req.path,
    method: req.method,
    statusCode,
    stack: err.stack
  })

  const response = {
    code: 'INTERNAL_ERROR',
    message,
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack
    })
  }

  res.status(statusCode).json(response)
}
```

### 5.6 Benefits

1. **Type Safety:** Result type makes error handling explicit
2. **Consistency:** All errors structured the same way
3. **HTTP Mapping:** Automatic status code from error type
4. **Testability:** Easy to test error cases
5. **Documentation:** Error codes self-document API

---

## 6. Architectural Improvements

### 6.1 Request/Response DTOs

**Current Issue:** Routes directly map domain entities to JSON, mixing concerns.

**Recommendation:** Create separate DTOs for HTTP layer.

**File:** `server/infrastructure/api/dto/ConnectionDTO.ts`

```typescript
// ABOUTME: HTTP Data Transfer Objects for connection endpoints
// ABOUTME: Separates API contract from domain model

import { Connection } from '../../../domain/entities/Connection'

export interface ConnectionResponseDTO {
  id: string
  requester_id: string
  addressee_id: string
  status: string
  created_at: string
  updated_at: string
}

export interface ConnectionWithUserResponseDTO extends ConnectionResponseDTO {
  user: {
    id: string
    name: string
    avatar_url: string | null
  }
}

export class ConnectionMapper {
  static toResponseDTO(connection: Connection): ConnectionResponseDTO {
    return {
      id: connection.id,
      requester_id: connection.requesterId,
      addressee_id: connection.addresseeId,
      status: connection.status,
      created_at: connection.createdAt.toISOString(),
      updated_at: connection.updatedAt.toISOString()
    }
  }
}
```

**Usage:**
```typescript
router.post('/', async (req, res) => {
  const result = await useCase.execute(...)
  if (result.isFailure()) { /* ... */ }

  const connection = result.getValue()
  return res.status(201).json({
    connection: ConnectionMapper.toResponseDTO(connection)
  })
})
```

### 6.2 Request Validation Middleware

**File:** `server/infrastructure/api/middleware/validation.middleware.ts`

```typescript
// ABOUTME: Request validation middleware using Zod schemas
// ABOUTME: Validates request body, params, and query before reaching handlers

import { Request, Response, NextFunction } from 'express'
import { z, ZodSchema } from 'zod'

export const validateBody = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body)
      next()
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          code: 'VALIDATION_ERROR',
          message: 'Request validation failed',
          errors: error.errors
        })
      }
      next(error)
    }
  }
}

export const validateParams = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.params)
      next()
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          code: 'VALIDATION_ERROR',
          message: 'Path parameter validation failed',
          errors: error.errors
        })
      }
      next(error)
    }
  }
}

export const validateQuery = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.query)
      next()
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          code: 'VALIDATION_ERROR',
          message: 'Query parameter validation failed',
          errors: error.errors
        })
      }
      next(error)
    }
  }
}
```

**Install Zod:**
```bash
npm install zod
```

**Define Schemas:**
```typescript
// server/infrastructure/api/schemas/message.schemas.ts
import { z } from 'zod'

export const SendMessageSchema = z.object({
  recipient_id: z.string().uuid('Invalid recipient ID'),
  content: z.string()
    .min(1, 'Content cannot be empty')
    .max(5000, 'Content cannot exceed 5000 characters')
})

export const MarkMessagesAsReadSchema = z.object({
  message_ids: z.array(z.string().uuid()).min(1, 'At least one message ID required')
})
```

**Usage:**
```typescript
import { validateBody } from '../middleware/validation.middleware'
import { SendMessageSchema } from '../schemas/message.schemas'

router.post('/',
  requireAuth,
  validateBody(SendMessageSchema),
  async (req, res) => {
    // req.body is now validated and typed
  }
)
```

### 6.3 Logging Improvements

**File:** `server/infrastructure/api/middleware/request-logger.middleware.ts`

```typescript
// ABOUTME: Request logging middleware with correlation IDs
// ABOUTME: Logs all requests with timing and error tracking

import { Request, Response, NextFunction } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { serverLogger } from '../../../logger.js'

export interface RequestWithId extends Request {
  requestId: string
}

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const requestId = uuidv4()
  ;(req as RequestWithId).requestId = requestId

  const startTime = Date.now()

  // Log request
  serverLogger.info('HTTP_REQUEST', `${req.method} ${req.path}`, {
    requestId,
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('user-agent')
  })

  // Log response
  res.on('finish', () => {
    const duration = Date.now() - startTime
    const level = res.statusCode >= 400 ? 'error' : 'info'

    serverLogger[level]('HTTP_RESPONSE', `${req.method} ${req.path} ${res.statusCode}`, {
      requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`
    })
  })

  next()
}
```

### 6.4 Rate Limiting

**File:** `server/infrastructure/api/middleware/rate-limit.middleware.ts`

```typescript
// ABOUTME: Rate limiting middleware to prevent abuse
// ABOUTME: Configurable limits per endpoint or global

import rateLimit from 'express-rate-limit'

export const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    code: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many requests, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false
})

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 login attempts per 15 minutes
  message: {
    code: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many authentication attempts, please try again later'
  }
})

export const messageRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 messages per minute
  message: {
    code: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many messages sent, please slow down'
  }
})
```

**Install:**
```bash
npm install express-rate-limit
```

**Usage:**
```typescript
// Global rate limit
app.use(globalRateLimiter)

// Endpoint-specific
app.use('/api/auth', authRateLimiter, createAuthRoutes())
app.use('/api/messages', messageRateLimiter, createMessagesRoutes())
```

### 6.5 Health Check Improvements

**File:** `server/infrastructure/api/routes/health.routes.ts`

```typescript
// ABOUTME: Health check endpoints for monitoring and orchestration
// ABOUTME: Provides detailed health status of all dependencies

import { Router } from 'express'
import { Container } from '../../di/Container'

export const createHealthRoutes = (): Router => {
  const router = Router()

  // Simple health check (for load balancers)
  router.get('/', (req, res) => {
    res.status(200).json({ status: 'OK' })
  })

  // Detailed health check
  router.get('/detailed', async (req, res) => {
    const checks: any = {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      architecture: 'hexagonal',
      status: 'healthy',
      checks: {}
    }

    // Check database
    try {
      const userRepo = Container.getUserRepository()
      // Simple query to check DB connection
      checks.checks.database = { status: 'healthy' }
    } catch (error) {
      checks.checks.database = { status: 'unhealthy', error: (error as Error).message }
      checks.status = 'unhealthy'
    }

    // Check email service
    try {
      const emailService = Container.getEmailService()
      checks.checks.email = { status: 'configured' }
    } catch (error) {
      checks.checks.email = { status: 'not_configured' }
    }

    const statusCode = checks.status === 'healthy' ? 200 : 503
    res.status(statusCode).json(checks)
  })

  return router
}
```

---

## 7. Testing Strategy

### 7.1 Test Pyramid

```
       /\
      /  \     E2E Tests (5%)
     /----\
    /      \   Integration Tests (15%)
   /--------\
  /          \ Unit Tests (80%)
 /____________\
```

### 7.2 Unit Tests (Domain & Use Cases)

**Domain entities should be 100% covered** - they contain business logic.

**File:** `server/domain/entities/__tests__/Connection.test.ts`

```typescript
import { describe, it, expect } from 'vitest'
import { Connection } from '../Connection'

describe('Connection Entity', () => {
  describe('createRequest', () => {
    it('should create a pending connection', () => {
      const connection = Connection.createRequest('1', 'user1', 'user2')

      expect(connection.status).toBe('pending')
      expect(connection.requesterId).toBe('user1')
      expect(connection.addresseeId).toBe('user2')
    })

    it('should throw if requester and addressee are same', () => {
      expect(() => {
        Connection.createRequest('1', 'user1', 'user1')
      }).toThrow('Cannot create connection with yourself')
    })
  })

  describe('accept', () => {
    it('should change status to accepted', () => {
      const connection = Connection.createRequest('1', 'user1', 'user2')
      connection.accept()

      expect(connection.status).toBe('accepted')
    })

    it('should throw if connection is not pending', () => {
      const connection = Connection.createRequest('1', 'user1', 'user2')
      connection.accept()

      expect(() => connection.accept()).toThrow(
        "Cannot accept connection with status 'accepted'"
      )
    })
  })

  describe('reject', () => {
    it('should change status to rejected', () => {
      const connection = Connection.createRequest('1', 'user1', 'user2')
      connection.reject()

      expect(connection.status).toBe('rejected')
    })
  })

  describe('block', () => {
    it('should change status to blocked from any state', () => {
      const connection = Connection.createRequest('1', 'user1', 'user2')
      connection.block()

      expect(connection.status).toBe('blocked')
    })
  })

  describe('business rules', () => {
    it('should correctly identify requester', () => {
      const connection = Connection.createRequest('1', 'user1', 'user2')

      expect(connection.isRequester('user1')).toBe(true)
      expect(connection.isRequester('user2')).toBe(false)
    })

    it('should get other user correctly', () => {
      const connection = Connection.createRequest('1', 'user1', 'user2')

      expect(connection.getOtherUser('user1')).toBe('user2')
      expect(connection.getOtherUser('user2')).toBe('user1')
      expect(connection.getOtherUser('user3')).toBeNull()
    })
  })
})
```

**Use case tests with mocks:**

**File:** `server/application/use-cases/network/__tests__/RequestConnectionUseCase.test.ts`

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { RequestConnectionUseCase } from '../RequestConnectionUseCase'
import { ConnectionRepository } from '../../../ports/ConnectionRepository'
import { Connection } from '../../../../domain/entities/Connection'

describe('RequestConnectionUseCase', () => {
  let useCase: RequestConnectionUseCase
  let mockRepository: ConnectionRepository

  beforeEach(() => {
    mockRepository = {
      findById: vi.fn(),
      findBetweenUsers: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findByUser: vi.fn(),
      exists: vi.fn()
    }

    useCase = new RequestConnectionUseCase(mockRepository)
  })

  it('should create a connection request', async () => {
    const mockConnection = Connection.createRequest('1', 'user1', 'user2')

    vi.mocked(mockRepository.findBetweenUsers).mockResolvedValue(null)
    vi.mocked(mockRepository.create).mockResolvedValue(mockConnection)

    const result = await useCase.execute({
      requesterId: 'user1',
      addresseeId: 'user2'
    })

    expect(result.isSuccess()).toBe(true)
    expect(result.getValue().requesterId).toBe('user1')
    expect(mockRepository.create).toHaveBeenCalled()
  })

  it('should fail if connection already exists', async () => {
    const existingConnection = Connection.createRequest('1', 'user1', 'user2')

    vi.mocked(mockRepository.findBetweenUsers).mockResolvedValue(existingConnection)

    const result = await useCase.execute({
      requesterId: 'user1',
      addresseeId: 'user2'
    })

    expect(result.isFailure()).toBe(true)
    expect(result.getError().code).toBe('ALREADY_EXISTS')
    expect(mockRepository.create).not.toHaveBeenCalled()
  })
})
```

### 7.3 Integration Tests (Repository Layer)

Test repositories with real Supabase test instance.

**File:** `server/infrastructure/adapters/repositories/__tests__/SupabaseConnectionRepository.test.ts`

```typescript
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { SupabaseConnectionRepository } from '../SupabaseConnectionRepository'
import { Connection } from '../../../../domain/entities/Connection'

describe('SupabaseConnectionRepository (Integration)', () => {
  let supabase: SupabaseClient
  let repository: SupabaseConnectionRepository
  let testUserId1: string
  let testUserId2: string

  beforeAll(async () => {
    // Use test Supabase instance
    supabase = createClient(
      process.env.SUPABASE_TEST_URL!,
      process.env.SUPABASE_TEST_KEY!
    )
    repository = new SupabaseConnectionRepository(supabase)

    // Create test users
    // ... setup code
  })

  afterAll(async () => {
    // Clean up test data
  })

  beforeEach(async () => {
    // Clear connections table
    await supabase.from('connections').delete().neq('id', '')
  })

  it('should create and retrieve a connection', async () => {
    const connection = Connection.createRequest('id1', testUserId1, testUserId2)

    const created = await repository.create(connection)
    expect(created.id).toBeDefined()
    expect(created.status).toBe('pending')

    const retrieved = await repository.findById(created.id)
    expect(retrieved).not.toBeNull()
    expect(retrieved!.requesterId).toBe(testUserId1)
  })

  it('should find connections between users', async () => {
    const connection = Connection.createRequest('id1', testUserId1, testUserId2)
    await repository.create(connection)

    const found = await repository.findBetweenUsers(testUserId1, testUserId2)
    expect(found).not.toBeNull()
    expect(found!.addresseeId).toBe(testUserId2)
  })
})
```

### 7.4 E2E Tests (API Endpoints)

Test full HTTP flow with supertest.

**File:** `server/infrastructure/api/__tests__/connections.e2e.test.ts`

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import app from '../../../index'

describe('Connections API (E2E)', () => {
  let authToken: string
  let userId: string

  beforeAll(async () => {
    // Create test user and get auth token
    const response = await request(app)
      .post('/api/auth/signup')
      .send({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      })

    authToken = response.body.session.access_token
    userId = response.body.user.id
  })

  afterAll(async () => {
    // Clean up test data
  })

  it('should create a connection request', async () => {
    const response = await request(app)
      .post('/api/connections')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        addressee_id: 'other-user-id'
      })

    expect(response.status).toBe(201)
    expect(response.body.connection.status).toBe('pending')
  })

  it('should return 401 without auth token', async () => {
    const response = await request(app)
      .post('/api/connections')
      .send({
        addressee_id: 'other-user-id'
      })

    expect(response.status).toBe(401)
  })
})
```

### 7.5 Test Infrastructure

**Install dependencies:**
```bash
npm install -D vitest @vitest/ui supertest @types/supertest
```

**Create:** `vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./server/__tests__/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'server/__tests__/',
        '**/*.test.ts',
        'dist/'
      ]
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './server')
    }
  }
})
```

**Create:** `server/__tests__/setup.ts`

```typescript
import { beforeAll, afterAll } from 'vitest'
import dotenv from 'dotenv'

beforeAll(() => {
  // Load test environment variables
  dotenv.config({ path: '.env.test' })
})

afterAll(() => {
  // Global cleanup
})
```

**Add to package.json:**
```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:unit": "vitest run server/domain server/application",
    "test:integration": "vitest run server/infrastructure/adapters",
    "test:e2e": "vitest run server/infrastructure/api"
  }
}
```

### 7.6 Test Coverage Goals

| Layer | Coverage Goal | Priority |
|-------|---------------|----------|
| Domain Entities | 100% | CRITICAL |
| Value Objects | 100% | CRITICAL |
| Use Cases | 95%+ | HIGH |
| Repositories | 80%+ | HIGH |
| Routes | 80%+ | MEDIUM |
| Middleware | 80%+ | MEDIUM |

---

## 8. Deployment Considerations

### 8.1 Environment Variables

**Required for production:**
```bash
# Supabase
VITE_SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...  # Server-side only
VITE_SUPABASE_ANON_KEY=eyJxxx...     # Public key

# Email
RESEND_API_KEY=re_xxx...

# Server
PORT=3001
NODE_ENV=production

# Security
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Logging
LOG_LEVEL=info  # debug, info, warn, error
```

### 8.2 Database Migration Strategy

**Migrations should be versioned and applied in order:**

1. `001_create_connections_table.sql` ✅
2. `002_update_opportunities_table.sql` ✅
3. `003_update_messages_table.sql` ❌ PENDING

**Migration process:**
```bash
# Development
npm run migrate:dev

# Production (via Supabase dashboard or CLI)
supabase db push
```

**Important:** Always backup production database before migrations.

### 8.3 Deployment Checklist

**Pre-deployment:**
- [ ] All migrations applied to production database
- [ ] Environment variables configured
- [ ] Tests passing (100% unit, 80%+ integration)
- [ ] Security audit completed
- [ ] Rate limiting configured
- [ ] Logging configured
- [ ] Error tracking setup (e.g., Sentry)

**Deployment:**
- [ ] Backend deployed to Railway/Render/AWS
- [ ] Health check endpoint responding
- [ ] Database connections working
- [ ] Email service configured
- [ ] CORS configured for production domain
- [ ] SSL/TLS enabled

**Post-deployment:**
- [ ] Monitor error logs
- [ ] Check health endpoint
- [ ] Verify all API routes responding
- [ ] Test authentication flow
- [ ] Monitor database query performance
- [ ] Check rate limiting working

### 8.4 Monitoring & Observability

**Recommended tools:**
- **Logging:** Winston or Pino (structured JSON logs)
- **Error Tracking:** Sentry
- **APM:** New Relic or DataDog
- **Uptime Monitoring:** UptimeRobot or Pingdom
- **Database Monitoring:** Supabase dashboard

**Key metrics to track:**
- Response time (p50, p95, p99)
- Error rate (by endpoint)
- Request rate
- Database query time
- Active connections
- Memory usage
- CPU usage

### 8.5 Security Considerations

**OWASP Top 10 Coverage:**

1. **Injection:** ✅ Parameterized queries via Supabase
2. **Broken Authentication:** ⚠️ Implement auth middleware
3. **Sensitive Data Exposure:** ✅ JWT tokens, no passwords stored
4. **XML External Entities:** N/A (JSON API)
5. **Broken Access Control:** ⚠️ RLS policies, verify completeness
6. **Security Misconfiguration:** ⚠️ Review CORS, headers
7. **XSS:** ✅ No HTML rendering on backend
8. **Insecure Deserialization:** ⚠️ Add input validation
9. **Using Components with Known Vulnerabilities:** ⚠️ Run `npm audit`
10. **Insufficient Logging:** ⚠️ Add request logging

**Additional security measures:**
- [ ] Implement helmet.js for security headers
- [ ] Add CSRF protection for state-changing operations
- [ ] Implement request validation with Zod
- [ ] Add rate limiting per user (not just IP)
- [ ] Implement API key rotation
- [ ] Add audit logging for sensitive operations
- [ ] Implement IP whitelisting for admin endpoints

**Install helmet:**
```bash
npm install helmet
```

**Usage:**
```typescript
import helmet from 'helmet'

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true
  }
}))
```

### 8.6 Scalability Considerations

**Current architecture scales well because:**
- Stateless backend (no in-memory sessions)
- Database handles concurrency (Supabase/Postgres)
- Repository pattern makes horizontal scaling easy

**Future optimizations:**
- [ ] Add Redis for caching (user profiles, connection counts)
- [ ] Implement database read replicas for heavy queries
- [ ] Add CDN for static assets
- [ ] Implement message queue for async operations (email sending)
- [ ] Add database connection pooling
- [ ] Implement pagination on all list endpoints
- [ ] Add GraphQL layer for complex queries (optional)

---

## Summary & Action Items

### Critical Path to Production

#### 1. IMMEDIATE (Before implementing messages routes)
- [ ] Create database migration `003_update_messages_table.sql`
- [ ] Apply migration to development Supabase
- [ ] Verify schema matches code expectations

#### 2. HIGH PRIORITY (Next implementation phase)
- [ ] Implement `messages.routes.ts` (use template from section 3.4)
- [ ] Update DI Container with message use cases (section 3.5)
- [ ] Register messages routes in server index (section 3.6)
- [ ] Implement authentication middleware (section 4.2)
- [ ] Apply auth middleware to all protected routes

#### 3. MEDIUM PRIORITY (Before production)
- [ ] Implement Result pattern in use cases (section 5.2)
- [ ] Create DomainError class (section 5.2)
- [ ] Update error handler middleware (section 5.5)
- [ ] Add request validation middleware (section 6.2)
- [ ] Implement request DTOs (section 6.1)
- [ ] Add rate limiting (section 6.4)
- [ ] Implement comprehensive logging (section 6.3)

#### 4. TESTING (Parallel to development)
- [ ] Write unit tests for all domain entities (target: 100%)
- [ ] Write unit tests for all use cases (target: 95%)
- [ ] Write integration tests for repositories (target: 80%)
- [ ] Write E2E tests for critical flows (target: 80%)
- [ ] Achieve overall coverage >85%

#### 5. PRE-PRODUCTION
- [ ] Security audit (OWASP Top 10)
- [ ] Performance testing (load test critical endpoints)
- [ ] Documentation (API docs, deployment guide)
- [ ] Deployment runbook
- [ ] Monitoring setup

### Final Architecture Grade

**Current State: 8/10**

With recommended improvements:
- ✅ Database schema fixes
- ✅ Messages routes implementation
- ✅ Auth middleware
- ✅ Error handling standardization
- ✅ Request validation
- ✅ Comprehensive tests

**Expected State: 9.5/10** (Production-ready enterprise-grade backend)

---

## Appendix: File Structure Reference

```
server/
├── domain/
│   ├── entities/
│   │   ├── User.ts ✅
│   │   ├── Connection.ts ✅
│   │   ├── Opportunity.ts ✅
│   │   ├── Message.ts ✅
│   │   └── __tests__/
│   │       ├── User.test.ts ❌
│   │       ├── Connection.test.ts ❌
│   │       ├── Opportunity.test.ts ❌
│   │       └── Message.test.ts ❌
│   └── value-objects/
│       ├── Email.ts ✅
│       ├── UserId.ts ✅
│       ├── CompletionPercentage.ts ✅
│       └── __tests__/
│           ├── Email.test.ts ❌
│           ├── UserId.test.ts ❌
│           └── CompletionPercentage.test.ts ❌
├── application/
│   ├── common/
│   │   ├── Result.ts ❌ RECOMMENDED
│   │   └── DomainError.ts ❌ RECOMMENDED
│   ├── ports/
│   │   ├── repositories/
│   │   │   └── IUserRepository.ts ✅
│   │   ├── services/
│   │   │   ├── IAuthService.ts ✅
│   │   │   └── IEmailService.ts ✅
│   │   ├── ConnectionRepository.ts ✅
│   │   ├── OpportunityRepository.ts ✅
│   │   └── MessageRepository.ts ✅
│   └── use-cases/
│       ├── auth/ (2 use cases) ✅
│       ├── users/ (3 use cases) ✅
│       ├── network/ (7 use cases) ✅
│       ├── opportunities/ (6 use cases) ✅
│       └── messages/ (6 use cases) ✅
├── infrastructure/
│   ├── adapters/
│   │   ├── repositories/
│   │   │   ├── SupabaseUserRepository.ts ✅
│   │   │   ├── SupabaseConnectionRepository.ts ✅
│   │   │   ├── SupabaseOpportunityRepository.ts ✅
│   │   │   ├── SupabaseMessageRepository.ts ✅
│   │   │   └── __tests__/
│   │   │       ├── SupabaseUserRepository.test.ts ❌
│   │   │       ├── SupabaseConnectionRepository.test.ts ❌
│   │   │       ├── SupabaseOpportunityRepository.test.ts ❌
│   │   │       └── SupabaseMessageRepository.test.ts ❌
│   │   └── services/
│   │       ├── SupabaseAuthService.ts ✅
│   │       └── ResendEmailService.ts ✅
│   ├── api/
│   │   ├── routes/
│   │   │   ├── auth.routes.ts ✅
│   │   │   ├── users.routes.ts ✅
│   │   │   ├── email.routes.ts ✅
│   │   │   ├── connections.routes.ts ✅
│   │   │   ├── opportunities.routes.ts ✅
│   │   │   ├── messages.routes.ts ❌ CRITICAL
│   │   │   ├── health.routes.ts ❌ RECOMMENDED
│   │   │   └── __tests__/
│   │   │       ├── auth.e2e.test.ts ❌
│   │   │       ├── connections.e2e.test.ts ❌
│   │   │       ├── opportunities.e2e.test.ts ❌
│   │   │       └── messages.e2e.test.ts ❌
│   │   ├── middleware/
│   │   │   ├── errorHandler.ts ✅ (needs update)
│   │   │   ├── logger.middleware.ts ✅
│   │   │   ├── auth.middleware.ts ❌ CRITICAL
│   │   │   ├── validation.middleware.ts ❌ RECOMMENDED
│   │   │   ├── rate-limit.middleware.ts ❌ RECOMMENDED
│   │   │   └── request-logger.middleware.ts ❌ RECOMMENDED
│   │   ├── dto/
│   │   │   ├── ConnectionDTO.ts ❌ RECOMMENDED
│   │   │   ├── OpportunityDTO.ts ❌ RECOMMENDED
│   │   │   └── MessageDTO.ts ❌ RECOMMENDED
│   │   └── schemas/
│   │       ├── connection.schemas.ts ❌ RECOMMENDED
│   │       ├── opportunity.schemas.ts ❌ RECOMMENDED
│   │       └── message.schemas.ts ❌ RECOMMENDED
│   └── di/
│       └── Container.ts ✅ (needs update for messages)
├── index.ts ✅ (needs update for messages routes)
└── logger.ts ✅

migrations/
├── 001_create_connections_table.sql ✅
├── 002_update_opportunities_table.sql ✅
└── 003_update_messages_table.sql ❌ CRITICAL

__tests__/
└── setup.ts ❌

Root Files:
├── vitest.config.ts ❌
├── .env.test ❌
└── package.json ✅ (needs test scripts)
```

**Legend:**
- ✅ Exists and correct
- ✅ (needs update) Exists but needs modifications
- ❌ Missing
- ❌ CRITICAL: Must be implemented before production
- ❌ RECOMMENDED: Should be implemented for production quality

---

**Document Version:** 1.0
**Last Updated:** 2025-10-21
**Author:** hexagonal-backend-architect agent
**Project:** España Creativa Red - Backend Architecture Review
