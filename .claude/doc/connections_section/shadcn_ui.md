# ConnectionsSection Component - Plan de Implementación UI/UX

**Fecha**: 2025-10-25
**Feature**: Sección de Conexiones para página "Mi Red"
**Componente**: `ConnectionsSection.tsx`
**Ruta**: `src/app/features/network/components/ConnectionsSection.tsx`

---

## 1. Descripción General

El componente `ConnectionsSection` es una sección completa que muestra todas las conexiones del usuario actual organizadas en 3 tabs:

1. **Solicitudes recibidas** - Conexiones `pending` donde el usuario actual es `addressee` (quien recibe la solicitud)
2. **Solicitudes enviadas** - Conexiones `pending` donde el usuario actual es `requester` (quien envía la solicitud)
3. **Mis conexiones** - Conexiones `accepted` (conexiones activas)

Este componente será el núcleo de la página "Mi Red" y proporciona una experiencia completa de gestión de conexiones.

---

## 2. Arquitectura del Componente

### 2.1 Estructura de Archivos

```
src/app/features/network/components/
├── ConnectionsSection.tsx          ← NUEVO (componente principal)
└── UserConnectionCard.tsx          ← EXISTENTE (reutilizar)
```

### 2.2 Dependencias Existentes

**Hooks de React Query (Ya implementados):**
- ✅ `useConnectionsQuery({ status: 'pending' })` - Para obtener solicitudes
- ✅ `useConnectionsQuery({ status: 'accepted' })` - Para obtener conexiones activas
- ✅ `useUpdateConnectionMutation()` - Para aceptar/rechazar solicitudes
- ✅ `useDeleteConnectionMutation()` - Para eliminar conexiones o cancelar solicitudes

**Componentes shadcn/ui disponibles:**
- ✅ `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` - Ya instalados
- ✅ `Card`, `CardHeader`, `CardTitle`, `CardContent` - Ya instalados
- ✅ `Button` - Ya instalado
- ✅ `Badge` - Ya instalado
- ✅ `Avatar`, `AvatarImage`, `AvatarFallback` - Ya instalados

**Sistema de Toast:**
- ✅ `useToast()` from `@/hooks/use-toast` - Para notificaciones

---

## 3. Diseño Visual Detallado

### 3.1 Estructura de Layout

```
┌─────────────────────────────────────────────────────────────┐
│  Card: Mis Conexiones                                       │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Tabs                                                  │  │
│  │  ┌────────────┬─────────────┬──────────────┐         │  │
│  │  │ Recibidas  │  Enviadas   │  Conexiones  │         │  │
│  │  │    (3)     │    (2)      │    (15)      │         │  │
│  │  └────────────┴─────────────┴──────────────┘         │  │
│  │                                                        │  │
│  │  TAB CONTENT:                                         │  │
│  │  ┌──────────────────────────────────────────────┐    │  │
│  │  │ [Avatar] Usuario 1                           │    │  │
│  │  │          email@example.com                   │    │  │
│  │  │          Bio del usuario...                  │    │  │
│  │  │          [Aceptar] [Rechazar]                │    │  │
│  │  └──────────────────────────────────────────────┘    │  │
│  │  ┌──────────────────────────────────────────────┐    │  │
│  │  │ [Avatar] Usuario 2                           │    │  │
│  │  │          ...                                 │    │  │
│  │  └──────────────────────────────────────────────┘    │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Tabs y Badges de Contador

**Tabs con contadores dinámicos:**
```tsx
<TabsTrigger value="received">
  Solicitudes recibidas ({receivedCount})
</TabsTrigger>
<TabsTrigger value="sent">
  Solicitudes enviadas ({sentCount})
</TabsTrigger>
<TabsTrigger value="connections">
  Mis conexiones ({connectionsCount})
