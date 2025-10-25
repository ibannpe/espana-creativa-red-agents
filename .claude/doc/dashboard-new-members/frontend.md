# Plan de Implementación Frontend - Dashboard New Members Feature

**Fecha**: 2025-10-25
**Feature**: Dashboard - Sección de Nuevos Miembros
**Objetivo**: Mostrar últimos 5 usuarios registrados (30 días) con funcionalidad de conexión

---

## 1. ESTRUCTURA DE ARCHIVOS

```
src/app/features/dashboard/
├── data/
│   ├── services/
│   │   └── dashboard.service.ts       # Service para API de dashboard
│   └── schemas/
│       └── dashboard.schema.ts        # Schemas Zod para validación
├── hooks/
│   └── queries/
│       └── useRecentUsersQuery.ts     # Query hook para usuarios recientes
└── components/
    ├── NewMemberCard.tsx              # Card individual de nuevo miembro
    └── NewMembersSection.tsx          # Sección completa (container)
```

### Responsabilidades por Archivo

**`dashboard.service.ts`**
- Comunicación HTTP con backend usando Axios
- Método único: `getRecentUsers(days?: number, limit?: number)`
- Validación de respuestas con schemas Zod
- Manejo de errores HTTP

**`dashboard.schema.ts`**
- Definición de schemas Zod para tipos de dashboard
- Schemas de request/response para API
- Inferencia de tipos TypeScript desde schemas
- Reutilización de `userProfileSchema` de profile feature

**`useRecentUsersQuery.ts`**
- Hook de React Query para fetching de usuarios recientes
- Configuración de caché, staleTime, gcTime
- Manejo de estados (loading, error, success)
- Integración con dashboard.service

**`NewMemberCard.tsx`**
- Componente presentacional para un usuario
- Integración con `useRequestConnectionMutation` y `useConnectionStatusQuery`
- Manejo de estados del botón (Conectar/Pendiente/Conectado)
- Toast notifications en respuesta a acciones

**`NewMembersSection.tsx`**
- Container component que usa `useRecentUsersQuery`
- Orquesta lista de `NewMemberCard` components
- Manejo de loading, error, y empty states
- Integración final en Dashboard.tsx

---

## 2. SCHEMAS (Zod) - `dashboard.schema.ts`

### Estrategia de Tipos

**IMPORTANTE**: NO duplicar el schema de usuario. Reutilizar `userProfileSchema` existente.

```typescript
// ABOUTME: Zod schemas for dashboard feature with runtime validation
// ABOUTME: Defines types for recent users query and dashboard-specific data

import { z } from 'zod'
import { userProfileSchema } from '@/app/features/profile/data/schemas/profile.schema'

// Extends UserProfile for dashboard-specific needs
export const recentUserSchema = userProfileSchema

// Request params para GET /api/users/recent
export const getRecentUsersRequestSchema = z.object({
  days: z.number().min(1).max(365).optional().default(30),
  limit: z.number().min(1).max(20).optional().default(5)
})

// Response schema - array de usuarios
export const getRecentUsersResponseSchema = z.object({
  users: z.array(recentUserSchema),
  count: z.number()
})

// TypeScript types inferred from schemas
export type RecentUser = z.infer<typeof recentUserSchema>
export type GetRecentUsersRequest = z.infer<typeof getRecentUsersRequestSchema>
export type GetRecentUsersResponse = z.infer<typeof getRecentUsersResponseSchema>
```

### Justificación de Diseño

1. **Reutilización de schemas**: `userProfileSchema` ya contiene todos los campos necesarios (id, name, avatar_url, created_at, etc.)
2. **Validación de parámetros**: `days` limitado a 1-365 para evitar queries ineficientes
3. **Límite razonable**: `limit` máximo de 20 para proteger performance
4. **Response con count**: Útil para mostrar "5 de 12 nuevos miembros" en futuras iteraciones

---

## 3. SERVICE LAYER - `dashboard.service.ts`

### Implementación del Servicio

```typescript
// ABOUTME: Dashboard service for fetching recent users and dashboard stats
// ABOUTME: Uses Axios for HTTP communication with backend API

import axios from 'axios'
import {
  type GetRecentUsersRequest,
  type GetRecentUsersResponse,
  getRecentUsersResponseSchema
} from '../schemas/dashboard.schema'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export const dashboardService = {
  /**
   * Get users registered in the last N days
   *
   * @param params - Optional params (days and limit)
   * @returns Promise with array of recent users
   */
  async getRecentUsers(params?: GetRecentUsersRequest): Promise<GetRecentUsersResponse> {
    const response = await axios.get(`${API_BASE_URL}/api/users/recent`, {
      params: {
        days: params?.days || 30,
        limit: params?.limit || 5
      }
    })

    // Zod validation + parsing
    return getRecentUsersResponseSchema.parse(response.data)
  }
}
```

### Configuración de la Llamada

- **URL**: `GET /api/users/recent`
- **Query params**: `?days=30&limit=5`
- **Headers**: Automáticos (Axios interceptor maneja auth si existe)
- **Timeout**: Default de Axios (no necesario personalizar para este caso)

### Manejo de Errores

**IMPORTANTE**: NO capturar errores en el service. Dejar que se propaguen al hook de React Query.

```typescript
// ❌ INCORRECTO - No hacer try/catch aquí
async getRecentUsers(params) {
  try {
    const response = await axios.get(...)
    return response.data
  } catch (error) {
    // No capturar aquí
  }
}

// ✅ CORRECTO - Dejar que el error suba
async getRecentUsers(params) {
  const response = await axios.get(...)
  return getRecentUsersResponseSchema.parse(response.data)
}
```

