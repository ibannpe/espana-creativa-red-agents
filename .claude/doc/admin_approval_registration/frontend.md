# Frontend Implementation Plan: Admin Approval Registration

## Fecha de Creación: 2025-10-22
## Estado: Propuesta de Arquitectura

---

## 1. Resumen Ejecutivo

Este documento proporciona la arquitectura frontend completa para implementar el sistema de registro con aprobación administrativa. Siguiendo la arquitectura basada en features del proyecto, este plan detalla la estructura de directorios, flujos de datos, integración con React Query, y la experiencia de usuario.

**Importante**: Este es un plan arquitectónico. NO incluye código de implementación. El agente de desarrollo debe seguir estas guías para la implementación real.

---

## 2. Decisiones Arquitectónicas Clave

### 2.1 Decisión: Feature Independiente vs Extensión de Auth

**Opción Seleccionada**: Feature Independiente con Integración en Auth

**Razón**:
- El signup approval es funcionalmente distinto del flujo de autenticación normal
- Requiere su propio dominio (pending_signups, approval tokens, etc.)
- Admin necesita UI dedicada que no pertenece al feature auth
- Mantiene separación de responsabilidades (SRP)

**Integración**:
- AuthPage modificada para mostrar "Solicitar Acceso" en lugar de registro directo
- Coexistencia con flujo normal usando feature flag (opcional)
- Hook `useAuthContext` NO se modifica, solo se consume

### 2.2 Decisión: Flujo de Usuario

**Opción Seleccionada**: Reemplazo del Tab de Signup

**Razón**:
- Simplifica UX - no hay confusión entre dos tipos de registro
- Reduce complejidad de UI
- Alineado con requerimientos del negocio (todos deben ser aprobados)

**Alternativa Rechazada**: Feature flag con doble flujo
- Añade complejidad innecesaria
- Más propenso a errores
- Requiere mantenimiento de dos paths

**Flujo Propuesto**:
```
/auth
├─ Login Tab (sin cambios)
└─ Solicitar Acceso Tab (reemplaza Signup)
     ↓
   [Usuario completa formulario]
     ↓
   [POST /api/signup-approval/request]
     ↓
   [Redirigir a /pending-approval]
     ↓
   [Página de éxito con instrucciones]
```

### 2.3 Decisión: Estado de Aprobación Pendiente

**Opción Seleccionada**: Página dedicada `/pending-approval`

**Razón**:
- Usuario puede refrescar la página sin perder contexto
- URL compartible (puede cerrar navegador y volver)
- Permite mostrar información detallada y FAQs
- Mejor para SEO y analytics

**Alternativa Rechazada**: Modal o toast
- Usuario pierde contexto al cerrar
- No puede volver a ver instrucciones

---

## 3. Estructura de Directorios

```
src/app/features/signup-approval/
├── components/
│   ├── RequestAccessForm.tsx          # Formulario de solicitud de acceso
│   ├── PendingApprovalPage.tsx        # Página de éxito post-solicitud
│   ├── AdminPendingList.tsx           # Lista de solicitudes pendientes (admin)
│   ├── PendingSignupCard.tsx          # Card individual de solicitud
│   └── ApprovalActionButtons.tsx      # Botones Aprobar/Rechazar
│
├── data/
│   ├── schemas/
│   │   └── signup-approval.schema.ts  # Zod schemas
│   │
│   └── services/
│       └── signup-approval.service.ts # API client
│
├── hooks/
│   ├── queries/
│   │   ├── usePendingSignupsQuery.ts  # Fetch pending signups (admin)
│   │   └── usePendingCountQuery.ts    # Badge count (admin)
│   │
│   ├── mutations/
│   │   ├── useRequestSignupMutation.ts     # Submit signup request
│   │   ├── useApproveSignupMutation.ts     # Approve request (admin)
│   │   └── useRejectSignupMutation.ts      # Reject request (admin)
│   │
│   └── useSignupApproval.ts           # Business logic hook (optional)
│
└── types/
    └── signup-approval.types.ts       # TypeScript types
```

**Notas de Estructura**:
- NO crear un contexto (useSignupApprovalContext) - no es necesario para esta feature
- Los hooks de mutación siguen el patrón estándar del proyecto: `{action, isLoading, error, isSuccess}`
- Query hooks usan React Query con claves consistentes

---

## 4. Schemas de Validación (Zod)

### 4.1 signup-approval.schema.ts

Este archivo debe definir todos los schemas para validación y tipado:

**Schemas Requeridos**:

1. **signupRequestSchema**:
   ```typescript
   // Campos: email (string), name (string), surname (string opcional)
   // Validación: email formato válido, name mínimo 2 caracteres
   ```

2. **pendingSignupSchema**:
   ```typescript
   // Representa una solicitud pendiente desde la API
   // Campos: id, email, name, surname, status, created_at, approval_token
   // status: 'pending' | 'approved' | 'rejected'
   ```

3. **pendingSignupsListResponseSchema**:
   ```typescript
   // Array de pendingSignupSchema
   // Usado por usePendingSignupsQuery
   ```

4. **approvalActionRequestSchema**:
   ```typescript
   // Para aprobar/rechazar
   // Campos: token (UUID), reason (opcional para rechazo)
   ```

**Tipos a Exportar**:
```typescript
export type SignupRequest = z.infer<typeof signupRequestSchema>
export type PendingSignup = z.infer<typeof pendingSignupSchema>
export type PendingSignupsListResponse = z.infer<typeof pendingSignupsListResponseSchema>
export type ApprovalActionRequest = z.infer<typeof approvalActionRequestSchema>
```

---

## 5. Service Layer

### 5.1 signup-approval.service.ts

**Patrón**: Igual que `auth.service.ts` - funciones puras async que retornan promesas tipadas.

**Métodos Requeridos**:

```typescript
export const signupApprovalService = {
  // Usuario solicita acceso
  async requestSignup(data: SignupRequest): Promise<{ success: boolean, message: string }>

  // Admin obtiene lista de pendientes
  async getPendingSignups(): Promise<PendingSignupsListResponse>

  // Admin obtiene count para badge
  async getPendingCount(): Promise<{ count: number }>

  // Admin aprueba solicitud
  async approveSignup(token: string): Promise<{ success: boolean }>

  // Admin rechaza solicitud
  async rejectSignup(token: string, reason?: string): Promise<{ success: boolean }>
}
```

**Endpoints del Backend** (ya definidos en backend plan):
- `POST /api/signup-approval/request` - Solicitar acceso
- `GET /api/signup-approval/pending` - Lista pendientes (requiere auth + admin role)
- `GET /api/signup-approval/count` - Count pendientes (requiere auth + admin role)
- `POST /api/signup-approval/approve/:token` - Aprobar (requiere auth + admin role)
- `POST /api/signup-approval/reject/:token` - Rechazar (requiere auth + admin role)

