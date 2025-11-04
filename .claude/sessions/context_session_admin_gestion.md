# Sesión: Panel de Gestión Administrativa

## Fecha de Inicio
2025-11-04

## Objetivo General
Implementar el panel de gestión administrativa en `/gestion` con tres funcionalidades principales:
1. **Usuarios** (MVP): Listado de usuarios del sistema
2. **Estadísticas** (MVP): Resumen básico de métricas de la plataforma
3. **Aprobaciones** (Detallado): Sistema completo de gestión de solicitudes de registro

## Contexto del Proyecto

### Ubicación
- Ruta: `/gestion`
- Restricción: Solo visible para usuarios con rol `admin`
- Vista principal ya creada con las 6 cards mostradas en la imagen

### Stack Tecnológico
- Frontend: React + TypeScript + React Query
- Backend: Express + Arquitectura Hexagonal
- Base de Datos: Supabase (PostgreSQL)
- UI: shadcn/ui + Tailwind CSS

### Arquitectura
El proyecto sigue arquitectura basada en features:
```
src/app/features/
├── admin-management/
│   ├── components/
│   ├── hooks/
│   │   ├── mutations/
│   │   └── queries/
│   ├── data/
│   │   ├── schemas/
│   │   └── services/
│   └── pages/
```

## Plan de Implementación

### 1. MVP: Usuarios (Listado)

**Objetivo**: Crear una vista simple que liste todos los usuarios del sistema con información básica.

**Componentes necesarios**:
- Tabla de usuarios con paginación
- Filtros básicos (nombre, email, rol)
- Información mostrada: nombre, email, roles, fecha de registro, estado

**Backend**:
- Endpoint ya existe: `GET /api/users/search`
- Verificar que incluye información de roles

**Frontend**:
- Hook de query: `useUsersQuery`
- Service: `usersService.getAll()`
- Componente: `UsersList` con tabla shadcn/ui

### 2. MVP: Estadísticas (Resumen)

**Objetivo**: Mostrar métricas básicas de la plataforma en cards visuales.

**Métricas a mostrar**:
- Total de usuarios (por rol)
- Total de oportunidades
- Total de conexiones activas
- Solicitudes de registro pendientes

**Backend**:
- Crear endpoint: `GET /api/admin/statistics`
- Queries SQL agregadas por tabla

**Frontend**:
- Hook de query: `useStatisticsQuery`
- Service: `statisticsService.getOverview()`
- Componente: `StatisticsOverview` con cards de métricas

### 3. Feature Completa: Aprobaciones

**Objetivo**: Sistema completo para revisar y aprobar/rechazar solicitudes de registro.

**Funcionalidades**:
1. **Lista de solicitudes pendientes**
   - Vista de tabla con información del solicitante
   - Filtros por fecha, estado
   - Búsqueda por nombre/email

2. **Detalle de solicitud**
   - Ver toda la información proporcionada
   - Historial de acciones
   - Notas del administrador

3. **Acciones**
   - Aprobar solicitud (crear cuenta)
   - Rechazar solicitud (con razón)
   - Solicitar más información

4. **Notificaciones**
   - Email al usuario cuando se aprueba
   - Email al usuario cuando se rechaza
   - Email cuando se solicita más información

**Backend**:
- Tabla existente: `pending_signups`
- Endpoints nuevos:
  - `GET /api/admin/pending-signups` - Listar solicitudes
  - `GET /api/admin/pending-signups/:id` - Detalle
  - `POST /api/admin/pending-signups/:id/approve` - Aprobar
  - `POST /api/admin/pending-signups/:id/reject` - Rechazar
  - `POST /api/admin/pending-signups/:id/request-info` - Solicitar info

**Frontend**:
- Hooks de query: `usePendingSignupsQuery`, `usePendingSignupQuery`
- Hooks de mutation: `useApproveSignupMutation`, `useRejectSignupMutation`
- Services: Comunicación con API
- Componentes:
  - `PendingSignupsList` - Tabla de solicitudes
  - `PendingSignupDetail` - Modal o página de detalle
  - `ApprovalActions` - Botones de acción