React Query manejará reintentos y estados de error automáticamente.

---

## 4. REACT QUERY HOOK - `useRecentUsersQuery.ts`

### Implementación del Hook

```typescript
// ABOUTME: React Query hook for fetching recently registered users
// ABOUTME: Handles caching, loading states, and automatic refetching

import { useQuery } from '@tanstack/react-query'
import { dashboardService } from '../../data/services/dashboard.service'
import type { RecentUser } from '../../data/schemas/dashboard.schema'

/**
 * Query hook to fetch users registered in the last N days
 *
 * @param options - Query configuration (days, limit, enabled)
 * @returns Query result with recent users array
 */
export const useRecentUsersQuery = (options?: {
  days?: number
  limit?: number
  enabled?: boolean
}) => {
  return useQuery<RecentUser[], Error>({
    queryKey: ['dashboard', 'recent-users', options?.days, options?.limit],

    queryFn: async () => {
      const response = await dashboardService.getRecentUsers({
        days: options?.days || 30,
        limit: options?.limit || 5
      })
      return response.users
    },

    // Configuración de caché
    staleTime: 2 * 60 * 1000,      // 2 minutos - dato relativamente estático
    gcTime: 10 * 60 * 1000,        // 10 minutos - mantener en caché más tiempo

    // Refetch config
    refetchOnWindowFocus: false,   // No refetch al cambiar de tab (evitar requests innecesarios)
    refetchOnMount: true,          // Sí refetch al montar componente

    // Habilitado por defecto, pero permite override
    enabled: options?.enabled !== false
  })
}
```

### Query Key Estrategia

**Formato**: `['dashboard', 'recent-users', days, limit]`

**Ventajas**:
- Permite múltiples queries con diferentes params en caché
- Invalidación granular: `queryClient.invalidateQueries({ queryKey: ['dashboard', 'recent-users'] })`
- Invalidación total de dashboard: `queryClient.invalidateQueries({ queryKey: ['dashboard'] })`

### Configuración de Caché

| Config | Valor | Justificación |
|--------|-------|---------------|
| `staleTime` | 2 min | Los nuevos miembros no cambian frecuentemente, evitar requests innecesarios |
| `gcTime` | 10 min | Mantener datos en caché más tiempo para mejor UX en navegación |
| `refetchOnWindowFocus` | false | No es crítico mostrar datos al segundo (evitar requests al cambiar de tab) |
| `refetchOnMount` | true | Sí mostrar datos frescos al entrar a Dashboard |

### Retorno del Hook

```typescript
{
  data: RecentUser[] | undefined,        // Array de usuarios o undefined si loading
  isLoading: boolean,                    // true durante primera carga
  error: Error | null,                   // Error si falla la query
  refetch: () => Promise<QueryResult>,   // Función para refetch manual
  isSuccess: boolean,                    // true si query exitosa
  isFetching: boolean                    // true durante cualquier fetch (incluso background)
}
```

---

## 5. INTEGRACIÓN CON NETWORK FEATURE

### Uso de Hooks Existentes

**Hook de Mutation**: `useRequestConnectionMutation`

```typescript
import { useRequestConnectionMutation } from '@/app/features/network/hooks/mutations/useRequestConnectionMutation'

// En NewMemberCard.tsx
const { action, isLoading, error, isSuccess } = useRequestConnectionMutation()

// Llamada
const handleConnect = () => {
  action({ addressee_id: user.id })
}
```

**Hook de Query Status**: `useConnectionStatusQuery`

```typescript
import { useConnectionStatusQuery } from '@/app/features/network/hooks/queries/useConnectionStatusQuery'

// En NewMemberCard.tsx
const { data: connectionStatus } = useConnectionStatusQuery(user.id)

// connectionStatus.status puede ser:
// - null: Sin conexión
// - 'pending': Solicitud enviada
// - 'accepted': Conexión aceptada
// - 'rejected': Conexión rechazada
// - 'blocked': Usuario bloqueado
```

### Invalidación de Queries

**IMPORTANTE**: El mutation hook YA invalida las queries necesarias.

Ver código existente en `useRequestConnectionMutation.ts`:
```typescript
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ['connections'] })
  queryClient.invalidateQueries({ queryKey: ['network-stats'] })
  queryClient.invalidateQueries({ queryKey: ['connection-status'] })
}
```

**NO necesitamos** invalidar `recent-users` porque:
1. La lista de nuevos usuarios no cambia al conectar
2. El estado de conexión se actualiza automáticamente por invalidación de `connection-status`

### Flujo de Conexión

```
1. Usuario hace click en "Conectar"
   ↓
2. handleConnect() llama a action({ addressee_id })
   ↓
3. useRequestConnectionMutation ejecuta POST /api/connections
   ↓
4. onSuccess invalida queries ['connection-status']
   ↓
5. useConnectionStatusQuery refetch automáticamente
   ↓
6. NewMemberCard re-renderiza con nuevo status
   ↓
7. Botón cambia a "Solicitud enviada" (disabled)
```

---

## 6. COMPONENTE: NewMemberCard.tsx

### Responsabilidades

1. Mostrar información del usuario (avatar, nombre, rol)
2. Gestionar estados del botón de conexión
3. Ejecutar mutation al hacer click
4. Mostrar feedback visual (toast)

### Estructura del Componente

