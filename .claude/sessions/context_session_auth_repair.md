# Sesión: Reparación y Mejora del Sistema de Autenticación

**Fecha:** 2025-10-22
**Objetivo:** Investigar, diagnosticar y reparar todos los problemas del sistema de login/logout

## Estado: EN PROGRESO

---

## Investigación Realizada

### 1. Análisis del Código

#### Arquitectura Dual Detectada

El proyecto tiene **DOS sistemas de autenticación coexistiendo**:

**Sistema Viejo (Legacy):**
- `src/lib/auth.ts` - Funciones directas de Supabase Auth
- `src/hooks/useAuth.ts` - Hook con lógica duplicada y manual
- `src/store/auth.ts` - Zustand store (no utilizado activamente)
- Usado por: Dashboard, Navigation (probablemente otros componentes)

**Sistema Nuevo (Feature-based Architecture):**
- `src/app/features/auth/` - Arquitectura hexagonal completa
- `src/app/features/auth/hooks/useAuthContext.tsx` - Context con React Query
- `src/app/features/auth/data/services/auth.service.ts` - Servicio que llama al backend
- Usado por: AuthPage, ProtectedRoute de features

**Backend (Hexagonal Architecture):**
- `server/infrastructure/api/routes/auth.routes.ts` - Endpoints REST
- POST /api/auth/signup
- POST /api/auth/signin
- POST /api/auth/signout
- GET /api/auth/me

### 2. Flujo de Pruebas Manuales

#### Prueba 1: Login con usuario inexistente
- **Input:** test@example.com / TestPassword123
- **Resultado:** ❌ Error 401 - "Request failed with status code 401"
- **Endpoint:** POST /api/auth/signin
- **Comportamiento:** Correcto (usuario no existe)

#### Prueba 2: Signup de nuevo usuario
- **Input:** testuser@example.com / TestPassword123 / Test User
- **Resultado:** ✅ Usuario creado exitosamente (201)
- **Endpoint:** POST /api/auth/signup
- **Redirección:** Redirigió a /dashboard correctamente
- **Problema:** Dashboard muestra "¡Bienvenido, !" (sin nombre de usuario)

#### Prueba 3: Logout
- **Acción:** Click en botón "Salir"
- **Resultado:** ❌ **FALLO CRÍTICO** - El usuario no fue deslogueado
- **Síntoma:** La página permaneció en /dashboard
- **Logs:** No se realizó llamada a /api/auth/signout
- **Causa raíz:** Dashboard usa `useAuth` viejo que llama a `supabase.auth.signOut()` directamente, pero no está integrado con el nuevo sistema

### 3. Logs del Sistema

#### Logs del Frontend (Consola del Navegador)
```
🔐 Auth hook iniciando (x4 veces - renderizados múltiples)
📡 Obteniendo sesión...
📡 Sesión obtenida: {hasSession: false, userId: undefined}
🚪 No hay usuario autenticado
🔔 Auth cambió: INITIAL_SESSION {hasSession: false}
```

**Problema:** Después del signup exitoso, el sistema dice "No hay usuario autenticado"

#### Logs del Backend (Servidor)
```
POST /api/auth/signup - 201 (1615ms)
GET /api/auth/me - 401 (0ms) - ¡Llamado múltiples veces!
```

**Problema:** El endpoint `/me` devuelve 401 inmediatamente después del signup

---

## Diagnóstico de Problemas

### 🔴 CRÍTICO 1: Logout No Funciona

**Ubicación:** `src/components/dashboard/Dashboard.tsx:57-60`

**Código Problemático:**
```tsx
<Button variant="ghost" size="sm" onClick={() => {
  signOut();  // ← Usa useAuth viejo
}}>
```

**Causa Raíz:**
- Dashboard importa `useAuth` del hook viejo (línea 2)
- El hook viejo llama a `supabase.auth.signOut()` directamente
- NO llama al endpoint `/api/auth/signout` del backend
- NO invalida el cache de React Query
- NO redirige al usuario a `/auth`

**Impacto:**
- Usuario permanece logueado visualmente
- Estado inconsistente entre frontend y backend
- Sesión de Supabase puede estar cerrada pero el UI no actualiza

---

### 🔴 CRÍTICO 2: Arquitectura Dual Causa Inconsistencias

**Problema:**
Dos sistemas de auth funcionando simultáneamente con:
- Diferentes fuentes de verdad
- Diferentes formas de manejar estado
- Diferentes flows de redirección

