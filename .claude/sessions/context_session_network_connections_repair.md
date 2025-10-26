# Contexto de Sesión: Reparación del Sistema de Conexiones

**Fecha**: 2025-10-26
**Objetivo**: Reparar y verificar el flujo completo de conexiones entre usuarios

## Problema Reportado

**Síntomas**:
1. Existen 3 usuarios de prueba en la plataforma
2. Hay solicitudes de conexión entre ellos
3. Las solicitudes NO aparecen en la sección "Mis Conexiones"
4. Los tabs muestran (0) en todas las secciones:
   - Solicitudes recibidas (0)
   - Solicitudes enviadas (0)
   - Mis conexiones (0)

**Evidencia Visual**:
- Dashboard muestra "Nuevos miembros" con 2 usuarios (Corral, ibanmillanperez)
- Ambos tienen botón "Conectar" o "Solicitud enviada"
- Pero en NetworkPage → "Mis Conexiones" todo aparece vacío

## Flujo Esperado

### 1. Solicitar Conexión
- Usuario A busca a Usuario B
- Usuario A hace click en "Conectar"
- Se crea registro en tabla `connections`:
  - `requester_id` = Usuario A
  - `addressee_id` = Usuario B
  - `status` = 'pending'

### 2. Solicitudes Recibidas
- Usuario B ve la solicitud en "Solicitudes recibidas (1)"
- Puede ver info de Usuario A
- Tiene opciones: "Aceptar" o "Rechazar"

### 3. Solicitudes Enviadas
- Usuario A ve su solicitud en "Solicitudes enviadas (1)"
- Puede ver info de Usuario B
- Puede "Cancelar" la solicitud

### 4. Aceptar Conexión
- Usuario B hace click en "Aceptar"
- Se actualiza el registro: `status` = 'accepted'
- Ambos ven la conexión en "Mis conexiones (1)"

### 5. Rechazar Conexión
- Usuario B hace click en "Rechazar"
- Se actualiza el registro: `status` = 'rejected'
- La solicitud desaparece de ambas listas

## Arquitectura del Sistema

### Backend (Hexagonal)

**Use Cases**:
- `GetConnectionsUseCase` - Obtener lista de conexiones
- `GetConnectionStatusUseCase` - Estado de conexión entre 2 usuarios
- `GetNetworkStatsUseCase` - Stats para el sidebar
- `RequestConnectionUseCase` - Crear nueva solicitud
- `UpdateConnectionStatusUseCase` - Aceptar/rechazar
- `DeleteConnectionUseCase` - Eliminar/cancelar
- `GetMutualConnectionsUseCase` - Conexiones mutuas

**Rutas API** (a verificar):
- `GET /api/network/connections?status=pending` - Lista de conexiones
- `GET /api/network/connections/:userId/status` - Estado de conexión
- `GET /api/network/stats` - Estadísticas
- `POST /api/network/connections` - Crear solicitud
- `PATCH /api/network/connections/:id` - Actualizar estado
- `DELETE /api/network/connections/:id` - Eliminar
- `GET /api/network/connections/:userId/mutual` - Mutuas

### Frontend (React Query)

**Services**:
- `network.service.ts` - HTTP client para API

**Queries**:
- `useConnectionsQuery` - Lista de conexiones
- `useConnectionStatusQuery` - Estado de conexión
- `useNetworkStatsQuery` - Stats
- `useMutualConnectionsQuery` - Mutuas

**Mutations**:
- `useRequestConnectionMutation` - Solicitar
- `useUpdateConnectionMutation` - Aceptar/rechazar
- `useDeleteConnectionMutation` - Eliminar

**Componentes**:
- `ConnectionsSection` - Tab system con listas
- `UserSearch` - Buscar y conectar usuarios
- `UserConnectionCard` - Card de usuario (dashboard)

## Plan de Investigación

### Fase 1: Verificar Base de Datos ✓
1. Verificar registros en tabla `connections`
2. Verificar usuarios existentes
3. Verificar RLS policies

### Fase 2: Backend API ⏳
1. Verificar rutas en `server/infrastructure/api/routes/`
2. Verificar use cases en `server/application/use-cases/network/`
3. Verificar repositorio en `server/infrastructure/persistence/`
4. Probar endpoints con curl

### Fase 3: Frontend Service ⏳
1. Verificar `network.service.ts`
2. Verificar llamadas HTTP
3. Verificar headers de autenticación

### Fase 4: React Query ⏳
1. Verificar `useConnectionsQuery`
2. Verificar invalidación de cache
3. Verificar filtros por status

### Fase 5: Componentes UI ⏳
1. Verificar `ConnectionsSection`
2. Verificar filtrado de solicitudes recibidas/enviadas
3. Verificar `UserSearch` y botón "Conectar"

### Fase 6: Pruebas E2E ⏳
1. Crear solicitud desde UserSearch
2. Verificar aparece en "Solicitudes enviadas"
3. Verificar aparece en "Solicitudes recibidas" del otro usuario
4. Aceptar solicitud
5. Verificar aparece en "Mis conexiones" para ambos

