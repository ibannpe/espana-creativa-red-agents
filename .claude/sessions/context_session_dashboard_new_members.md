# Sesión: Dashboard - Nuevos Miembros y Funcionalidad de Conexión

## Fecha de Creación
2025-10-25

## Objetivo
Implementar dos funcionalidades principales en el Dashboard:
1. Mostrar usuarios registrados en los últimos 30 días en la sección "Nuevos miembros"
2. Activar el botón "Conectar" para permitir conexiones entre usuarios

## Estado Actual

### Archivo Analizado
- `src/components/dashboard/Dashboard.tsx` (líneas 215-245)

### Problema Identificado
1. **Datos Hardcodeados**: La sección "Nuevos miembros" muestra datos estáticos (Usuario 1, Usuario 2, Usuario 3)
   ```typescript
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
   ```

2. **Botón Conectar Sin Funcionalidad**: El botón no tiene handler onClick

### Infraestructura Existente

**Sistema de Conexiones YA IMPLEMENTADO** ✅
- Tabla `connections` en base de datos (migration 004)
- Backend completo con arquitectura hexagonal:
  - Routes: `server/infrastructure/api/routes/connections.routes.ts`
  - Use Cases: `server/application/use-cases/network/`
  - Repository: `server/infrastructure/adapters/repositories/SupabaseConnectionRepository.ts`
- Frontend con React Query:
  - Service: `src/app/features/network/data/services/network.service.ts`
  - Mutation Hook: `src/app/features/network/hooks/mutations/useRequestConnectionMutation.ts`
  - Query Hooks: `src/app/features/network/hooks/queries/`

**API de Usuarios Existente** ✅
- `src/lib/api/users.ts` con funciones:
  - `getAllUsers()` - Obtiene todos los usuarios ordenados por created_at DESC
  - `getUserProfile(userId)` - Obtiene perfil con roles
  - `searchUsers(query, filters)` - Búsqueda avanzada

**Tipos TypeScript** ✅
- `User` definido en `src/types/index.ts` con campo `created_at`

## Plan de Implementación Final

### FASE 1: Backend - Endpoint de Usuarios Recientes ⏳
**Estimación**: 2-3 horas
**Documento de Referencia**: `.claude/doc/recent_users/backend.md`

#### Archivos a Crear
1. `server/application/use-cases/users/GetRecentUsersUseCase.ts`
   - Validación: days (1-365, default 30), limit (1-50, default 5)
   - Lógica de negocio para filtrar usuarios recientes

2. Extender `server/application/ports/UserRepository.ts`
   - Añadir: `findRecentUsers(days: number, limit: number): Promise<User[]>`

3. Implementar en `server/infrastructure/adapters/repositories/SupabaseUserRepository.ts`
   - Query Supabase: `WHERE created_at >= NOW() - INTERVAL 'N days'`
   - JOIN con `user_roles` y `roles`
   - ORDER BY `created_at DESC`
   - LIMIT N

4. Crear ruta `server/infrastructure/api/routes/users.routes.ts`
   - **CRÍTICO**: Ruta `/recent` ANTES de `/:id` para evitar conflictos
   - Endpoint: `GET /api/users/recent?days=30&limit=5`
   - Validación de query params (parsing string → number)

5. Registrar en `server/infrastructure/di/Container.ts`

#### Tests Backend
- Unit: `GetRecentUsersUseCase.test.ts`
- Integration: `SupabaseUserRepository.test.ts`
- E2E: `users.routes.test.ts`

#### Notas Críticas
- ⚠️ Orden de rutas es crucial (recent antes de :id)
- ✅ Sin autenticación (endpoint público)
- ✅ Timezones: UTC en DB y comparaciones

---

### FASE 2: Frontend - Data Layer ⏳
**Estimación**: 2-3 horas
**Documento de Referencia**: `.claude/doc/dashboard-new-members/frontend.md`

#### Estructura de Archivos a Crear
```
src/app/features/dashboard/
├── data/
│   ├── services/
│   │   └── dashboard.service.ts
│   └── schemas/
│       └── dashboard.schema.ts
├── hooks/
│   └── queries/
│       └── useRecentUsersQuery.ts
└── components/
    ├── NewMemberCard.tsx
    └── NewMembersSection.tsx
```

#### 1. `dashboard.schema.ts`
- Zod schemas para validación
- Reutilizar `userProfileSchema` de profile feature
- Tipos: `GetRecentUsersResponse`, `RecentUser`

#### 2. `dashboard.service.ts`
- Axios client para `GET /api/users/recent?days=30&limit=5`
- Validación con Zod
- Manejo de errores HTTP

#### 3. `useRecentUsersQuery.ts`
- React Query hook
- Query key: `['dashboard', 'recent-users', 30, 5]`
- Config: `staleTime: 2min`, `gcTime: 10min`, `refetchOnWindowFocus: false`
- Return: `{ users, isLoading, error, refetch }`