**Manifestaciones:**
1. AuthPage usa `useAuthContext` → llama a backend API
2. Dashboard usa `useAuth` → llama directo a Supabase
3. App.tsx usa `useAuthContext` para routing
4. Navigation usa `useAuth` para mostrar usuario
5. ProtectedRoute tiene DOS versiones diferentes

**Resultado:**
- Login funciona (AuthPage → backend → Supabase)
- Pero el resto de la app no se entera porque usa hook diferente
- Logout no funciona porque Dashboard usa hook viejo

---

### 🟡 IMPORTANTE 3: Sesión No Persiste Después del Signup

**Síntoma:**
Después de signup exitoso, los logs muestran:
```
📡 Sesión obtenida: {hasSession: false}
```

**Posibles Causas:**
1. Supabase no está configurado para auto-confirm emails
2. El backend crea el usuario pero no establece la sesión
3. El frontend no espera/procesa correctamente la respuesta del signup
4. Cookies/localStorage no se están guardando correctamente

**Evidencia:**
- POST /signup devuelve 201 (éxito)
- Pero inmediatamente GET /me devuelve 401 (no autenticado)
- Usuario ve dashboard pero sin datos de usuario

---

### 🟡 IMPORTANTE 4: Renderizados Múltiples del Auth Hook

**Síntoma:**
```
🔐 Auth hook iniciando (x4 veces en < 1ms)
```

**Causa:**
El hook `useAuth` se inicializa 4 veces simultáneamente, probablemente porque:
- Múltiples componentes lo usan
- No hay memoización adecuada
- Strict Mode de React causa doble renderizado
- Listeners de Supabase se suscriben múltiples veces

**Impacto:**
- Performance degradada
- Llamadas API duplicadas
- Posibles race conditions

---

### 🟢 MENOR 5: Nombre de Usuario No Se Muestra

**Síntoma:**
Dashboard muestra "¡Bienvenido, !" sin nombre

**Causa:**
El objeto `user` del nuevo sistema probablemente no tiene `name` poblado correctamente, o el Dashboard está usando el hook viejo que no tiene el usuario actualizado.

---

### 🟢 MENOR 6: ProtectedRoute Duplicado

**Archivos:**
- `src/components/auth/ProtectedRoute.tsx` (hook viejo)
- `src/app/features/auth/components/ProtectedRoute.tsx` (hook nuevo)

**App.tsx** importa del nuevo:
```tsx
import { ProtectedRoute } from '@/app/features/auth/components/ProtectedRoute'
```

Pero existe el viejo también, causando confusión.

---

## Plan de Reparación y Mejoras

### Fase 1: Decisión Arquitectónica (CRÍTICO)

**Decisión Requerida:**
¿Migrar completamente al nuevo sistema o mantener dual?

**Recomendación:** MIGRAR AL NUEVO SISTEMA COMPLETAMENTE

**Razones:**
1. El nuevo sistema es más robusto (React Query, hexagonal architecture)
2. El viejo sistema causa bugs críticos
3. Mantener dual es insostenible a largo plazo
4. El backend ya está hecho para el nuevo sistema

---

### Fase 2: Reparación del Logout (URGENTE)

**Tareas:**

#### 2.1. Actualizar Dashboard a useAuthContext
- [ ] Cambiar import de `useAuth` a `useAuthContext`
- [ ] Actualizar destructuring del hook
- [ ] Verificar que `signOut` llame al nuevo servicio
- [ ] Agregar redirección a `/auth` después del logout

**Archivo:** `src/components/dashboard/Dashboard.tsx`

**Cambios:**
```diff
- import { useAuth } from '@/hooks/useAuth';
+ import { useAuthContext } from '@/app/features/auth/hooks/useAuthContext';

- const { user, signOut } = useAuth();
+ const { user, signOut } = useAuthContext();
```

#### 2.2. Actualizar Navigation a useAuthContext
**Archivo:** `src/components/layout/Navigation.tsx`

#### 2.3. Verificar signOut en el backend
- [ ] Confirmar que `POST /api/auth/signout` funciona correctamente
- [ ] Verificar que limpia cookies/sesión de Supabase
- [ ] Verificar que devuelve respuesta correcta

#### 2.4. Mejorar useSignOutMutation
**Archivo:** `src/app/features/auth/hooks/mutations/useSignOutMutation.ts`