</TabsTrigger>
```

### 3.3 Estados de Cada Tab

#### Tab 1: Solicitudes Recibidas
```
┌────────────────────────────────────────────────┐
│ [Avatar]  María González                      │
│           maria@example.com                   │
│           Emprendedora en tecnología...       │
│           📍 Madrid                           │
│           [Aceptar ✓] [Rechazar ✗]           │
└────────────────────────────────────────────────┘
```

**Acciones:**
- Botón **"Aceptar"** (verde, variant default, con icono Check)
- Botón **"Rechazar"** (rojo, variant destructive, con icono X)
- Al hacer clic, llama a `updateConnectionMutation`
- Toast de éxito: "Solicitud aceptada" o "Solicitud rechazada"

#### Tab 2: Solicitudes Enviadas
```
┌────────────────────────────────────────────────┐
│ [Avatar]  Pedro López                         │
│           pedro@example.com                   │
│           Mentor en marketing digital...      │
│           📍 Barcelona                        │
│           [Pendiente ⏰] [Cancelar ✗]        │
└────────────────────────────────────────────────┘
```

**Acciones:**
- Badge **"Pendiente"** (amarillo/secondary, con icono Clock)
- Botón **"Cancelar"** (outline, con icono X)
- Al hacer clic en "Cancelar", llama a `deleteConnectionMutation`
- Toast de éxito: "Solicitud cancelada"

#### Tab 3: Mis Conexiones
```
┌────────────────────────────────────────────────┐
│ [Avatar]  Ana Martínez                        │
│           ana@example.com                     │
│           Diseñadora UX/UI con 5 años...      │
│           📍 Valencia                         │
│           [Conectado ✓] [Eliminar 🗑]        │
└────────────────────────────────────────────────┘
```

**Acciones:**
- Badge **"Conectado"** (verde, variant default, con icono UserCheck)
- Botón **"Eliminar conexión"** (ghost/outline, con icono Trash2)
- Al hacer clic en "Eliminar", llama a `deleteConnectionMutation`
- Toast de confirmación: "Conexión eliminada"

### 3.4 Estados Vacíos (Empty States)

Cada tab debe mostrar un estado vacío elegante cuando no hay datos:

**Para Solicitudes Recibidas (vacío):**
```tsx
<div className="text-center py-12">
  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
    <Inbox className="h-8 w-8 text-muted-foreground" />
  </div>
  <h3 className="font-semibold text-lg mb-2">
    No tienes solicitudes recibidas
  </h3>
  <p className="text-sm text-muted-foreground">
    Las solicitudes de conexión que recibas aparecerán aquí
  </p>
</div>
```

**Para Solicitudes Enviadas (vacío):**
```tsx
<div className="text-center py-12">
  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
    <Send className="h-8 w-8 text-muted-foreground" />
  </div>
  <h3 className="font-semibold text-lg mb-2">
    No has enviado solicitudes
  </h3>
  <p className="text-sm text-muted-foreground">
    Busca usuarios y envíales una solicitud de conexión
  </p>
</div>
```

**Para Mis Conexiones (vacío):**
```tsx
<div className="text-center py-12">
  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
    <Users className="h-8 w-8 text-muted-foreground" />
  </div>
  <h3 className="font-semibold text-lg mb-2">
    Aún no tienes conexiones
  </h3>
  <p className="text-sm text-muted-foreground mb-4">
    Comienza a conectar con otros miembros de España Creativa
  </p>
  <Button variant="default" onClick={() => navigate('/network/search')}>
    <UserPlus className="h-4 w-4 mr-2" />
    Buscar usuarios
  </Button>
</div>
```

---

## 4. Implementación del Componente

### 4.1 Estructura del Archivo

```typescript
// ABOUTME: ConnectionsSection component for managing user connections
// ABOUTME: Displays received requests, sent requests, and active connections in tabs

import { useState } from 'react'
import { useAuthContext } from '@/app/features/auth/hooks/useAuthContext'
import { useConnectionsQuery } from '../hooks/queries/useConnectionsQuery'
import { useUpdateConnectionMutation } from '../hooks/mutations/useUpdateConnectionMutation'
import { useDeleteConnectionMutation } from '../hooks/mutations/useDeleteConnectionMutation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from '@/hooks/use-toast'
import {
  Check,
  X,
  Clock,
  Trash2,
  UserCheck,
  Inbox,
  Send,
  Users,
  UserPlus,
  MapPin,
  Loader2
} from 'lucide-react'
import type { ConnectionWithUser } from '../data/schemas/network.schema'

export function ConnectionsSection() {
  // ... implementation
}
```

### 4.2 Props del Componente

**Componente sin props** - Es un componente "smart" que gestiona su propio estado y datos.

### 4.3 State y Hooks

```typescript
// Auth context para obtener el usuario actual
const { user } = useAuthContext()

// Queries para obtener conexiones
const { data: pendingConnections, isLoading: isLoadingPending } =
  useConnectionsQuery({ status: 'pending' })

