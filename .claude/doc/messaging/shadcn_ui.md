# Plan de Implementación UI - Sistema de Mensajería en Tiempo Real

**Fecha:** 2025-10-27
**Agente:** shadcn-ui-architect
**Feature:** Sistema de Mensajería Completo

---

## 🎯 Objetivo

Diseñar una interfaz de chat profesional tipo WhatsApp/Telegram Web que integre los componentes existentes (`ConversationList`, `MessageCard`, `MessageInput`) con una arquitectura de layout responsive, accesible y optimizada para performance.

---

## 📊 Componentes shadcn/ui Recomendados

### ✅ Ya Existentes en el Proyecto

Los siguientes componentes YA están instalados y disponibles:

1. **`<ScrollArea />`** - `/src/components/ui/scroll-area.tsx`
   - **Uso:** Scroll personalizado para la lista de conversaciones y área de mensajes
   - **Por qué:** Proporciona scroll suave, consistente cross-browser, y control programático del scroll position

2. **`<Separator />`** - `/src/components/ui/separator.tsx`
   - **Uso:** Divisores entre fechas de mensajes y entre secciones del layout
   - **Por qué:** Jerarquía visual clara sin agregar peso visual excesivo

3. **`<Skeleton />`** - `/src/components/ui/skeleton.tsx`
   - **Uso:** Loading states en conversaciones y mensajes
   - **Por qué:** Feedback visual inmediato, reduce percepción de tiempo de carga

4. **`<Sheet />`** - `/src/components/ui/sheet.tsx`
   - **Uso:** Conversaciones en mobile (slide desde la izquierda)
   - **Por qué:** Patrón nativo mobile, mejor que modal para contenido lateral

5. **`<Resizable />`** - `/src/components/ui/resizable.tsx`
   - **Uso:** Paneles ajustables en desktop (opcional pero recomendado)
   - **Por qué:** UX personalizable, permite al usuario ajustar ancho de columnas

6. **`<Avatar />`, `<Badge />`, `<Button />`, `<Card />`, `<Input />`**
   - **Uso:** Ya utilizados en componentes existentes
   - **Por qué:** Consistencia con el design system del proyecto

### 🆕 Componentes Adicionales Necesarios

**NINGUNO** - Todos los componentes necesarios ya están disponibles en el proyecto.

---

## 🏗️ Arquitectura de Layout Propuesta

### Desktop Layout (≥1024px)

```
┌─────────────────────────────────────────────────────────────────┐
│ Navigation (sticky)                                              │
├──────────────────┬─────────────────────────────┬────────────────┤
│ Conversaciones   │ Chat Area                   │ User Info      │
│ (ResizablePanel) │ (ResizablePanel)            │ (Optional)     │
│                  │                             │                │
│ [ScrollArea]     │ ┌─────────────────────────┐ │ [Avatar]       │
│  - Search        │ │ Header (sticky)         │ │ [Name]         │
│  - ConvList      │ │ [Avatar][Name][Status]  │ │ [Bio]          │
│                  │ └─────────────────────────┘ │ [Online]       │
│                  │                             │                │
│                  │ [ScrollArea - Messages]     │ [Shared Files] │
│                  │  - Date Separator           │ [Media]        │
│                  │  - MessageCard              │                │
│                  │  - MessageCard              │                │
│                  │  - ...                      │                │
│                  │                             │                │
│                  │ ┌─────────────────────────┐ │                │
│                  │ │ MessageInput (sticky)   │ │                │
│                  │ └─────────────────────────┘ │                │
└──────────────────┴─────────────────────────────┴────────────────┘
```

**Proporciones recomendadas:**
- Conversaciones: `25%` (min: 280px, max: 400px)
- Chat Area: `50%` (min: 400px)
- User Info: `25%` (min: 240px, max: 320px) - **Opcional para v1**

**Implementación:**
```tsx
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable'

<ResizablePanelGroup direction="horizontal">
  <ResizablePanel defaultSize={25} minSize={20} maxSize={35}>
    {/* Conversaciones */}
  </ResizablePanel>

  <ResizableHandle />

  <ResizablePanel defaultSize={75}>
    {/* Chat Area */}
  </ResizablePanel>
</ResizablePanelGroup>
```

**¿Por qué `ResizablePanel`?**
- ✅ UX profesional (ej. Discord, Slack)
- ✅ Flexibilidad para el usuario
- ✅ Persistencia opcional con localStorage
- ⚠️ Consideración: Añade complejidad - puede omitirse en v1 y usar grid fijo

### Mobile Layout (<1024px)

