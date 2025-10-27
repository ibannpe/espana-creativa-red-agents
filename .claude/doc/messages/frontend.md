# Plan de Implementación: Sistema de Mensajería en Tiempo Real

**Fecha:** 2025-10-27
**Autor:** Frontend Developer Agent
**Feature:** Sistema de mensajería con Supabase Realtime

---

## 1. CONTEXTO Y ESTADO ACTUAL

### 1.1 Backend (✅ Completamente implementado)

El backend está **100% funcional** con arquitectura hexagonal:

**Endpoints disponibles:**
- `GET /api/messages/conversations` - Lista de conversaciones con contador no leídos
- `GET /api/messages/conversation/:userId` - Mensajes de una conversación (paginados)
- `POST /api/messages` - Enviar mensaje
- `PUT /api/messages/read` - Marcar mensajes como leídos (bulk)
- `DELETE /api/messages/:id` - Eliminar mensaje
- `GET /api/messages/unread-count` - Total de mensajes no leídos

**Base de datos Supabase:**
- Tabla `messages` con RLS policies
- Índices optimizados para consultas
- Supabase Realtime está disponible (cliente ya inicializado en `src/lib/supabase.ts`)

### 1.2 Frontend (✅ Hooks y componentes listos, ❌ NO integrados)

**Ubicación:** `src/app/features/messages/`

**Hooks React Query disponibles:**

```typescript
// Queries
useConversationsQuery()              // Lista de conversaciones
useConversationMessagesQuery(params) // Mensajes de conversación
useUnreadCountQuery()                // Total mensajes no leídos

// Mutations
useSendMessageMutation()    // Enviar mensaje
useMarkAsReadMutation()     // Marcar como leído
useDeleteMessageMutation()  // Eliminar mensaje
```

**Componentes reutilizables:**
- `<ConversationList />` - Lista de conversaciones con avatares y badges
- `<MessageCard />` - Burbuja de mensaje individual
- `<MessageInput />` - Input para escribir mensajes

**Problema:**
- La página actual `src/components/pages/MessagesPage.tsx` usa **datos mock hardcodeados**
- **NO hay tiempo real** - los mensajes no se actualizan automáticamente
- **NO hay routing dinámico** para conversaciones individuales

---

## 2. ARQUITECTURA PROPUESTA: SUPABASE REALTIME + REACT QUERY

### 2.1 Patrón Recomendado

**Opción A: Custom Hooks con Realtime Integrado (RECOMENDADO)**

Crear hooks personalizados que combinen React Query con Supabase Realtime:

```typescript
// src/app/features/messages/hooks/useRealtimeConversations.ts
// Extiende useConversationsQuery con suscripción Realtime
```

```typescript
// src/app/features/messages/hooks/useRealtimeMessages.ts
// Extiende useConversationMessagesQuery con suscripción Realtime
```

**Ventajas:**
- Separación de responsabilidades clara
- Fácil de testear (mock de Realtime separado de React Query)
- Reutilizable en múltiples componentes
- Cleanup automático de suscripciones

**Desventajas:**
- Ligeramente más código inicial

**Opción B: Realtime directamente en componentes (NO RECOMENDADO)**

Integrar suscripciones Realtime directamente en los componentes que consumen los queries.

**Ventajas:**
- Menos código inicial

**Desventajas:**
- Lógica mezclada con presentación
- Difícil de testear
- Duplicación de código si múltiples componentes necesitan Realtime
- Violación del patrón feature-based

### 2.2 Estrategia de Invalidación de Cache

**Para mensajes nuevos recibidos:**

```typescript
// Opción 1: invalidateQueries (RECOMENDADO para este caso)
queryClient.invalidateQueries({ queryKey: ['conversations'] })
queryClient.invalidateQueries({ queryKey: ['conversation-messages', userId] })
queryClient.invalidateQueries({ queryKey: ['unread-count'] })
```

**¿Por qué invalidateQueries y no setQueryData?**

