# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**España Creativa Red** is a SaaS networking platform connecting entrepreneurs and mentors from the España Creativa association. Built with Vite + React (not Next.js despite README references), TypeScript, Supabase, and shadcn/ui.

## Development Commands

### Running the Application

```bash
# Frontend development server (Vite on port 8080)
yarn dev

# Backend API server (Express on port 3001)
yarn dev:server

# Run both frontend and backend concurrently
yarn dev:full
```

### Build & Deployment

```bash
# Production build
yarn build

# Development build (with source maps)
yarn build:dev

# Preview production build
yarn preview
```

### Code Quality

```bash
# Run ESLint
yarn lint
```

### Database Management

```bash
# Clean all test data from database
yarn clean-db

# Clean development environment (removes all user data)
yarn clean-dev
```

## Architecture Overview

### Tech Stack Reality Check

**IMPORTANT**: Despite what the README says, this project uses:
- **Vite + React** (NOT Next.js) - Frontend bundler and framework
- **React Router** - Client-side routing
- **Express** - Backend API server (separate from frontend)
- **Supabase** - Database, authentication, and storage
- **Zustand** - Global state management
- **shadcn/ui** - UI component library built on Radix UI

### Frontend-Backend Split Architecture

This is a **dual-server architecture**:

1. **Frontend (Vite)**: Runs on port 8080, serves React SPA
2. **Backend (Express)**: Runs on port 3001, handles email API routes

Communication happens via proxy configuration in [vite.config.ts](vite.config.ts):
```typescript
proxy: {
  '/api': {
    target: 'http://localhost:3001',
    changeOrigin: true,
  }
}
```

### Project Structure

```
├── src/                         # Frontend React application
│   ├── components/             # React components
│   │   ├── auth/              # Authentication (login/register/protected routes)
│   │   ├── dashboard/         # Dashboard page component
│   │   ├── layout/            # Navigation and layout components
│   │   ├── network/           # User search and discovery
│   │   ├── pages/             # Page-level components
│   │   ├── profile/           # Profile management and display
│   │   └── ui/                # shadcn/ui components
│   ├── hooks/                 # React hooks (useAuth, use-toast)
│   ├── lib/                   # Core utilities and clients
│   │   ├── api/              # Supabase API wrappers (users.ts)
│   │   ├── auth.ts           # Authentication functions
│   │   ├── supabase.ts       # Supabase client initialization
│   │   ├── logger.ts         # Client-side logging system
│   │   └── resend.ts         # Email sending functions
│   ├── store/                # Zustand stores (auth.ts)
│   ├── types/                # TypeScript type definitions
│   └── App.tsx               # Main app with React Router routes
├── server/                   # Backend Express API
│   ├── index.ts             # Express server with email endpoints
│   └── logger.js            # Server-side logging
├── scripts/                  # Database maintenance scripts
└── supabase-schema.sql      # Complete database schema
```

### State Management Pattern

**⚠️ IMPORTANT - Auth System Migration (Updated 2025-10-22)**

The project has fully migrated to a **feature-based authentication system** using React Query and hexagonal architecture.

**Current System (Use This):**
- **Hook:** `useAuthContext` from `src/app/features/auth/hooks/useAuthContext.tsx`
- **Architecture:** React Query + Hexagonal (Domain-Driven Design)
- **Backend Integration:** All auth operations go through Express API endpoints
- **State Management:** React Query cache with automatic invalidation

**Deprecated System (DO NOT USE):**
- ~~`useAuth` from `src/hooks/useAuth.ts`~~ - DEPRECATED
- ~~`useAuthStore` from `src/store/auth.ts`~~ - DEPRECATED
- ~~Auth functions from `src/lib/auth.ts`~~ - DEPRECATED

### Authentication Flow

**1. Client Initialization** ([src/lib/supabase.ts](src/lib/supabase.ts)):
   - Creates Supabase client with auto-refresh enabled
   - Uses environment variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
   - Configured for session persistence and auto token refresh

**2. Auth Context Provider** ([src/app/features/auth/hooks/useAuthContext.tsx](src/app/features/auth/hooks/useAuthContext.tsx)):
   - **Usage in components:**
     ```typescript
     import { useAuthContext } from '@/app/features/auth/hooks/useAuthContext'

     function MyComponent() {
       const { user, isLoading, signIn, signOut, signUp } = useAuthContext()

       if (isLoading) return <Loading />
       if (!user) return <Login />

       return <div>Hello {user.name}</div>
     }
     ```
   - Provides auth state and operations via React Query
   - Auto-manages cache and invalidation
   - Integrated with backend API

