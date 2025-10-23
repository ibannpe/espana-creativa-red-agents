# Admin Approval Registration Feature - Planning Session

## Feature Overview
Implement an admin-approval registration workflow where new users must be approved before gaining access to the platform.

## Functional Requirements
1. Visitor submits signup request (email + name + surname)
2. Store in `public.pending_signups` (no Auth user created yet)
3. Send email to admin with unique approval link
4. Admin clicks approval link → Edge Function:
   - Marks request as approved
   - Generates magic link via `auth.admin.generateLink({ type: 'magiclink', email })`
   - Sends email to user with action_link
5. (Optional) Create/update `public.profiles` with `approved_at` timestamp
6. Add rate-limiting and validation to prevent abuse

## Status
- **Phase**: Implementation In Progress
- **Last Updated**: 2025-10-22 18:45
- **Current Stage**: Phases 1-2 Complete (Domain Layer), Phase 3 In Progress
- **Completed Phases**: Database migrations, Domain value objects & entities
- **Next**: Application layer (Ports & Use Cases)

## Decisiones Finales de Iban

### Respuestas a Preguntas Críticas:

1. **Administradores**: Lista configurable de emails (variable de entorno)
   - Implementar: `ADMIN_EMAILS=admin1@espanacreativa.org,admin2@espanacreativa.org`
   - Notificar a todos los admins en la lista
   - Cualquier admin puede aprobar/rechazar

2. **Timeline de Aprobación**: 24-48 horas
   - Mensaje en página de espera: "Tu solicitud será revisada en 24-48 horas"
   - No auto-rechazo después de este periodo

3. **Notificación de Rechazo**: Sí, con mensaje genérico
   - Email educado y profesional
   - Sin razón específica (para simplificar MVP)
   - Posibilidad de añadir campo de razón opcional en futuras iteraciones

4. **Creación de Perfil**: En el primer login
   - Perfil en `public.users` se crea cuando usuario hace clic en magic link
   - Consistente con el trigger `handle_new_user()` existente
   - Más simple y alineado con arquitectura actual

5. **Auto-Aprobación de Dominios**: No
   - Todos los registros requieren aprobación manual
   - Simplifica MVP
   - Puede añadirse en futuras iteraciones si es necesario

6. **Migración del Registro Actual**: Reemplazo completo
   - El tab "Registrarse" se convierte en "Solicitar Acceso"
   - No mantener doble flujo
   - Sin feature flag (deployment atómico)

7. **Expiración del Token**: 7 días
   - Token de aprobación válido por 168 horas
   - Más flexible para admins
   - Balance entre seguridad y usabilidad

8. **Rate Limiting**: 5 solicitudes/hora por IP
   - Más permisivo que la recomendación inicial
   - Mejor para redes compartidas (oficinas, espacios de coworking)
   - 1 solicitud por email por día (adicional)

## Resumen Ejecutivo del Plan Final

### Scope Definitivo

**Feature Completa**: Sistema de registro con aprobación administrativa para España Creativa Red

**Componentes**:
1. ✅ Backend (Hexagonal Architecture) - 21 archivos nuevos + 4 modificados
2. ✅ Frontend (Feature-based + React Query) - 12 archivos nuevos + 3 modificados
3. ✅ Base de Datos (Supabase) - 2 tablas + RLS + índices
4. ✅ Email (Resend) - 3 plantillas nuevas
5. ✅ Testing - 21 archivos de test + builders + mocks

### Flujo de Usuario Final

```
1. Visitante → /auth → Tab "Solicitar Acceso"
   ↓
2. Completa formulario (email, nombre, apellidos)
   ↓
3. Rate limit check (5 req/hora por IP, 1 req/día por email)
   ↓
4. Guarda en pending_signups → Envía email a TODOS los admins
   ↓
5. Página de confirmación: "Revisaremos tu solicitud en 24-48 horas"
   ↓
6. Admin recibe email → Click "Aprobar" o "Rechazar"
   ↓
7a. Si APRUEBA:
    - Backend genera magic link (auth.admin.generateLink)
    - Envía email al usuario con magic link
    - Usuario hace click → Sesión creada → Trigger crea perfil → Dashboard

7b. Si RECHAZA:
    - Marca como rejected
    - Envía email genérico al usuario (mensaje educado)
```

### Archivos a Crear