```
┌─────────────────────────────────┐
│ Navigation (sticky)             │
├─────────────────────────────────┤
│                                 │
│ Vista 1: Lista de Conversaciones│
│ [Search]                        │
│ [ConversationList]              │
│                                 │
│ (Click → abre Sheet →)          │
│                                 │
└─────────────────────────────────┘

Al seleccionar conversación:

┌─────────────────────────────────┐
│ ← Back | [Avatar] User Name     │ ← Sheet Header
├─────────────────────────────────┤
│                                 │
│ [ScrollArea - Messages]         │
│  - MessageCard                  │
│  - MessageCard                  │
│  - ...                          │
│                                 │
├─────────────────────────────────┤
│ [MessageInput]                  │ ← Sticky bottom
└─────────────────────────────────┘
```

**Implementación:**
```tsx
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'

// Mobile: Sheet para chat
<Sheet open={!!selectedUserId} onOpenChange={() => setSelectedUserId(null)}>
  <SheetContent side="bottom" className="h-[90vh]">
    <SheetHeader>
      <SheetTitle>{selectedUser.name}</SheetTitle>
    </SheetHeader>
    {/* Messages + Input */}
  </SheetContent>
</Sheet>
```

**¿Por qué `Sheet` en lugar de `Dialog`?**
- ✅ Más natural en mobile (slide up)
- ✅ Ocupa más espacio vertical
- ✅ Gesture-friendly (swipe to close)
- ❌ `Dialog`: Centrado, menos espacio, no tan nativo

**Alternativa:** Navegación completa (React Router)
```tsx
// Opción B: Router-based (mejor para SEO/deep linking)
/messages → Lista de conversaciones
/messages/:userId → Chat individual (fullscreen mobile)
```

**Recomendación:** **Sheet para v1** (más rápido), Router para v2 si se necesitan URLs compartibles.

---

## 🎨 Patrones de Diseño Específicos

### 1. Scroll Behavior (Crítico para UX)

#### Auto-Scroll al Último Mensaje

**Problema:** Scroll automático puede molestar si el usuario está leyendo mensajes antiguos.

**Solución:** "Smart Scroll" con detección de posición del usuario.

```tsx
import { ScrollArea } from '@/components/ui/scroll-area'
import { useEffect, useRef, useState } from 'react'

function ChatArea({ messages }) {
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const [isUserScrolling, setIsUserScrolling] = useState(false)
  const [showScrollButton, setShowScrollButton] = useState(false)

  // Detectar si el usuario está cerca del final
  const checkScrollPosition = () => {
    const viewport = scrollAreaRef.current
    if (!viewport) return

    const { scrollTop, scrollHeight, clientHeight } = viewport
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight

    // Si está a más de 100px del final, no auto-scroll
    setIsUserScrolling(distanceFromBottom > 100)
    setShowScrollButton(distanceFromBottom > 200)
  }

  // Auto-scroll solo si el usuario NO está scrolleando arriba
  useEffect(() => {
    if (!isUserScrolling && messages.length > 0) {
      scrollAreaRef.current?.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: 'smooth'
      })
    }
  }, [messages.length, isUserScrolling])

  return (
    <>
      <ScrollArea
        ref={scrollAreaRef}
        onScroll={checkScrollPosition}
        className="flex-1"
      >
        {messages.map(msg => <MessageCard key={msg.id} {...msg} />)}
      </ScrollArea>

      {/* Botón para volver al final */}
      {showScrollButton && (
        <Button
          size="sm"
          className="absolute bottom-20 right-4"
          onClick={() => scrollAreaRef.current?.scrollTo({
            top: scrollAreaRef.current.scrollHeight,
            behavior: 'smooth'
          })}
        >
          ↓ Nuevos mensajes
        </Button>
      )}
    </>
  )
}
```

**¿Por qué este approach?**
- ✅ No interrumpe lectura de mensajes antiguos
- ✅ Feedback claro de nuevos mensajes
- ✅ UX similar a WhatsApp Web
- ⚠️ Requiere gestión de estado adicional

#### Paginación / Infinite Scroll

**Recomendación:** "Load More" button arriba (no virtualización en v1).

```tsx
<ScrollArea>
  {hasMore && (
    <Button
      variant="ghost"
      onClick={() => fetchOlderMessages()}
      className="w-full mb-4"
    >
      Cargar mensajes anteriores
    </Button>
  )}

  {messages.map(msg => <MessageCard key={msg.id} {...msg} />)}
</ScrollArea>
```

**¿Por qué NO Infinite Scroll automático?**
- ❌ Puede cargar mensajes mientras el usuario scrollea (UX confusa)
- ❌ Complica el scroll position management
- ✅ Button da control al usuario
- ✅ Más fácil de implementar

**¿Cuándo usar virtualización (react-window)?**
- ✅ Si >500 mensajes en una conversación
- ✅ Si hay problemas de performance
- ❌ No necesario en v1 (React Query + paginación backend suficiente)

