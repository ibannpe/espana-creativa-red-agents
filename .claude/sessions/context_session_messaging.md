# Contexto de Sesión: Sistema de Mensajería en Tiempo Real

**Issue:** #7
**Branch:** `feature-issue-7`
**Fecha Inicio:** 2025-10-27
**Estado:** En progreso - Fase de análisis completada

---

## Resumen del Objetivo

Transformar el sistema de mensajería de España Creativa Red de **mock data** a un **sistema funcional en tiempo real** con Supabase Realtime + React Query.

### Valor para el Usuario
- Comunicación en tiempo real entre emprendedores y mentores
- Notificaciones de mensajes no leídos
- URLs compartibles de conversaciones (deep linking)
- Experiencia móvil nativa con Sheet/Drawer
- Estado de lectura de mensajes

---

## Estado Actual del Código

### ✅ Backend (100% Completado)

**Arquitectura:** Hexagonal con Express + TypeScript

**Endpoints disponibles:**
- `GET /api/messages/conversations` - Lista de conversaciones
- `GET /api/messages/conversation/:userId` - Mensajes de conversación específica
- `POST /api/messages` - Enviar mensaje
- `PUT /api/messages/read` - Marcar como leído
- `DELETE /api/messages/:id` - Eliminar mensaje
- `GET /api/messages/unread-count` - Contador de no leídos

**Ubicación:** `server/application/use-cases/messages/`

**Tests:** `SendMessageUseCase.test.ts` implementado ✅

---

### ⚠️ Frontend (Parcialmente Implementado)

#### Código Existente (Listo para Usar)

1. **Servicio HTTP** (`src/app/features/messages/data/services/message.service.ts`)
   - Axios + Zod validation
   - Todos los endpoints integrados
   - Tests implementados ✅

2. **Hooks de React Query**
   - `useConversationsQuery.ts` - Lista conversaciones (polling 30s)
   - `useConversationMessagesQuery.ts` - Mensajes de conversación
   - `useUnreadCountQuery.ts` - Contador no leídos
   - `useSendMessageMutation.ts` - Enviar mensaje
   - `useMarkAsReadMutation.ts` - Marcar leído
   - `useDeleteMessageMutation.ts` - Eliminar mensaje

3. **Componentes Reutilizables**
   - `ConversationList.tsx` - Lista de conversaciones con avatares
   - `MessageCard.tsx` - Card individual de mensaje
   - `MessageInput.tsx` - Input para escribir mensajes

4. **Schemas Zod**
   - `message.schema.ts` + tests ✅
   - Validación completa de tipos

#### ❌ Problemas Identificados

1. **MessagesPage con Mock Data** (`src/components/pages/MessagesPage.tsx:13-42`)
   - Usa array hardcodeado de conversaciones
   - No integra hooks existentes
   - No hay routing dinámico `/messages/:userId`
   - No usa componentes reutilizables ya creados

2. **No hay Realtime**
   - Hooks usan `refetchInterval: 30s` (polling ineficiente)
   - No hay suscripciones Supabase WebSocket
   - Mensajes no aparecen automáticamente

3. **No hay Routing Dinámico**
   - Solo existe `/messages` en `App.tsx:102-108`
   - Falta `/messages/:userId` para deep linking

4. **No hay Badge en Navigation**
   - Contador de no leídos no visible en barra

5. **No hay Tests Frontend**
   - Solo tests en service y schema
   - Faltan tests de hooks y componentes

---

## Plan de Implementación (4 Fases)

### FASE 1: Setup y Base (2-3 horas) ✅ EN CURSO

**Objetivo:** Mensajería funcional SIN tiempo real

#### Tareas

1. **Crear estructura de archivos**
   - [x] `.claude/sessions/context_session_messaging.md` ← Tú estás aquí
   - [ ] `src/app/features/messages/pages/MessagesPage.tsx` (nueva versión)
   - [ ] `src/app/features/messages/components/MessagesList.tsx`
   - [ ] `src/test-utils/react-query.tsx` (wrapper tests)
   - [ ] `vitest.config.ts` (actualizar)

2. **Actualizar routing en `src/App.tsx`**
   ```typescript
   <Route path="/messages" element={<ProtectedRoute><MessagesPage /></ProtectedRoute>} />
   <Route path="/messages/:userId" element={<ProtectedRoute><MessagesPage /></ProtectedRoute>} />
   ```

3. **Nueva MessagesPage**
   - Eliminar mock data
   - Usar `useConversationsQuery()` hook existente
   - Usar `useParams()` para obtener `userId` de URL
   - Usar componentes `ConversationList`, `MessageCard`, `MessageInput`
   - Layout responsive: grid 3 cols desktop, Stack mobile