```typescript
// ABOUTME: Card component for displaying a new member with connection action
// ABOUTME: Integrates with network feature for connection requests and status

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { useRequestConnectionMutation } from '@/app/features/network/hooks/mutations/useRequestConnectionMutation'
import { useConnectionStatusQuery } from '@/app/features/network/hooks/queries/useConnectionStatusQuery'
import type { RecentUser } from '../data/schemas/dashboard.schema'

interface NewMemberCardProps {
  user: RecentUser
}

export function NewMemberCard({ user }: NewMemberCardProps) {
  const { toast } = useToast()

  // Network hooks
  const { action: requestConnection, isLoading } = useRequestConnectionMutation()
  const { data: connectionStatus } = useConnectionStatusQuery(user.id)

  // Handlers
  const handleConnect = () => {
    requestConnection(
      { addressee_id: user.id },
      {
        onSuccess: () => {
          toast({
            title: 'Solicitud enviada',
            description: `Se ha enviado una solicitud de conexión a ${user.name}`,
          })
        },
        onError: (error) => {
          toast({
            title: 'Error',
            description: error.message || 'No se pudo enviar la solicitud',
            variant: 'destructive'
          })
        }
      }
    )
  }

  // Estados del botón
  const isConnected = connectionStatus?.status === 'accepted'
  const isPending = connectionStatus?.status === 'pending'
  const hasConnection = isConnected || isPending

  // UI del botón
  const buttonLabel = isPending ? 'Solicitud enviada' : isConnected ? 'Conectado' : 'Conectar'
  const buttonDisabled = hasConnection || isLoading

  // Avatar fallback (iniciales)
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  // Determinar rol para mostrar
  const displayRole = user.user_roles?.[0]?.roles?.name || 'Miembro'

  return (
    <div className="flex items-center space-x-4">
      <Avatar>
        <AvatarImage src={user.avatar_url || undefined} alt={user.name} />
        <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
      </Avatar>

      <div className="flex-1">
        <p className="text-sm font-medium">{user.name}</p>
        <p className="text-xs text-muted-foreground capitalize">{displayRole}</p>
      </div>

      <Button
        size="sm"
        variant="outline"
        onClick={handleConnect}
        disabled={buttonDisabled}
      >
        {buttonLabel}
      </Button>
    </div>
  )
}
```

### Estados del Botón

| Estado | Label | Disabled | Acción onClick |
|--------|-------|----------|----------------|
| Sin conexión | "Conectar" | No | Enviar solicitud |
| Cargando | "Conectar" | Sí | - |
| Pending | "Solicitud enviada" | Sí | - |
| Accepted | "Conectado" | Sí | - |

### Funciones Auxiliares

**`getInitials(name)`**
- Toma primeras letras de cada palabra
- Máximo 2 caracteres
- Uppercase
- Ejemplo: "Juan Pérez" → "JP"

### Manejo de Roles

**Prioridad**:
1. Si `user.user_roles[0].roles.name` existe → Mostrar rol
2. Si array vacío o undefined → Mostrar "Miembro"

**Capitalización**:
- Usar clase CSS `capitalize` para capitalizar primera letra

### Consideraciones de Tipos

**IMPORTANTE**: El tipo `RecentUser` es igual a `UserProfile` que incluye:

```typescript
{
  id: string
  name: string
  avatar_url: string | null
  user_roles?: Array<{
    roles: {
      name: string
      // ...
    }
  }>
  // ... otros campos
}
```

Si `user_roles` no viene poblado en la respuesta del backend, necesitarás que el backend haga el JOIN correspondiente.

---

## 7. COMPONENTE: NewMembersSection.tsx

### Responsabilidades

1. Consumir `useRecentUsersQuery`
2. Orquestar lista de `NewMemberCard`
3. Manejar estados de loading, error, empty

### Estructura del Componente

```typescript
// ABOUTME: Section container for displaying list of new members
// ABOUTME: Handles loading, error, and empty states with proper feedback

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertCircle, Users } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useRecentUsersQuery } from '../hooks/queries/useRecentUsersQuery'
import { NewMemberCard } from './NewMemberCard'

export function NewMembersSection() {
  const { data: users, isLoading, error } = useRecentUsersQuery({
    days: 30,
    limit: 5
  })

  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow duration-300">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Nuevos miembros
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Loading State */}
        {isLoading && (
          <>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-[120px]" />
                  <Skeleton className="h-3 w-[80px]" />
                </div>
                <Skeleton className="h-9 w-[90px]" />
              </div>
            ))}
          </>
        )}

        {/* Error State */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No se pudieron cargar los nuevos miembros.
              Por favor, intenta de nuevo más tarde.
            </AlertDescription>
          </Alert>
        )}

        {/* Empty State */}
        {!isLoading && !error && (!users || users.length === 0) && (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No hay nuevos miembros aún</p>
          </div>
        )}

        {/* Success State */}
        {!isLoading && !error && users && users.length > 0 && (
          <>
            {users.map((user) => (
              <NewMemberCard key={user.id} user={user} />
            ))}
          </>
        )}
      </CardContent>
    </Card>
  )
}
```

### Estados de UI

**Loading State**:
- 5 skeletons (uno por cada usuario esperado)
- Skeleton para avatar (circular), nombre (rectángulo), rol (rectángulo pequeño), botón (rectángulo)

**Error State**:
- Alert rojo con icono AlertCircle
- Mensaje genérico (no exponer detalles técnicos)
- NO mostrar botón de retry (el usuario puede refrescar la página)

**Empty State**:
- Icono Users con opacidad 50%
- Mensaje "No hay nuevos miembros aún"
- Centrado verticalmente con padding