---

### 2. Agrupación de Mensajes

#### Por Fecha

```tsx
import { Separator } from '@/components/ui/separator'
import { format, isToday, isYesterday } from 'date-fns'
import { es } from 'date-fns/locale'

function DateSeparator({ date }) {
  let label = format(date, 'EEEE, d MMMM yyyy', { locale: es })

  if (isToday(date)) label = 'Hoy'
  if (isYesterday(date)) label = 'Ayer'

  return (
    <div className="flex items-center gap-4 my-6">
      <Separator className="flex-1" />
      <span className="text-xs text-muted-foreground font-medium uppercase">
        {label}
      </span>
      <Separator className="flex-1" />
    </div>
  )
}
```

#### Mensajes Consecutivos del Mismo Usuario

**Optimización visual:** Agrupar mensajes seguidos del mismo usuario (≤5min diferencia).

```tsx
function shouldGroupWithPrevious(currentMsg, previousMsg) {
  if (!previousMsg) return false
  if (currentMsg.sender_id !== previousMsg.sender_id) return false

  const timeDiff = new Date(currentMsg.created_at) - new Date(previousMsg.created_at)
  return timeDiff < 5 * 60 * 1000 // 5 minutos
}

// En MessageCard, ocultar avatar y reducir espacio si agrupado
<div className={cn(
  "flex gap-3",
  isOwnMessage ? "flex-row-reverse" : "flex-row",
  isGrouped && "mt-1" // Menos espacio
)}>
  {!isGrouped && <Avatar />} {/* Solo mostrar si no agrupado */}
  {isGrouped && <div className="w-8" />} {/* Spacer para alinear */}
  <MessageBubble />
</div>
```

**¿Por qué agrupar?**
- ✅ Menos ruido visual
- ✅ Más espacio para contenido
- ✅ UX similar a apps populares
- ⚠️ Requiere lógica adicional en rendering

---

### 3. Animaciones

#### Nuevos Mensajes

**Recomendación:** Fade + Slide sutil.

```tsx
import { motion } from 'framer-motion'

function MessageCard({ message, isNew }) {
  return (
    <motion.div
      initial={isNew ? { opacity: 0, y: 20 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      {/* Contenido del mensaje */}
    </motion.div>
  )
}
```

**⚠️ IMPORTANTE:** `framer-motion` no está en el proyecto actualmente.

**Alternativa CSS-only (sin dependencias):**

```tsx
// En CSS global o tailwind
@keyframes slideInMessage {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// En componente
<div className={cn(
  "animate-in fade-in slide-in-from-bottom-4 duration-300",
  isNew && "animate-slideInMessage"
)}>
```

**Recomendación Final:** **CSS-only para v1**, considerar framer-motion si se necesitan animaciones complejas en el futuro.

#### Typing Indicator (Escribiendo...)

```tsx
function TypingIndicator() {
  return (
    <div className="flex gap-1 p-3 bg-muted rounded-lg w-fit">
      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
           style={{ animationDelay: '0ms' }} />
      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
           style={{ animationDelay: '150ms' }} />
      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
           style={{ animationDelay: '300ms' }} />
    </div>
  )
}
```

**¿Cuándo implementar?**
- 🟡 Prioridad media (nice-to-have)
- 🟡 Requiere WebSocket/Realtime
- 🟡 Fase 3 según plan de contexto

---

### 4. Estados de la UI

#### Loading States

**Skeleton para lista de conversaciones:**

```tsx
import { Skeleton } from '@/components/ui/skeleton'

function ConversationListSkeleton() {
  return (
    <div className="space-y-3 p-4">
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
}
```

**Skeleton para mensajes:**

```tsx
function MessagesSkeleton() {
  return (
    <div className="space-y-4 p-4">
      {[1, 2, 3].map(i => (
        <div key={i} className={i % 2 === 0 ? 'flex justify-end' : 'flex justify-start'}>
          <Skeleton className="h-16 w-2/3 rounded-lg" />
        </div>
      ))}
    </div>
  )
}
```

#### Empty States

```tsx
import { MessageCircle } from 'lucide-react'

// Sin conversaciones
<div className="flex flex-col items-center justify-center h-full text-center p-8">
  <MessageCircle className="h-16 w-16 text-muted-foreground mb-4" />
  <h3 className="text-lg font-semibold mb-2">No tienes conversaciones</h3>
  <p className="text-sm text-muted-foreground mb-4">
    Busca usuarios en la red para iniciar un chat
  </p>
  <Button asChild>
    <Link to="/network">Explorar red</Link>
  </Button>
</div>

// Sin conversación seleccionada (desktop)
<div className="flex flex-col items-center justify-center h-full text-center">
  <MessageCircle className="h-12 w-12 text-muted-foreground mb-4" />
  <p className="text-muted-foreground">
    Selecciona una conversación para empezar a chatear
  </p>
</div>
```