4. **Crear MessagesList.tsx**
   - Component para renderizar lista de mensajes
   - Usa `useConversationMessagesQuery(userId)`
   - Scroll automático al final
   - DateSeparator entre días

#### Entregable
- Mensajería funcional con backend real
- Polling cada 30s (temporal)

---

### FASE 2: Tiempo Real (3-4 horas)

**Objetivo:** Mensajes aparecen automáticamente vía WebSocket

#### Tareas

1. **Crear hooks Realtime**
   - `src/app/features/messages/hooks/useRealtimeConversations.ts`
     - Suscripción a `INSERT` en tabla `messages`
     - Invalida query `['conversations']` al recibir mensaje

   - `src/app/features/messages/hooks/useRealtimeMessages.ts`
     - Suscripción a conversación activa
     - Invalida `['conversation-messages', userId]`

   - `src/app/features/messages/hooks/useUnreadNotifications.ts`
     - Suscripción global para contador
     - Invalida `['unread-count']`

2. **Patrón Realtime + React Query**
   ```typescript
   useEffect(() => {
     const channel = supabase
       .channel(`messages-${userId}`)
       .on('postgres_changes', {
         event: 'INSERT',
         schema: 'public',
         table: 'messages',
         filter: `recipient_id=eq.${user.id}`
       }, () => {
         queryClient.invalidateQueries(['conversation-messages', userId])
       })
       .subscribe()

     return () => supabase.removeChannel(channel) // Cleanup crítico!
   }, [userId, user?.id])
   ```

3. **Desactivar polling**
   - Quitar `refetchInterval` de hooks query
   - Confiar solo en Realtime

#### Decisiones Técnicas
- **`invalidateQueries` sobre `setQueryData`** (más simple, menos bugs)
- **Optimistic updates** solo para envío (UX fluida)
- **Cleanup obligatorio** en todos los useEffect

#### Entregable
- Mensajes en tiempo real funcionando
- Sin memory leaks

---

### FASE 3: UX y Polish (2-3 horas)

**Objetivo:** Experiencia de usuario completa

#### Tareas

1. **Smart Scroll** (`useScrollToBottom.ts`)
   - Auto-scroll solo si usuario está al final
   - No interrumpir lectura de mensajes viejos
   - Botón "Nuevos mensajes ↓" si hay nuevos mientras scrollea arriba

2. **Optimistic Updates**
   - Actualizar `useSendMessageMutation.ts`
   - Mostrar mensaje inmediatamente antes de respuesta servidor
   - `onMutate` cancela queries en curso
   - `onError` hace rollback

3. **Mark as Read Automático**
   - Llamar `useMarkAsReadMutation` al abrir conversación
   - Integrar en MessagesList.tsx

4. **Badge en Navigation** (`src/components/layout/Navigation.tsx`)
   - Usar `useUnreadCountQuery()`
   - Badge verde con número
   - Reactivo en tiempo real

5. **Loading States**
   - Skeletons para conversaciones
   - Skeletons para mensajes
   - Usar shadcn/ui Skeleton component

6. **Error States**
   - Mensaje claro con botón "Reintentar"
   - Usar shadcn/ui Alert component

7. **Empty States**
   - "No tienes conversaciones" con botón "Explorar red"
   - "Selecciona una conversación" en desktop

8. **Mobile Layout**
   - Sheet (drawer) para chat en pantallas <1024px
   - Gesture swipe-down para cerrar
   - Usar shadcn/ui Sheet component

#### Entregable
- UX completa y pulida
- Accesibilidad WCAG AA

---

### FASE 4: Testing (3-4 horas)

**Objetivo:** Suite de tests completa (>80% coverage)

#### Tests a Crear

1. **Unit Tests**
   - `message.service.test.ts` (ya existe ✅)
   - `useSendMessageMutation.test.ts`
   - `useRealtimeMessages.test.ts` (mock EventEmitter)

2. **Component Tests**
   - `MessagesList.test.tsx`
   - `ConversationList.test.tsx` (actualizar)
   - `MessagesPage.test.tsx`

3. **Integration Tests**
   - `messaging-flow.test.tsx`
     - Flujo: abrir conversación → enviar → recibir
     - Mark as read automático
     - Invalidación de cache

4. **Test Utils**
   - `src/test-utils/react-query.tsx` - QueryClient wrapper
   - `src/test-utils/supabase-realtime.ts` - Mock EventEmitter

#### Entregable
- Coverage >80% en código crítico
- Tests pasan en CI/CD

---

## Decisiones de Arquitectura

### Patrón Realtime + React Query