**Success State**:
- Lista de `NewMemberCard` con `key={user.id}`
- Spacing vertical entre cards: `space-y-4`

### Diseño Visual

Siguiendo las directrices del proyecto:

- **Card**: `shadow-sm` con `hover:shadow-md` y `transition-shadow duration-300`
- **Spacing**: `space-y-4` entre elementos (generoso)
- **Colores**: Usar color primario (green) para icono de título
- **Bordes**: `rounded-xl` en Card (por defecto en shadcn/ui)

---

## 8. INTEGRACIÓN EN DASHBOARD.tsx

### Cambios Necesarios

**Archivo**: `src/components/dashboard/Dashboard.tsx`

**Líneas a reemplazar**: 215-245

**Antes**:
```typescript
<Card className="shadow-sm hover:shadow-md transition-shadow duration-300">
  <CardHeader>
    <CardTitle className="flex items-center gap-2">
      <Users className="h-5 w-5 text-primary" />
      Nuevos miembros
    </CardTitle>
  </CardHeader>
  <CardContent className="space-y-4">
    {[1, 2, 3].map((i) => (
      <div key={i} className="flex items-center space-x-4">
        <Avatar>
          <AvatarFallback>U{i}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <p className="text-sm font-medium">Usuario {i}</p>
          <p className="text-xs text-muted-foreground">Emprendedor</p>
        </div>
        <Button size="sm" variant="outline">
          Conectar
        </Button>
      </div>
    ))}
  </CardContent>
</Card>
```

**Después**:
```typescript
import { NewMembersSection } from '@/app/features/dashboard/components/NewMembersSection'

// ...

<NewMembersSection />
```

**Importaciones a agregar**:
```typescript
import { NewMembersSection } from '@/app/features/dashboard/components/NewMembersSection'
```

**Importaciones a eliminar** (ya no se usan en este bloque):
```typescript
// Pueden eliminarse SI no se usan en otra parte del archivo:
// import { Avatar, AvatarFallback } from '@/components/ui/avatar'
// (verificar antes de eliminar)
```

---

## 9. CONSIDERACIONES TÉCNICAS

### Optimistic Updates

**Decisión**: NO implementar optimistic updates.

**Justificación**:
- La latencia de la API de conexión es baja (<500ms típicamente)
- El feedback inmediato se da con el estado `isLoading` del botón
- El toast notification proporciona confirmación visual suficiente
- Optimistic updates agregan complejidad innecesaria para este caso

### Polling Automático

**Decisión**: NO implementar polling.

**Justificación**:
- Los nuevos miembros no cambian tan frecuentemente (1-2 por día típicamente)
- El staleTime de 2 minutos + refetchOnMount es suficiente
- Polling consumiría recursos del servidor innecesariamente
- Si se necesita en el futuro, puede agregarse con `refetchInterval` en el hook

### Manejo de Duplicados en Caché

**NO es un problema** porque:
- React Query usa la query key para identificar cachés únicas
- Cada query key incluye los params (days, limit)
- No hay forma de tener datos duplicados con diferentes keys

### Paginación

**NO implementar** en esta fase.

**Razones**:
- Limit fijo de 5 usuarios es suficiente para el Dashboard
- La sección "Nuevos miembros" es un preview, no una lista completa
- Si el usuario quiere ver más, puede ir a la página de Network/Search

**Si se requiere en el futuro**:
- Agregar params `offset` y `page` al schema
- Usar `useInfiniteQuery` en lugar de `useQuery`
- Implementar botón "Ver más" o scroll infinito

### Error Recovery

**Estrategia**:
- NO auto-retry en caso de error (React Query default es 3 retries)
- Configurar `retry: false` en el hook para evitar múltiples requests fallidos
- Mostrar error state claro al usuario
- El usuario puede refrescar manualmente la página si lo desea

```typescript
export const useRecentUsersQuery = (options) => {
  return useQuery({
    // ...
    retry: false,  // NO auto-retry
    // ...
  })
}
```

### Performance

**Optimizaciones aplicadas**:

1. **Memoización**: No necesaria - React Query ya memoiza resultados
2. **Lazy Loading**: No necesaria - solo 5 usuarios
3. **Virtual Scrolling**: No necesaria - lista corta
4. **Image Lazy Loading**: Avatares se cargan lazy por defecto en navegadores modernos

**Consideraciones futuras**:
- Si `limit` aumenta a >20, considerar virtualización
- Si avatares son grandes, implementar lazy loading explícito

### TypeScript Strict Mode

**Asegurarse de que todos los archivos**:
- Tengan tipos explícitos en parámetros de funciones
- No usen `any` (usar `unknown` si es necesario)
- Manejen valores `null` y `undefined` correctamente
- Usen type guards donde sea apropiado

Ejemplo de type guard:
```typescript
const displayRole = user.user_roles?.[0]?.roles?.name || 'Miembro'
// ✅ Correcto - usa optional chaining

const displayRole = user.user_roles[0].roles.name || 'Miembro'
// ❌ Incorrecto - puede fallar si user_roles es undefined
```

---

## 10. FLUJO DE DATOS COMPLETO