**Validación**:
- Cada método debe parsear la respuesta con el schema de Zod correspondiente
- Axios errores se propagan a React Query para manejo consistente

---

## 6. React Query Hooks

### 6.1 Query Hooks

#### usePendingSignupsQuery.ts

**Propósito**: Obtener lista de solicitudes pendientes para admin

**Configuración React Query**:
```typescript
queryKey: ['signup-approval', 'pending']
queryFn: signupApprovalService.getPendingSignups
enabled: isAdmin // Solo ejecutar si el usuario es admin
staleTime: 30000 // 30 segundos
refetchOnWindowFocus: true // Refrescar al volver a la ventana
```

**Retorno**:
```typescript
{
  data: PendingSignup[] | undefined
  isLoading: boolean
  error: Error | null
  refetch: () => void
}
```

**Uso en Componente**:
```typescript
// En AdminPendingList.tsx
const { data: pendingSignups, isLoading, error } = usePendingSignupsQuery()
```

---

#### usePendingCountQuery.ts

**Propósito**: Badge count en navigation para admin

**Configuración React Query**:
```typescript
queryKey: ['signup-approval', 'count']
queryFn: signupApprovalService.getPendingCount
enabled: isAdmin
staleTime: 60000 // 1 minuto
refetchInterval: 60000 // Poll cada minuto
```

**Retorno**:
```typescript
{
  data: { count: number } | undefined
  isLoading: boolean
}
```

**Uso en Componente**:
```typescript
// En Navigation.tsx
const { data } = usePendingCountQuery()
const pendingCount = data?.count || 0
```

---

### 6.2 Mutation Hooks

#### useRequestSignupMutation.ts

**Propósito**: Usuario solicita acceso

**Configuración React Query**:
```typescript
mutationFn: (data: SignupRequest) => signupApprovalService.requestSignup(data)
onSuccess: (response) => {
  // Redirigir a /pending-approval
  navigate('/pending-approval')
}
```

**Retorno** (estándar del proyecto):
```typescript
{
  action: (data: SignupRequest) => void
  isLoading: boolean
  error: Error | null
  isSuccess: boolean
}
```

**Uso en Componente**:
```typescript
// En RequestAccessForm.tsx
const { action: requestSignup, isLoading, error } = useRequestSignupMutation()

const handleSubmit = (formData) => {
  requestSignup(formData)
}
```

---

#### useApproveSignupMutation.ts

**Propósito**: Admin aprueba solicitud

**Configuración React Query**:
```typescript
mutationFn: (token: string) => signupApprovalService.approveSignup(token)
onSuccess: () => {
  // Invalidar queries relacionadas
  queryClient.invalidateQueries(['signup-approval', 'pending'])
  queryClient.invalidateQueries(['signup-approval', 'count'])

  // Mostrar toast de éxito
  toast.success('Solicitud aprobada. Email enviado al usuario.')
}
```

**Retorno**: Estándar `{action, isLoading, error, isSuccess}`

**Uso en Componente**:
```typescript
// En PendingSignupCard.tsx o ApprovalActionButtons.tsx
const { action: approveSignup, isLoading } = useApproveSignupMutation()

const handleApprove = () => {
  approveSignup(pendingSignup.approval_token)
}
```

---

#### useRejectSignupMutation.ts

**Propósito**: Admin rechaza solicitud

**Configuración React Query**:
```typescript
mutationFn: ({ token, reason }: { token: string, reason?: string }) =>
  signupApprovalService.rejectSignup(token, reason)

onSuccess: () => {
  queryClient.invalidateQueries(['signup-approval', 'pending'])
  queryClient.invalidateQueries(['signup-approval', 'count'])
  toast.success('Solicitud rechazada.')
}
```

**Consideración UX**: Mostrar un dialog para que admin pueda añadir razón de rechazo (opcional).

---

## 7. Componentes Frontend

### 7.1 RequestAccessForm.tsx

**Ubicación**: `src/app/features/signup-approval/components/RequestAccessForm.tsx`

**Propósito**: Reemplaza el formulario de signup en AuthPage

**Props**: Ninguna (usa hooks internamente)

**Estructura**:
```tsx
// Formulario con campos:
// - Email (input type="email", required)
// - Nombre (input type="text", required, min 2 chars)
// - Apellidos (input type="text", opcional)
// - Botón "Solicitar Acceso"

// Usa useRequestSignupMutation()
// Muestra loading state durante envío
// Muestra error si falla
// Redirige a /pending-approval on success
```

**Diseño**:
- Seguir estilo de `LoginForm.tsx` y `RegisterForm.tsx` existentes
- Iconos: `Mail`, `User` de lucide-react
- Colores: Usar `--primary` (Spanish orange) para botón
- Spacing: `space-y-4` entre campos
- Input height: `h-11`
- Border radius: `rounded-xl`

**Validación**:
- Validación en tiempo real con schema de Zod
- Mensajes de error bajo cada campo
- Deshabilitar botón si form inválido o isLoading

---

### 7.2 PendingApprovalPage.tsx

**Ubicación**: `src/app/features/signup-approval/components/PendingApprovalPage.tsx`

**Propósito**: Página de éxito después de solicitar acceso

**Ruta**: `/pending-approval`

**Estructura**:
```tsx
// Card centrado con:
// - Icono de reloj/espera (Clock de lucide-react)
// - Título: "Solicitud Enviada"
// - Mensaje: Explicar que admin revisará la solicitud
// - Tiempo estimado: "Normalmente respondemos en 24-48 horas"
// - Instrucciones: Revisar email para link de activación
// - Botón: "Volver al login" (Link to /auth)
```

**Diseño**:
- Layout centrado con `min-h-screen flex items-center justify-center`
- Fondo: `bg-gradient-to-br from-background via-background to-muted`
- Card: `shadow-elegant` con `border-0`
- Icono grande: `w-16 h-16` con color `text-primary`
- Tipografía: Título `text-2xl font-bold`, descripción `text-muted-foreground`

**Consideraciones UX**:
- No requiere autenticación (usuario aún no tiene sesión)
- Mostrar email del usuario si está disponible en query params o sessionStorage
- Añadir FAQs opcionales: "¿Qué pasa si no recibo el email?"

---

### 7.3 AdminPendingList.tsx

**Ubicación**: `src/app/features/signup-approval/components/AdminPendingList.tsx`

**Propósito**: Lista de solicitudes pendientes para admin

**Ruta**: `/admin/pending-signups` (nueva ruta protegida)

**Props**: Ninguna (usa hooks internamente)