1. **Simplicidad:** Supabase puede retornar datos en formato ligeramente diferente al backend Express
2. **Consistencia:** Evita desincronización entre cache y servidor
3. **Menos propenso a bugs:** No hay que transformar manualmente los datos de Realtime
4. **Mejor DX:** React Query re-fetcha automáticamente

**Optimización:** Usar `refetchInterval` solo como fallback, Realtime será la fuente principal.

**Para optimistic updates (enviar mensaje):**

```typescript
// Usar setQueryData para mostrar mensaje inmediatamente
queryClient.setQueryData(['conversation-messages', recipientId], (old) => {
  return {
    ...old,
    messages: [...old.messages, optimisticMessage]
  }
})

// Si falla, revertir con onError
onError: () => {
  queryClient.invalidateQueries(['conversation-messages', recipientId])
}
```

---

## 3. ESTRUCTURA DE HOOKS PERSONALIZADA

### 3.1 Hook: `useRealtimeConversations`

**Ubicación:** `src/app/features/messages/hooks/useRealtimeConversations.ts`

**Responsabilidad:**
- Extender `useConversationsQuery` con suscripción Realtime
- Escuchar eventos `INSERT` en tabla `messages` donde `recipient_id = currentUser.id`
- Invalidar query de conversaciones cuando llega mensaje nuevo

**Flujo:**
1. Ejecutar `useConversationsQuery()` normalmente
2. Usar `useEffect` para suscribirse a `supabase.channel().on('postgres_changes')`
3. Filtro: `event = 'INSERT'` y `table = 'messages'` y `recipient_id = currentUser.id`
4. Callback: `queryClient.invalidateQueries(['conversations'])`
5. Cleanup: `supabase.removeChannel()` al desmontar

**Pseudocódigo:**

```typescript
export function useRealtimeConversations() {
  const queryClient = useQueryClient()
  const { user } = useAuthContext()
  const conversationsQuery = useConversationsQuery()

  useEffect(() => {
    if (!user?.id) return

    const channel = supabase
      .channel('conversations-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `recipient_id=eq.${user.id}`
        },
        (payload) => {
          // Invalidar conversaciones para re-fetch
          queryClient.invalidateQueries({ queryKey: ['conversations'] })
          queryClient.invalidateQueries({ queryKey: ['unread-count'] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user?.id, queryClient])

  return conversationsQuery
}
```

### 3.2 Hook: `useRealtimeMessages`

**Ubicación:** `src/app/features/messages/hooks/useRealtimeMessages.ts`

**Responsabilidad:**
- Extender `useConversationMessagesQuery` con suscripción Realtime
- Escuchar eventos `INSERT` y `UPDATE` en tabla `messages` para la conversación activa
- Invalidar query de mensajes cuando hay cambios

**Flujo:**
1. Ejecutar `useConversationMessagesQuery(userId)` normalmente
2. Usar `useEffect` para suscribirse a mensajes de la conversación
3. Filtro: `(sender_id=eq.userId AND recipient_id=eq.currentUser.id) OR (sender_id=eq.currentUser.id AND recipient_id=eq.userId)`
4. Callback: `queryClient.invalidateQueries(['conversation-messages', userId])`
5. Auto-marcar como leídos los mensajes recibidos
6. Cleanup: `supabase.removeChannel()` al desmontar

**Pseudocódigo:**