```
┌─────────────────────────────────────────────────────────────┐
│                       DASHBOARD PAGE                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              NewMembersSection.tsx                          │
│  - Usa useRecentUsersQuery()                                │
│  - Renderiza loading/error/empty/success states            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              useRecentUsersQuery                            │
│  - queryKey: ['dashboard', 'recent-users', 30, 5]          │
│  - queryFn: dashboardService.getRecentUsers()               │
│  - staleTime: 2min, gcTime: 10min                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              dashboardService.getRecentUsers()              │
│  - GET /api/users/recent?days=30&limit=5                   │
│  - Parse con getRecentUsersResponseSchema                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   BACKEND API                               │
│  - Endpoint: GET /api/users/recent                          │
│  - Filtra por created_at >= now() - 30 days                │
│  - Ordena por created_at DESC                               │
│  - Limita a 5 resultados                                    │
│  - Incluye JOIN con user_roles y roles                     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              Response: { users: [...], count: 5 }           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              NewMembersSection (Success State)              │
│  - Map users.map(user => <NewMemberCard />)                │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    NewMemberCard                            │
│  - Muestra avatar, nombre, rol                              │
│  - useConnectionStatusQuery(user.id)                       │
│  - useRequestConnectionMutation()                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼ (Click "Conectar")
┌─────────────────────────────────────────────────────────────┐
│            useRequestConnectionMutation                     │
│  - POST /api/connections { addressee_id }                  │
│  - onSuccess: invalidate ['connection-status']             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│          useConnectionStatusQuery (auto-refetch)            │
│  - GET /api/connections/status/:userId                     │
│  - Retorna { status: 'pending' }                           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│            NewMemberCard (re-render)                        │
│  - Botón cambia a "Solicitud enviada" (disabled)          │
│  - Toast muestra "Solicitud enviada a {nombre}"            │
└─────────────────────────────────────────────────────────────┘
```

---

## 11. ESTADOS DE ERROR Y EDGE CASES

### Backend Retorna Error 500

**Comportamiento**:
- `useRecentUsersQuery` → `error` state
- `NewMembersSection` → renderiza Alert rojo
- Mensaje: "No se pudieron cargar los nuevos miembros"

**NO mostrar**:
- Stack trace
- Mensaje de error técnico
- Botón de retry (el usuario puede F5)

### Backend Retorna Array Vacío

**Comportamiento**:
- `users.length === 0` → empty state
- Icono Users + mensaje "No hay nuevos miembros aún"

### Usuario NO Autenticado

**Comportamiento**:
- Dashboard.tsx está protegido por `<ProtectedRoute>`
- Este caso NO debería ocurrir
- Si ocurre, Axios interceptor redirige a `/auth`

### Usuario Sin Avatar

**Comportamiento**:
- `avatar_url === null`
- `<AvatarImage src={undefined} />` → no renderiza nada
- `<AvatarFallback>` → muestra iniciales

### Usuario Sin Rol

**Comportamiento**:
- `user.user_roles === undefined` O `user.user_roles.length === 0`
- Mostrar "Miembro" como fallback

### Nombre de Usuario Muy Largo

**Comportamiento**:
- Dejar que el diseño del Card maneje overflow
- NO truncar (el card tiene `flex-1` que acomoda)
- Si se vuelve problema, agregar clase `truncate`

### Click Rápido en "Conectar" (Doble Click)

**Comportamiento protegido**:
- Primer click → `isLoading = true` → botón disabled
- Segundo click → ignored (botón disabled)
- Mutation solo se ejecuta una vez

### Backend Tarda Mucho (>5s)

**Comportamiento**:
- Loading state se mantiene visible
- Usuario ve skeletons
- NO hay timeout en Axios (default sin límite)
- Considerar agregar timeout si se convierte en problema:

```typescript
const response = await axios.get(url, {
  timeout: 10000  // 10 segundos
})
```

### Network Feature NO Disponible

**NO debería ocurrir** porque:
- Network feature ya existe en el proyecto
- Hooks están en `src/app/features/network/`

**Si ocurre** (imports rotos):
- TypeScript fallará en build time
- Fix: Verificar paths de imports

---

## 12. TESTING STRATEGY

### Unit Tests

**Archivo**: `dashboard.service.test.ts`

**Casos**:
1. ✅ getRecentUsers() retorna array de usuarios
2. ✅ getRecentUsers() valida response con schema Zod
3. ✅ getRecentUsers() rechaza schema inválido
4. ✅ getRecentUsers() pasa params correctos en query string

**Archivo**: `useRecentUsersQuery.test.ts`

**Casos**:
1. ✅ Hook retorna loading state inicialmente
2. ✅ Hook retorna data después de fetch exitoso
3. ✅ Hook retorna error después de fetch fallido
4. ✅ Hook usa query key correcto
5. ✅ Hook respeta enabled option

**Archivo**: `NewMemberCard.test.tsx`

**Casos**:
1. ✅ Renderiza nombre y avatar del usuario
2. ✅ Muestra iniciales si no hay avatar
3. ✅ Muestra rol correcto o "Miembro" por defecto
4. ✅ Botón "Conectar" llama a mutation al hacer click
5. ✅ Botón disabled cuando status = 'pending'
6. ✅ Botón muestra "Solicitud enviada" cuando status = 'pending'
7. ✅ Botón muestra "Conectado" cuando status = 'accepted'
8. ✅ Muestra toast en onSuccess
9. ✅ Muestra toast error en onError

**Archivo**: `NewMembersSection.test.tsx`

**Casos**:
1. ✅ Muestra loading skeletons cuando isLoading
2. ✅ Muestra error alert cuando hay error
3. ✅ Muestra empty state cuando users.length === 0
4. ✅ Renderiza NewMemberCard por cada usuario
5. ✅ Pasa user correcto a cada NewMemberCard

### Integration Tests

**Archivo**: `dashboard-integration.test.tsx`