**Estructura**:
```tsx
// Usa usePendingSignupsQuery()
// Si isLoading: Mostrar skeleton loaders
// Si error: Mostrar error state con retry button
// Si no hay datos: Empty state "No hay solicitudes pendientes"
// Si hay datos: Grid o lista de PendingSignupCard

// Header:
// - Título "Solicitudes Pendientes"
// - Badge con count total
// - Botón refresh (opcional)

// Body:
// - Grid de cards (grid grid-cols-1 md:grid-cols-2 gap-6)
// - Cada card renderiza PendingSignupCard
```

**Diseño**:
- Container: `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8`
- Header: Sticky con `bg-background/95 backdrop-blur-sm`
- Cards: Sombra sutil con hover effect
- Responsive: 1 columna móvil, 2 columnas desktop

**Permisos**:
- DEBE verificar que usuario tiene rol 'admin'
- Usar ProtectedRoute con adminOnly prop (si existe) o verificar dentro del componente
- Redirigir a /dashboard si no admin

---

### 7.4 PendingSignupCard.tsx

**Ubicación**: `src/app/features/signup-approval/components/PendingSignupCard.tsx`

**Propósito**: Card individual de solicitud pendiente

**Props**:
```typescript
interface PendingSignupCardProps {
  pendingSignup: PendingSignup
}
```

**Estructura**:
```tsx
// Card con:
// - Avatar con iniciales del nombre
// - Nombre completo (name + surname)
// - Email
// - Fecha de solicitud (formateada con Intl.DateTimeFormat)
// - Badge de status (pending/approved/rejected)
// - ApprovalActionButtons (si status === 'pending')
```

**Diseño**:
- Card: `bg-card border rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow`
- Avatar: Circular con gradiente (igual que Navigation)
- Layout: Flex column con gap-4
- Fecha: Formato relativo "Hace 2 horas" o absoluto "22 oct 2025"
- Badge: Colores basados en status
  - pending: `bg-yellow-100 text-yellow-800`
  - approved: `bg-green-100 text-green-800`
  - rejected: `bg-red-100 text-red-800`

**Interacción**:
- Hover effect en el card
- No clickable (acciones en botones)

---

### 7.5 ApprovalActionButtons.tsx

**Ubicación**: `src/app/features/signup-approval/components/ApprovalActionButtons.tsx`

**Propósito**: Botones de aprobar/rechazar

**Props**:
```typescript
interface ApprovalActionButtonsProps {
  approvalToken: string
  onActionComplete?: () => void
}
```

**Estructura**:
```tsx
// Dos botones:
// 1. Aprobar (verde, CheckCircle icon)
// 2. Rechazar (rojo, XCircle icon)

// Usa useApproveSignupMutation() y useRejectSignupMutation()
// Loading state: Deshabilitar ambos botones
// Click Aprobar: Mostrar confirmación con AlertDialog
// Click Rechazar: Mostrar dialog con textarea para razón (opcional)
```

**Diseño**:
- Layout: Flex row gap-2
- Botones: Tamaño completo en móvil, auto en desktop
- Aprobar: `bg-green-600 hover:bg-green-700 text-white`
- Rechazar: `bg-red-600 hover:bg-red-700 text-white`
- Loading: Spinner con `Loader2` icon

**Confirmación**:
- Usar `AlertDialog` de shadcn/ui
- Mensaje: "¿Estás seguro de aprobar esta solicitud? Se enviará un email al usuario."
- Acciones: Cancelar / Confirmar

**Razón de Rechazo** (opcional):
- Usar `Dialog` de shadcn/ui con `Textarea`
- Placeholder: "Motivo del rechazo (opcional)"
- Botón: "Confirmar Rechazo"

---

## 8. Integración en AuthPage

### 8.1 Modificación de AuthPage.tsx

**Ubicación**: `src/components/auth/AuthPage.tsx`

**Cambios Requeridos**:

1. **Reemplazar Tab de Signup**:
   ```tsx
   // Antes:
   <TabsTrigger value="signup">Registrarse</TabsTrigger>

   // Después:
   <TabsTrigger value="request-access">Solicitar Acceso</TabsTrigger>
   ```

2. **Reemplazar Content de Signup**:
   ```tsx
   // Antes:
   <TabsContent value="signup">
     <form onSubmit={handleSignup}>...</form>
   </TabsContent>

   // Después:
   <TabsContent value="request-access">
     <RequestAccessForm />
   </TabsContent>
   ```

3. **Importar RequestAccessForm**:
   ```tsx
   import { RequestAccessForm } from '@/app/features/signup-approval/components/RequestAccessForm'
   ```

**NO Modificar**:
- Login tab (permanece sin cambios)
- useAuthContext (no se toca)
- Diseño del layout
- Navegación on success (RequestAccessForm maneja su propia redirección)

---

## 9. Integración en Navigation

### 9.1 Modificación de Navigation.tsx

**Ubicación**: `src/components/layout/Navigation.tsx`

**Cambios Requeridos**:

1. **Añadir Item de Navegación** (solo para admins):
   ```tsx
   const navItems = [
     { href: '/dashboard', label: 'Dashboard', icon: Home },
     { href: '/network', label: 'Mi Red', icon: Users },
     { href: '/opportunities', label: 'Oportunidades', icon: Briefcase },
     { href: '/messages', label: 'Mensajes', icon: MessageSquare },
     { href: '/projects', label: 'Programas', icon: Calendar },
     // NUEVO (condicional solo si isAdmin):
     {
       href: '/admin/pending-signups',
       label: 'Solicitudes',
       icon: UserPlus,  // Nuevo icono de lucide-react
       adminOnly: true,
       badge: pendingCount // Badge con count
     },
   ]
   ```

2. **Verificar Rol de Admin**:
   ```tsx
   // Obtener user de useAuthContext
   const { user } = useAuthContext()

   // Verificar si es admin (user.roles incluye 'admin')
   // NOTA: Verificar estructura real de user.roles en tu proyecto
   const isAdmin = user?.roles?.some(role => role.name === 'admin')
   ```

3. **Usar usePendingCountQuery**:
   ```tsx
   import { usePendingCountQuery } from '@/app/features/signup-approval/hooks/queries/usePendingCountQuery'

   const { data: countData } = usePendingCountQuery()
   const pendingCount = countData?.count || 0
   ```

4. **Renderizar Badge en Nav Item**:
   ```tsx
   // En el mapeo de navItems
   {item.badge && item.badge > 0 && (
     <span className="ml-2 px-2 py-0.5 text-xs font-semibold bg-primary text-primary-foreground rounded-full">
       {item.badge}
     </span>
   )}
   ```