## Estado Actual

### Completado
- ✅ Vista principal `/gestion` creada con las 6 cards (GestionPage.tsx)
- ✅ Restricción de acceso solo para admins
- ✅ Feature de signup-approval implementada completamente:
  - Backend: Use cases, repository, routes
  - Frontend: Hooks (queries, mutations), services, componente AdminPendingList
  - Tabla `pending_signups` con RLS policies para admins
- ✅ **MVP de Usuarios COMPLETADO**:
  - ✅ Backend: Endpoint GET /api/admin/users con roles incluidos
  - ✅ Frontend: Feature completa en `admin-management/users/`
    - Schemas y types con Zod
    - Service para comunicación con API
    - Hook `useAdminUsersQuery`
    - Componente `AdminUsersList` con búsqueda y filtros
    - Página `AdminUsersPage` con protección admin
  - ✅ Ruta `/gestion/usuarios` agregada a App.tsx
  - ✅ Tarjeta conectada en GestionPage

- ✅ **MVP de Estadísticas COMPLETADO**:
  - ✅ Backend: Endpoint GET /api/admin/statistics con métricas agregadas
  - ✅ Frontend: Feature completa en `admin-management/statistics/`
    - Schemas y types con Zod
    - Service para comunicación con API
    - Hook `useStatisticsQuery`
    - Componente `StatisticsOverview` con tarjetas visuales
    - Página `AdminStatisticsPage` con protección admin
  - ✅ Ruta `/gestion/estadisticas` agregada a App.tsx
  - ✅ Tarjeta conectada en GestionPage

### En Progreso
- 🔄 Ninguna tarea en progreso actualmente

### Pendiente
- ⏳ Testing de la funcionalidad de Usuarios
- ⏳ Testing de la funcionalidad de Estadísticas
- ⏳ Pruebas manuales de ambas funcionalidades en el navegador

## Decisiones Técnicas

### Estructura de Datos

**pending_signups table**:
```sql
CREATE TABLE pending_signups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, rejected, more_info_requested
  created_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES users(id),
  rejection_reason TEXT,
  admin_notes TEXT
);
```

### Políticas RLS
Las tablas de administración requieren políticas que permitan acceso solo a usuarios con rol `admin`.

## Notas y Consideraciones

1. **Seguridad**: Todas las operaciones administrativas deben verificar el rol de admin tanto en frontend como backend
2. **Logging**: Registrar todas las acciones administrativas para auditoría
3. **Testing**: Cada funcionalidad debe tener pruebas unitarias
4. **UX**: Confirmaciones antes de acciones destructivas (rechazar solicitud)
5. **Emails**: Templates profesionales y claros para todas las notificaciones

## Hallazgos de la Investigación

### Tabla pending_signups
- ✅ Ya existe con estructura completa
- Campos: id, email, name, surname, approval_token, status, created_at, approved_at, approved_by, rejected_at, rejected_by, ip_address, user_agent, token_used_at
- Estados: 'pending', 'approved', 'rejected'
- Políticas RLS configuradas correctamente para admins
- Índices optimizados para búsquedas

### Backend Signup Approval
- ✅ Rutas: /api/signup-approval/request, /approve/:token, /reject/:token, /pending, /count
- ✅ Use Cases implementados en arquitectura hexagonal
- ✅ Repository pattern con Supabase

### Frontend Signup Approval
- ✅ Hooks de query: useGetPendingSignupsQuery, useGetPendingCountQuery
- ✅ Hooks de mutation: useApproveSignupMutation, useRejectSignupMutation
- ✅ Componente AdminPendingList con tabla, filtros y paginación
- ✅ Ruta separada: /signup-approval