**Casos**:
1. ✅ NewMembersSection + useRecentUsersQuery integración completa
2. ✅ Flujo completo: fetch → render → click Conectar → mutation → status update
3. ✅ Mock de dashboardService retorna data real
4. ✅ Mock de networkService retorna connection status

### E2E Tests (Playwright)

**Archivo**: `dashboard-new-members.spec.ts`

**Casos**:
1. ✅ Usuario ve sección "Nuevos miembros" en Dashboard
2. ✅ Usuario ve 5 nuevos miembros listados
3. ✅ Usuario puede hacer click en "Conectar"
4. ✅ Usuario ve toast "Solicitud enviada"
5. ✅ Botón cambia a "Solicitud enviada" después de click
6. ✅ Empty state visible cuando no hay nuevos miembros

---

## 13. DEPENDENCIAS Y PREREQUISITOS

### NPM Packages (Ya Instalados)

- ✅ `@tanstack/react-query` - React Query
- ✅ `axios` - HTTP client
- ✅ `zod` - Schema validation
- ✅ `lucide-react` - Icons (Users, AlertCircle)
- ✅ `@radix-ui/*` - shadcn/ui base (Avatar, Card, Button, etc.)

### Features Existentes (Ya Implementados)

- ✅ `network` feature - Conexiones y mutations
- ✅ `profile` feature - User profile schema
- ✅ `auth` feature - Current user context

### Backend API (PENDIENTE DE IMPLEMENTAR)

- ❌ `GET /api/users/recent` - **Necesita crearse en backend**

**Requisitos del endpoint**:
```typescript
// Request
GET /api/users/recent?days=30&limit=5

// Response
{
  "users": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "name": "Juan Pérez",
      "avatar_url": "https://...",
      "created_at": "2025-10-20T10:00:00Z",
      "user_roles": [
        {
          "roles": {
            "name": "emprendedor"
          }
        }
      ],
      // ... otros campos de UserProfile
    }
  ],
  "count": 5
}
```

**Query SQL esperada** (referencia para backend):
```sql
SELECT u.*, COUNT(*) OVER() as total_count
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
WHERE u.created_at >= NOW() - INTERVAL '$1 days'
ORDER BY u.created_at DESC
LIMIT $2
```

**IMPORTANTE**: El backend debe hacer JOIN con `user_roles` y `roles` para incluir información del rol.

---

## 14. ORDEN DE IMPLEMENTACIÓN RECOMENDADO

### Fase 1: Backend (Prerequisito)
1. ✅ Crear endpoint `GET /api/users/recent` en backend
2. ✅ Verificar respuesta con Postman/curl
3. ✅ Asegurar que incluye JOIN con user_roles

### Fase 2: Data Layer (Schema + Service)
1. ✅ Crear `dashboard.schema.ts` con schemas Zod
2. ✅ Crear `dashboard.service.ts` con método getRecentUsers
3. ✅ Escribir unit tests para service
4. ✅ Ejecutar tests: `yarn test dashboard.service.test.ts`

### Fase 3: Query Hook
1. ✅ Crear `useRecentUsersQuery.ts` con configuración React Query
2. ✅ Escribir unit tests para hook
3. ✅ Ejecutar tests: `yarn test useRecentUsersQuery.test.ts`

### Fase 4: UI Components
1. ✅ Crear `NewMemberCard.tsx` con integración de network hooks
2. ✅ Escribir unit tests para NewMemberCard
3. ✅ Crear `NewMembersSection.tsx` con estados
4. ✅ Escribir unit tests para NewMembersSection
5. ✅ Ejecutar tests: `yarn test NewMemberCard.test.tsx NewMembersSection.test.tsx`

### Fase 5: Integración en Dashboard
1. ✅ Reemplazar código hardcodeado en `Dashboard.tsx`
2. ✅ Agregar import de `NewMembersSection`
3. ✅ Verificar en dev server: `yarn dev:full`

### Fase 6: Integration & E2E Tests
1. ✅ Escribir integration tests
2. ✅ Escribir E2E tests con Playwright
3. ✅ Ejecutar todos los tests: `yarn test`
4. ✅ Ejecutar E2E: `yarn test:e2e` (o comando que uses para Playwright)

### Fase 7: Manual QA
1. ✅ Verificar loading state (throttle network en DevTools)
2. ✅ Verificar empty state (base de datos sin usuarios recientes)
3. ✅ Verificar error state (detener backend)
4. ✅ Verificar flujo de conexión completo
5. ✅ Verificar estados del botón (pending/accepted)
6. ✅ Verificar toast notifications

---

## 15. CHECKLIST DE VALIDACIÓN PRE-COMMIT

Antes de hacer commit, verificar:

### Código
- [ ] Todos los archivos tienen comentarios ABOUTME (2 líneas)
- [ ] No hay `console.log` olvidados
- [ ] No hay tipos `any`
- [ ] Todos los imports usan paths absolutos con `@/`
- [ ] Nombres de archivos siguen convención (camelCase para funciones, PascalCase para componentes)

### Tests
- [ ] Todos los tests pasan (`yarn test`)
- [ ] Coverage >80% en nuevos archivos
- [ ] E2E tests pasan (`yarn test:e2e`)

### Funcionalidad
- [ ] Loading state funciona correctamente
- [ ] Error state muestra mensaje apropiado
- [ ] Empty state se ve cuando no hay usuarios
- [ ] Botón "Conectar" envía solicitud
- [ ] Toast muestra confirmación
- [ ] Botón cambia a "Solicitud enviada"
- [ ] Avatar muestra imagen o iniciales
- [ ] Rol muestra texto correcto