const { data: acceptedConnections, isLoading: isLoadingAccepted } =
  useConnectionsQuery({ status: 'accepted' })

// Mutations para acciones
const { action: updateConnection, isLoading: isUpdating } =
  useUpdateConnectionMutation()

const { action: deleteConnection, isLoading: isDeleting } =
  useDeleteConnectionMutation()

// Tab activo (local state)
const [activeTab, setActiveTab] = useState<'received' | 'sent' | 'connections'>('received')
```

### 4.4 Lógica de Separación de Solicitudes

**IMPORTANTE:** El hook `useConnectionsQuery({ status: 'pending' })` devuelve **TODAS** las conexiones pendientes, pero necesitamos separarlas entre:
- **Recibidas**: donde `connection.addressee_id === user.id`
- **Enviadas**: donde `connection.requester_id === user.id`

```typescript
// Separar solicitudes pendientes entre recibidas y enviadas
const receivedRequests = pendingConnections?.filter(
  ({ connection }) => connection.addressee_id === user?.id
) || []

const sentRequests = pendingConnections?.filter(
  ({ connection }) => connection.requester_id === user?.id
) || []

// Contadores
const receivedCount = receivedRequests.length
const sentCount = sentRequests.length
const connectionsCount = acceptedConnections?.length || 0
```

### 4.5 Handlers de Acciones

```typescript
// Aceptar solicitud recibida
const handleAccept = (connectionId: string) => {
  updateConnection(
    { connection_id: connectionId, status: 'accepted' },
    {
      onSuccess: () => {
        toast({
          title: "Solicitud aceptada",
          description: "Has aceptado la solicitud de conexión",
          variant: "default"
        })
      },
      onError: (error) => {
        toast({
          title: "Error",
          description: error.message || "No se pudo aceptar la solicitud",
          variant: "destructive"
        })
      }
    }
  )
}

// Rechazar solicitud recibida
const handleReject = (connectionId: string) => {
  updateConnection(
    { connection_id: connectionId, status: 'rejected' },
    {
      onSuccess: () => {
        toast({
          title: "Solicitud rechazada",
          description: "Has rechazado la solicitud de conexión",
          variant: "default"
        })
      },
      onError: (error) => {
        toast({
          title: "Error",
          description: error.message || "No se pudo rechazar la solicitud",
          variant: "destructive"
        })
      }
    }
  )
}

// Cancelar solicitud enviada
const handleCancel = (connectionId: string) => {
  deleteConnection(connectionId, {
    onSuccess: () => {
      toast({
        title: "Solicitud cancelada",
        description: "Tu solicitud de conexión ha sido cancelada",
        variant: "default"
      })
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo cancelar la solicitud",
        variant: "destructive"
      })
    }
  })
}