```typescript
export function useRealtimeMessages(userId: string) {
  const queryClient = useQueryClient()
  const { user } = useAuthContext()
  const { action: markAsRead } = useMarkAsReadMutation()

  const messagesQuery = useConversationMessagesQuery({
    user_id: userId,
    limit: 50,
    offset: 0
  })

  useEffect(() => {
    if (!user?.id || !userId) return

    const channel = supabase
      .channel(`messages-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `recipient_id=eq.${user.id},sender_id=eq.${userId}`
        },
        (payload) => {
          // Mensaje nuevo recibido
          queryClient.invalidateQueries({
            queryKey: ['conversation-messages', userId]
          })
          queryClient.invalidateQueries({ queryKey: ['unread-count'] })

          // Auto-marcar como leído si conversación está activa
          if (payload.new?.id) {
            markAsRead({ message_ids: [payload.new.id] })
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages'
        },
        () => {
          // Actualizar por cambios en read_at
          queryClient.invalidateQueries({
            queryKey: ['conversation-messages', userId]
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user?.id, userId, queryClient, markAsRead])

  return messagesQuery
}
```

### 3.3 Hook: `useUnreadNotifications`

**Ubicación:** `src/app/features/messages/hooks/useUnreadNotifications.ts`

**Responsabilidad:**
- Badge de contador de mensajes no leídos en Navbar
- Actualización en tiempo real del contador

**Pseudocódigo:**

```typescript
export function useUnreadNotifications() {
  const queryClient = useQueryClient()
  const { user } = useAuthContext()
  const unreadQuery = useUnreadCountQuery()

  useEffect(() => {
    if (!user?.id) return

    const channel = supabase
      .channel('unread-notifications')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE
          schema: 'public',
          table: 'messages',
          filter: `recipient_id=eq.${user.id}`
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['unread-count'] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user?.id, queryClient])

  return unreadQuery
}
```

---

## 4. OPTIMISTIC UPDATES

### 4.1 Al enviar un mensaje

**Estrategia:**

1. **Mostrar mensaje inmediatamente** en UI (optimistic)
2. **Enviar al backend** con mutation
3. **Si falla:** Revertir y mostrar error
4. **Si tiene éxito:** Backend retorna mensaje con ID real, invalidar query

**Implementación en `useSendMessageMutation`:**

```typescript
export const useSendMessageMutation = () => {
  const queryClient = useQueryClient()

  const mutation = useMutation<MessageWithUsers, Error, SendMessageRequest>({
    mutationFn: async (data: SendMessageRequest) => {
      const response = await messageService.sendMessage(data)
      return response.message
    },

    // Optimistic update
    onMutate: async (variables) => {
      // Cancelar queries en progreso
      await queryClient.cancelQueries({
        queryKey: ['conversation-messages', variables.recipient_id]
      })

      // Snapshot del estado anterior
      const previousMessages = queryClient.getQueryData([
        'conversation-messages',
        variables.recipient_id
      ])

      // Mensaje optimista
      const optimisticMessage = {
        id: 'temp-' + Date.now(),
        sender_id: currentUser.id,
        recipient_id: variables.recipient_id,
        content: variables.content,
        read_at: null,
        created_at: new Date().toISOString(),
        sender: currentUser,
        recipient: { /* ... */ }
      }

      // Actualizar cache con mensaje optimista
      queryClient.setQueryData(
        ['conversation-messages', variables.recipient_id],
        (old: any) => ({
          ...old,
          messages: [...(old?.messages || []), optimisticMessage]
        })
      )

      return { previousMessages }
    },

    onSuccess: (_, variables) => {
      // Invalidar para obtener mensaje real del servidor
      queryClient.invalidateQueries({
        queryKey: ['conversation-messages', variables.recipient_id]
      })
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    },

    onError: (error, variables, context) => {
      // Revertir al estado anterior
      queryClient.setQueryData(
        ['conversation-messages', variables.recipient_id],
        context?.previousMessages
      )
    }
  })

  return {
    action: mutation.mutate,
    isLoading: mutation.isPending,
    error: mutation.error,
    isSuccess: mutation.isSuccess,
    data: mutation.data
  }
}
```

**¿Por qué usar optimistic updates aquí?**

- UX más fluida: el mensaje aparece inmediatamente
- Sensación de velocidad
- Feedback visual instantáneo

---

## 5. MARK AS READ: ESTRATEGIA

### 5.1 ¿Cuándo marcar como leído?

**Opción A: Al abrir la conversación (RECOMENDADO)**

```typescript
// En MessagesPage o hook useRealtimeMessages
useEffect(() => {
  if (messagesData?.messages) {
    const unreadMessages = messagesData.messages
      .filter(msg => msg.recipient_id === currentUser.id && !msg.read_at)
      .map(msg => msg.id)

    if (unreadMessages.length > 0) {
      markAsRead({ message_ids: unreadMessages })
    }
  }
}, [messagesData, currentUser.id])
```

**Ventajas:**
- Simple y predecible
- Una sola llamada al backend
- Usuario ve mensajes no leídos antes de marcarlos

**Opción B: Al hacer scroll y ver el mensaje (NO RECOMENDADO para MVP)**

**Desventajas:**
- Más complejo (Intersection Observer)
- Múltiples llamadas al backend
- Overhead innecesario para MVP

### 5.2 Evitar llamadas excesivas

**Debounce/Throttle:**

```typescript
import { useDebouncedCallback } from 'use-debounce'

const debouncedMarkAsRead = useDebouncedCallback(
  (messageIds: string[]) => {
    markAsRead({ message_ids: messageIds })
  },
  500 // 500ms debounce
)
```

**Batching:**

Acumular IDs de mensajes no leídos y marcarlos todos de una vez al abrir conversación (ya implementado en backend como bulk operation).

---

## 6. PERFORMANCE Y OPTIMIZACIÓN

### 6.1 ¿Necesito virtualización?

**Respuesta corta:** NO para MVP, SÍ para producción con >100 mensajes.

**Criterios:**
- Si conversaciones típicas tienen <50 mensajes → NO
- Si hay conversaciones con >100 mensajes → SÍ (usar `react-window` o `react-virtual`)

**Implementación futura:**

```typescript
import { useVirtualizer } from '@tanstack/react-virtual'

// En MessagesList component
const parentRef = useRef<HTMLDivElement>(null)

const virtualizer = useVirtualizer({
  count: messages.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 80, // Altura estimada de cada mensaje
  overscan: 5
})
```

### 6.2 Múltiples suscripciones Realtime

**Problema:** Si el usuario tiene muchas conversaciones abiertas en pestañas, cada una crea una suscripción.

**Solución:**
- Solo suscribirse a la conversación **activa**
- Usar `useEffect` con cleanup para remover canales al cambiar de conversación
- Limite máximo de canales: Supabase Free tier permite hasta 100 conexiones simultáneas

**Ejemplo:**

```typescript
useEffect(() => {
  // Solo suscribirse si userId está definido (conversación activa)
  if (!userId) return

  const channel = supabase.channel(`messages-${userId}`)
  // ... suscripción

  return () => {
    supabase.removeChannel(channel)
  }
}, [userId]) // Re-suscribirse al cambiar de conversación
```

### 6.3 Optimización de queries

**Reducir `refetchInterval` ahora que hay Realtime:**

```typescript
// ANTES (sin Realtime)
useConversationsQuery({
  refetchInterval: 30000 // Polling cada 30s
})

// DESPUÉS (con Realtime)
useConversationsQuery({
  refetchInterval: false, // Desactivar polling
  // Realtime maneja actualizaciones
})
```

**Excepciones:**
- Mantener `refetchInterval` como fallback si Realtime falla (60s es suficiente)
- Solo para queries críticas (conversations, unread-count)

---

## 7. PAGINACIÓN CON REALTIME

### 7.1 Problema

React Query tiene `useInfiniteQuery` para paginación, pero nuestro hook actual usa `useQuery`.

**Backend ya soporta paginación:**
- `GET /api/messages/conversation/:userId?limit=50&offset=0`

### 7.2 Solución

**Opción A: Migrar a `useInfiniteQuery` (RECOMENDADO para producción)**

```typescript
export function useInfiniteConversationMessages(userId: string) {
  return useInfiniteQuery({
    queryKey: ['conversation-messages', userId],
    queryFn: ({ pageParam = 0 }) =>
      messageService.getConversationMessages({
        user_id: userId,
        limit: 50,
        offset: pageParam
      }),
    getNextPageParam: (lastPage, pages) => {
      const nextOffset = pages.length * 50
      return lastPage.messages.length < 50 ? undefined : nextOffset
    },
    initialPageParam: 0
  })
}
```

**Integración con Realtime:**

```typescript
// En el callback de Realtime
queryClient.invalidateQueries({
  queryKey: ['conversation-messages', userId]
})
// React Query re-fetcha solo la primera página
// El usuario puede cargar más con "Load More"
```

**Opción B: Mantener `useQuery` con offset manual (MVP simple)**

```typescript
const [offset, setOffset] = useState(0)

const { data } = useConversationMessagesQuery({
  user_id: userId,
  limit: 50,
  offset
})

const loadMore = () => setOffset(prev => prev + 50)
```

**Recomendación para MVP:** Opción B, migrar a A después.

### 7.3 Botón "Load More"

```typescript
<Button
  onClick={() => fetchNextPage()}
  disabled={!hasNextPage || isFetchingNextPage}
>
  {isFetchingNextPage ? 'Cargando...' : 'Cargar más mensajes'}
</Button>
```

---

## 8. ERROR HANDLING

### 8.1 Desconexiones de Realtime

**Problema:** Supabase puede desconectar por:
- Pérdida de red
- Idle timeout
- Reinicio del servidor

**Solución:**

Supabase Realtime **auto-reconecta** por defecto, pero debemos manejar estados:

```typescript
useEffect(() => {
  const channel = supabase
    .channel('messages')
    .on('postgres_changes', { /* ... */ }, callback)
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('✅ Realtime conectado')
      }
      if (status === 'CHANNEL_ERROR') {
        console.error('❌ Error en Realtime')
        // Fallback: volver a polling
        queryClient.invalidateQueries(['conversations'])
      }
      if (status === 'TIMED_OUT') {
        console.warn('⏱️ Timeout en Realtime')
      }
    })

  return () => supabase.removeChannel(channel)
}, [])
```

**Fallback automático:**

Si Realtime falla, React Query puede seguir usando `refetchInterval` como backup.

### 8.2 Errores de mutación

Ya manejados en los mutation hooks con `onError`:

```typescript
const { error, isError } = useSendMessageMutation()