### Performance
- [ ] No hay re-renders innecesarios (verificar con React DevTools Profiler)
- [ ] Queries usan staleTime/gcTime apropiados
- [ ] No hay memory leaks (verificar con Chrome DevTools)

### Documentación
- [ ] Actualizar `.claude/sessions/context_session_dashboard_new_members.md`
- [ ] Marcar tareas completadas en el archivo de sesión

---

## 16. POSIBLES PROBLEMAS Y SOLUCIONES

### Problema: Backend no retorna user_roles

**Síntoma**: `displayRole` siempre muestra "Miembro"

**Causa**: Backend no hace JOIN con user_roles en el endpoint

**Solución**:
- Verificar query SQL en backend
- Asegurar que incluye:
  ```sql
  LEFT JOIN user_roles ur ON u.id = ur.user_id
  LEFT JOIN roles r ON ur.role_id = r.id
  ```

### Problema: Avatar no se muestra

**Síntoma**: Solo se ven iniciales, nunca imágenes

**Causas posibles**:
1. `avatar_url` es null en base de datos → ESPERADO, usar fallback
2. CORS issue en bucket de Supabase → Verificar configuración de Storage
3. URL inválida → Verificar formato en base de datos

**Solución**:
- Verificar URL en Network tab de DevTools
- Si URL válida pero no carga → problema de CORS o permisos
- Consultar [scripts/setup-storage-manual.md](scripts/setup-storage-manual.md)

### Problema: Query no se invalida después de conectar

**Síntoma**: Status del botón no cambia después de click

**Causa**: `useConnectionStatusQuery` no se refetch

**Solución**:
- Verificar que `useRequestConnectionMutation` invalida `['connection-status']`
- Verificar en React Query DevTools que la invalidación ocurre
- Si no funciona, agregar invalidación manual:
  ```typescript
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['connection-status', user.id] })
  }
  ```

### Problema: Tests fallan con "Cannot find module"

**Síntoma**: Error al importar componentes en tests

**Causa**: Path alias `@/` no configurado en Jest/Vitest

**Solución**:
- Verificar `vite.config.ts` o `vitest.config.ts` tiene:
  ```typescript
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
  ```

### Problema: Toast no se muestra

**Síntoma**: Click en "Conectar" no muestra notificación

**Causas posibles**:
1. `<Toaster />` no está en el árbol de React
2. Callback `onSuccess` no se ejecuta
3. Error en `onError` silenciado

**Solución**:
- Verificar que `App.tsx` incluye `<Toaster />` de shadcn/ui
- Agregar `console.log` en callbacks para debug
- Verificar en React Query DevTools el estado de la mutation

### Problema: Muchos re-renders

**Síntoma**: Performance lenta, componente parpadea

**Causa**: useQuery refetch demasiado frecuente

**Solución**:
- Aumentar `staleTime` de 2min a 5min
- Verificar `refetchOnWindowFocus: false`
- Usar React DevTools Profiler para identificar causa

---

## 17. NOTAS IMPORTANTES PARA IMPLEMENTACIÓN

### COLORES

**IMPORTANTE**: Usar colores definidos en `src/index.css`

```css
/* Tailwind classes disponibles */
- text-primary → Color verde principal
- bg-primary → Fondo verde
- border-primary → Borde verde

/* NO usar colores hardcodeados */
❌ className="text-green-500"  // Incorrecto
✅ className="text-primary"     // Correcto
```

### CONOCIMIENTO DESACTUALIZADO

**React Query v5** (versión actual del proyecto):
- ❌ `cacheTime` → DEPRECATED
- ✅ `gcTime` → Usar este
- ❌ `isLoading` → Ahora es `isPending` en mutations
- ✅ `isPending` → Correcto para v5

**Axios Interceptors**:
- El proyecto YA tiene interceptor configurado para auth
- NO necesitas agregar headers de autorización manualmente
- El token se agrega automáticamente

**TypeScript strict**:
- El proyecto usa `strict: true`
- NO usar `as any`
- Manejar null/undefined explícitamente

### PATRONES DEL PROYECTO

**NO usar**:
- ❌ `fetch()` API → Usar `axios`
- ❌ `useState` para server state → Usar React Query
- ❌ Props drilling → Usar hooks de contexto
- ❌ Inline styles → Usar Tailwind classes

**SÍ usar**:
- ✅ Axios para HTTP
- ✅ React Query para server state
- ✅ Zod schemas para validación
- ✅ Feature-based folder structure
- ✅ shadcn/ui components

### CONVENCIONES DE NOMBRES

**Archivos**:
- Schemas: `{feature}.schema.ts` (singular)
- Services: `{feature}.service.ts` (singular)
- Hooks: `use{Feature}Query.ts` o `use{Feature}Mutation.ts`
- Components: `PascalCase.tsx`

**Funciones**:
- Query hooks: `use{Feature}Query`
- Mutation hooks: `use{Feature}Mutation`
- Service methods: `get{Resource}`, `update{Resource}`, etc.

**Query Keys**:
- Array format: `['feature', 'action', ...params]`
- Ejemplo: `['dashboard', 'recent-users', 30, 5]`

### IMPORTS

**Orden de imports**:
1. React imports
2. Third-party libraries (axios, zod, react-query)
3. Internal features (`@/app/features/...`)
4. UI components (`@/components/ui/...`)
5. Hooks (`@/hooks/...`)
6. Types (`@/types/...`)