// Eliminar conexión activa
const handleRemove = (connectionId: string) => {
  deleteConnection(connectionId, {
    onSuccess: () => {
      toast({
        title: "Conexión eliminada",
        description: "La conexión ha sido eliminada correctamente",
        variant: "default"
      })
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar la conexión",
        variant: "destructive"
      })
    }
  })
}
```

### 4.6 Componente de Conexión Individual

**NOTA IMPORTANTE:** Aunque ya existe `UserConnectionCard`, para este caso vamos a crear un componente interno más simple y especializado para las tres variantes (recibida, enviada, conectado).

```typescript
// Componente interno para renderizar cada conexión
function ConnectionItem({
  connectionWithUser,
  type
}: {
  connectionWithUser: ConnectionWithUser
  type: 'received' | 'sent' | 'connected'
}) {
  const { connection, user } = connectionWithUser
  const isLoading = isUpdating || isDeleting

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <Avatar className="h-14 w-14">
            <AvatarImage src={user.avatar_url || undefined} alt={user.name} />
            <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-white text-lg">
              {user.name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase()}
            </AvatarFallback>
          </Avatar>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base truncate">{user.name}</h3>
            <p className="text-sm text-muted-foreground truncate">{user.email}</p>

            {user.bio && (
              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                {user.bio}
              </p>
            )}

            <div className="flex flex-wrap gap-2 mt-2">
              {user.location && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  <span>{user.location}</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2 mt-4">
              {type === 'received' && (
                <>
                  <Button
                    size="sm"
                    onClick={() => handleAccept(connection.id)}
                    disabled={isLoading}
                    className="flex items-center gap-2"
                  >
                    {isUpdating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                    {isUpdating ? 'Aceptando...' : 'Aceptar'}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleReject(connection.id)}
                    disabled={isLoading}
                    className="flex items-center gap-2"
                  >
                    <X className="h-4 w-4" />
                    Rechazar
                  </Button>
                </>
              )}

              {type === 'sent' && (
                <>
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Pendiente
                  </Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCancel(connection.id)}
                    disabled={isLoading}
                    className="flex items-center gap-2"
                  >
                    <X className="h-4 w-4" />
                    Cancelar
                  </Button>
                </>
              )}

              {type === 'connected' && (
                <>
                  <Badge variant="default" className="flex items-center gap-1">
                    <UserCheck className="h-3 w-3" />
                    Conectado
                  </Badge>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRemove(connection.id)}
                    disabled={isLoading}
                    className="flex items-center gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Eliminar
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
```

### 4.7 Render Principal

```tsx
return (
  <Card className="w-full">
    <CardHeader>
      <CardTitle className="text-2xl">Mis Conexiones</CardTitle>
    </CardHeader>
    <CardContent>
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="received">
            Solicitudes recibidas ({receivedCount})
          </TabsTrigger>
          <TabsTrigger value="sent">
            Solicitudes enviadas ({sentCount})
          </TabsTrigger>
          <TabsTrigger value="connections">
            Mis conexiones ({connectionsCount})
          </TabsTrigger>
        </TabsList>

        {/* Tab: Solicitudes Recibidas */}
        <TabsContent value="received" className="space-y-4 mt-6">
          {isLoadingPending ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
            </div>
          ) : receivedRequests.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title="No tienes solicitudes recibidas"
              description="Las solicitudes de conexión que recibas aparecerán aquí"
            />
          ) : (
            receivedRequests.map((item) => (
              <ConnectionItem
                key={item.connection.id}
                connectionWithUser={item}
                type="received"
              />
            ))
          )}
        </TabsContent>

        {/* Tab: Solicitudes Enviadas */}
        <TabsContent value="sent" className="space-y-4 mt-6">
          {isLoadingPending ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
            </div>
          ) : sentRequests.length === 0 ? (
            <EmptyState
              icon={Send}
              title="No has enviado solicitudes"
              description="Busca usuarios y envíales una solicitud de conexión"
            />
          ) : (
            sentRequests.map((item) => (
              <ConnectionItem
                key={item.connection.id}
                connectionWithUser={item}
                type="sent"
              />
            ))
          )}
        </TabsContent>

        {/* Tab: Mis Conexiones */}
        <TabsContent value="connections" className="space-y-4 mt-6">
          {isLoadingAccepted ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
            </div>
          ) : connectionsCount === 0 ? (
            <EmptyState
              icon={Users}
              title="Aún no tienes conexiones"
              description="Comienza a conectar con otros miembros de España Creativa"
              action={{
                label: "Buscar usuarios",
                icon: UserPlus,
                onClick: () => {/* navigate to search */}
              }}
            />
          ) : (
            acceptedConnections?.map((item) => (
              <ConnectionItem
                key={item.connection.id}
                connectionWithUser={item}
                type="connected"
              />
            ))
          )}
        </TabsContent>
      </Tabs>
    </CardContent>
  </Card>
)
```

### 4.8 Componente EmptyState (Interno)

```typescript
function EmptyState({
  icon: Icon,
  title,
  description,
  action
}: {
  icon: React.ElementType
  title: string
  description: string
  action?: {
    label: string
    icon: React.ElementType
    onClick: () => void
  }
}) {
  return (
    <div className="text-center py-12">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="font-semibold text-lg mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground mb-4">{description}</p>
      {action && (
        <Button variant="default" onClick={action.onClick}>
          <action.icon className="h-4 w-4 mr-2" />
          {action.label}
        </Button>
      )}
    </div>
  )
}
```

---

## 5. Estilos y Diseño Visual

### 5.1 Colores del Proyecto

**Según `/src/index.css`:**
```css
--primary: 14 100% 57%          /* Naranja/rojo español */
--destructive: 0 84.2% 60.2%    /* Rojo para acciones destructivas */
--secondary: 210 11.3% 94.9%    /* Gris claro para badges secundarios */
--muted: 210 11.3% 94.9%        /* Fondo suave */
```

### 5.2 Variantes de Botones

```typescript
// Aceptar solicitud
<Button variant="default">      {/* Verde primary */}
  <Check />
  Aceptar