**3. Backend API Endpoints** ([server/infrastructure/api/routes/auth.routes.ts](server/infrastructure/api/routes/auth.routes.ts)):
   - `POST /api/auth/signup` - Register new user
   - `POST /api/auth/signin` - Authenticate user
   - `POST /api/auth/signout` - Sign out current user (clears session)
   - `GET /api/auth/me` - Get current authenticated user

**4. Auth Service** ([src/app/features/auth/data/services/auth.service.ts](src/app/features/auth/data/services/auth.service.ts)):
   - Handles all HTTP communication with backend
   - Returns typed responses validated with Zod schemas
   - Used by React Query mutations and queries

**5. Protected Routes** ([src/app/features/auth/components/ProtectedRoute.tsx](src/app/features/auth/components/ProtectedRoute.tsx)):
   - Wraps routes requiring authentication
   - Redirects to `/auth` if no user session
   - Shows loading state while checking auth

**6. Features:**
   - ✅ Auto-refresh tokens (Supabase)
   - ✅ Session persistence across page reloads
   - ✅ Automatic cache invalidation on logout
   - ✅ Backend validation of all auth operations
   - ✅ Welcome email on successful signup
   - ✅ Proper redirect after logout to `/auth`

### Database Schema

See [supabase-schema.sql](supabase-schema.sql) for complete schema.

**Key Tables**:
- `users` - Extended user profiles (references `auth.users`)
- `roles` - System roles: admin, mentor, emprendedor
- `user_roles` - Many-to-many user-role mapping
- `projects` - Projects and programs
- `opportunities` - Collaboration opportunities
- `messages` - Private chat and public board messages
- `interests` - User interest in projects

**Important Features**:
- Row Level Security (RLS) enabled on all tables
- Automatic profile completion calculation trigger
- Full-text search indexes for Spanish language
- GIN indexes on array fields (skills, interests)
- Auto-creates user profile and default role on signup

### API Layer Pattern

**Supabase API Wrappers** ([src/lib/api/users.ts](src/lib/api/users.ts)):
- `getUserProfile(userId)` - Get user with roles
- `updateUserProfile(userId, updates)` - Update user fields
- `searchUsers(query, filters)` - Advanced search with filters
- `getAllUsers()` - Fetch all users

Pattern: Always select users with joined roles:
```typescript
.select(`
  *,
  user_roles!inner(
    roles(*)
  )
`)
```

Then transform to User type with flattened roles array.

### Backend API Server

**Express Server** ([server/index.ts](server/index.ts)):

Email endpoints (proxied from frontend via `/api/*`):
- `POST /api/send-email` - Generic email sending
- `POST /api/send-welcome-email` - Welcome email on signup
- `POST /api/send-profile-reminder` - Profile completion reminders
- `POST /api/send-message-notification` - New message notifications
- `POST /api/send-opportunity-notification` - New opportunity alerts

Development endpoints:
- `POST /api/dev/logs` - Client log batching endpoint
- `GET /health` - Health check

**Email Integration**:
- Uses Resend API (requires `RESEND_API_KEY` env var)
- Email functions defined in [src/lib/resend.ts](src/lib/resend.ts)
- Called from both client (on signup) and server (via API routes)

### Logging System

**Dual Logging Architecture**:

1. **Client Logger** ([src/lib/client-logger.ts](src/lib/client-logger.ts)):
   - Batches logs and sends to backend endpoint
   - Auto-flushes on page unload
   - Used via `devLogger` in frontend code

2. **Server Logger** ([server/logger.js](server/logger.js)):
   - Structured logging with categories
   - Email operation tracking
   - Client log aggregation

**Dev Logger API** (available in frontend):
```typescript
import { devLogger } from '@/lib/logger'

devLogger.info(category, message, data)
devLogger.error(category, message, error)
devLogger.apiCall(method, endpoint, data, fnName)
```

### Design System