#### Error States

```tsx
import { AlertCircle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

function ErrorState({ error, onRetry }) {
  return (
    <Alert variant="destructive" className="m-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Error al cargar mensajes</AlertTitle>
      <AlertDescription className="mt-2">
        {error.message || 'Ocurrió un error inesperado'}
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="mt-3"
        >
          Reintentar
        </Button>
      </AlertDescription>
    </Alert>
  )
}
```

---

## ♿ Accessibility (WCAG 2.1 AA)

### ARIA Labels Necesarios

```tsx
// Lista de conversaciones
<div role="list" aria-label="Conversaciones">
  <div
    role="listitem"
    aria-label={`Conversación con ${user.name}, último mensaje: ${lastMessage}, ${unreadCount} mensajes sin leer`}
    tabIndex={0}
  >
    {/* Contenido de conversación */}
  </div>
</div>

// Área de mensajes
<div
  role="log"
  aria-live="polite"
  aria-label="Historial de mensajes"
>
  {messages.map(msg => (
    <div
      role="article"
      aria-label={`Mensaje de ${msg.sender.name} a las ${formatTime(msg.created_at)}`}
    >
      {msg.content}
    </div>
  ))}
</div>

// Input de mensaje
<textarea
  aria-label="Escribir mensaje"
  aria-describedby="character-count"
  aria-invalid={isOverLimit}
/>
<span id="character-count" className="sr-only">
  {remainingChars} caracteres restantes
</span>
```

### Keyboard Navigation

**Requerimientos:**

1. **Tab order lógico:**
   - Search → Conversaciones → Área de chat → Input mensaje

2. **Shortcuts de teclado:**
   - `Arrow Up/Down`: Navegar entre conversaciones
   - `Enter`: Abrir conversación seleccionada
   - `Escape`: Cerrar conversación (mobile) o deseleccionar (desktop)
   - `Ctrl/Cmd + K`: Focus en search

```tsx
function ConversationList({ conversations, selectedId, onSelect }) {
  const [focusedIndex, setFocusedIndex] = useState(0)

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setFocusedIndex(prev => Math.min(prev + 1, conversations.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setFocusedIndex(prev => Math.max(prev - 1, 0))
        break
      case 'Enter':
        e.preventDefault()
        onSelect(conversations[focusedIndex].user.id)
        break
    }
  }

  return (
    <div onKeyDown={handleKeyDown}>
      {conversations.map((conv, idx) => (
        <div
          key={conv.user.id}
          tabIndex={focusedIndex === idx ? 0 : -1}
          ref={focusedIndex === idx ? focusedRef : null}
        >
          {/* Contenido */}
        </div>
      ))}
    </div>
  )
}
```

### Focus Management

- Al abrir conversación en mobile (Sheet), focus debe ir al input de mensaje
- Al cerrar Sheet, focus debe volver a la conversación en la lista
- Al enviar mensaje, focus debe permanecer en el input

```tsx
import { useEffect, useRef } from 'react'

function MessageInput({ recipientId }) {
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    // Auto-focus al abrir conversación
    inputRef.current?.focus()
  }, [recipientId])

  const handleSubmit = async () => {
    await sendMessage()
    // Mantener focus después de enviar
    inputRef.current?.focus()
  }

  return <textarea ref={inputRef} {...props} />
}
```

---

## ⚡ Performance & Optimización

### 1. Re-renders

**Problema:** Lista de conversaciones re-renderiza todos los items cuando cambia uno.

**Solución:** `React.memo` en componentes de lista.

```tsx
import { memo } from 'react'

const ConversationItem = memo(({ conversation, isSelected, onSelect }) => {
  // ... componente
}, (prevProps, nextProps) => {
  // Custom comparison para evitar re-renders innecesarios
  return (
    prevProps.conversation.id === nextProps.conversation.id &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.conversation.unread_count === nextProps.conversation.unread_count &&
    prevProps.conversation.last_message.id === nextProps.conversation.last_message.id
  )
})
```

### 2. React Query Optimizations

```tsx
// En useConversationsQuery
{
  staleTime: 30 * 1000, // No refetch por 30s
  cacheTime: 5 * 60 * 1000, // Cache 5min
  refetchOnWindowFocus: false, // No refetch al volver a la tab
  refetchInterval: false, // No polling (usar WebSockets en su lugar)
}

// En useConversationMessagesQuery
{
  staleTime: 0, // Siempre fresh (para tiempo real)
  cacheTime: 10 * 60 * 1000,
  keepPreviousData: true, // Smooth transitions en paginación
}
```

### 3. Virtualización

**¿Cuándo implementar?**