{isError && (
  <Alert variant="destructive">
    <AlertDescription>
      Error al enviar mensaje: {error.message}
    </AlertDescription>
  </Alert>
)}
```

### 8.3 Reconexión automática

**NO implementar manualmente** - Supabase Realtime ya lo hace.

Si quieres logging adicional:

```typescript
supabase.channel('messages')
  .on('system', { event: 'reconnect' }, () => {
    console.log('🔄 Realtime reconectado')
    queryClient.invalidateQueries(['conversations'])
  })
```

---

## 9. ROUTING DINÁMICO

### 9.1 Rutas necesarias

```typescript
// En src/App.tsx (React Router)

<Route path="/messages" element={<ProtectedRoute><MessagesPage /></ProtectedRoute>} />
<Route path="/messages/:userId" element={<ProtectedRoute><MessagesPage /></ProtectedRoute>} />
```

**O mejor:**

```typescript
<Route path="/messages">
  <Route index element={<ProtectedRoute><MessagesPage /></ProtectedRoute>} />
  <Route path=":userId" element={<ProtectedRoute><MessagesPage /></ProtectedRoute>} />
</Route>
```

### 9.2 Implementación en MessagesPage

```typescript
import { useParams, useNavigate } from 'react-router-dom'

export function MessagesPage() {
  const { userId } = useParams<{ userId: string }>()
  const navigate = useNavigate()

  const handleSelectConversation = (newUserId: string) => {
    navigate(`/messages/${newUserId}`)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Lista de conversaciones */}
      <ConversationList
        selectedUserId={userId}
        onSelectConversation={handleSelectConversation}
      />

      {/* Chat activo */}
      {userId ? (
        <MessagesList userId={userId} />
      ) : (
        <EmptyState />
      )}
    </div>
  )
}
```

### 9.3 Deep linking

URLs como `/messages/123e4567-e89b-12d3-a456-426614174000` deben:
1. Cargar la página de mensajes
2. Auto-seleccionar la conversación con ese usuario
3. Marcar mensajes como leídos automáticamente

---

## 10. NOTIFICACIONES EN NAVBAR

### 10.1 Badge con contador

**Ubicación:** `src/components/layout/Navigation.tsx`

```typescript
import { useUnreadNotifications } from '@/app/features/messages/hooks/useUnreadNotifications'

