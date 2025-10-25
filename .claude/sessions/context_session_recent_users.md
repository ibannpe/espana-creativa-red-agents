# Context Session: Recent Users Endpoint

## Feature Name
recent_users

## Objective
Crear endpoint `GET /api/users/recent` que retorne los usuarios más recientes registrados en el sistema con capacidad de filtrado por días.

## Business Requirements

### Decisiones de Iban
- Mostrar **5 usuarios** más recientes (ordenados por `created_at DESC`)
- Filtrar usuarios con `created_at >= NOW() - INTERVAL 'N days'`
- Endpoint debe aceptar parámetro `days` (default: 30 días)
- Endpoint debe aceptar parámetro `limit` (default: 5 usuarios)

### Use Case
Permitir a la plataforma mostrar los miembros más recientes de la red España Creativa, útil para:
- Dashboard de bienvenida
- Sección "Nuevos miembros"
- Analytics de crecimiento de la red

## Technical Context

### Current Architecture
- **Backend Framework**: Express + TypeScript
- **Architecture Pattern**: Hexagonal (Ports & Adapters)
- **Database**: Supabase (PostgreSQL)
- **DI Container**: Singleton pattern en `server/infrastructure/di/Container.ts`

### Existing Structure
```
server/
├── domain/
│   ├── entities/User.ts
│   └── value-objects/
├── application/
│   ├── use-cases/users/
│   └── ports/repositories/IUserRepository.ts
├── infrastructure/
│   ├── adapters/repositories/SupabaseUserRepository.ts
│   ├── api/routes/users.routes.ts
│   └── di/Container.ts
```

### Current Users Routes
- `GET /api/users/:id` - Get user profile by ID
- `PUT /api/users/:id` - Update user profile
- `GET /api/users/search` - Search users with filters
- `GET /api/users` - Get all users

## Implementation Scope

### Files to Create
1. `server/application/use-cases/users/GetRecentUsersUseCase.ts`

### Files to Modify
1. `server/application/ports/repositories/IUserRepository.ts` - Add `findRecentUsers()` method
2. `server/infrastructure/adapters/repositories/SupabaseUserRepository.ts` - Implement `findRecentUsers()`
3. `server/infrastructure/api/routes/users.routes.ts` - Add `GET /recent` route
4. `server/infrastructure/di/Container.ts` - Register new use case

## API Specification

### Endpoint
```
GET /api/users/recent?days=30&limit=5
```

### Query Parameters
- `days` (optional, default: 30): Number of days to look back
- `limit` (optional, default: 5): Maximum number of users to return

### Response Format
```json
{
  "users": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "avatar_url": "https://...",
      "bio": "...",
      "location": "Madrid",
      "linkedin_url": "...",
      "website_url": "...",
      "skills": ["React", "TypeScript"],
      "interests": ["Web Development"],
      "completed_pct": 85,
      "created_at": "2025-10-20T10:00:00Z",
      "updated_at": "2025-10-22T15:30:00Z"
    }
  ],
  "count": 5,
  "days_filter": 30
}
```

### Error Responses
- `400 Bad Request`: Invalid query parameters
- `500 Internal Server Error`: Database or server error

## Database Considerations

### Table: `users`
- Primary filter field: `created_at` (timestamp with timezone)
- Sort order: `created_at DESC`
- Join required: `user_roles` for role information

### Query Performance
- Index on `created_at` column (verify if exists)
- Small result set (max 5 records) - performance should be excellent

## Dependencies
- No new npm packages required
- Uses existing Supabase client
- Uses existing domain entities and value objects

## Testing Strategy
Will be defined by backend-test-architect agent.

## Notes
- This endpoint will NOT require authentication (public data for network growth visibility)
- Timezone consideration: Supabase stores timestamps in UTC, filtering will use database NOW()
- No caching strategy initially - can be added later if needed
- Route registration order matters: `/recent` must come BEFORE `/:id` to avoid conflict

## Session Status
- **Created**: 2025-10-25
- **Status**: Planning phase
- **Agent**: hexagonal-backend-architect