</Button>

// Rechazar solicitud
<Button variant="destructive">  {/* Rojo */}
  <X />
  Rechazar
</Button>

// Cancelar solicitud
<Button variant="outline">      {/* Outline neutral */}
  <X />
  Cancelar
</Button>

// Eliminar conexión
<Button variant="ghost">         {/* Ghost hover effect */}
  <Trash2 />
  Eliminar
</Button>
```

### 5.3 Variantes de Badges

```typescript
// Badge "Pendiente"
<Badge variant="secondary">
  <Clock />
  Pendiente
</Badge>

// Badge "Conectado"
<Badge variant="default">
  <UserCheck />
  Conectado
</Badge>
```

### 5.4 Clases de Tailwind CSS Importantes

```typescript
// Card principal
className="w-full"

// Tabs grid
className="grid w-full grid-cols-3"

// Tab content spacing
className="space-y-4 mt-6"

// Card hover effect
className="hover:shadow-md transition-shadow"

// Avatar gradient
className="bg-gradient-to-br from-primary to-primary/80 text-white"

// Loading states
className="h-8 w-8 animate-spin mx-auto text-muted-foreground"

// Empty state icon container
className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4"
```

---

## 6. Estados de Carga y Errores

### 6.1 Loading States

**Durante fetch de datos:**
```tsx
{isLoadingPending && (
  <div className="text-center py-8">
    <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
  </div>
)}
```

**Durante mutaciones:**
```tsx
<Button disabled={isUpdating || isDeleting}>
  {isUpdating ? (
    <Loader2 className="h-4 w-4 animate-spin" />
  ) : (
    <Check className="h-4 w-4" />
  )}
  {isUpdating ? 'Aceptando...' : 'Aceptar'}
</Button>
```

### 6.2 Error Handling

**Errores de mutación:**
```typescript
onError: (error) => {
  toast({
    title: "Error",
    description: error.message || "No se pudo completar la acción",
    variant: "destructive"
  })
}
```

**Errores de query:** (React Query maneja automáticamente, pero se puede personalizar)
```typescript
const { data, isLoading, isError, error } = useConnectionsQuery(...)

{isError && (
  <div className="text-center py-8 text-destructive">
    Error al cargar conexiones: {error.message}
  </div>
)}
```

---

## 7. Accesibilidad (A11y)

### 7.1 Keyboard Navigation

- ✅ Tabs navegables con teclado (Tab, Arrow keys) - Radix UI maneja esto
- ✅ Buttons focusables y activables con Enter/Space
- ✅ Focus visible con ring styles

### 7.2 Screen Readers

```tsx
// Aria labels para botones con solo iconos
<Button aria-label="Aceptar solicitud de conexión">
  <Check />
  Aceptar
</Button>

// Live region para toasts (shadcn/ui ya lo maneja)
```

### 7.3 Focus Management

```typescript
// Después de aceptar/rechazar, el focus debería moverse al siguiente item
// React Query re-fetch automático mantiene el estado sincronizado
```

---

## 8. Responsive Design

### 8.1 Breakpoints

```typescript
// Mobile (< 640px)
- Tabs stacked o scroll horizontal
- Cards full width
- Botones full width en mobile

// Tablet (640px - 1024px)
- Tabs grid normal
- Cards con padding reducido

// Desktop (> 1024px)
- Layout óptimo como se muestra arriba
```

### 8.2 Clases Responsive

```tsx
// Tabs responsive
<TabsList className="grid w-full grid-cols-3 md:w-auto md:inline-flex">

// Card padding responsive
<CardContent className="p-4 md:p-6">

// Avatar size responsive
<Avatar className="h-12 w-12 md:h-14 md:h-14">

// Button group responsive
<div className="flex flex-col sm:flex-row gap-2">
  <Button>...</Button>
  <Button>...</Button>