**Backend** (server/):
```
domain/
├── entities/PendingSignup.ts + test
├── value-objects/
│   ├── PendingSignupId.ts + test
│   ├── ApprovalToken.ts + test
│   ├── SignupStatus.ts + test
│   └── IpAddress.ts + test

application/
├── ports/
│   ├── IPendingSignupRepository.ts
│   ├── IRateLimitService.ts
│   └── ITokenService.ts
└── use-cases/signup-approval/
    ├── SubmitSignupRequestUseCase.ts + test
    ├── ApproveSignupUseCase.ts + test
    ├── RejectSignupUseCase.ts + test
    └── GetPendingSignupsUseCase.ts + test

infrastructure/
├── repositories/SupabasePendingSignupRepository.ts + test
├── services/
│   ├── RateLimitService.ts + test
│   └── TokenService.ts + test
└── api/routes/signup-approval.routes.ts + test

__tests__/
├── integration/
│   ├── signup-approval-flow.test.ts
│   ├── rate-limiting.test.ts
│   └── concurrent-approval.test.ts
├── builders/
│   ├── PendingSignupBuilder.ts
│   └── ApprovalTokenBuilder.ts
└── mocks/
    ├── IPendingSignupRepositoryMock.ts
    └── IRateLimitServiceMock.ts
```

**Modificar**:
- `server/infrastructure/di/Container.ts` (registrar nuevos servicios)
- `server/infrastructure/adapters/services/ResendEmailService.ts` (3 plantillas)
- `server/infrastructure/api/routes/auth.routes.ts` (opcional, redirección)
- `server/infrastructure/adapters/services/SupabaseAuthService.ts` (método generateMagicLink)

**Frontend** (src/):
```
app/features/signup-approval/
├── components/
│   ├── RequestAccessForm.tsx
│   ├── PendingApprovalPage.tsx
│   ├── AdminPendingList.tsx
│   ├── PendingSignupCard.tsx
│   └── ApprovalActionButtons.tsx
├── data/
│   ├── schemas/signup-approval.schema.ts
│   └── services/signup-approval.service.ts
├── hooks/
│   ├── queries/
│   │   ├── usePendingSignupsQuery.ts
│   │   └── usePendingCountQuery.ts
│   └── mutations/
│       ├── useRequestSignupMutation.ts
│       ├── useApproveSignupMutation.ts
│       └── useRejectSignupMutation.ts
```

**Modificar**:
- `src/components/auth/AuthPage.tsx` (reemplazar tab signup)
- `src/components/layout/Navigation.tsx` (añadir item "Solicitudes" con badge)
- `src/App.tsx` (rutas /pending-approval y /admin/pending-signups)

**Base de Datos** (SQL):
```
migrations/
├── 001_create_pending_signups.sql
├── 002_create_rate_limits.sql
└── 003_add_rls_policies.sql
```

### Variables de Entorno Nuevas

```bash
# .env
ADMIN_EMAILS=admin1@espanacreativa.org,admin2@espanacreativa.org
APPROVAL_TOKEN_EXPIRY_HOURS=168  # 7 días
RATE_LIMIT_SIGNUPS_PER_HOUR=5
RATE_LIMIT_SIGNUPS_PER_DAY=1  # por email
```

### Estimación de Esfuerzo Total

| Fase | Tiempo |
|------|--------|
| Backend (domain + use cases) | 10-12h |
| Backend (infrastructure + DI) | 6-8h |
| Frontend (schemas + hooks) | 5-7h |
| Frontend (componentes) | 9-11h |
| Base de datos + migraciones | 3-4h |
| Email templates | 2-3h |
| Tests (unit + integration) | 14-19h |
| Integración y ajustes | 3-5h |
| **TOTAL** | **52-69 horas** |

### Plan de Implementación Recomendado

**Orden sugerido**:

1. **Base de Datos** (3-4h)
   - Crear tablas pending_signups y signup_rate_limits
   - RLS policies
   - Índices
   - Ejecutar en Supabase

2. **Backend - Domain Layer** (4-6h)
   - Entities + Value Objects
   - Tests unitarios
   - ZERO dependencias externas

3. **Backend - Application Layer** (6-8h)
   - Definir ports (interfaces)
   - Implementar use cases
   - Tests con mocks

4. **Backend - Infrastructure Layer** (6-8h)
   - Implementar repositories
   - Implementar services (RateLimit, Token, Email)
   - Actualizar DI Container
   - Tests de integración

5. **Backend - API Routes** (2-3h)
   - Endpoints de signup-approval
   - Middleware de autorización
   - Tests de API

6. **Frontend - Data Layer** (3-4h)
   - Schemas (Zod)
   - Service (axios)
   - Tests

7. **Frontend - Hooks** (4-5h)
   - Query hooks
   - Mutation hooks
   - Tests

8. **Frontend - Componentes Usuario** (4-5h)
   - RequestAccessForm
   - PendingApprovalPage
   - Tests

9. **Frontend - Componentes Admin** (5-6h)
   - AdminPendingList
   - PendingSignupCard
   - ApprovalActionButtons
   - Tests