export function Navigation() {
  const { data: unreadData } = useUnreadNotifications()
  const unreadCount = unreadData?.unread_count || 0

  return (
    <nav>
      <Link to="/messages" className="relative">
        <MessageSquare className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0">
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Link>
    </nav>
  )
}
```

### 10.2 Actualización en tiempo real

El hook `useUnreadNotifications` ya maneja esto con Realtime, el badge se actualiza automáticamente.

---

## 11. SCROLL AUTOMÁTICO

### 11.1 Al cargar conversación

```typescript
const messagesEndRef = useRef<HTMLDivElement>(null)

useEffect(() => {
  messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
}, [messagesData])

return (
  <div className="messages-container overflow-y-auto">
    {messages.map(msg => <MessageCard key={msg.id} message={msg} />)}
    <div ref={messagesEndRef} />
  </div>
)
```

### 11.2 Al recibir mensaje nuevo

Solo auto-scroll si el usuario está al final del scroll:

```typescript
const scrollToBottom = () => {
  if (isUserAtBottom()) {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }
}

const isUserAtBottom = () => {
  const container = containerRef.current
  if (!container) return false

  const { scrollTop, scrollHeight, clientHeight } = container
  return scrollHeight - scrollTop - clientHeight < 100 // 100px threshold
}
```

---

## 12. ESTADOS DE LOADING Y ERROR

### 12.1 Loading states

```typescript
const { data, isLoading, isFetching } = useRealtimeConversations()