**Consideraciones**:
- Badge debe ser visible pero no intrusivo
- Color del badge: `bg-primary` (Spanish orange)
- Solo mostrar si count > 0
- Filtrar navItems para no mostrar items con `adminOnly: true` si no es admin

---

## 10. Routing y Protección

### 10.1 Nuevas Rutas en App.tsx

**Ubicación**: `src/App.tsx`

**Rutas a Añadir**:

```tsx
// Ruta pública (no requiere auth)
<Route path="/pending-approval" element={<PendingApprovalPage />} />

// Ruta protegida (requiere auth + admin role)
<Route
  path="/admin/pending-signups"
  element={
    <ProtectedRoute adminOnly={true}>
      <AdminPendingList />
    </ProtectedRoute>
  }
/>
```

**Protección de Rutas**:
- `/pending-approval`: Accesible sin auth (usuario acaba de solicitar acceso)
- `/admin/pending-signups`: Requiere auth + rol admin

**Implementación de adminOnly en ProtectedRoute**:
```tsx
// Si ProtectedRoute no tiene prop adminOnly, añadir:
interface ProtectedRouteProps {
  children: React.ReactNode
  adminOnly?: boolean
}

// Verificar:
if (adminOnly && !isUserAdmin(user)) {
  return <Navigate to="/dashboard" replace />
}
```

---

## 11. Flujo de Datos Completo

### 11.1 Diagrama de Flujo: Usuario Solicita Acceso

```
┌─────────────────────────────────────────────────────────────┐
│                    Usuario Visita /auth                     │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│              AuthPage (Tab: Solicitar Acceso)               │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │           RequestAccessForm                          │   │
│  │  - useRequestSignupMutation()                        │   │
│  │  - Inputs: email, name, surname                      │   │
│  │  - Validación: Zod schema en tiempo real            │   │
│  └──────────────────────┬───────────────────────────────┘   │
└─────────────────────────┼───────────────────────────────────┘
                          │ onSubmit
                          ▼
┌─────────────────────────────────────────────────────────────┐
│           useRequestSignupMutation (React Query)            │
│  - mutationFn: signupApprovalService.requestSignup()        │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│               signupApprovalService.requestSignup()         │
│  - POST /api/signup-approval/request                        │
│  - Body: { email, name, surname }                           │
│  - Parsea response con Zod                                  │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                      Backend API                            │
│  - Valida datos                                             │
│  - Rate limiting                                            │
│  - INSERT en pending_signups                                │
│  - Envía email a admin con link de aprobación              │
│  - Retorna { success: true, message: "..." }               │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│        onSuccess en useRequestSignupMutation                │
│  - navigate('/pending-approval')                            │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                  /pending-approval Página                   │
│  - PendingApprovalPage                                      │
│  - Mensaje de éxito                                         │
│  - Instrucciones: Revisar email                            │
│  - Link: Volver a /auth                                    │
└─────────────────────────────────────────────────────────────┘
```

---

### 11.2 Diagrama de Flujo: Admin Aprueba Solicitud

```
┌─────────────────────────────────────────────────────────────┐
│            Admin Visita /admin/pending-signups              │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                   AdminPendingList                          │
│  - usePendingSignupsQuery()                                 │
│  - Renderiza lista de PendingSignupCard                     │
└─────────────────────────┬───────────────────────────────────┘
                          │ Query automática (React Query)
                          ▼
┌─────────────────────────────────────────────────────────────┐
│           usePendingSignupsQuery (React Query)              │
│  - queryKey: ['signup-approval', 'pending']                 │
│  - queryFn: signupApprovalService.getPendingSignups()       │
│  - enabled: isAdmin                                         │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│           signupApprovalService.getPendingSignups()         │
│  - GET /api/signup-approval/pending                         │
│  - Headers: Authorization con session token                 │
│  - Parsea response con Zod                                  │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                      Backend API                            │
│  - Verifica auth + rol admin (middleware)                   │
│  - SELECT * FROM pending_signups WHERE status = 'pending'  │
│  - Retorna array de solicitudes                            │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              AdminPendingList renderiza cards               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         PendingSignupCard                            │   │
│  │  - Muestra datos de solicitud                        │   │
│  │  - ApprovalActionButtons                             │   │
│  │    ├─ Botón Aprobar                                  │   │
│  │    └─ Botón Rechazar                                 │   │
│  └──────────────────────┬───────────────────────────────┘   │
└─────────────────────────┼───────────────────────────────────┘
                          │ Admin hace clic en "Aprobar"
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              AlertDialog de Confirmación                    │
│  - Mensaje: "¿Estás seguro de aprobar?"                    │
│  - Botones: Cancelar / Confirmar                            │
└─────────────────────────┬───────────────────────────────────┘
                          │ Confirma
                          ▼
┌─────────────────────────────────────────────────────────────┐
│          useApproveSignupMutation (React Query)             │
│  - mutationFn: signupApprovalService.approveSignup(token)   │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│           signupApprovalService.approveSignup(token)        │
│  - POST /api/signup-approval/approve/:token                 │
│  - Headers: Authorization                                   │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                      Backend API                            │
│  - Verifica auth + admin role                               │
│  - Valida token                                             │
│  - Crea usuario en auth.users (Supabase Admin API)         │
│  - Genera magic link                                        │
│  - Envía email a usuario con magic link                     │
│  - UPDATE pending_signups SET status = 'approved'           │
│  - Retorna { success: true }                                │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│         onSuccess en useApproveSignupMutation               │
│  - queryClient.invalidateQueries(['signup-approval'])       │
│  - toast.success("Solicitud aprobada")                      │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│           React Query refetch automático                    │
│  - AdminPendingList se actualiza automáticamente            │
│  - Card de solicitud aprobada desaparece o cambia status    │
│  - Badge count en Navigation se actualiza                   │
└─────────────────────────────────────────────────────────────┘
```

---

## 12. Estado de Carga y Errores

### 12.1 Patrones de Loading States

**RequestAccessForm**:
```tsx
// Durante mutación:
- Deshabilitar inputs
- Deshabilitar botón submit
- Mostrar spinner en botón (Loader2 icon)
- Texto botón: "Enviando..." o mantener "Solicitar Acceso" con spinner
```

**AdminPendingList**:
```tsx
// Durante query inicial:
- Mostrar skeleton loaders (usar Skeleton de shadcn/ui)
- 3-4 cards skeleton con animación pulse

// Durante refetch:
- NO mostrar skeleton (mantener datos actuales)
- Indicador sutil en header (opcional spinner pequeño)
```

**PendingSignupCard Actions**:
```tsx
// Durante mutación (aprobar/rechazar):
- Deshabilitar AMBOS botones
- Mostrar spinner en el botón clickeado
- Mantener card visible con opacity reducida (opcional)
```

---

### 12.2 Patrones de Error Handling