| Escenario | Umbral | Solución |
|-----------|--------|----------|
| Conversaciones | >50 | `react-window` o `@tanstack/react-virtual` |
| Mensajes en chat | >500 | `react-window` (FixedSizeList) |
| Búsqueda de usuarios | >100 resultados | Paginación backend + infinite scroll |

**Recomendación para v1:**
- ❌ NO implementar virtualización
- ✅ Usar paginación backend (ya implementado)
- ✅ React Query cache maneja el resto
- 🟡 Monitorear performance con React DevTools Profiler

**Si se necesita en futuro:**

```tsx
import { FixedSizeList } from 'react-window'

function VirtualizedMessageList({ messages }) {
  return (
    <FixedSizeList
      height={600}
      itemCount={messages.length}
      itemSize={80}
      width="100%"
    >
      {({ index, style }) => (
        <div style={style}>
          <MessageCard message={messages[index]} />
        </div>
      )}
    </FixedSizeList>
  )
}
```

### 4. Optimistic Updates

Ya implementado en `useSendMessageMutation`, pero recordatorio de patrón:

```tsx
useMutation({
  mutationFn: messageService.sendMessage,
  onMutate: async (newMessage) => {
    // Cancelar queries en curso
    await queryClient.cancelQueries(['messages', recipientId])

    // Snapshot del estado previo
    const previousMessages = queryClient.getQueryData(['messages', recipientId])

    // Optimistic update
    queryClient.setQueryData(['messages', recipientId], (old) => ({
      ...old,
      messages: [...old.messages, {
        ...newMessage,
        id: `temp-${Date.now()}`,
        status: 'sending'
      }]
    }))

    return { previousMessages }
  },
  onError: (err, newMessage, context) => {
    // Rollback
    queryClient.setQueryData(
      ['messages', recipientId],
      context.previousMessages
    )
  },
  onSuccess: (data) => {
    // Reemplazar mensaje temporal con el real del backend
    queryClient.invalidateQueries(['messages', recipientId])
  }
})
```

---

## 🎨 Consideraciones de UX

### 1. Indicador de Conexión

```tsx
import { Wifi, WifiOff } from 'lucide-react'

function ConnectionStatus() {
  const isOnline = useOnlineStatus() // Custom hook

  if (isOnline) return null

  return (
    <div className="fixed top-0 left-0 right-0 bg-destructive text-destructive-foreground p-2 text-center text-sm z-50">
      <WifiOff className="inline h-4 w-4 mr-2" />
      Sin conexión - Los mensajes se enviarán cuando vuelvas a estar en línea
    </div>
  )
}
```

### 2. Confirmaciones de Eliminación

**Ya implementado** en `MessageCard` pero mejorable:

```tsx
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="ghost" size="sm">
      <Trash2 className="h-4 w-4" />
    </Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>¿Eliminar mensaje?</AlertDialogTitle>
      <AlertDialogDescription>
        Esta acción no se puede deshacer. El mensaje se eliminará permanentemente.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancelar</AlertDialogCancel>
      <AlertDialogAction onClick={handleDelete}>
        Eliminar
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

**¿Por qué AlertDialog en lugar de `window.confirm()`?**
- ✅ Consistente con el design system
- ✅ Más accessible
- ✅ Customizable
- ❌ Más código - puede dejarse `confirm()` para v1

### 3. Búsqueda de Conversaciones

```tsx
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { useState, useMemo } from 'react'

function ConversationSearch({ conversations, onFilter }) {
  const [search, setSearch] = useState('')

  const filteredConversations = useMemo(() => {
    if (!search.trim()) return conversations

    return conversations.filter(conv =>
      conv.user.name.toLowerCase().includes(search.toLowerCase()) ||
      conv.last_message.content.toLowerCase().includes(search.toLowerCase())
    )
  }, [conversations, search])

  return (
    <div className="relative p-4">
      <Search className="absolute left-7 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        placeholder="Buscar conversaciones..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="pl-10"
      />
    </div>
  )
}
```

### 4. Indicador de Mensajes No Leídos

**Ya implementado** con Badge en `ConversationList`, pero considerar:

- Badge en el título de la página (`document.title = "(2) Mensajes | España Creativa"`)
- Badge en navegación global
- Notificaciones de sistema (Notification API) - Fase 4

```tsx
// Hook para actualizar title
import { useEffect } from 'react'
import { useUnreadCountQuery } from '../hooks/queries/useUnreadCountQuery'