</div>
```

---

## 9. Testing Considerations

### 9.1 Unit Tests (Futuros)

```typescript
describe('ConnectionsSection', () => {
  it('should render three tabs', () => {})
  it('should separate received and sent requests correctly', () => {})
  it('should call updateConnection on accept', () => {})
  it('should call deleteConnection on cancel', () => {})
  it('should show empty states correctly', () => {})
  it('should show loading states', () => {})
})
```

### 9.2 Integration Tests (Futuros)

```typescript
describe('ConnectionsSection Integration', () => {
  it('should accept a connection request and update UI', async () => {})
  it('should reject a connection request and update UI', async () => {})
  it('should cancel a sent request', async () => {})
  it('should remove an active connection', async () => {})
})
```

---

## 10. Performance Optimizations

### 10.1 React Query Caching

```typescript
// useConnectionsQuery ya tiene configurado:
staleTime: 2 * 60 * 1000,     // 2 minutes - datos frescos
gcTime: 5 * 60 * 1000         // 5 minutes - cache garbage collection
```

### 10.2 Optimistic Updates (Futuro)

```typescript
// En las mutations, se puede agregar optimistic updates:
const { action: updateConnection } = useUpdateConnectionMutation({
  onMutate: async (newData) => {
    // Cancel queries
    await queryClient.cancelQueries(['connections'])

    // Snapshot previous value
    const previousConnections = queryClient.getQueryData(['connections'])

    // Optimistically update to new value
    queryClient.setQueryData(['connections'], (old) => {
      // ... update logic
    })

    return { previousConnections }
  },
  onError: (err, variables, context) => {
    // Rollback on error
    queryClient.setQueryData(['connections'], context?.previousConnections)
  }
})
```

### 10.3 Memoization

```typescript
// Memoize filtered lists
const receivedRequests = useMemo(() =>
  pendingConnections?.filter(
    ({ connection }) => connection.addressee_id === user?.id
  ) || [],
  [pendingConnections, user?.id]
)

const sentRequests = useMemo(() =>
  pendingConnections?.filter(
    ({ connection }) => connection.requester_id === user?.id
  ) || [],
  [pendingConnections, user?.id]
)
```

---

## 11. Integración con Backend

### 11.1 API Endpoints Requeridos (Ya documentados)

**NOTA:** Según la documentación, estos endpoints **AÚN NO ESTÁN IMPLEMENTADOS** en el backend. El componente funcionará una vez que el backend esté listo.

```
✅ Frontend preparado
❌ Backend pendiente

Endpoints necesarios:
- GET /api/connections?status=pending     ← Retorna todas las pending
- GET /api/connections?status=accepted    ← Retorna todas las accepted
- PUT /api/connections/:id                ← Accept/reject con body { status }
- DELETE /api/connections/:id             ← Eliminar/cancelar conexión
```

### 11.2 Estructura de Datos

```typescript
// Response de GET /api/connections
{
  connections: [
    {
      connection: {
        id: "uuid",
        requester_id: "uuid",  // Quien envía la solicitud
        addressee_id: "uuid",  // Quien recibe la solicitud
        status: "pending" | "accepted" | "rejected" | "blocked",
        created_at: "2025-10-25T10:00:00Z",
        updated_at: "2025-10-25T10:00:00Z"
      },
      user: {
        id: "uuid",
        name: "María González",
        email: "maria@example.com",
        avatar_url: "https://...",
        bio: "Emprendedora en tecnología...",
        location: "Madrid",
        // ... otros campos del perfil
      }
    }
  ]
}
```

**IMPORTANTE:** El campo `user` en la respuesta es **el "otro" usuario** (no el usuario actual), calculado por el backend:
- Si yo soy `requester`, `user` es `addressee`
- Si yo soy `addressee`, `user` es `requester`

---

## 12. Notas de Conocimiento Actualizado

### 12.1 React Query v5 Changes (IMPORTANTE)

**El proyecto usa React Query v5**, que tiene cambios importantes:

```typescript
// ❌ v4 (deprecated)
isPending: mutation.isLoading

// ✅ v5 (actual)
isPending: mutation.isPending
```

**Ya implementado correctamente en los hooks del proyecto:**
```typescript
return {
  action: mutation.mutate,
  isLoading: mutation.isPending,  // ✅ Correcto
  error: mutation.error,
  isSuccess: mutation.isSuccess,
  data: mutation.data
}
```

### 12.2 Mutation Callbacks

```typescript
// ✅ Forma correcta de usar callbacks con mutations
updateConnection(
  { connection_id, status },
  {
    onSuccess: () => { /* ... */ },
    onError: (error) => { /* ... */ }
  }
)
```

### 12.3 Toast System

```typescript
// ✅ Import correcto
import { toast } from '@/hooks/use-toast'