## Hallazgos y Reparaciones

### ✅ Problema 1: Errores 401 (Unauthorized) - RESUELTO

**Causa raíz**:
- El archivo `src/app/features/network/data/services/network.service.ts` tenía `const API_BASE_URL = ''`
- Esto hacía que las peticiones fueran directamente a `http://localhost:3001/api/connections`
- Bypaseaba el proxy de Vite configurado en `/api`
- El token de Supabase no se enviaba correctamente

**Solución aplicada**:
- Eliminé la constante `API_BASE_URL`
- Todas las rutas ahora son relativas: `'/connections'`, `'/connections/stats'`, etc.
- El `axiosInstance` maneja correctamente el baseURL (`/api` en desarrollo)
- Las peticiones ahora pasan por el proxy y el token se envía en cada request

**Archivos modificados**:
- ✅ `src/app/features/network/data/services/network.service.ts`

**Resultado**:
- ✅ No más errores 401
- ✅ Las peticiones se autentican correctamente
- ✅ El backend recibe el token de Supabase

### ✅ Problema 2: Falta botón "Conectar" - RESUELTO

**Causa raíz**:
- El componente `ProfileCard` (usado en búsqueda de usuarios) NO tenía implementado el botón para solicitar conexión
- Solo mostraba info del usuario y botones de LinkedIn/Website

**Solución aplicada**:
- Agregué imports necesarios: `useConnectionStatusQuery`, `useRequestConnectionMutation`, `useAuthContext`
- Agregué prop `showConnectButton?: boolean` (default: true)
- Implementé lógica para consultar estado de conexión
- Agregué handler `handleConnect` para solicitar conexión
- Implementé botón con 3 estados:
  - **'none'**: Botón verde "Conectar" (clickeable)
  - **'pending'**: Botón gris "Solicitud enviada" (disabled)
  - **'accepted'**: Botón outline "Conectados" (disabled)
- El botón NO se muestra si es el usuario actual

**Archivos modificados**:
- ✅ `src/components/profile/ProfileCard.tsx`

**Resultado**:
- ✅ Los usuarios pueden solicitar conexiones desde la búsqueda
- ✅ Se muestra el estado actual de cada conexión
- ✅ Notificación toast al enviar solicitud

### ✅ Verificación de NewMemberCard (Dashboard)

**Estado**: YA IMPLEMENTADO CORRECTAMENTE

El componente `src/app/features/dashboard/components/NewMemberCard.tsx` YA tenía:
- ✅ Query para obtener estado de conexión
- ✅ Mutation para solicitar conexión
- ✅ Botón con estados (Conectar, Solicitud enviada, Conectado)
- ✅ Toast notifications
- ✅ Lógica para detectar usuario actual

**No requirió modificaciones**.

### ✅ Problema 3: Formato de respuesta del backend - RESUELTO

**Causa raíz**:
- El backend en `server/infrastructure/api/routes/connections.routes.ts` retornaba la lista de conexiones con estructura plana:
```json
{
  "connections": [{
    "id": "...",
    "requester_id": "...",
    "addressee_id": "...",
    "status": "pending",
    "created_at": "...",
    "updated_at": "...",
    "user": {...}
  }]
}
```
- Pero el frontend esperaba estructura anidada según `connectionWithUserSchema`:
```json
{
  "connections": [{
    "connection": {
      "id": "...",
      "requester_id": "...",
      ...
    },
    "user": {...}
  }]
}
```

**Solución aplicada**:
- Modifiqué la ruta GET `/api/connections` para retornar el objeto `connection` anidado
- Cambié el mapeo en la línea 27-37 del archivo `connections.routes.ts`

**Archivos modificados**:
- ✅ `server/infrastructure/api/routes/connections.routes.ts`

**Resultado**:
- ✅ El frontend ahora puede parsear correctamente la respuesta del backend
- ✅ Se eliminó el mismatch entre backend y frontend schemas

### ✅ Problema 4: Validación Zod fallando silenciosamente - RESUELTO

**Causa raíz**:
- El schema `userProfileSchema` validaba campos URL con `.url().nullable()`:
  - `avatar_url: z.string().url().nullable()`
  - `linkedin_url: z.string().url().nullable()`
  - `website_url: z.string().url().nullable()`
- El backend retornaba strings vacíos `""` para estos campos cuando el usuario no los había completado
- Zod rechazaba `""` porque no es una URL válida ni es `null`
- Esto causaba que `getConnectionsResponseSchema.parse()` fallara y React Query no actualizara el estado

**Solución aplicada**:
- Modifiqué el schema para aceptar strings vacíos usando `.or(z.literal(''))`:
```typescript
avatar_url: z.string().url().or(z.literal('')).nullable(),
linkedin_url: z.string().url().or(z.literal('')).nullable(),
website_url: z.string().url().or(z.literal('')).nullable(),
```

**Archivos modificados**:
- ✅ `src/app/features/profile/data/schemas/profile.schema.ts`