export function useUnreadTitle() {
  const { data } = useUnreadCountQuery()

  useEffect(() => {
    const count = data?.count || 0
    document.title = count > 0
      ? `(${count}) Mensajes | España Creativa`
      : 'Mensajes | España Creativa'
  }, [data?.count])
}
```

---

## 🚨 Problemas Potenciales y Soluciones

### 1. Race Conditions en Optimistic Updates

**Problema:** Usuario envía mensaje, pero el backend tarda y llega un mensaje nuevo del otro usuario antes.

**Solución:** ID temporal único + merge lógico.

```tsx
onMutate: async (newMessage) => {
  const tempId = `optimistic-${Date.now()}-${Math.random()}`

  queryClient.setQueryData(['messages', recipientId], (old) => {
    const newMsg = {
      ...newMessage,
      id: tempId,
      created_at: new Date().toISOString(),
      _isOptimistic: true
    }

    return {
      ...old,
      messages: [...old.messages, newMsg].sort(
        (a, b) => new Date(a.created_at) - new Date(b.created_at)
      )
    }
  })

  return { tempId }
},
onSuccess: (data, variables, context) => {
  // Reemplazar mensaje optimistic con el real
  queryClient.setQueryData(['messages', recipientId], (old) => ({
    ...old,
    messages: old.messages.map(msg =>
      msg.id === context.tempId ? data.message : msg
    )
  }))
}
```

### 2. Scroll Position al Recibir Mensajes

**Problema:** Auto-scroll al recibir mensaje interrumpe lectura.

**Solución:** Ya propuesta en sección "Scroll Behavior" - solo auto-scroll si cerca del final.

### 3. Stale Data Después de Inactividad

**Problema:** Usuario deja tab abierta 1 hora, vuelve, ve datos viejos.

**Solución:** `refetchOnMount` + `staleTime` ajustado.

```tsx
useConversationsQuery({
  refetchOnMount: 'always',
  refetchOnWindowFocus: true,
  staleTime: 30 * 1000
})
```

**Mejor solución (Fase 3):** WebSocket reconnect automático al volver a la tab.

### 4. Memory Leaks en Subscripciones

**Problema:** Suscripciones a WebSockets no se limpian al desmontar componente.

**Solución (para Fase 3 WebSockets):**

```tsx
useEffect(() => {
  const subscription = supabase
    .channel(`messages:${userId}`)
    .on('INSERT', handleNewMessage)
    .subscribe()

  return () => {
    subscription.unsubscribe()
  }
}, [userId])
```

### 5. Mobile Keyboard Overlap

**Problema:** Teclado mobile cubre input de mensaje.

**Solución:**

```tsx
// Usar visualViewport API
useEffect(() => {
  const handleResize = () => {
    const viewport = window.visualViewport
    if (viewport) {
      document.documentElement.style.setProperty(
        '--viewport-height',
        `${viewport.height}px`
      )
    }
  }

  window.visualViewport?.addEventListener('resize', handleResize)
  return () => window.visualViewport?.removeEventListener('resize', handleResize)
}, [])

// En CSS
.chat-container {
  height: var(--viewport-height, 100vh);
}
```

**Alternativa:** Usar `env(safe-area-inset-bottom)` en iOS.

---

## 📱 Mobile Experience - Decisión Final

### Opción Recomendada: Sheet (Side Drawer)

**Pros:**
- ✅ Rápido de implementar
- ✅ No requiere cambios en routing
- ✅ Gesture-friendly (swipe)
- ✅ Buen uso del espacio vertical

**Cons:**
- ❌ No permite URLs compartibles
- ❌ No hay deep linking

**Implementación:**

```tsx
function MessagesPageMobile() {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)

  return (
    <>
      {/* Lista de conversaciones */}
      <ConversationList
        onSelectConversation={setSelectedUserId}
        selectedUserId={selectedUserId}
      />

      {/* Sheet con el chat */}
      <Sheet open={!!selectedUserId} onOpenChange={() => setSelectedUserId(null)}>
        <SheetContent
          side="bottom"
          className="h-[90vh] flex flex-col p-0"
        >
          {selectedUserId && (
            <ChatView
              userId={selectedUserId}
              onClose={() => setSelectedUserId(null)}
            />
          )}
        </SheetContent>
      </Sheet>
    </>
  )
}
```

### Alternativa: Router-based (para futuro)

```tsx
// Route config
/messages → Lista
/messages/:userId → Chat fullscreen

// En MessagesPage.tsx
const { userId } = useParams()
const navigate = useNavigate()

return (
  <div className="lg:grid lg:grid-cols-3">
    <ConversationList
      onSelectConversation={(id) => {
        if (isMobile) navigate(`/messages/${id}`)
        else setSelectedUserId(id)
      }}
    />

    {/* Desktop: Siempre visible */}
    {!isMobile && userId && <ChatView userId={userId} />}
  </div>
)