10. **Integración Frontend** (3-4h)
    - Modificar AuthPage
    - Modificar Navigation
    - Añadir rutas a App.tsx
    - Tests E2E

11. **Email Templates** (2-3h)
    - Admin notification
    - User approval
    - User rejection
    - Tests de envío

12. **Testing Final** (4-6h)
    - E2E completo
    - Casos edge
    - Performance
    - Seguridad

### Checklist de Deployment

- [ ] Ejecutar migraciones SQL en Supabase producción
- [ ] Configurar variables de entorno en servidor backend
- [ ] Configurar variables de entorno en Vercel/Netlify (frontend)
- [ ] Actualizar ADMIN_EMAILS con emails reales
- [ ] Verificar que RESEND_API_KEY está configurado
- [ ] Deploy backend (Railway/Render)
- [ ] Deploy frontend (Vercel/Netlify)
- [ ] Test E2E en staging
- [ ] Verificar recepción de emails (admin y usuario)
- [ ] Monitorear rate limiting
- [ ] Verificar RLS policies funcionan correctamente
- [ ] Test de carga (simular 10-20 solicitudes simultáneas)

### Riesgos y Mitigaciones

| Riesgo | Severidad | Mitigación |
|--------|-----------|------------|
| Magic link expira en 1h | ALTA | Instrucciones claras en email + opción de reenvío |
| Email no llega (spam) | ALTA | Usar dominio verificado + SPF/DKIM + email de confirmación |
| Race condition en rate limiting | MEDIA | Usar transacciones SQL + índices únicos |
| Admin no ve badge de notificación | MEDIA | Polling cada 60s + opción de notificaciones push futuras |
| Token de admin leak | MEDIA | Single-use tokens + expiración 7 días + HTTPS only |
| Usuario intenta múltiples emails | BAJA | Rate limit por IP adicional |

### Documentación a Crear

- [ ] README de migración de base de datos
- [ ] Guía de administración (cómo aprobar/rechazar)
- [ ] FAQ para usuarios (qué esperar después de solicitar)
- [ ] Runbook de operaciones (qué hacer si emails no llegan)
- [ ] Actualizar CLAUDE.md con nueva arquitectura

## Implementation Progress

### ✅ Fase 1: Base de Datos (COMPLETADA)

**Archivos Creados**:
- `migrations/001_create_pending_signups.sql` - Tabla principal con constraints
- `migrations/002_create_rate_limits.sql` - Rate limiting con función de cleanup
- `migrations/003_add_rls_policies.sql` - Políticas RLS para seguridad
- `migrations/README.md` - Instrucciones de ejecución

**Commits**: `feat(db): Add database migrations...` (commit 891f24a)

**Estado**: ✅ Listo para ejecutar en Supabase

---

### ✅ Fase 2: Backend Domain Layer (COMPLETADA)

**Value Objects Creados** (con tests):
- `PendingSignupId.ts` + `PendingSignupId.test.ts` - UUID validation
- `ApprovalToken.ts` + `ApprovalToken.test.ts` - Token security
- `SignupStatus.ts` + `SignupStatus.test.ts` - Status transitions

**Entities Creadas**:
- `PendingSignup.ts` - Aggregate root con business rules
  - Método `approve(adminId)` - Aprobación con validaciones
  - Método `reject(adminId)` - Rechazo con validaciones
  - Validación de expiración de token (7 días)
  - Prevención de replay attacks (token single-use)

**Commits**: `feat(domain): Add value objects and PendingSignup entity` (commit 392eb79)

**Test Coverage**: 100% en value objects (27 tests unitarios creados)

---

### 🔄 Fase 3: Backend Application Layer (EN PROGRESO)

**Pendiente**:
- [ ] Definir ports (interfaces): IPendingSignupRepository, IRateLimitService, ITokenService
- [ ] Implementar 4 use cases con tests:
  - [ ] SubmitSignupRequestUseCase
  - [ ] ApproveSignupUseCase
  - [ ] RejectSignupUseCase
  - [ ] GetPendingSignupsUseCase

**Estimación Restante**: 6-8 horas

---

## Plan Updates
(Actualizado en tiempo real durante implementación)

## Team Selection

### Subagents to Consult:

1. **hexagonal-backend-architect**:
   - Design Edge Function architecture for approval workflow
   - Create domain entities for pending signups
   - Define ports/adapters for signup approval process
   - Ensure proper separation of concerns

2. **frontend-developer**:
   - Modify auth/signup UI to support "pending approval" state
   - Create admin approval page/component
   - Implement proper error/success messaging
   - Integrate with backend approval API

3. **backend-test-architect**:
   - Design tests for signup approval use cases
   - Test email sending flows
   - Test security token generation/validation
   - Test rate limiting mechanisms