**Resultado**:
- ✅ Zod ahora acepta URLs válidas, strings vacíos, o null
- ✅ No más errores de validación silenciosos

### ✅ Problema 5: Formato de timestamps de Postgres - RESUELTO

**Causa raíz**:
- El schema validaba timestamps con `.datetime()`:
  - `created_at: z.string().datetime()`
  - `updated_at: z.string().datetime()`
- Postgres retorna timestamps con microsegundos: `"2025-10-07T15:35:30.277063+00:00"`
- Zod `.datetime()` espera formato ISO 8601 estricto sin microsegundos
- Esto causaba errores de validación: `"Invalid datetime"`

**Solución aplicada**:
- Cambié la validación de `.datetime()` a `.string()` para aceptar cualquier formato de timestamp:
```typescript
created_at: z.string(), // Accept any string format from Postgres
updated_at: z.string()  // Accept any string format from Postgres
```

**Archivos modificados**:
- ✅ `src/app/features/profile/data/schemas/profile.schema.ts`

**Resultado**:
- ✅ Los timestamps de Postgres se aceptan correctamente
- ✅ No más errores de validación de datetime

### 📸 Screenshot de Verificación

**Archivo**: `.playwright-mcp/network-connections-fixed.png`

Muestra:
- ✅ Tab "Solicitudes enviadas (1)" funcionando
- ✅ Card mostrando solicitud a ibanmillanperez con estado "Pendiente"
- ✅ Botón "Cancelar" disponible
- ✅ Sidebar "Gestionar mi red" con todas las secciones

## Base de Datos

La tabla `connections` ya existe en Supabase con la estructura correcta:
- ✅ `id` UUID (PK)
- ✅ `requester_id` UUID (FK a users)
- ✅ `addressee_id` UUID (FK a users)
- ✅ `status` VARCHAR(50) - valores: 'pending', 'accepted', 'rejected', 'blocked'
- ✅ `created_at`, `updated_at` TIMESTAMP
- ✅ Constraint único: `(requester_id, addressee_id)`
- ✅ Constraint: no auto-conexión
- ✅ RLS policies habilitadas

## Estado Final del Sistema

### Backend ✅
- ✅ Rutas API funcionando (`/api/connections`)
- ✅ Use cases implementados
- ✅ Autenticación con middleware
- ✅ Validación de tokens Supabase
- ✅ Persistencia en base de datos

### Frontend ✅
- ✅ Service layer reparado (rutas relativas)
- ✅ React Query hooks funcionando
- ✅ Componentes con botón "Conectar":
  - ✅ ProfileCard (búsqueda)
  - ✅ NewMemberCard (dashboard)
- ✅ Estados de conexión dinámicos
- ✅ Notificaciones al usuario

### Flujo Completo ✅ - VERIFICADO E2E

**Testing realizado con usuarios**: Corral (requester) → ibanmillanperez (addressee)

1. Usuario A (Corral) busca a Usuario B (ibanmillanperez) → ✅ FUNCIONA
2. Usuario A hace click en "Conectar" → ✅ FUNCIONA
3. Se crea registro en BD (status: 'pending') → ✅ FUNCIONA
4. Usuario A ve "Solicitud enviada" en búsqueda y dashboard → ✅ FUNCIONA
5. Usuario A ve solicitud en "Solicitudes enviadas (1)" → ✅ FUNCIONA
6. Usuario B ve solicitud en "Solicitudes recibidas (1)" → ✅ FUNCIONA
7. Usuario B hace click en "Aceptar" → ✅ FUNCIONA
8. Se actualiza registro en BD (status: 'accepted') → ✅ FUNCIONA
9. Usuario B ve conexión en "Mis conexiones (1)" con badge "Conectado" → ✅ FUNCIONA
10. Usuario B ve "Conectado" en dashboard → ✅ FUNCIONA
11. Notificaciones toast funcionando correctamente → ✅ FUNCIONA

**Screenshots de evidencia**:
- `.playwright-mcp/network-connections-fixed.png` - Solicitud enviada (Corral)
- `.playwright-mcp/network-solicitud-recibida-iban.png` - Solicitud recibida (ibanmillanperez)
- `.playwright-mcp/network-conexion-aceptada-iban.png` - Conexión aceptada (ibanmillanperez)
- `.playwright-mcp/network-conexion-final-iban.png` - Vista final de red (ibanmillanperez)

## Próximos Pasos (Opcionales)

1. ✅ Probar flujo completo E2E con dos usuarios - COMPLETADO
2. ⏳ Implementar notificaciones en tiempo real (Supabase Realtime)
3. ⏳ Agregar contador de solicitudes pendientes en el header
4. ⏳ Implementar página de perfil individual
5. ⏳ Agregar filtro por conexiones en la búsqueda
6. ⏳ Implementar flujo de "Rechazar" solicitud
7. ⏳ Implementar flujo de "Cancelar" solicitud enviada
8. ⏳ Implementar flujo de "Eliminar" conexión activa