**Mejoras necesarias:**
```typescript
onSuccess: () => {
  // Clear current user from cache
  queryClient.setQueryData(['auth', 'currentUser'], null)
  // Invalidate all queries
  queryClient.invalidateQueries()
  // Redirigir a /auth
  navigate('/auth', { replace: true })
}
```

---

### Fase 3: Solucionar Persistencia de Sesión Post-Signup

**Investigar:**

#### 3.1. Verificar configuración de Supabase
- [ ] Email confirmation: ¿está deshabilitado en desarrollo?
- [ ] Auto-refresh tokens: ¿está habilitado?
- [ ] Cookies vs localStorage: ¿qué se está usando?

#### 3.2. Revisar SignUp Use Case en backend
**Archivo:** `server/application/use-cases/auth/SignUpUseCase.ts` (si existe)

- [ ] ¿El backend devuelve la sesión después de crear usuario?
- [ ] ¿Se está guardando el token correctamente?

#### 3.3. Revisar useSignUpMutation en frontend
**Archivo:** `src/app/features/auth/hooks/mutations/useSignUpMutation.ts`

- [ ] ¿Procesa correctamente la respuesta del signup?
- [ ] ¿Guarda el usuario en el cache de React Query?
- [ ] ¿Actualiza el queryKey `['auth', 'currentUser']`?

---

### Fase 4: Eliminar Sistema Viejo (Cleanup)

**Tareas:**

#### 4.1. Deprecar archivos viejos
- [ ] `src/lib/auth.ts` - Marcar como deprecated
- [ ] `src/hooks/useAuth.ts` - Marcar como deprecated
- [ ] `src/store/auth.ts` - Eliminar (no se usa)
- [ ] `src/components/auth/ProtectedRoute.tsx` - Eliminar (duplicado)

#### 4.2. Migrar componentes restantes
- [ ] Buscar todos los usos de `useAuth` viejo: `grep -r "from '@/hooks/useAuth'" src/`
- [ ] Reemplazar con `useAuthContext`
- [ ] Actualizar imports

#### 4.3. Centralizar en un solo ProtectedRoute
- [ ] Usar solo `src/app/features/auth/components/ProtectedRoute.tsx`
- [ ] Actualizar todas las importaciones

---

### Fase 5: Optimizaciones y Mejoras

#### 5.1. Reducir renderizados múltiples
- [ ] Memoizar AuthProvider
- [ ] Usar `useMemo` para el value del context
- [ ] Revisar dependencies del useEffect

#### 5.2. Mejorar manejo de errores
- [ ] Toast notifications para errores de auth
- [ ] Mensajes de error más descriptivos
- [ ] Logging consistente

#### 5.3. Agregar redirección post-logout
**Archivo:** `src/app/features/auth/hooks/mutations/useSignOutMutation.ts`

```typescript
import { useNavigate } from 'react-router-dom'

export function useSignOutMutation() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const mutation = useMutation({
    mutationFn: () => authService.signOut(),
    onSuccess: () => {
      queryClient.setQueryData(['auth', 'currentUser'], null)
      queryClient.invalidateQueries()
      navigate('/auth', { replace: true })
    }
  })

  return {
    action: mutation.mutate,
    isLoading: mutation.isPending,
    error: mutation.error,
    isSuccess: mutation.isSuccess
  }
}
```

#### 5.4. Implementar refresh token automático
- [ ] Configurar Supabase para auto-refresh
- [ ] Manejar expiración de tokens
- [ ] Implementar retry logic

---

## Archivos Clave Involucrados

### Frontend - Sistema Viejo (Deprecar)
```
src/lib/auth.ts
src/hooks/useAuth.ts
src/store/auth.ts
src/components/auth/ProtectedRoute.tsx
src/components/auth/LoginForm.tsx (no usado)
src/components/auth/RegisterForm.tsx (no usado)
```

### Frontend - Sistema Nuevo (Migrar a este)
```
src/app/features/auth/
├── components/
│   ├── ProtectedRoute.tsx
│   ├── LoginForm.tsx
│   └── RegisterForm.tsx
├── hooks/
│   ├── useAuthContext.tsx ← Context provider
│   ├── mutations/
│   │   ├── useSignInMutation.ts
│   │   ├── useSignOutMutation.ts ← NECESITA MEJORA
│   │   └── useSignUpMutation.ts
│   └── queries/
│       └── useCurrentUserQuery.ts
└── data/
    ├── schemas/
    │   └── auth.schema.ts
    └── services/
        └── auth.service.ts ← Llama al backend
```