4. **shadcn-ui-architect**:
   - Design admin approval UI components
   - Create "pending approval" success page
   - Design email templates (HTML/React)

## Implementation Plan

### Phase 1: Database Schema & RLS Policies

**1.1 Create `pending_signups` Table**
```sql
CREATE TABLE public.pending_signups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  surname VARCHAR(255),
  approval_token UUID NOT NULL DEFAULT uuid_generate_v4() UNIQUE,
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID REFERENCES auth.users(id),
  ip_address INET,
  user_agent TEXT
);

-- Indexes for performance
CREATE INDEX idx_pending_signups_email ON pending_signups(email);
CREATE INDEX idx_pending_signups_status ON pending_signups(status);
CREATE INDEX idx_pending_signups_token ON pending_signups(approval_token);
CREATE INDEX idx_pending_signups_created_at ON pending_signups(created_at);
```

**1.2 RLS Policies**
- Public INSERT for signup requests (with rate limiting)
- Admin-only SELECT for viewing pending signups
- No UPDATE/DELETE for public users

**1.3 Rate Limiting Table**
```sql
CREATE TABLE public.signup_rate_limits (
  id SERIAL PRIMARY KEY,
  ip_address INET NOT NULL,
  email VARCHAR(255),
  request_count INTEGER DEFAULT 1,
  window_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(ip_address, email)
);
```

### Phase 2: Backend Architecture (Hexagonal)

**2.1 Domain Layer**
- **Entities**:
  - `PendingSignup` entity with business logic
  - Value objects: `ApprovalToken`, `SignupStatus`

- **Use Cases**:
  - `SubmitSignupRequestUseCase`: Validate and store signup request
  - `ApproveSignupUseCase`: Approve signup and create auth user
  - `RejectSignupUseCase`: Reject signup request
  - `GetPendingSignupsUseCase`: List pending requests (admin only)

**2.2 Application Layer (Ports)**
- `IPendingSignupRepository`: CRUD for pending signups
- `ITokenService`: Generate/validate approval tokens
- `IRateLimitService`: Check rate limits
- `IEmailService`: Enhanced with new templates

**2.3 Infrastructure Layer (Adapters)**
- `SupabasePendingSignupRepository`: Implements repository
- `TokenService`: UUID-based token generation
- `RateLimitService`: IP-based rate limiting
- `ResendEmailService`: Add admin/user approval emails

**2.4 API Routes**
- `POST /api/auth/request-signup`: Submit signup request
- `POST /api/auth/approve/:token`: Admin approval endpoint
- `GET /api/auth/pending-signups`: List pending (admin only)
- `POST /api/auth/reject/:token`: Admin rejection endpoint

### Phase 3: Supabase Edge Function (Alternative to Express)

**Option A: Use Supabase Edge Functions**
```
supabase/functions/
  ├── approve-signup/
  │   └── index.ts
  └── reject-signup/
      └── index.ts
```

**Option B: Keep Express Backend** (Recommended for consistency)
- Use existing Express server
- Add new routes to auth.routes.ts

### Phase 4: Email Templates (Resend)

**4.1 Admin Notification Email**
```typescript
adminSignupNotification(adminEmail, pendingSignup) {
  subject: "Nueva solicitud de registro - España Creativa"
  html: Template with approval/rejection links
}
```

**4.2 User Approval Email**
```typescript
signupApproved(userEmail, magicLink) {
  subject: "Tu cuenta ha sido aprobada - España Creativa"
  html: Template with magic link to create session
}
```

**4.3 User Rejection Email**
```typescript
signupRejected(userEmail, reason?) {
  subject: "Solicitud de registro - España Creativa"
  html: Polite rejection message
}
```

### Phase 5: Frontend Components

**5.1 Modify AuthPage.tsx**
- Replace direct signup with "Request Access" form
- Show "pending approval" success state
- Remove password field from initial form

**5.2 Create Components**
- `RequestAccessForm.tsx`: New signup form (email, name, surname)
- `PendingApprovalPage.tsx`: Success message after request
- `AdminPendingSignupsPage.tsx`: Admin dashboard for approvals
- `PendingSignupsList.tsx`: List component with approve/reject

**5.3 Admin Dashboard Integration**
- Add "Pending Signups" menu item (admin only)
- Badge with pending count
- Real-time updates (optional with React Query)

### Phase 6: Security & Rate Limiting

**6.1 Rate Limiting Strategy**
- 3 requests per IP per hour
- 1 request per email per day
- Implement in middleware or use case level

**6.2 Token Security**
- UUIDs for approval tokens
- Single-use tokens (mark as used)
- Expiration (24-48 hours)
- Signed URLs for extra security (optional)

**6.3 Validation**
- Email validation (format + disposable email check)
- Name sanitization
- CSRF protection on admin endpoints