**Visual Language**:
- Primary color: Green (#22c55e)
- Border radius: `rounded-xl`, `rounded-2xl` for cards and containers
- Shadows: `shadow-sm` with `hover:shadow-md` transitions
- Spacing: Generous padding (`p-6`, `p-8`) and gaps (`gap-6`, `gap-8`)

**Component Patterns**:
- Cards: White background, subtle borders, hover effects
- Forms: Clear labels, focus states with ring effects
- Navigation: Sticky header with backdrop blur
- Buttons: Rounded with transition effects

## Common Development Workflows

### Adding a New Protected Page

1. Create page component in [src/components/pages/](src/components/pages/)
2. Add route in [src/App.tsx](src/App.tsx) wrapped with `<ProtectedRoute>`
3. Add navigation link in [src/components/layout/Navigation.tsx](src/components/layout/Navigation.tsx)

### Implementing New API Endpoint

1. Add function to appropriate file in [src/lib/api/](src/lib/api/)
2. Use Supabase client from [src/lib/supabase.ts](src/lib/supabase.ts)
3. Add logging with `devLogger.apiCall()`
4. Handle errors gracefully with fallbacks

### Adding Email Notification

1. Create email template function in [src/lib/resend.ts](src/lib/resend.ts)
2. Add API endpoint in [server/index.ts](server/index.ts)
3. Call endpoint from frontend or trigger server-side
4. Test with valid `RESEND_API_KEY`

### Database Changes

1. Update [supabase-schema.sql](supabase-schema.sql) with new schema
2. Run SQL in Supabase dashboard SQL editor
3. Update TypeScript types in [src/types/](src/types/)
4. Update RLS policies if needed
5. Consider using [scripts/clean-dev-environment.js](scripts/clean-dev-environment.js) for fresh start

### Working with User Profiles

Profile completion is automatically calculated by database trigger on insert/update based on:
- Name (20%)
- Bio (25%)
- Location (15%)
- Skills array (20%)
- Interests array (20%)

Update via `updateUserProfile()` from [src/lib/api/users.ts](src/lib/api/users.ts).

### File Upload (Avatar)

User avatars are stored in Supabase Storage:
- Bucket: `avatars`
- Upload component: [src/components/profile/PhotoUploadModal.tsx](src/components/profile/PhotoUploadModal.tsx)
- URL stored in `users.avatar_url`

See [scripts/setup-storage-manual.md](scripts/setup-storage-manual.md) for storage bucket setup.

## Environment Variables

Required variables in `.env`:

```bash
# Supabase
VITE_SUPABASE_URL=          # Your Supabase project URL
VITE_SUPABASE_ANON_KEY=     # Public anon key
SUPABASE_SERVICE_ROLE_KEY=  # Service role key (server-side only)

# Email
RESEND_API_KEY=             # Resend API key for emails
```

## Important Notes

### TypeScript Configuration

Uses project references pattern with base [tsconfig.json](tsconfig.json):
- [tsconfig.app.json](tsconfig.app.json) - Configuration for React application code (src/)
- [tsconfig.node.json](tsconfig.node.json) - Configuration for Node.js code (vite.config.ts, server/)

### Path Aliases

`@/` resolves to `./src/` via Vite configuration in [vite.config.ts](vite.config.ts).

### Port Configuration

Frontend (Vite) intentionally runs on port 8080 (not default 5173). Backend runs on 3001. If changing ports, update:
- [vite.config.ts](vite.config.ts) `server.port`
- [vite.config.ts](vite.config.ts) `server.proxy.'/api'.target`
- [server/index.ts](server/index.ts) CORS origins array

### Performance Optimizations

`getCurrentUser()` includes aggressive timeouts to prevent slow Supabase queries from blocking app:
- 10s timeout on auth check
- 5s timeout on profile query
- Fallback to basic user object if profile fetch fails
- This prevents infinite loading states but may show incomplete profiles initially

### Git Branch Structure

- **Main branch**: `main`
- **Current branch**: `develop`
- Create PRs targeting `main`

## Testing & Quality

No automated tests currently implemented. When adding tests:
- Frontend: Use Vitest + React Testing Library
- E2E: Consider Playwright
- Database: Use separate test Supabase project

## Deployment

Frontend and backend must be deployed separately:

**Frontend (Vite)**:
- Deploy to Vercel, Netlify, or similar static hosting
- Set environment variables for Supabase

**Backend (Express)**:
- Deploy to Railway, Render, or serverless platform
- Update frontend proxy/API URL to production backend URL
- Set `RESEND_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY`

**Database**:
- Already on Supabase cloud
- Run [supabase-schema.sql](supabase-schema.sql) on production instance
- Configure RLS policies

Flujo de Trabajo de Sub-Agentes

Reglas
	•	Tras la fase de planificación, se debe crear un archivo .claude/sessions/context_session_{feature_name}.md con la definición del plan.
	•	Antes de comenzar cualquier trabajo, se debe revisar el archivo .claude/sessions/context_session_{feature_name}.md y los archivos .claude/doc/{feature_name}/*.
	•	El archivo de sesión debe contener el contexto y el plan general, actualizado continuamente por los subagentes.
	•	Al finalizar cada fase o tarea, debes actualizar el archivo de contexto con toda la información del trabajo realizado.

Sub-Agentes

Este proyecto usa sub-agentes especializados:
	•	shadcn-ui-architect: Construcción y arquitectura de componentes UI
	•	qa-criteria-validator: Validación final de UI/UX
	•	ui-ux-analyzer: Revisión e iteración de UI/UX
	•	frontend-developer: Lógica de negocio del cliente
	•	frontend-test-engineer: Definición de casos de prueba del frontend
	•	typescript-test-explorer: Diseño de pruebas TypeScript
	•	hexagonal-backend-architect: Arquitectura backend y API de Next.js
	•	backend-test-architect: Definición de pruebas backend

Los subagentes investigan e informan, pero tú implementas.
Antes de actuar, consulta siempre los archivos contextuales creados por ellos.

Estándares de Escritura de Código
	•	Simplicidad Primero: Preferir soluciones simples y mantenibles sobre las ingeniosas.
	•	Comentarios ABOUTME: Todos los archivos deben iniciar con dos líneas que empiecen con ABOUTME: explicando el propósito del archivo.
	•	Cambios Mínimos: Solo los necesarios para cumplir el objetivo.
	•	Consistencia de Estilo: Igualar el formato y estilo existente del archivo.
	•	Preservar Comentarios: No eliminar comentarios salvo que sean falsos.
	•	Sin Nombres Temporales: Evitar términos como “nuevo”, “mejorado”, etc.
	•	Documentación Perpetua: Los comentarios deben describir el código actual, no su historia.

Control de Versiones
	•	Los cambios no triviales deben registrarse en git.
	•	Crear ramas WIP para nuevo trabajo.
	•	Hacer commits frecuentes.
	•	No eliminar implementaciones sin permiso explícito.

Requisitos de Pruebas

POLÍTICA SIN EXCEPCIONES:
Todo proyecto debe incluir:
	•	Pruebas unitarias

La única forma de omitir pruebas es que Iban diga explícitamente:

“AUTORIZO QUE OMITAS LAS PRUEBAS ESTA VEZ.”

	•	Las pruebas deben cubrir toda la funcionalidad.
	•	La salida de las pruebas debe ser limpia y sin errores.
	•	Nunca ignores los logs o resultados: pueden contener información crítica.

Cumplimiento de Arquitectura

Backend
	1.	Mantener el Dominio Puro: sin dependencias de frameworks.
	2.	Definir Puertos Primero: interfaces en src/application/ports/.
	3.	Controladores Delgados: las rutas API delegan a casos de uso.
	4.	Inyección de Dependencias: todo se inyecta por constructor.
	5.	Patrón Repositorio: el acceso a datos solo a través de interfaces.

Frontend
	1.	Patrón Contenedor: separar lógica de presentación.
	2.	Hooks Personalizados: la lógica de negocio en hooks.
	3.	Organización por Características: app/features/.
	4.	Componentes Puros: los componentes reciben props, los hooks gestionan estado.

Escritura de Código
	•	Debes dirigirte SIEMPRE a mí como “Iban”.
	•	Se prioriza la claridad y mantenibilidad sobre la concisión o el rendimiento.
	•	Haz el menor cambio posible para lograr el objetivo.
	•	Igualar el estilo y formato del código circundante.
	•	No cambiar espacios en blanco innecesarios.
	•	No eliminar comentarios a menos que sean falsos.
	•	No usar nombres o comentarios temporales.
	•	No reescribir código sin permiso.
	•	Documentar los posibles problemas no relacionados, no corregirlos.

Control de Versiones
	•	Todos los cambios deben registrarse en git.
	•	Si el proyecto no está en git, detente y solicita permiso para iniciarlo.
	•	Si hay cambios sin commit, pregunta antes de continuar.
	•	Crea una rama WIP si no existe una para tu tarea.
	•	Haz commits frecuentes durante el desarrollo.

Obtener Ayuda
	•	Pregunta antes de asumir.
	•	Detente y pide ayuda si estás bloqueado.
	•	Cualquier excepción a las reglas requiere autorización explícita de Iban.

Pruebas
	•	Las pruebas deben cubrir toda la funcionalidad implementada.
	•	Nunca ignores los resultados o errores.
	•	Los resultados deben ser limpios y sin errores.
	•	Si se esperan errores, deben ser capturados y probados.
	•	SIN EXCEPCIONES: se requieren pruebas unitarias, de integración y de extremo a extremo, salvo autorización explícita de Iban.

Verificación de Cumplimiento

Antes de entregar tu trabajo, verifica que todas las reglas anteriores se hayan cumplido.
Si consideras romper alguna regla, detente y pide autorización a Iban.