// Página separada para mobile
function MobileChatPage() {
  const { userId } = useParams()
  return <ChatView userId={userId} />
}
```

**¿Cuándo migrar a Router?**
- 🟡 Si se necesitan URLs compartibles ("Mira este chat")
- 🟡 Si hay SEO concerns
- 🟡 Fase 2 o posterior

---

## 🎨 Colores y Temas

### Uso de Variables CSS del Proyecto

**IMPORTANTE:** Usar SIEMPRE las variables definidas en `src/index.css`.

```css
/* Colores disponibles */
--primary: 14 100% 57%; /* Orange/Red España Creativa */
--primary-foreground: 0 0% 100%;

--secondary: 210 11.3% 94.9%;
--muted: 210 11.3% 94.9%;
--accent: 210 11.3% 94.9%;

--destructive: 0 84.2% 60.2%;
--border: 220 13% 91%;
```

**Aplicación en componentes de mensajería:**

```tsx
// Mensaje propio
<div className="bg-primary text-primary-foreground">
  {content}
</div>

// Mensaje recibido
<div className="bg-muted text-foreground">
  {content}
</div>

// Badge de no leídos
<Badge variant="default" className="bg-primary">
  {count}
</Badge>

// Online indicator
<div className="w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
```

**⚠️ NO hardcodear colores:**

```tsx
// ❌ MAL
<div className="bg-[#22c55e]">

// ✅ BIEN
<div className="bg-primary">
```

### Dark Mode Support

**Estado actual:** El proyecto tiene variables CSS para dark mode definidas, pero no está implementado el toggle.

**Consideración:** Mensajes deben verse bien en ambos modos.

```tsx
// Asegurar contraste adecuado
<div className="bg-primary text-primary-foreground"> {/* Auto-ajusta en dark mode */}
  {content}