### Phase 7: User Flow Implementation

**7.1 Signup Request Flow**
```
User visits /auth
  → Fills "Request Access" form (email, name, surname)
  → Submits form
  → Rate limit check
  → Save to pending_signups
  → Send email to admin
  → Show "Pending Approval" page
```

**7.2 Admin Approval Flow**
```
Admin receives email
  → Clicks "Approve" link (with token)
  → Backend validates token
  → Creates Auth user with auth.admin.generateLink()
  → Sends magic link to user
  → Marks pending_signup as approved
```

**7.3 User Access Flow**
```
User receives approval email
  → Clicks magic link
  → Supabase creates session
  → Create profile in public.users
  → Redirect to /dashboard
```

### Phase 8: Admin Interface

**8.1 Admin Dashboard Features**
- View pending signups (table view)
- Approve/Reject actions
- View signup history
- Search/filter by email, name, date
- Bulk actions (optional)

**8.2 Permissions**
- Only users with 'admin' role can access
- Middleware check on backend
- Frontend route protection

### Phase 9: Testing

**9.1 Unit Tests**
- PendingSignup entity tests
- Use case tests with mocks
- Repository tests
- Rate limiting tests

**9.2 Integration Tests**
- Full signup request flow
- Approval flow with email
- Token validation
- Rate limiting scenarios

**9.3 E2E Tests (Playwright)**
- User requests access
- Admin approves
- User receives magic link
- User logs in successfully

### Phase 10: Documentation & Deployment

**10.1 Environment Variables**
```bash
# Add to .env
ADMIN_EMAIL=admin@espanacreativa.dev
SIGNUP_APPROVAL_REQUIRED=true
RATE_LIMIT_SIGNUPS_PER_HOUR=3
APPROVAL_TOKEN_EXPIRY_HOURS=48
```

**10.2 Database Migration Script**
- SQL script to create tables
- RLS policies
- Indexes

**10.3 Deployment Checklist**
- Run database migrations on production
- Update environment variables
- Deploy backend changes
- Deploy frontend changes
- Test end-to-end on staging
- Monitor rate limiting metrics

### Phase 11: Optional Enhancements

**11.1 Advanced Features**
- Email verification before approval
- Admin notes on approval/rejection
- Webhook notifications
- Analytics dashboard
- Waiting list management
- Auto-approval for whitelisted domains

**11.2 UX Improvements**
- Progress indicators
- Estimated approval time
- Admin mobile app notifications
- Slack/Discord integration for admin alerts

## Open Questions

### Architecture Decisions
1. **Edge Functions vs Express Backend**
   - Should we use Supabase Edge Functions for approval endpoints?
   - Or keep everything in Express for consistency?

2. **Magic Link Generation**
   - Use `auth.admin.generateLink()` (requires service role key)
   - Or use `auth.admin.createUser()` + send password reset email?
   - Or custom JWT-based magic link?

3. **Admin Notification Method**
   - Email only?
   - Email + dashboard badge?
   - Real-time notification (webhook/websocket)?
   - Slack/Discord integration?

### User Experience
4. **Signup Form Fields**
   - Minimum required: email, name, surname
   - Should we collect more info upfront (bio, interests)?
   - Should we ask for password during request or after approval?

5. **Approval Timeline**
   - What's the expected approval time (hours/days)?
   - Should we show estimated wait time?
   - Auto-reject after X days?

6. **Multi-Admin Handling**
   - Single admin email or multiple admins?
   - First-come-first-serve approval?
   - Require multiple approvals?

### Security & Abuse Prevention
7. **Rate Limiting Configuration**
   - 3 requests/hour per IP sufficient?
   - Block disposable email domains?
   - CAPTCHA/reCAPTCHA required?

8. **Token Expiration**
   - How long should approval tokens be valid?
   - What happens if token expires before admin acts?
   - Allow re-requesting?

9. **Duplicate Detection**
   - Block if email exists in pending_signups?
   - Block if email exists in auth.users?
   - Allow re-submission after rejection?

### Technical Implementation
10. **Database Choice**
    - Store in Supabase public schema (current plan)?
    - Use separate service/microservice?
    - Leverage Supabase Auth metadata?

11. **Email Service**
    - Continue with Resend (current)?
    - Need dedicated template system?
    - HTML templates or React Email?

12. **Frontend State Management**
    - Use React Query for pending signups?
    - Real-time subscription to pending count?
    - Optimistic updates on approve/reject?

---

### shadcn-ui-architect (Completed: 2025-10-22)

**Status**: UI/UX Design Complete

**Documentation Created**: `.claude/doc/admin_approval_registration/shadcn_ui.md`

**Key Design Recommendations**:

1. **Request Access Form Components**:
   - Use `Field` component (shadcn/ui v4) for form fields
   - `Input` for email, name, surname
   - `Alert` for validation errors
   - `Spinner` from lucide-react for loading states
   - Match existing AuthPage styling (white card, subtle shadows)

2. **Pending Approval Page**:
   - Use `Card` with success icon (CheckCircle2)
   - Clear messaging: "Tu solicitud ha sido enviada"
   - Timeline: "24-48 horas"
   - CTA button to return to auth page

3. **Admin Dashboard**:
   - **Desktop**: `Table` component with sortable columns
   - **Mobile**: `Card` components in vertical stack
   - `Dialog` for confirmation (approve/reject)
   - `Badge` for status indicators (pending/approved/rejected)
   - `Input` with search icon for filtering
   - Empty state with illustrations

4. **Email Templates**:
   - **Admin notification**: HTML with approve/reject buttons (España Creativa orange)
   - **User approval**: Welcoming message with magic link button
   - **User rejection**: Polite messaging, professional tone
   - All templates mobile-responsive with media queries

5. **Color Palette** (from existing design system):
   - Primary: `hsl(14 100% 57%)` - España Creativa orange
   - Success: `hsl(142 71% 45%)` - Green
   - Destructive: `hsl(0 84% 60%)` - Red
   - Muted: `hsl(210 40% 96.1%)` - Light gray

6. **Accessibility**:
   - All buttons have ARIA labels
   - Keyboard navigation support (Tab, Enter, Escape)
   - Screen reader announcements for status changes
   - Focus visible states on all interactive elements
   - Minimum touch target size: 44x44px

**Visual Hierarchy**:
- **Primary action**: Approve (green button, prominent)
- **Secondary action**: Reject (red outline button)
- **Tertiary action**: View details (ghost button)

**Component Breakdown**:
- `RequestAccessForm`: 5 shadcn components (Field, Input, Button, Alert, Card)
- `PendingApprovalPage`: 3 components (Card, Button, CheckCircle2 icon)
- `AdminPendingList`: 8 components (Table, Badge, Dialog, Input, Button, EmptyState, Skeleton)

**Responsive Breakpoints**:
- Mobile: < 768px (card view)
- Tablet: 768px - 1024px (compact table)
- Desktop: > 1024px (full table with all columns)

**Implementation Checklist** (in shadcn_ui.md):
- 40+ items covering all components
- Accessibility testing requirements
- Mobile responsiveness verification
- Email client compatibility testing

**Next Steps**:
- Frontend developer to implement components following shadcn_ui.md
- Use existing España Creativa design tokens
- Test on multiple devices and email clients

---

### backend-test-architect (Completed: 2025-10-22)

**Status**: Testing Strategy Complete

**Documentation Created**: `.claude/doc/admin_approval_registration/testing.md`

**Testing Strategy Summary**:

1. **Unit Test Coverage** (95% target for critical paths):
   - **Domain Layer**: PendingSignup entity, ApprovalToken, SignupStatus value objects
   - **Application Layer**: All 4 use cases with comprehensive mocking
   - **Infrastructure Layer**: Repositories, RateLimitService, TokenService, EmailService
   - **API Routes**: All endpoints with request/response validation

2. **Integration Tests**:
   - Full signup → approval → login flow
   - Rate limiting enforcement (IP + email)
   - Token expiration handling
   - Concurrent approval prevention
   - Email delivery failures

3. **Critical Test Scenarios** (Given-When-Then format):
   - Rate limiting IP exhaustion
   - Token expiration after 48 hours
   - Token replay attack prevention
   - Concurrent approval by multiple admins
   - Email service failure graceful degradation
   - Database constraint violations
   - Magic link generation failure rollback
   - Malformed token validation

4. **Mock Strategy**:
   - **Always mock**: Supabase Auth Admin API, Resend API, Date/Time, UUID generation
   - **Use real**: Domain entities, value objects, in-memory test database
   - **Conditional**: Repositories (mock in unit tests, real in integration tests)

5. **Test Data Builders**:
   - `PendingSignupBuilder`: Fluent builder with method chaining
   - `ApprovalTokenBuilder`: Random and fixed token generation
   - `UserBuilder`: Extended with admin role helpers

6. **File Structure**:
   - 21 test files to create
   - Organized by architectural layer
   - Integration tests in separate directory
   - Builders and mocks in `__tests__/` directory

7. **Code Coverage Targets**:
   - Domain entities: 95%+
   - Use cases: 90%+
   - Repositories: 80%+
   - API routes: 85%+
   - Overall: 85%+

8. **Testing Tools**:
   - Vitest (existing framework)
   - Supertest (API testing)
   - Fake timers for date-dependent tests
   - In-memory database for repository tests