**RequestAccessForm**:
```tsx
// Errores de validación:
- Mostrar mensaje bajo el campo específico
- Color: text-destructive
- Formato: "El email es inválido"

// Errores de API:
- Mostrar error general bajo el formulario
- Color: text-destructive con fondo bg-destructive/10
- Incluir botón "Reintentar"
- Casos específicos:
  - Email ya existe: "Este email ya ha sido registrado"
  - Rate limit: "Demasiados intentos. Intenta de nuevo más tarde"
  - Error genérico: "Error al enviar solicitud. Inténtalo de nuevo"
```

**AdminPendingList**:
```tsx
// Error en query:
- Empty state con icono de error (AlertCircle)
- Mensaje: "Error al cargar solicitudes"
- Botón: "Reintentar" (llama a refetch())
- Considerar mostrar detalles técnicos en development

// Sin conexión:
- Mensaje: "Sin conexión a internet"
- React Query manejará retry automático
```

**Mutations (Approve/Reject)**:
```tsx
// Error en mutación:
- Toast de error (usar toast de shadcn/ui)
- Mensaje: "Error al aprobar solicitud" / "Error al rechazar solicitud"
- NO invalidar query (mantener estado anterior)
- Permitir reintento
```

---

### 12.3 Empty States

**AdminPendingList sin solicitudes**:
```tsx
// Componente EmptyState:
- Icono: Inbox o Users de lucide-react (grande, 64x64)
- Color icono: text-muted-foreground
- Título: "No hay solicitudes pendientes"
- Descripción: "Las nuevas solicitudes aparecerán aquí"
- NO mostrar botón de acción (no hay acción relevante)
```

---

## 13. Experiencia de Usuario (UX)

### 13.1 Flujo de Usuario: Solicitud de Acceso

**Paso 1: Landing en /auth**
- Usuario ve dos tabs: "Iniciar Sesión" y "Solicitar Acceso"
- Tab "Solicitar Acceso" seleccionado por defecto para nuevos usuarios (opcional)
- Texto informativo: "Únete a la red de emprendedores de España Creativa"

**Paso 2: Completar Formulario**
- Campos claros con placeholders
- Validación en tiempo real (no esperar a submit)
- Mensajes de error amigables
- Botón submit deshabilitado si form inválido

**Paso 3: Envío Exitoso**
- Redirección inmediata a `/pending-approval`
- NO mostrar modal/toast intermedio (puede confundir)
- Transición suave (opcional fade)

**Paso 4: Página de Espera**
- Mensaje positivo y claro
- Expectativas realistas de tiempo
- Instrucciones claras sobre qué hacer
- Opción de volver al login
- NO presionar "spam" - explicar que el email puede tardar

**Paso 5: Email de Aprobación**
- Usuario recibe email con magic link
- Clic en link → Supabase crea sesión → Redirect a /dashboard
- Si link expiró: Mensaje claro con opción de solicitar nuevo link (futuro)

---

### 13.2 Flujo de Admin: Gestión de Solicitudes

**Paso 1: Notificación**
- Badge en Navigation con count de pendientes
- Poll cada minuto (staleTime de React Query)
- Color badge: primary (Spanish orange)

**Paso 2: Acceder a Lista**
- Clic en "Solicitudes" en nav
- Verificación de rol admin (redirect si no)
- Carga de lista con skeleton

**Paso 3: Revisar Solicitudes**
- Cards claras con información esencial
- Orden: Más recientes primero (backend ordena por created_at DESC)
- Paginación futura si hay muchas (usar infinite scroll o pagination)

**Paso 4: Tomar Acción**
- Botones claros: "Aprobar" (verde) / "Rechazar" (rojo)
- Confirmación antes de acción (prevenir clicks accidentales)
- Razón de rechazo opcional (mejora comunicación)

**Paso 5: Feedback Inmediato**
- Toast de confirmación
- Lista se actualiza automáticamente (React Query invalidation)
- Badge count se actualiza
- Card desaparece o cambia status

**Paso 6: Verificación**
- Admin puede verificar que email fue enviado (toast confirma)
- En futuro: Log de acciones admin (auditoría)

---

### 13.3 Consideraciones de Accesibilidad

**Formularios**:
- Labels asociados con inputs (`htmlFor`)
- Mensajes de error con `aria-describedby`
- Focus management (focus en primer input al montar)
- Keyboard navigation funcional

**Botones**:
- Loading state con `aria-busy="true"`
- Disabled state con `aria-disabled="true"`
- Texto descriptivo (no solo íconos)

**Listas**:
- Navegación por teclado
- Screen reader friendly (usar semantic HTML)
- Status badges con texto claro (no solo color)

**Modals/Dialogs**:
- Focus trap dentro del modal
- Escape para cerrar
- Focus return al trigger después de cerrar

---

## 14. Performance y Optimización

### 14.1 React Query Configuration

**Global Config** (en QueryClient):
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000, // 30 segundos
      cacheTime: 300000, // 5 minutos
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
    }
  }
})
```

**Feature-Specific Overrides**:
- `usePendingSignupsQuery`: staleTime 30s, refetchOnWindowFocus true
- `usePendingCountQuery`: staleTime 60s, refetchInterval 60s (polling)

---

### 14.2 Code Splitting

**Lazy Loading de Componentes**:
```typescript
// En App.tsx
const AdminPendingList = lazy(() =>
  import('@/app/features/signup-approval/components/AdminPendingList')
)

const PendingApprovalPage = lazy(() =>
  import('@/app/features/signup-approval/components/PendingApprovalPage')
)

// Usar con Suspense
<Suspense fallback={<LoadingSpinner />}>
  <AdminPendingList />
</Suspense>
```

**Razón**:
- AdminPendingList solo se carga para admins (pequeño % de usuarios)
- PendingApprovalPage solo se carga después de solicitud
- Reduce bundle inicial

---

### 14.3 Memoization

**Componentes a Memoizar**:
```typescript
// PendingSignupCard si hay muchos items
export const PendingSignupCard = memo(({ pendingSignup }: Props) => {
  // ...
})