if (isLoading) {
  return <ConversationListSkeleton />
}

if (isFetching && !isLoading) {
  // Mostrar spinner pequeño en esquina
  return <RefreshIndicator />
}
```

### 12.2 Error boundaries

```typescript
import { ErrorBoundary } from 'react-error-boundary'

<ErrorBoundary
  fallback={<MessagesErrorFallback />}
  onReset={() => {
    queryClient.invalidateQueries(['conversations'])
    navigate('/messages')
  }}
>
  <MessagesPage />
</ErrorBoundary>
```

---

## 13. PROBLEMAS POTENCIALES Y CÓMO EVITARLOS

### 13.1 Memory leaks por suscripciones Realtime

**Problema:** Olvidar cleanup de canales

**Solución:**

```typescript
useEffect(() => {
  const channel = supabase.channel('...')
  channel.subscribe()

  return () => {
    supabase.removeChannel(channel) // ⚠️ CRÍTICO
  }
}, [])
```

### 13.2 Múltiples re-renders

**Problema:** Realtime + React Query + component re-renders

**Solución:**
- Usar `React.memo` en componentes pesados
- Memoizar callbacks con `useCallback`
- Evitar crear objetos nuevos en render

```typescript
const handleSelect = useCallback((userId: string) => {
  navigate(`/messages/${userId}`)
}, [navigate])
```

### 13.3 Race conditions

**Problema:** Mensaje enviado mientras llega otro por Realtime

**Solución:**
- React Query maneja esto con `queryClient.cancelQueries()`
- Usar `onMutate` para cancelar queries en progreso
- Confiar en timestamps del servidor (`created_at`)

### 13.4 Cache desincronizado

**Problema:** Cache de React Query no refleja estado del servidor

**Solución:**
- Usar `invalidateQueries` después de cada mutación
- Configurar `staleTime` y `gcTime` apropiadamente
- En desarrollo, activar React Query DevTools

### 13.5 Autenticación caducada

**Problema:** Token de Supabase expira mientras usuario está en chat

**Solución:**
- Supabase auto-refresca tokens (configurado en `src/lib/supabase.ts`)
- Axios debe incluir token en headers (verificar interceptor)

---

## 14. ARCHIVOS A CREAR

```
src/app/features/messages/
├── hooks/
│   ├── useRealtimeConversations.ts          ✨ NUEVO
│   ├── useRealtimeMessages.ts                ✨ NUEVO
│   ├── useUnreadNotifications.ts             ✨ NUEVO
│   └── mutations/
│       └── useSendMessageMutation.ts         🔄 MODIFICAR (optimistic updates)
├── pages/
│   └── MessagesPage.tsx                      ✨ NUEVO (reemplazar mock actual)
└── components/
    └── MessagesList.tsx                      ✨ NUEVO (lista de mensajes con scroll)