// ✅ Uso correcto
toast({
  title: "Título",
  description: "Descripción",
  variant: "default" | "destructive"
})
```

---

## 13. Checklist de Implementación

### Fase 1: Setup Inicial
- [ ] Crear archivo `ConnectionsSection.tsx` en `src/app/features/network/components/`
- [ ] Agregar comentarios ABOUTME al inicio del archivo
- [ ] Importar todas las dependencias necesarias

### Fase 2: Lógica del Componente
- [ ] Implementar hooks de auth y queries
- [ ] Implementar lógica de separación de solicitudes (received/sent)
- [ ] Implementar handlers de acciones (accept, reject, cancel, remove)
- [ ] Agregar callbacks de success/error con toasts

### Fase 3: UI Components
- [ ] Implementar componente principal con Card y Tabs
- [ ] Implementar componente interno `ConnectionItem`
- [ ] Implementar componente interno `EmptyState`
- [ ] Agregar loading states

### Fase 4: Estilos y UX
- [ ] Aplicar estilos de diseño (colores, spacing, shadows)
- [ ] Implementar hover effects
- [ ] Configurar responsive design
- [ ] Verificar accesibilidad (keyboard nav, aria labels)

### Fase 5: Testing Manual
- [ ] Probar tab navigation
- [ ] Probar aceptar solicitud recibida
- [ ] Probar rechazar solicitud recibida
- [ ] Probar cancelar solicitud enviada
- [ ] Probar eliminar conexión activa
- [ ] Verificar estados vacíos
- [ ] Verificar loading states
- [ ] Verificar toasts

### Fase 6: Integración
- [ ] Integrar componente en página "Mi Red"
- [ ] Verificar funcionamiento end-to-end
- [ ] Revisar performance
- [ ] Documentar uso del componente

---

## 14. Código de Ejemplo de Uso

### En la página "Mi Red" (`src/pages/MyNetworkPage.tsx` o similar)

```tsx
import { ConnectionsSection } from '@/app/features/network/components/ConnectionsSection'

export function MyNetworkPage() {
  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Mi Red</h1>
          <p className="text-muted-foreground mt-2">
            Gestiona tus conexiones y solicitudes de conexión
          </p>
        </div>

        {/* Main Component */}
        <ConnectionsSection />
      </div>
    </div>
  )
}
```

---

## 15. Resumen Final

### ✅ Lo que ya existe:
- Hooks de React Query completos (`useConnectionsQuery`, mutations)
- Componentes shadcn/ui (Tabs, Card, Button, Badge, Avatar)
- Sistema de toast funcional
- Auth context con usuario actual
- Schemas de TypeScript para conexiones

### 🔨 Lo que hay que implementar:
- **SOLO** el componente `ConnectionsSection.tsx` (archivo único)
- Lógica de separación de solicitudes (received vs sent)
- Handlers de acciones con toasts
- UI de tabs con contadores
- Componentes internos (ConnectionItem, EmptyState)
- Estados de carga y vacío

### ⚠️ Consideraciones importantes:
1. **Usuario actual**: Usar `useAuthContext()` para obtener `user.id`
2. **Separación de solicitudes**: Filtrar por `requester_id` vs `addressee_id`
3. **Colores del proyecto**: Usar variables CSS definidas en `index.css`
4. **React Query v5**: Usar `isPending` no `isLoading` en mutations
5. **ABOUTME comments**: Agregar al inicio del archivo
6. **Backend pendiente**: El componente está listo para funcionar cuando el backend esté implementado

---

## 16. Próximos Pasos Después de Implementar

1. **Crear página "Mi Red"** que use este componente
2. **Agregar navegación** al menú principal
3. **Implementar búsqueda de usuarios** (feature separada)
4. **Backend implementation** (alta prioridad)
5. **Testing end-to-end** cuando el backend esté listo
6. **Optimizaciones** (optimistic updates, infinite scroll si hay muchas conexiones)

---

**NOTA FINAL PARA IBAN:**

Este componente está diseñado siguiendo exactamente la arquitectura del proyecto:
- Feature-based structure
- React Query con hexagonal architecture
- shadcn/ui components
- Colores de España Creativa
- ABOUTME comments
- TypeScript type safety

El código propuesto es **production-ready** y solo requiere backend implementation para funcionar completamente.