#### Tests Frontend (Data Layer)
- Unit: `dashboard.service.test.ts`
- Unit: `useRecentUsersQuery.test.ts`

---

### FASE 3: Frontend - UI Components ⏳
**Estimación**: 3-4 horas
**Documento de Referencia**: `.claude/doc/dashboard/shadcn_ui.md`

#### 1. `NewMemberCard.tsx` (Componente Presentacional)
**Props**:
```typescript
interface NewMemberCardProps {
  user: UserProfile
  onConnect?: (userId: string) => void
  connectionStatus?: 'none' | 'pending' | 'accepted'
  isLoading?: boolean
}
```

**Layout**: Horizontal compacto
- Avatar 48px con iniciales fallback
- Nombre + Rol ("Miembro" si no tiene rol)
- Botón con 3 estados:
  - `none`: "Conectar" (primary)
  - `pending`: "Solicitud enviada" (disabled)
  - `accepted`: Badge "Conectado"

**Integración**:
- `useRequestConnectionMutation` de network feature
- `useToast` para notifications
- Manejo de estados de loading

#### 2. `NewMembersSection.tsx` (Container Component)
**Responsabilidades**:
- Usar `useRecentUsersQuery` para obtener datos
- Verificar estado de conexión con cada usuario (via `useConnectionStatusQuery`)
- Renderizar lista de `NewMemberCard`
- Manejar 4 estados:
  - **Loading**: 5 skeletons
  - **Error**: Alert rojo con mensaje
  - **Empty**: Mensaje "No hay nuevos miembros aún"
  - **Success**: Lista de cards

#### 3. Modificar `Dashboard.tsx`
- Eliminar líneas 215-245 (código hardcodeado)
- Importar `<NewMembersSection />`
- Reemplazar código estático

#### Tests Frontend (UI)
- Unit: `NewMemberCard.test.tsx`
- Unit: `NewMembersSection.test.tsx`
- Integration: Flujo completo de conexión

---

### FASE 4: Testing E2E ⏳
**Estimación**: 2-3 horas

#### Tests con Playwright
1. **Ver nuevos miembros**:
   - Dashboard muestra 5 usuarios recientes
   - Datos correctos (nombre, avatar, rol)

2. **Enviar solicitud de conexión**:
   - Click en "Conectar"
   - Toast "Solicitud enviada a [Nombre]"
   - Botón cambia a "Solicitud enviada" (disabled)

3. **Estados de conexión**:
   - Usuario con conexión pending muestra estado correcto
   - Usuario con conexión accepted muestra badge

4. **Edge cases**:
   - Sin usuarios nuevos → mensaje "No hay nuevos miembros aún"
   - Error de red → mensaje de error amigable

---

### FASE 5: Documentación y QA ⏳
**Estimación**: 1 hora

#### Tareas
1. Actualizar comentarios ABOUTME en todos los archivos nuevos
2. Verificar que todos los tests pasan
3. QA manual completo
4. Actualizar este documento de sesión con resultados

---

## Resumen de Estimaciones

| Fase | Tiempo | Complejidad |
|------|--------|-------------|
| Backend | 2-3h | Baja |
| Frontend Data | 2-3h | Media |
| Frontend UI | 3-4h | Media |
| Testing E2E | 2-3h | Media |
| Docs & QA | 1h | Baja |
| **TOTAL** | **10-14h** | - |

## Decisiones de Iban (2025-10-25)

### UX/UI ✅
1. **Orden**: Más recientes primero (created_at DESC)
2. **Cantidad**: Mostrar **5 usuarios** (no 3)
3. **Feedback**: Toast notification + cambio de botón
4. **Estado conexión**: Mostrar "Solicitud enviada" (disabled) si pending

### Arquitectura ✅
5. **Patrón**: Feature module completo `app/features/dashboard/`
6. **Backend**: Crear endpoint `GET /api/users/recent?days=30`
7. **Componente UI**: Crear `NewMemberCard` específico (no reutilizar UserConnectionCard)

### Datos ✅
8. **Sin avatar**: Iniciales del nombre en fallback
9. **Sin rol**: Mostrar "Miembro" genérico
10. **Sin usuarios**: Mostrar mensaje "No hay nuevos miembros aún"

### Testing ✅
11. **Alcance**: Completo (Unit + Integration + E2E)

## Contexto Técnico

### Estado de Auth
- Sistema migrado a React Query con `useAuthContext`
- Usuario autenticado disponible en contexto

### Configuración de Proxy
- API Backend: `http://localhost:3001`
- Frontend proxy: `/api/*` → Backend
- Vite config: `vite.config.ts`

### Patrones del Proyecto
- React Query para data fetching
- Arquitectura hexagonal en backend
- Feature-based organization para nuevas features
- shadcn/ui para componentes UI

## Siguientes Pasos
1. Esperar respuestas de Iban a las preguntas
2. Consultar sub-agentes especializados
3. Finalizar plan detallado
4. Implementar por fases