**Critical Edge Cases Covered**:
- Concurrent approvals by multiple admins
- Token replay attacks
- Email bounces/failures
- Database constraint violations
- Race conditions in rate limiting
- Expired token approval attempts
- Duplicate email submissions

**Implementation Estimate**:
- Unit tests: 8-10 hours
- Integration tests: 4-6 hours
- Test builders and mocks: 2-3 hours
- **Total: 14-19 hours**

**Next Steps**:
- Write tests alongside implementation (TDD approach)
- Use test builders for consistent test data
- Run tests on every commit
- Monitor coverage and maintain 85%+ threshold

---

## Subagent Feedback

### hexagonal-backend-architect (Completed: 2025-10-22)

**Document Created**: `.claude/doc/admin_approval_registration/backend.md`

**Key Architectural Decisions Made**:

1. **Domain Entity Design**:
   - `PendingSignup` as Aggregate Root with business rules
   - Value objects: `PendingSignupId`, `ApprovalToken`, `SignupStatus`
   - Entity enforces state transitions: `pending → approved/rejected` only
   - Immutability pattern: all state changes return new instances

2. **Use Case Responsibilities**:
   - `SubmitSignupRequestUseCase`: Validation, rate limiting, duplicate checking, admin notification
   - `ApproveSignupUseCase`: Token validation, magic link generation, status update, user notification
   - `RejectSignupUseCase`: Token validation, status update, optional rejection email
   - `GetPendingSignupsUseCase`: Admin-only query with status filtering

3. **Port Interfaces**:
   - `IPendingSignupRepository`: Standard CRUD + token-based lookup + cleanup operations
   - `IRateLimitService`: Combined IP + email rate limiting with structured results
   - Extended `IAuthService`: Added `generateMagicLink()` method

4. **Magic Link Strategy**: **RECOMMENDED: `auth.admin.generateLink()`**
   - Native Supabase feature (no custom implementation)
   - Built-in 1-hour expiration
   - Automatic session creation on click
   - No password required initially

5. **Rate Limiting Architecture**: **Application Layer (Use Case)**
   - Rate limiting is business logic, not infrastructure concern
   - Implemented in `SubmitSignupRequestUseCase.execute()`
   - Service abstraction via `IRateLimitService` port
   - Better testability and flexibility

6. **Integration with Existing Auth**:
   - Keep existing `SignUpUseCase` for backward compatibility
   - Add feature flag: `SIGNUP_APPROVAL_REQUIRED=true`
   - Optional hybrid approach: auto-approve whitelisted domains
   - Profile creation: on first login (after magic link click)

**Critical Architectural Risks Identified**:

1. **HIGH**: Magic link expiration (1 hour) - mitigated with resend capability
2. **HIGH**: Email delivery failures - mitigated with transaction pattern (email before status update)
3. **MEDIUM**: Race conditions in rate limiting - mitigated with atomic database operations
4. **MEDIUM**: Admin token leakage - mitigated with single-use tokens and expiration

**File Structure Summary**:
- 11 new files to create in domain layer
- 4 new files in application layer
- 3 new files in infrastructure layer
- 3 database migration files
- Extend 4 existing files

**Next Steps for Implementation**:
1. Start with domain layer (pure business logic, zero dependencies)
2. Define application ports (interfaces)
3. Implement use cases with unit tests
4. Create infrastructure adapters
5. Wire up dependency injection container
6. Add integration tests

**Open Questions for Iban** (requires clarification before implementation):
1. Single admin email or multiple admins?
2. Expected approval timeline for UX messaging?
3. Should rejected users receive email notification?
4. Profile creation timing: on approval or first login?
5. Auto-approve whitelisted email domains?
6. Keep direct signup as fallback during migration?

**Implementation Estimate**:
- Domain layer: 4-6 hours
- Application layer: 6-8 hours
- Infrastructure layer: 6-8 hours
- Database + tests: 4-6 hours
- **Total: 20-28 hours** (for complete implementation with tests)

---

### frontend-developer Agent (Completed: 2025-10-22)

**Status**: Frontend Architecture Complete

**Documentation Created**: `.claude/doc/admin_approval_registration/frontend.md`

**Key Architectural Decisions**:

1. **Feature Structure**: Independent feature at `src/app/features/signup-approval/`
   - NOT extending auth feature to maintain separation of concerns
   - Following project's feature-based architecture pattern
   - Will integrate with auth by modifying AuthPage to show "Solicitar Acceso" instead of direct signup

2. **Form Design**: Replace existing signup tab with "Solicitar Acceso" form
   - Simpler UX (no confusion between two registration types)
   - All users must be approved (business requirement)
   - Tab renamed from "Registrarse" to "Solicitar Acceso"