// Comparación personalizada si necesario
export const PendingSignupCard = memo(
  ({ pendingSignup }: Props) => { /* ... */ },
  (prevProps, nextProps) => prevProps.pendingSignup.id === nextProps.pendingSignup.id
)
```

**Callbacks a Memoizar**:
```typescript
// En AdminPendingList si pasa callbacks a children
const handleActionComplete = useCallback(() => {
  refetch()
}, [refetch])
```

---

### 14.4 Optimistic Updates (Opcional)

**Para acciones de Admin**:
```typescript
// En useApproveSignupMutation
onMutate: async (token) => {
  // Cancelar queries in-flight
  await queryClient.cancelQueries(['signup-approval', 'pending'])

  // Snapshot del valor anterior
  const previousSignups = queryClient.getQueryData(['signup-approval', 'pending'])

  // Actualización optimista
  queryClient.setQueryData(['signup-approval', 'pending'], (old) =>
    old?.filter(signup => signup.approval_token !== token)
  )

  // Retornar contexto para rollback
  return { previousSignups }
},
onError: (err, token, context) => {
  // Rollback en caso de error
  queryClient.setQueryData(['signup-approval', 'pending'], context.previousSignups)
},
onSettled: () => {
  // Refetch para asegurar sincronización
  queryClient.invalidateQueries(['signup-approval'])
}
```

**Pros**: UI más rápida, mejor UX
**Cons**: Más complejo, puede confundir si falla (mostrar error claro)

---

## 15. Testing Considerations

**NOTA**: Iban debe autorizar explícitamente omitir tests. Asume que tests SON requeridos.

### 15.1 Unit Tests

**Schemas (signup-approval.schema.test.ts)**:
```typescript
// Test validación de email
// Test validación de name (min 2 chars)
// Test surname opcional
// Test parse de pendingSignupSchema
// Test status enum values
```

**Service (signup-approval.service.test.ts)**:
```typescript
// Mock axios
// Test requestSignup con data válida
// Test requestSignup con error de API
// Test getPendingSignups con auth
// Test approveSignup con token
// Test rejectSignup con razón opcional
```

---

### 15.2 Component Tests

**RequestAccessForm.test.tsx**:
```typescript
// Test renderizado inicial
// Test validación de email inválido
// Test validación de name corto
// Test submit con datos válidos
// Test loading state durante mutación
// Test error state de API
```

**AdminPendingList.test.tsx**:
```typescript
// Test loading skeleton
// Test empty state sin solicitudes
// Test lista con solicitudes
// Test error state
// Test permisos (redirect si no admin)
```

**PendingSignupCard.test.tsx**:
```typescript
// Test renderizado con datos
// Test formato de fecha
// Test badge de status
// Test botones de acción
```

---

### 15.3 Integration Tests

**Flujo completo Usuario**:
```typescript
// Test: Usuario solicita acceso → ve página de éxito
// 1. Renderizar AuthPage
// 2. Llenar formulario de solicitud
// 3. Submitear
// 4. Mock API success
// 5. Verificar redirección a /pending-approval
// 6. Verificar mensaje de éxito
```

**Flujo completo Admin**:
```typescript
// Test: Admin aprueba solicitud → lista se actualiza
// 1. Renderizar AdminPendingList
// 2. Mock API con solicitudes pendientes
// 3. Clic en "Aprobar" en primera card
// 4. Confirmar en AlertDialog
// 5. Mock API success
// 6. Verificar toast de éxito
// 7. Verificar card desaparece o cambia status
```

---

### 15.4 E2E Tests (Playwright)

**Usuario**:
```typescript
test('Usuario puede solicitar acceso', async ({ page }) => {
  await page.goto('/auth')
  await page.click('text=Solicitar Acceso')
  await page.fill('[name="email"]', 'test@example.com')
  await page.fill('[name="name"]', 'Test User')
  await page.click('button:has-text("Solicitar Acceso")')
  await expect(page).toHaveURL('/pending-approval')
  await expect(page.locator('text=Solicitud Enviada')).toBeVisible()
})
```

**Admin**:
```typescript
test('Admin puede aprobar solicitud', async ({ page }) => {
  // Login como admin
  await page.goto('/admin/pending-signups')
  await expect(page.locator('[data-testid="pending-signup-card"]').first()).toBeVisible()
  await page.click('button:has-text("Aprobar")')
  await page.click('button:has-text("Confirmar")')
  await expect(page.locator('text=Solicitud aprobada')).toBeVisible()
})
```

---

## 16. Consideraciones de Seguridad Frontend

### 16.1 Validación de Inputs

**Client-Side**:
- Validación de Zod schemas antes de enviar
- Sanitización de inputs (evitar XSS)
- No confiar en validación client-side (backend DEBE validar)

**Email Validation**:
- Formato básico con Zod (regex)
- Backend debe verificar dominio y disposable emails

---

### 16.2 Tokens de Aprobación

**Manejo en Frontend**:
- Tokens llegan en props/params (nunca en localStorage)
- NO exponer tokens en logs o console
- Tokens son single-use (backend invalida después de uso)

---

### 16.3 Protección de Rutas Admin

**Verificación de Rol**:
```typescript
// En ProtectedRoute o dentro de AdminPendingList
const isAdmin = user?.roles?.some(role => role.name === 'admin')

if (!isAdmin) {
  return <Navigate to="/dashboard" replace />
}
```

**Backend Verification**:
- NUNCA confiar solo en frontend
- Backend DEBE verificar rol admin en TODOS los endpoints
- Middleware de auth + verificación de rol

---

### 16.4 Rate Limiting Client

**Prevención de Spam**:
```typescript
// En RequestAccessForm
const [submittedAt, setSubmittedAt] = useState<number | null>(null)

const canSubmit = () => {
  if (!submittedAt) return true
  const timeSinceSubmit = Date.now() - submittedAt
  return timeSinceSubmit > 60000 // 1 minuto
}

// Deshabilitar submit si canSubmit() === false
// Mostrar mensaje: "Espera 1 minuto antes de reintentar"
```

---

## 17. Configuración de Colores y Diseño

### 17.1 Colores del Design System

**Extraídos de `src/index.css`**:

```css
--primary: 14 100% 57%;              /* Spanish orange/red accent */
--primary-foreground: 0 0% 100%;     /* Blanco */

--destructive: 0 84.2% 60.2%;        /* Rojo para rechazar */
--destructive-foreground: 0 0% 100%;

--muted: 210 11.3% 94.9%;            /* Gris claro para fondos */
--muted-foreground: 220 8.9% 46.1%;  /* Gris oscuro para textos secundarios */