### Frontend - Componentes a Actualizar
```
src/components/dashboard/Dashboard.tsx ← USA HOOK VIEJO
src/components/layout/Navigation.tsx ← USA HOOK VIEJO
src/components/auth/AuthPage.tsx ← Ya usa hook nuevo ✓
src/App.tsx ← Ya usa hook nuevo ✓
```

### Backend
```
server/infrastructure/api/routes/auth.routes.ts
server/infrastructure/adapters/services/SupabaseAuthService.ts
server/application/use-cases/auth/ (si existe)
```

---

## Testing Plan

### Tests Manuales Requeridos

#### Test 1: Signup Completo
1. Navegar a /auth
2. Ir a tab "Registrarse"
3. Ingresar: nombre, email, contraseña
4. Click "Crear Cuenta"
5. **Verificar:**
   - ✅ Redirige a /dashboard
   - ✅ Muestra nombre de usuario en header
   - ✅ Sesión persiste al refrescar página
   - ✅ No muestra errores de auth en consola

#### Test 2: Login Completo
1. Logout (si está logueado)
2. Navegar a /auth
3. Ingresar credenciales válidas
4. Click "Iniciar Sesión"
5. **Verificar:**
   - ✅ Redirige a /dashboard
   - ✅ Muestra datos de usuario
   - ✅ Navigation muestra avatar y nombre

#### Test 3: Logout Completo
1. Estando logueado en /dashboard
2. Click en botón "Salir" (o en Navigation)
3. **Verificar:**
   - ✅ Redirige a /auth inmediatamente
   - ✅ No puede acceder a rutas protegidas
   - ✅ Al refrescar sigue en /auth
   - ✅ Backend logs muestran POST /api/auth/signout exitoso

#### Test 4: Rutas Protegidas
1. Cerrar sesión completamente
2. Intentar navegar a /dashboard directamente
3. **Verificar:**
   - ✅ Redirige a /auth automáticamente
   - ✅ Muestra loading state antes de redirect

#### Test 5: Persistencia de Sesión
1. Login exitoso
2. Refrescar página (F5)
3. **Verificar:**
   - ✅ Mantiene sesión activa
   - ✅ No hace login nuevamente
   - ✅ Datos de usuario siguen disponibles

### Tests Unitarios a Crear

```typescript
// useAuthContext.test.tsx
describe('useAuthContext', () => {
  it('should throw error when used outside AuthProvider')
  it('should provide auth state')
  it('should call signOut mutation on logout')
  it('should redirect to /auth after logout')
})

// useSignOutMutation.test.ts
describe('useSignOutMutation', () => {
  it('should call authService.signOut')
  it('should clear query cache on success')
  it('should invalidate all queries on success')
  it('should navigate to /auth on success')
  it('should handle errors gracefully')
})

// ProtectedRoute.test.tsx
describe('ProtectedRoute', () => {
  it('should show loading when auth is loading')
  it('should redirect to /auth when not authenticated')
  it('should render children when authenticated')
})
```

---

## Próximos Pasos Inmediatos

1. **Confirmar con Iban:** ¿Proceder con migración completa al nuevo sistema?
2. **Reparar Logout:** Actualizar Dashboard y Navigation
3. **Verificar Persistencia:** Debuggear por qué la sesión no persiste post-signup
4. **Testing:** Ejecutar plan de testing completo
5. **Cleanup:** Eliminar código viejo después de verificar que todo funciona

---

## Notas Adicionales

### Observaciones de Arquitectura

- El sistema nuevo está bien diseñado (React Query + Hexagonal)
- El backend está correctamente estructurado
- La migración será relativamente simple porque el nuevo sistema ya está implementado
- Solo falta actualizar componentes que usan el hook viejo

### Riesgos

- **Bajo riesgo:** La migración es straightforward (solo cambiar imports)
- **Medio riesgo:** Puede haber componentes adicionales usando hook viejo que no hemos encontrado
- **Bajo riesgo:** El nuevo sistema ya está probado parcialmente (AuthPage funciona)

### Recomendaciones

1. **No mantener sistema dual:** Es fuente de bugs
2. **Migrar todo de una vez:** Evitar estados intermedios
3. **Agregar tests:** Especialmente para logout que fue el problema principal
4. **Documentar:** Actualizar CLAUDE.md con la arquitectura correcta después de la migración

---

**Última actualización:** 2025-10-22 08:40 UTC
**Estado:** Investigación completa, esperando aprobación para reparación