```

### 14.1 Modificar archivos existentes

```
src/components/layout/Navigation.tsx          🔄 MODIFICAR (agregar badge)
src/App.tsx                                   🔄 MODIFICAR (rutas dinámicas)
src/app/features/messages/hooks/queries/
  ├── useConversationsQuery.ts                🔄 MODIFICAR (desactivar polling)
  └── useConversationMessagesQuery.ts         🔄 MODIFICAR (desactivar polling)
```

---

## 15. CHECKLIST DE IMPLEMENTACIÓN

### Fase 1: Integración base sin Realtime

- [ ] Crear `MessagesPage.tsx` nueva en `src/app/features/messages/pages/`
- [ ] Implementar routing: `/messages` y `/messages/:userId`
- [ ] Conectar `<ConversationList />` con `useConversationsQuery`
- [ ] Crear componente `<MessagesList />` con `useConversationMessagesQuery`
- [ ] Conectar `<MessageInput />` con `useSendMessageMutation`
- [ ] Implementar selección de conversación (navegación)
- [ ] Layout responsive (lista izquierda, chat derecha)
- [ ] Estados de loading y error

### Fase 2: Tiempo Real con Supabase

- [ ] Crear `useRealtimeConversations.ts`
- [ ] Crear `useRealtimeMessages.ts`
- [ ] Crear `useUnreadNotifications.ts`
- [ ] Integrar hooks Realtime en `MessagesPage`
- [ ] Desactivar `refetchInterval` en queries
- [ ] Verificar cleanup de suscripciones
- [ ] Testing: enviar mensaje desde otra cuenta, verificar que llega en tiempo real

### Fase 3: Funcionalidades complementarias

- [ ] Auto-marcar como leídos al abrir conversación
- [ ] Scroll automático a último mensaje
- [ ] Optimistic updates en `useSendMessageMutation`
- [ ] Indicador de "mensaje enviando..." (isLoading)
- [ ] Empty states (sin conversaciones, sin mensajes)
- [ ] Botón "Load More" para mensajes antiguos (opcional MVP)

### Fase 4: Notificaciones

- [ ] Badge en `Navigation.tsx` con `useUnreadNotifications`
- [ ] Actualización automática del contador
- [ ] Icono pulsante en badge cuando hay mensajes nuevos (opcional)

### Fase 5: Pulido UX

- [ ] Confirmación antes de eliminar mensaje
- [ ] Manejo de errores con `toast` o `Alert`
- [ ] Skeleton loaders para conversaciones y mensajes
- [ ] Animaciones de entrada de mensajes nuevos
- [ ] Indicador de estado de conexión Realtime (opcional)

---

## 16. CONSIDERACIONES DE TESTING

### 16.1 Tests unitarios

**Hooks:**
```typescript
// useRealtimeConversations.test.ts
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

describe('useRealtimeConversations', () => {
  it('should invalidate queries on new message', async () => {
    // Mock Supabase Realtime
    // Simular evento INSERT
    // Verificar queryClient.invalidateQueries llamado
  })
})
```

**Componentes:**
```typescript
// MessagesList.test.tsx
import { render, screen } from '@testing-library/react'