--border: 220 13% 91%;               /* Bordes sutiles */
```

**Uso en Componentes**:
- Botón "Solicitar Acceso": `bg-primary text-primary-foreground`
- Botón "Aprobar": `bg-green-600 hover:bg-green-700 text-white` (no usar primary aquí)
- Botón "Rechazar": `bg-destructive text-destructive-foreground`
- Badge "pending": `bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-500`
- Badge "approved": `bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-500`
- Badge "rejected": `bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-500`

---

### 17.2 Tipografía y Spacing

**Títulos**:
- H1: `text-3xl font-bold`
- H2: `text-2xl font-bold`
- H3: `text-xl font-semibold`

**Body**:
- Normal: `text-base`
- Descripción: `text-sm text-muted-foreground`
- Caption: `text-xs text-muted-foreground`

**Spacing**:
- Container padding: `px-4 sm:px-6 lg:px-8 py-8`
- Card padding: `p-6`
- Gap entre elementos: `gap-4` o `gap-6`
- Stack vertical: `space-y-4`

---

### 17.3 Sombras y Bordes

**Sombras**:
- Card normal: `shadow-sm`
- Card hover: `shadow-md`
- Card elevated: `shadow-elegant` (definido en CSS: `0 10px 30px -10px hsl(220 8.9% 16.1% / 0.1)`)

**Bordes**:
- Border radius cards: `rounded-2xl`
- Border radius buttons: `rounded-lg`
- Border radius inputs: `rounded-md`
- Border color: `border-border`

---

## 18. Dependencias y Imports

### 18.1 Dependencias Existentes (ya en el proyecto)

```json
{
  "@tanstack/react-query": "^5.x",
  "axios": "^1.x",
  "zod": "^3.x",
  "react-router-dom": "^6.x",
  "lucide-react": "^0.x",
  "@radix-ui/react-*": "shadcn/ui components"
}
```

**NO Añadir Nuevas Dependencias** a menos que sea absolutamente necesario.

---

### 18.2 Imports Comunes por Archivo

**Componentes**:
```typescript
import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from '@/components/ui/use-toast'
import { Loader2, Mail, User, Clock, CheckCircle, XCircle } from 'lucide-react'
```

**Hooks**:
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { signupApprovalService } from '../data/services/signup-approval.service'
import { SignupRequest, PendingSignup } from '../data/schemas/signup-approval.schema'
```

**Services**:
```typescript
import axios from 'axios'
import { z } from 'zod'
import {
  signupRequestSchema,
  SignupRequest,
  PendingSignupsListResponse,
  pendingSignupsListResponseSchema
} from '../schemas/signup-approval.schema'
```

---

## 19. Notas Importantes para el Desarrollador

### 19.1 NO Modificar Directamente

**Archivos Existentes que NO Deben Cambiar Significativamente**:
- `useAuthContext.tsx` - NO añadir lógica de signup approval aquí
- Mutation hooks existentes - NO modificar `useSignUpMutation`
- `auth.service.ts` - NO añadir métodos de signup approval aquí

**Razón**: Mantener separación de responsabilidades y evitar contaminar el feature auth.

---

### 19.2 Extensibilidad Futura

**Features a Considerar (NO implementar ahora)**:
- Re-envío de solicitud si expiró
- Historial de solicitudes aprobadas/rechazadas para admin
- Búsqueda y filtros en AdminPendingList
- Paginación si hay muchas solicitudes
- Notificaciones en tiempo real (WebSocket/Supabase Realtime)
- Dashboard de métricas (tiempo promedio de aprobación, tasa de aprobación)

**Preparar para Extensión**:
- Query hooks con params opcionales (filters, pagination)
- Service methods flexibles
- Componentes modulares y reutilizables

---

### 19.3 Conocimiento Desactualizado