</div>
```

---

## 📦 Estructura de Archivos Propuesta

```
src/app/features/messages/
├── components/
│   ├── ConversationList.tsx          ✅ Ya existe
│   ├── MessageCard.tsx                ✅ Ya existe
│   ├── MessageInput.tsx               ✅ Ya existe
│   ├── ChatArea.tsx                   🆕 Área principal de chat
│   ├── ChatHeader.tsx                 🆕 Header con avatar y estado
│   ├── MessageList.tsx                🆕 Lista virtualizable de mensajes
│   ├── DateSeparator.tsx              🆕 Separador de fechas
│   ├── TypingIndicator.tsx            🆕 Indicador "escribiendo..."
│   ├── ConnectionStatus.tsx           🆕 Indicador de conexión
│   ├── EmptyState.tsx                 🆕 Estado vacío
│   └── SkeletonLoaders.tsx            🆕 Todos los skeletons
├── hooks/
│   ├── queries/
│   │   ├── useConversationsQuery.ts   ✅ Ya existe
│   │   ├── useConversationMessagesQuery.ts ✅ Ya existe
│   │   └── useUnreadCountQuery.ts     ✅ Ya existe
│   ├── mutations/
│   │   ├── useSendMessageMutation.ts  ✅ Ya existe
│   │   ├── useMarkAsReadMutation.ts   ✅ Ya existe
│   │   └── useDeleteMessageMutation.ts ✅ Ya existe
│   ├── useScrollToBottom.ts           🆕 Smart scroll logic
│   ├── useMessageGrouping.ts          🆕 Agrupar mensajes
│   ├── useUnreadTitle.ts              🆕 Update document.title
│   └── useOnlineStatus.ts             🆕 Detector de conexión
├── data/
│   ├── schemas/message.schema.ts      ✅ Ya existe
│   └── services/message.service.ts    ✅ Ya existe
└── MessagesPage.tsx                   🔄 Actualizar (eliminar mock)
```

**Nuevo archivo propuesto:** `src/components/pages/MessagesPage.tsx`

Deberá:
1. Eliminar mock data
2. Integrar componentes reales
3. Implementar layout responsive
4. Gestionar estado de conversación seleccionada

---

## ✅ Checklist de Implementación

### Fase 1: Layout y Componentes Base

- [ ] Crear `ChatArea.tsx` con ScrollArea y estructura
- [ ] Crear `ChatHeader.tsx` con avatar y estado usuario
- [ ] Crear `MessageList.tsx` que mapee MessageCard
- [ ] Crear `DateSeparator.tsx`
- [ ] Crear `SkeletonLoaders.tsx` (conversaciones + mensajes)
- [ ] Crear `EmptyState.tsx` (sin conversaciones + sin selección)
- [ ] Actualizar `MessagesPage.tsx`:
  - [ ] Eliminar mock data
  - [ ] Integrar `useConversationsQuery`
  - [ ] Implementar grid responsive (lg:grid-cols-3)
  - [ ] Sheet en mobile, ResizablePanel en desktop
  - [ ] Estado `selectedUserId`

### Fase 2: UX Avanzada

- [ ] Implementar smart scroll (`useScrollToBottom.ts`)
- [ ] Botón "Scroll to bottom" cuando hay nuevos mensajes
- [ ] Agrupar mensajes consecutivos (`useMessageGrouping.ts`)
- [ ] Marcar como leído automáticamente al abrir conversación
- [ ] Búsqueda de conversaciones
- [ ] Animaciones CSS para mensajes nuevos

### Fase 3: Accessibility

- [ ] ARIA labels en todos los componentes
- [ ] Keyboard navigation en lista de conversaciones
- [ ] Focus management (Sheet open/close)
- [ ] Skip links ("Saltar a mensajes")
- [ ] Screen reader announcements para mensajes nuevos

### Fase 4: Performance

- [ ] React.memo en ConversationItem
- [ ] Optimizar React Query settings (staleTime, cacheTime)
- [ ] Monitorear re-renders con React DevTools
- [ ] Lazy load de imágenes en avatares
- [ ] (Si necesario) Implementar virtualización

### Fase 5: Polish

- [ ] Update document.title con unread count (`useUnreadTitle.ts`)
- [ ] Indicador de conexión (`ConnectionStatus.tsx`)
- [ ] Confirmación AlertDialog para eliminar
- [ ] Loading states en todas las mutaciones
- [ ] Error boundaries

---

## 🔍 Referencias y Recursos

### Documentación shadcn/ui

- [ScrollArea](https://ui.shadcn.com/docs/components/scroll-area)
- [Sheet](https://ui.shadcn.com/docs/components/sheet)
- [Resizable](https://ui.shadcn.com/docs/components/resizable)
- [Skeleton](https://ui.shadcn.com/docs/components/skeleton)
- [Separator](https://ui.shadcn.com/docs/components/separator)

### Inspiración de Diseño

- **WhatsApp Web:** Grid 3 columnas, smart scroll
- **Telegram Web:** ResizablePanel, agrupación de mensajes
- **Discord:** Canales laterales, typing indicators
- **Slack:** Threads, rich message formatting

### WCAG 2.1 AA Compliance

- [Keyboard Accessible](https://www.w3.org/WAI/WCAG21/Understanding/keyboard.html)
- [Focus Visible](https://www.w3.org/WAI/WCAG21/Understanding/focus-visible.html)
- [Meaningful Sequence](https://www.w3.org/WAI/WCAG21/Understanding/meaningful-sequence.html)

---

## 🎯 Recomendaciones Finales

### Prioridades para v1 (MVP)

1. ✅ **Layout básico funcionando** (grid desktop, sheet mobile)
2. ✅ **Componentes reales** integrados (eliminar mock)
3. ✅ **Smart scroll** (no interrumpir lectura)
4. ✅ **Loading/Error states** (UX clara)
5. ✅ **Accessibility básica** (keyboard nav, ARIA)

### Para v2 (Mejoras)

1. 🟡 Agrupación de mensajes por fecha y usuario
2. 🟡 Búsqueda de conversaciones
3. 🟡 Animaciones smooth
4. 🟡 ResizablePanel en desktop
5. 🟡 Typing indicator

### Para v3 (Tiempo Real)

1. 🟡 WebSocket/Supabase Realtime
2. 🟡 Online/Offline status
3. 🟡 Mensajes en tiempo real
4. 🟡 Notificaciones de sistema

### NO Hacer en v1

- ❌ Virtualización (innecesario <500 msgs)
- ❌ framer-motion (usar CSS animations)
- ❌ Router-based mobile (Sheet es suficiente)
- ❌ Dark mode toggle (variables ya preparadas)
- ❌ Rich text editor (textarea simple)

---

## 📊 Métricas de Éxito

### Performance

- ⏱️ **Time to Interactive:** <2s en 3G
- ⏱️ **Scroll FPS:** >60fps
- 📦 **Bundle size increase:** <50KB

### UX

- ✅ **Auto-scroll** sin interrumpir lectura antigua
- ✅ **Loading states** en <100ms
- ✅ **Keyboard navigation** funcional
- ✅ **Mobile responsive** sin horizontal scroll

### Accessibility

- ♿ **Lighthouse Accessibility:** >95
- ♿ **Screen reader compatible**
- ♿ **Keyboard-only navigation** completa

---

## 🚀 Próximos Pasos

1. **Revisar este documento** con Iban y equipo
2. **Consultar a `frontend-developer`** para plan de integración
3. **Crear tareas** en archivo de sesión para cada componente
4. **Implementar Fase 1** (layout + componentes base)
5. **Testing manual** en desktop y mobile
6. **Iterar** con feedback de `ui-ux-analyzer`

---

**Autor:** shadcn-ui-architect
**Última actualización:** 2025-10-27
**Estado:** Esperando aprobación para implementación