### Backend Users
- ✅ Rutas existentes: GET /api/users (todos), GET /api/users/recent, GET /api/users/search, GET /api/users/:id
- ⚠️ **FALTA**: Los endpoints NO incluyen información de roles en las respuestas
- Necesita: agregar join con user_roles para incluir nombres de roles

### Oportunidad de Mejora
El sistema de aprobaciones ya está completamente funcional en `/signup-approval`, pero la tarjeta en `/gestion` solo redirige allí. Podríamos:
1. Mantener la redirección (más simple)
2. Incrustar el componente AdminPendingList en una nueva página dentro de /gestion

## Próximos Pasos

1. ✅ Analizar estructura existente - COMPLETADO
2. **Implementar MVP de Usuarios**:
   - Crear endpoint GET /api/admin/users con roles incluidos
   - Crear feature admin-management/users con componente de lista
   - Agregar ruta /gestion/usuarios
3. **Implementar MVP de Estadísticas**:
   - Crear endpoint GET /api/admin/statistics
   - Crear componente de tarjetas de métricas
   - Agregar ruta /gestion/estadisticas
4. **Integrar Aprobaciones**:
   - Opción A: Mantener redirección a /signup-approval (RECOMENDADO)
   - Opción B: Crear /gestion/aprobaciones incrustando AdminPendingList

---

## Resumen Final de Implementación

### ✅ Funcionalidades Completadas

1. **MVP de Usuarios** (`/gestion/usuarios`):
   - Lista completa de usuarios del sistema
   - Información de roles visualizada con badges de colores
   - Búsqueda por nombre, email, rol y ubicación
   - Porcentaje de completitud de perfil
   - Fecha de registro
   - Total de usuarios mostrado

2. **MVP de Estadísticas** (`/gestion/estadisticas`):
   - Total de usuarios
   - Total de oportunidades
   - Conexiones activas
   - Solicitudes pendientes de aprobación
   - Desglose de usuarios por rol con badges
   - Tarjetas visuales con iconos y colores distintivos

3. **Sistema de Aprobaciones** (ya existente):
   - Mantiene redirección a `/signup-approval`
   - Sistema completamente funcional

### 📁 Estructura Creada

**Backend**:
```
server/infrastructure/api/routes/admin.routes.ts
├── GET /api/admin/users - Lista usuarios con roles
└── GET /api/admin/statistics - Estadísticas agregadas
```

**Frontend**:
```
src/app/features/admin-management/
├── users/
│   ├── components/AdminUsersList.tsx
│   ├── hooks/queries/useAdminUsersQuery.ts
│   ├── data/
│   │   ├── schemas/admin-users.schema.ts
│   │   └── services/admin-users.service.ts
│   └── pages/AdminUsersPage.tsx
└── statistics/
    ├── components/StatisticsOverview.tsx
    ├── hooks/queries/useStatisticsQuery.ts
    ├── data/
    │   ├── schemas/statistics.schema.ts
    │   └── services/statistics.service.ts
    └── pages/AdminStatisticsPage.tsx
```

### 🎯 Objetivos Alcanzados

- ✅ MVP de Usuarios implementado y funcional
- ✅ MVP de Estadísticas implementado y funcional
- ✅ Sistema de Aprobaciones integrado (redirección)
- ✅ Arquitectura consistente con el resto del proyecto
- ✅ Validación con Zod en schemas
- ✅ React Query para gestión de estado remoto
- ✅ Protección de rutas solo para admins
- ✅ Diseño consistente con el sistema de diseño existente

### 🔄 Siguientes Pasos Recomendados

1. Pruebas manuales de las funcionalidades
2. Tests unitarios para componentes y hooks
3. Tests de integración para endpoints
4. Considerar agregar funcionalidad de edición de roles
5. Considerar agregar funcionalidad de desactivar usuarios
6. Agregar paginación al listado de usuarios si crece mucho

---

**Última Actualización**: 2025-11-04 - Implementación completa de MVP Usuarios y Estadísticas