**Iban, ten en cuenta**:
1. **Color Primary Cambió**: El proyecto usa Spanish orange (`--primary: 14 100% 57%`), NO verde (#22c55e) como se menciona en CLAUDE.md. Actualizar CLAUDE.md.

2. **Zustand Deprecado**: El proyecto migró a React Query para estado. NO usar Zustand para nuevas features.

3. **Auth Hook Correcto**: Usar `useAuthContext` de `@/app/features/auth/hooks/useAuthContext`, NO `useAuth` de `@/hooks/useAuth`.

4. **Backend Hexagonal**: El backend usa arquitectura hexagonal completa. Los endpoints deben seguir el patrón: Domain → Use Case → Controller → Route.

5. **Tests Obligatorios**: A menos que digas explícitamente "AUTORIZO QUE OMITAS LAS PRUEBAS ESTA VEZ", deben implementarse tests unitarios, de integración y E2E.

---

### 19.4 Orden de Implementación Recomendado

**Fase 1: Fundación** (sin UI visible aún):
1. Schemas (`signup-approval.schema.ts`)
2. Service (`signup-approval.service.ts`)
3. Tests de schemas y service

**Fase 2: Hooks** (lógica de negocio):
4. Query hooks (`usePendingSignupsQuery`, `usePendingCountQuery`)
5. Mutation hooks (`useRequestSignupMutation`, `useApproveSignupMutation`, `useRejectSignupMutation`)
6. Tests de hooks

**Fase 3: Componentes** (UI visible):
7. `RequestAccessForm` + integración en `AuthPage`
8. `PendingApprovalPage` + ruta en `App.tsx`
9. Tests de componentes de usuario

**Fase 4: Admin UI**:
10. `PendingSignupCard`
11. `ApprovalActionButtons`
12. `AdminPendingList`
13. Integración en `Navigation`
14. Ruta protegida en `App.tsx`
15. Tests de componentes admin

**Fase 5: E2E y Refinamiento**:
16. Tests E2E completos
17. Ajustes de UX basados en testing
18. Performance optimization

**Razón**: Construir desde la base hacia arriba, asegurando que cada capa funciona antes de añadir la siguiente.

---

## 20. Checklist de Implementación

### 20.1 Checklist para Desarrollador

**Antes de Empezar**:
- [ ] Leer este documento completo
- [ ] Leer backend plan (`.claude/doc/admin_approval_registration/backend.md`)
- [ ] Verificar que backend está implementado y funcionando
- [ ] Crear rama de feature: `feature/admin-approval-registration-frontend`

**Schemas y Service**:
- [ ] Crear `signup-approval.schema.ts` con todos los schemas
- [ ] Crear tests de schemas
- [ ] Crear `signup-approval.service.ts` con todos los métodos
- [ ] Crear tests de service (mock axios)
- [ ] Verificar que todos los tests pasan

**Query Hooks**:
- [ ] Crear `usePendingSignupsQuery.ts`
- [ ] Crear `usePendingCountQuery.ts`
- [ ] Crear tests de query hooks
- [ ] Verificar que hooks funcionan con backend real (manual testing)

**Mutation Hooks**:
- [ ] Crear `useRequestSignupMutation.ts`
- [ ] Crear `useApproveSignupMutation.ts`
- [ ] Crear `useRejectSignupMutation.ts`
- [ ] Crear tests de mutation hooks
- [ ] Verificar invalidation de queries funciona

**Componentes de Usuario**:
- [ ] Crear `RequestAccessForm.tsx`
- [ ] Modificar `AuthPage.tsx` (reemplazar signup tab)
- [ ] Crear `PendingApprovalPage.tsx`
- [ ] Añadir ruta `/pending-approval` en `App.tsx`
- [ ] Crear tests de componentes
- [ ] Testing manual del flujo completo

**Componentes de Admin**:
- [ ] Crear `PendingSignupCard.tsx`
- [ ] Crear `ApprovalActionButtons.tsx`
- [ ] Crear `AdminPendingList.tsx`
- [ ] Añadir ruta `/admin/pending-signups` protegida en `App.tsx`
- [ ] Modificar `Navigation.tsx` (añadir item con badge)
- [ ] Crear tests de componentes admin
- [ ] Testing manual del flujo admin

**Tests E2E**:
- [ ] Test: Usuario solicita acceso
- [ ] Test: Admin aprueba solicitud
- [ ] Test: Admin rechaza solicitud
- [ ] Test: Verificación de permisos (no admin no puede acceder)
- [ ] Todos los tests E2E pasan

**Refinamiento**:
- [ ] Verificar diseño en móvil y desktop
- [ ] Verificar accesibilidad (keyboard navigation, screen readers)
- [ ] Verificar loading states y error states
- [ ] Verificar performance (lazy loading funciona)
- [ ] Code review interno

**Documentación y Entrega**:
- [ ] Actualizar CLAUDE.md si es necesario
- [ ] Crear CHANGELOG entry
- [ ] Commit con mensaje descriptivo
- [ ] Push a remote
- [ ] Crear PR con descripción completa

---

## 21. Preguntas Frecuentes (FAQ)

**P: ¿Puedo usar el hook `useSignUpMutation` existente para la solicitud de acceso?**

R: NO. El signup approval es un flujo diferente. `useSignUpMutation` crea un usuario directamente en `auth.users`. La solicitud de acceso solo guarda en `pending_signups` sin crear usuario. Crear un hook nuevo: `useRequestSignupMutation`.

---

**P: ¿Debo crear un contexto `useSignupApprovalContext`?**

R: NO, a menos que necesites compartir estado complejo entre múltiples componentes. Para esta feature, los hooks de React Query son suficientes. Si en el futuro necesitas estado global (ej: wizard multi-paso), entonces considera un contexto.

---

**P: ¿Cómo verifico si el usuario es admin?**

R: Obtén el user de `useAuthContext()` y verifica si tiene el rol 'admin':
```typescript
const { user } = useAuthContext()
const isAdmin = user?.roles?.some(role => role.name === 'admin')
```

**IMPORTANTE**: Verificar también en el backend. NO confiar solo en frontend.

---

**P: ¿Qué pasa si el usuario ya solicitó acceso y vuelve a solicitar?**

R: El backend debe verificar si el email ya existe en `pending_signups` y retornar error 409 (Conflict). El frontend muestra el error: "Ya existe una solicitud con este email. Si no has recibido respuesta, contacta al administrador."

---

**P: ¿Debo usar Supabase Realtime para actualizar la lista de admin en tiempo real?**

R: NO para MVP. Usa polling con `refetchInterval` en `usePendingCountQuery`. En el futuro, si hay muchos admins y necesitas sincronización inmediata, considera Realtime.

---

**P: ¿Cómo manejo la expiración del token de aprobación?**

R: El backend debe verificar expiración (ej: 48 horas). Si expiró, retornar error 410 (Gone). Frontend muestra error: "Este link de aprobación ha expirado. Contacta al administrador para re-enviar la solicitud."

Futuro: Implementar endpoint para re-enviar solicitud.

---

**P: ¿Puedo usar optimistic updates para las acciones de admin?**

R: Sí, pero es opcional. Ver sección 14.4. Si lo implementas, asegúrate de manejar rollback correctamente en caso de error.

---

**P: ¿Los tests son obligatorios?**

R: SÍ, a menos que Iban diga explícitamente: "AUTORIZO QUE OMITAS LAS PRUEBAS ESTA VEZ." Sin esa autorización, implementa tests unitarios, de integración y E2E.

---

## 22. Recursos de Referencia

### 22.1 Archivos Existentes a Consultar

**Para Patrones de Código**:
- `src/app/features/auth/data/schemas/auth.schema.ts` - Ejemplo de schemas Zod
- `src/app/features/auth/data/services/auth.service.ts` - Ejemplo de service layer
- `src/app/features/auth/hooks/mutations/useSignUpMutation.ts` - Ejemplo de mutation hook
- `src/app/features/auth/hooks/queries/useCurrentUserQuery.ts` - Ejemplo de query hook
- `src/app/features/auth/components/RegisterForm.tsx` - Ejemplo de formulario

**Para Diseño y UI**:
- `src/components/auth/AuthPage.tsx` - Diseño de página de auth
- `src/components/layout/Navigation.tsx` - Navegación con badges
- `src/index.css` - Design system y colores

**Para Testing**:
- `src/app/features/auth/data/schemas/auth.schema.test.ts` - Ejemplo de tests de schemas
- `src/app/features/auth/data/services/auth.service.test.ts` - Ejemplo de tests de service

---

### 22.2 Documentación Externa

**React Query**:
- Queries: https://tanstack.com/query/latest/docs/react/guides/queries
- Mutations: https://tanstack.com/query/latest/docs/react/guides/mutations
- Invalidation: https://tanstack.com/query/latest/docs/react/guides/query-invalidation

**Zod**:
- Schema validation: https://zod.dev/
- TypeScript inference: https://zod.dev/?id=type-inference

**shadcn/ui**:
- Components: https://ui.shadcn.com/docs/components
- AlertDialog: https://ui.shadcn.com/docs/components/alert-dialog
- Toast: https://ui.shadcn.com/docs/components/toast

---

## 23. Conclusión

Este plan arquitectónico proporciona una guía completa para implementar el sistema de registro con aprobación administrativa en el frontend. Siguiendo estas directrices, el desarrollador debe ser capaz de:

1. Construir una feature modular y mantenible
2. Integrar correctamente con el backend hexagonal
3. Proporcionar una experiencia de usuario fluida
4. Asegurar calidad con tests apropiados
5. Mantener consistencia con el resto del proyecto

**Próximos Pasos para Iban**:
1. Revisar este plan y aprobar o solicitar cambios
2. Autorizar omisión de tests si es aplicable (NO recomendado)
3. Verificar que backend está implementado y desplegado
4. Dar luz verde para implementación

**Próximos Pasos para Desarrollador**:
1. Leer este documento completo
2. Leer backend plan
3. Seguir orden de implementación recomendado (sección 19.4)
4. Usar checklist de implementación (sección 20.1)
5. Hacer commits frecuentes y descriptivos
6. Solicitar code review antes de merge

---

**Documento Creado**: 2025-10-22
**Autor**: Frontend Developer Agent
**Versión**: 1.0
**Estado**: Propuesta Arquitectónica - Pendiente de Aprobación