describe('MessagesList', () => {
  it('should render messages in order', () => {
    // Mock messages data
    // Render component
    // Verify order
  })
})
```

### 16.2 Integration tests

```typescript
// MessagesPage.integration.test.tsx
describe('MessagesPage Integration', () => {
  it('should send and receive message', async () => {
    // 1. Render page
    // 2. Select conversation
    // 3. Type message
    // 4. Click send
    // 5. Verify message appears
    // 6. Mock Realtime event (reply)
    // 7. Verify reply appears
  })
})
```

### 16.3 E2E tests (Playwright - opcional)

```typescript
test('real-time messaging flow', async ({ page }) => {
  await page.goto('/messages')
  await page.click('[data-testid="conversation-1"]')
  await page.fill('[placeholder="Escribe un mensaje..."]', 'Hola mundo')
  await page.click('button:has-text("Enviar")')
  await expect(page.locator('text=Hola mundo')).toBeVisible()
})
```

---

## 17. COLORES Y DISEÑO (según index.css)

**Paleta España Creativa:**
- Primary: `hsl(14 100% 57%)` - Naranja/rojo español
- Background: `hsl(0 0% 100%)` - Blanco
- Muted: `hsl(210 11.3% 94.9%)` - Gris claro
- Border: `hsl(220 13% 91%)` - Gris borde

**Aplicación en mensajes:**
- Burbujas del usuario: `bg-primary text-primary-foreground`
- Burbujas del otro: `bg-muted text-muted-foreground`
- Badges de no leídos: `bg-primary` (naranja España Creativa)
- Hover states: `hover:bg-accent`

**Bordes y sombras:**
- Border radius: `rounded-xl`, `rounded-2xl`
- Shadows: `shadow-sm`, `hover:shadow-md`

---

## 18. NOTAS FINALES

### 18.1 Conocimiento actualizado necesario

**Supabase Realtime (2024+):**
- API cambió de `.from().on()` a `.channel().on('postgres_changes')`
- Documentación: https://supabase.com/docs/guides/realtime/postgres-changes

**React Query v5:**
- `isLoading` → solo primera carga
- `isFetching` → cualquier fetch (incluye refetch)
- `useQuery` retorna objeto, no array

### 18.2 Dependencias necesarias

```json
{
  "@supabase/supabase-js": "^2.39.0",
  "@tanstack/react-query": "^5.17.0",
  "react-router-dom": "^6.21.0",
  "date-fns": "^3.0.0",
  "use-debounce": "^10.0.0"
}
```

### 18.3 Variables de entorno

Ya configuradas en `.env`:
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 18.4 Próximos pasos

1. **Leer este documento completo** antes de implementar
2. **Consultar a Iban** si hay dudas sobre arquitectura
3. **Implementar fase por fase**, no todo a la vez
4. **Testear Realtime** en desarrollo antes de producción
5. **Verificar que backend está corriendo** en `localhost:3001`

---

## 19. PREGUNTAS FRECUENTES

**P: ¿Puedo usar WebSockets en lugar de Supabase Realtime?**

R: No recomendado. Supabase Realtime ya usa WebSockets internamente y maneja reconexiones, autenticación, y scaling. Implementar WebSockets propios sería reinventar la rueda.

**P: ¿Debo usar optimistic updates en todas las mutaciones?**

R: Solo en `sendMessage`. Para `markAsRead` y `deleteMessage` no es crítico, pueden esperar la respuesta del servidor.

**P: ¿Cómo pruebo Realtime en desarrollo local?**

R: Supabase Realtime funciona igual en desarrollo que en producción. Solo asegúrate de que las RLS policies permitan el acceso.

**P: ¿Qué pasa si el usuario tiene 1000 mensajes en una conversación?**

R: Implementar paginación con `useInfiniteQuery` y virtualización con `react-virtual`. Backend ya soporta paginación (`limit`/`offset`).

**P: ¿Debo implementar indicador de "escribiendo..."?**

R: NO para MVP. Requiere canal Realtime adicional para presencia y agrega complejidad. Implementar después si Iban lo pide.

---

## 20. RECURSOS ADICIONALES

**Documentación oficial:**
- Supabase Realtime: https://supabase.com/docs/guides/realtime
- React Query: https://tanstack.com/query/latest
- React Router: https://reactrouter.com/

**Ejemplos de referencia:**
- Supabase Chat App: https://github.com/supabase/supabase/tree/master/examples/slack-clone

---

**Fin del documento**

Este plan cubre todos los aspectos técnicos necesarios para implementar el sistema de mensajería en tiempo real. El siguiente paso es obtener aprobación de Iban y comenzar la implementación fase por fase.