**Path aliases**:
- ✅ `@/app/features/...`
- ✅ `@/components/...`
- ✅ `@/hooks/...`
- ❌ `../../../components/...` → NO usar relative paths largos

---

## 18. DECISIONES ARQUITECTÓNICAS CLAVE

### ¿Por qué NO reutilizar UserConnectionCard?

**Razones**:
1. `UserConnectionCard` está diseñado para la página de Network con más información (bio, skills, etc.)
2. Dashboard necesita un card más compacto y simplificado
3. Los requisitos de UI son diferentes (orden de elementos, spacing)
4. Evita sobre-complejizar `UserConnectionCard` con props condicionales

### ¿Por qué 2 componentes separados (Card + Section)?

**Razones**:
1. **Separation of Concerns**: Section maneja datos, Card maneja presentación
2. **Testability**: Más fácil testear cada componente por separado
3. **Reusabilidad**: NewMemberCard podría usarse en otro contexto
4. **Patrón Container/Presentational**: Estándar en React

### ¿Por qué NO usar context para dashboard?

**Razones**:
1. Dashboard no necesita compartir estado entre múltiples componentes
2. React Query ya provee "global state" a través de cache
3. Context agrega complejidad innecesaria para un feature simple
4. useRecentUsersQuery es suficiente para este caso

### ¿Por qué crear nuevo endpoint en lugar de filtrar en frontend?

**Razones**:
1. **Performance**: Filtrar 1000 usuarios en frontend es ineficiente
2. **Network**: Transferir todos los usuarios consume bandwidth innecesario
3. **Escalabilidad**: Con más usuarios (10k+), filtrado en frontend no escala
4. **Backend Responsibility**: La lógica de negocio (qué es "reciente") pertenece al backend

---

## 19. RECURSOS Y REFERENCIAS

### Documentación Oficial

- [React Query v5 Docs](https://tanstack.com/query/latest/docs/react/overview)
- [Zod Documentation](https://zod.dev/)
- [Axios Documentation](https://axios-http.com/docs/intro)
- [shadcn/ui Components](https://ui.shadcn.com/)

### Archivos del Proyecto (Referencias)

**Patrones a seguir**:
- `/src/app/features/network/` - Feature completo de referencia
- `/src/app/features/auth/` - Auth con React Query
- `/src/app/features/profile/` - Profile schemas

**Componentes a revisar**:
- `/src/components/ui/avatar.tsx` - Avatar component
- `/src/components/ui/card.tsx` - Card component
- `/src/components/ui/button.tsx` - Button variants
- `/src/components/ui/skeleton.tsx` - Loading skeleton

**Configuración**:
- `/vite.config.ts` - Path aliases y proxy
- `/src/index.css` - Colores y estilos globales
- `/tsconfig.json` - TypeScript config

### Testing

- `/src/app/features/auth/data/services/auth.service.test.ts` - Ejemplo de service test
- `/.claude/doc/testing-strategy-summary.md` - Estrategia de testing del proyecto

---

## 20. RESUMEN EJECUTIVO

### Archivos a Crear (6 archivos)

1. `src/app/features/dashboard/data/schemas/dashboard.schema.ts` (80 líneas)
2. `src/app/features/dashboard/data/services/dashboard.service.ts` (40 líneas)
3. `src/app/features/dashboard/hooks/queries/useRecentUsersQuery.ts` (35 líneas)
4. `src/app/features/dashboard/components/NewMemberCard.tsx` (120 líneas)
5. `src/app/features/dashboard/components/NewMembersSection.tsx` (80 líneas)
6. `src/app/features/dashboard/data/services/dashboard.service.test.ts` (Tests)

### Archivos a Modificar (1 archivo)

1. `src/components/dashboard/Dashboard.tsx` (eliminar líneas 215-245, agregar import + component)

### Prerequisitos Backend

- Endpoint `GET /api/users/recent?days=30&limit=5` debe existir
- Debe retornar usuarios con JOIN de user_roles

### Tests a Escribir

- Unit tests: 4 archivos de test (service, hook, 2 componentes)
- Integration test: 1 archivo
- E2E test: 1 archivo (Playwright)

### Estimación de Esfuerzo

- Backend endpoint: 2-3 horas
- Frontend implementation: 4-5 horas
- Testing: 3-4 horas
- QA manual: 1 hora
- **Total**: 10-13 horas

---

## 21. PRÓXIMOS PASOS

### Inmediatos

1. ✅ **Iban**: Revisar y aprobar este plan
2. ✅ **Backend**: Implementar endpoint `GET /api/users/recent`
3. ✅ **Frontend**: Implementar data layer (schemas + service)

### Secuenciales

4. ✅ Implementar query hook
5. ✅ Implementar UI components
6. ✅ Integrar en Dashboard.tsx
7. ✅ Escribir tests
8. ✅ QA manual
9. ✅ Code review
10. ✅ Deploy

### Futuras Mejoras (Backlog)

- [ ] Mostrar contador "5 de 12 nuevos miembros"
- [ ] Botón "Ver todos" que lleva a página de Network
- [ ] Filtro por rol en nuevos miembros
- [ ] Destacar miembros con perfiles completos
- [ ] Animación de entrada para nuevos miembros

---

**Fin del Plan de Implementación Frontend**

Este documento debe ser tu guía completa para implementar el feature de Dashboard New Members. Cualquier duda sobre decisiones técnicas o arquitectónicas, consulta este documento antes de proceder.

**Regla de Oro**: Si algo no está documentado aquí y tienes dudas, pregunta a Iban antes de asumir.