**Elección:** `invalidateQueries` sobre `setQueryData`

**Razones:**
1. Más simple y menos propenso a bugs
2. Garantiza consistencia con backend
3. React Query maneja el re-fetch automáticamente

**Alternativa descartada:**
- `setQueryData` requiere gestión manual del cache
- Riesgo de desinc entre cache y BD

---

### Optimistic Updates

**Aplicación:** Solo para envío de mensajes

**Razones:**
1. Mejora percepción de velocidad
2. Mensajes propios no requieren validación compleja
3. Rollback fácil si falla

**No aplicar a:**
- Mensajes recibidos (confiar en Realtime)
- Mark as read (no crítico para UX)

---

### Layout Responsive

**Desktop:** Grid 3 columnas (fijo, no resizable en v1)
- Columna 1: Lista conversaciones
- Columnas 2-3: Chat activo

**Mobile:** Stack + Sheet
- Vista principal: Lista conversaciones
- Sheet: Chat individual (drawer desde abajo)

**Alternativa descartada:**
- ResizablePanel (shadcn/ui) → demasiado complejo para v1

---

### Scroll Behavior

**Problema:** Auto-scroll interrumpe lectura de mensajes viejos

**Solución:** Smart scroll
```typescript
const isNearBottom = scrollPosition > (scrollHeight - clientHeight - 100)
if (isNearBottom) {
  scrollToBottom()
} else {
  showNewMessagesBadge()
}
```

---

## Estado de la Base de Datos

### Tabla `messages`

**Schema:**
```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES users(id),
  recipient_id UUID NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_messages_recipient ON messages(recipient_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
```

**RLS Policies:**
- ✅ Usuarios pueden leer sus propios mensajes (enviados o recibidos)
- ✅ Usuarios pueden insertar mensajes como sender
- ✅ Usuarios pueden actualizar `is_read` de mensajes recibidos

---

## Variables de Entorno

**Requeridas:**
```bash
VITE_SUPABASE_URL=https://...supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbG...
```

**Configuración Actual:**
- Frontend: Puerto 8080 (Vite)
- Backend: Puerto 3001 (Express)
- Proxy: `/api/*` → `http://localhost:3001`

---

## Riesgos y Mitigaciones

| Riesgo | Mitigación |
|--------|-----------|
| **Memory leaks** por suscripciones sin cleanup | `return () => supabase.removeChannel()` en todos los useEffect |
| **Race conditions** entre mutaciones y Realtime | `cancelQueries` en `onMutate`, confiar en timestamps |
| **Re-renders excesivos** | `React.memo` en listas, `useCallback` en handlers |
| **Cache desincronizado** | `invalidateQueries` después de toda mutación |
| **Token expirado** | Auto-refresh ya configurado en `src/lib/supabase.ts` |

---

## Próximos Pasos Inmediatos

1. ✅ Completar este documento de contexto
2. [ ] Comenzar FASE 1: Crear `MessagesPage.tsx` nueva
3. [ ] Actualizar routing en `App.tsx`
4. [ ] Crear `MessagesList.tsx`
5. [ ] Testing manual: enviar/recibir mensajes

---

## Notas de Implementación

### Comandos útiles

```bash
# Desarrollo
yarn dev:full  # Frontend + Backend

# Testing
yarn test  # Vitest
yarn test:watch  # Watch mode

# Build
yarn build
yarn lint
```

### Archivos clave a modificar

1. `src/components/pages/MessagesPage.tsx` - Reemplazar completamente
2. `src/App.tsx` - Agregar ruta `/messages/:userId`
3. `src/components/layout/Navigation.tsx` - Badge no leídos
4. `src/app/features/messages/hooks/mutations/useSendMessageMutation.ts` - Optimistic updates

### Archivos clave a crear

1. `src/app/features/messages/pages/MessagesPage.tsx`
2. `src/app/features/messages/components/MessagesList.tsx`
3. `src/app/features/messages/hooks/useRealtimeConversations.ts`
4. `src/app/features/messages/hooks/useRealtimeMessages.ts`
5. `src/app/features/messages/hooks/useUnreadNotifications.ts`

---

## Log de Decisiones

### 2025-10-27 - Análisis Inicial
- ✅ Confirmado: Backend 100% funcional
- ✅ Identificado: Frontend usa mock data
- ✅ Identificado: Hooks existen pero no están integrados
- ✅ Decisión: Implementar en 4 fases (Setup → Realtime → UX → Tests)
- ✅ Decisión: `invalidateQueries` sobre `setQueryData` para Realtime

---

**Última actualización:** 2025-10-27
**Siguiente revisión:** Tras completar FASE 1