3. **React Query Integration**:
   - Query hooks: `usePendingSignupsQuery` (admin list), `usePendingCountQuery` (badge)
   - Mutation hooks: `useRequestSignupMutation`, `useApproveSignupMutation`, `useRejectSignupMutation`
   - Cache invalidation on approve/reject actions
   - Polling for badge count (60s interval)

4. **State Management**: React Query ONLY (no context needed)
   - Mutations follow project standard: `{action, isLoading, error, isSuccess}`
   - Automatic cache updates and invalidation
   - No global state required for this feature

5. **Admin Dashboard Integration**:
   - New route: `/admin/pending-signups` (protected, admin only)
   - Navigation item with badge showing pending count
   - Badge uses Spanish orange color (`--primary`)
   - Only visible to users with 'admin' role

6. **User Flow UX**:
   - Submit request → Redirect to `/pending-approval` page (not modal)
   - Success page explains wait time (24-48 hours)
   - User receives email with magic link after admin approval
   - Magic link creates session and redirects to dashboard

**Directory Structure**:
```
src/app/features/signup-approval/
├── components/
│   ├── RequestAccessForm.tsx
│   ├── PendingApprovalPage.tsx
│   ├── AdminPendingList.tsx
│   ├── PendingSignupCard.tsx
│   └── ApprovalActionButtons.tsx
├── data/
│   ├── schemas/signup-approval.schema.ts
│   └── services/signup-approval.service.ts
├── hooks/
│   ├── queries/
│   │   ├── usePendingSignupsQuery.ts
│   │   └── usePendingCountQuery.ts
│   └── mutations/
│       ├── useRequestSignupMutation.ts
│       ├── useApproveSignupMutation.ts
│       └── useRejectSignupMutation.ts
```

**Integration Points**:
- `AuthPage.tsx`: Replace signup tab content with RequestAccessForm
- `Navigation.tsx`: Add "Solicitudes" item with badge (admin only)
- `App.tsx`: Add routes for `/pending-approval` (public) and `/admin/pending-signups` (protected)

**API Endpoints Required** (backend must implement):
- `POST /api/signup-approval/request` - Submit signup request
- `GET /api/signup-approval/pending` - List pending (admin only)
- `GET /api/signup-approval/count` - Badge count (admin only)
- `POST /api/signup-approval/approve/:token` - Approve request (admin only)
- `POST /api/signup-approval/reject/:token` - Reject request (admin only)

**Important Notes for Implementation**:
1. DO NOT modify `useAuthContext` or auth feature hooks
2. DO NOT use Zustand (project migrated to React Query)
3. Primary color is Spanish orange (`--primary: 14 100% 57%`), NOT green
4. ALL schemas must use Zod for validation
5. Tests are REQUIRED unless Iban explicitly authorizes omission
6. Follow existing auth feature patterns (same structure, naming conventions)

**Recommended Implementation Order**:
1. Schemas and service (no UI yet)
2. Query and mutation hooks
3. User components (RequestAccessForm, PendingApprovalPage)
4. Admin components (AdminPendingList, cards, buttons)
5. Integration with AuthPage and Navigation
6. Tests (unit, integration, E2E)

**Testing Requirements**:
- Unit tests: Schemas, service, hooks
- Component tests: All components with react-testing-library
- E2E tests: Full user flow, admin approval flow, permission checks

**Implementation Estimate**:
- Schemas + service: 2-3 hours
- Hooks (queries + mutations): 3-4 hours
- User components: 4-5 hours
- Admin components: 5-6 hours
- Integration + routing: 2-3 hours
- Tests (unit + integration + E2E): 8-10 hours
- **Total: 24-31 hours** (for complete implementation with tests)

**Next Steps**:
- Backend must be implemented first (hexagonal architecture)
- Frontend developer should read `.claude/doc/admin_approval_registration/frontend.md` before starting
- Use implementation checklist in section 20.1 of frontend.md

**Answers to Backend's Open Questions** (from frontend perspective):

1. **Single admin email or multiple admins?**
   - Frontend supports both: Navigation badge works for all admins
   - Backend should determine policy

2. **Expected approval timeline?**
   - Frontend shows "24-48 hours" in success page
   - Can be made configurable via env var

3. **Rejected users receive email?**
   - YES - improves communication and user experience
   - Optional reason field in rejection dialog

4. **Profile creation timing?**
   - Recommend on first login (after magic link) for simplicity
   - Frontend doesn't need special handling

5. **Auto-approve whitelisted domains?**
   - Not needed in frontend (backend decision)
   - If implemented, frontend flow remains same

6. **Keep direct signup as fallback?**
   - NO - replace tab entirely for MVP
   - Feature flag can be added later if needed
