# Plan de Implementación: Reparación del Sistema de Autenticación

**Fecha:** 2025-10-22
**Objetivo:** Reparar sistema de login/logout y migrar al nuevo sistema de auth
**Autorización requerida de:** Iban

---

## Resumen del Plan

Este plan migra completamente al **nuevo sistema de autenticación basado en features** (React Query + Hexagonal Architecture) y elimina el **sistema viejo** que causa bugs críticos.

**Duración estimada:** 2-3 horas
**Complejidad:** BAJA-MEDIA
**Riesgo:** BAJO

---

## Fase 1: Reparación Inmediata del Logout (URGENTE)

**Objetivo:** Hacer que el logout funcione correctamente
**Tiempo estimado:** 30-45 minutos

### Tarea 1.1: Agregar redirección a useSignOutMutation

**Archivo:** `src/app/features/auth/hooks/mutations/useSignOutMutation.ts`

**Cambios:**

```typescript
// ANTES
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { authService } from '../../data/services/auth.service'

export function useSignOutMutation() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: () => authService.signOut(),
    onSuccess: () => {
      queryClient.setQueryData(['auth', 'currentUser'], null)
      queryClient.invalidateQueries()
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

```typescript
// DESPUÉS
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { authService } from '../../data/services/auth.service'

export function useSignOutMutation() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const mutation = useMutation({
    mutationFn: () => authService.signOut(),
    onSuccess: () => {
      // Clear current user from cache
      queryClient.setQueryData(['auth', 'currentUser'], null)

      // Invalidate all queries to force refetch
      queryClient.invalidateQueries()

      // Redirect to auth page
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

**Comandos:**
```bash
# Abrir archivo
code src/app/features/auth/hooks/mutations/useSignOutMutation.ts

# Aplicar cambios manualmente o usar Edit tool
```

---

### Tarea 1.2: Migrar Dashboard a useAuthContext

**Archivo:** `src/components/dashboard/Dashboard.tsx`

**Cambios:**

```typescript
// ANTES (líneas 2-3, 23)
import { useAuth } from '@/hooks/useAuth';

const { user, signOut } = useAuth();
```

```typescript
// DESPUÉS
import { useAuthContext } from '@/app/features/auth/hooks/useAuthContext';

const { user, signOut } = useAuthContext();
```

**Verificaciones:**
- ✓ El resto del código NO necesita cambios (same API)
- ✓ `user` y `signOut` tienen la misma interfaz
- ✓ No hay otras dependencias del hook viejo en Dashboard

**Testing después del cambio:**
1. Navegar a /dashboard (estando logueado)
2. Click en "Salir"
3. Verificar que redirige a /auth
4. Verificar que no puede volver a /dashboard sin login

---

### Tarea 1.3: Migrar Navigation a useAuthContext

**Archivo:** `src/components/layout/Navigation.tsx`

**Cambios:**

```typescript
// ANTES (línea 12, 25)
import { useAuth } from '@/hooks/useAuth'

const { user, signOut } = useAuth()
```

```typescript
// DESPUÉS
import { useAuthContext } from '@/app/features/auth/hooks/useAuthContext'

const { user, signOut } = useAuthContext()
```

**Verificaciones:**
- ✓ Navigation también usa `user` y `signOut` con misma interfaz
- ✓ No hay otras dependencias del hook viejo

---

### Tarea 1.4: Testing de Logout

**Tests manuales:**

```bash
# 1. Levantar servidores
yarn dev:full

# 2. Navegar a http://localhost:8080

# 3. Registrarse o hacer login

# 4. Click en "Salir" desde Dashboard o Navigation

# Verificar:
✓ Redirige a /auth inmediatamente
✓ No puede acceder a /dashboard sin login
✓ Al refrescar sigue en /auth
✓ Logs del backend muestran: POST /api/auth/signout - 200
```

**Tests con Playwright:**
```typescript
// Test automatizado
test('logout redirects to auth page', async ({ page }) => {
  // Login
  await page.goto('http://localhost:8080/auth')
  await page.fill('[name="email"]', 'test@example.com')
  await page.fill('[name="password"]', 'password123')
  await page.click('button:has-text("Iniciar Sesión")')

  // Verify on dashboard
  await expect(page).toHaveURL('/dashboard')

  // Logout
  await page.click('button:has-text("Salir")')

  // Verify redirected
  await expect(page).toHaveURL('/auth')

  // Verify can't access protected route
  await page.goto('/dashboard')
  await expect(page).toHaveURL('/auth')
})
```

---

## Fase 2: Investigación de Persistencia de Sesión

**Objetivo:** Entender por qué la sesión no persiste post-signup
**Tiempo estimado:** 30-60 minutos

### Tarea 2.1: Verificar configuración de Supabase

**Archivo:** `src/lib/supabase.ts`

**Verificar:**
```typescript
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,  // ← VERIFICAR QUE ESTÉ TRUE
      autoRefreshToken: true,  // ← VERIFICAR QUE ESTÉ TRUE
      detectSessionInUrl: true,
      storageKey: 'espana-creativa-auth',  // ← Opcional pero recomendado
    }
  }
)
```

**Investigar en Supabase Dashboard:**
1. Ir a Authentication → Settings
2. Verificar "Enable email confirmations" → debe estar DISABLED en dev
3. Verificar "Secure email change" → debe estar DISABLED en dev

---

### Tarea 2.2: Revisar SignUp Use Case en Backend

**Archivo:** Buscar `SignUpUseCase` o verificar `auth.routes.ts`

**Verificar en:** `server/infrastructure/api/routes/auth.routes.ts` líneas 10-52

**Debe devolver:**
```json
{
  "user": {
    "id": "...",
    "email": "...",
    "name": "...",
    // ... otros campos
  }
  // ¿Falta session aquí?
}
```

**Investigar:**
- ¿El backend está devolviendo la sesión de Supabase?
- ¿El frontend está guardando la sesión después del signup?

---

### Tarea 2.3: Revisar useSignUpMutation

**Archivo:** `src/app/features/auth/hooks/mutations/useSignUpMutation.ts`

**Verificar que haga:**
```typescript
onSuccess: (data) => {
  // 1. Guardar usuario en cache
  queryClient.setQueryData(['auth', 'currentUser'], data.user)

  // 2. Mostrar toast de éxito
  toast.success('Cuenta creada exitosamente')

  // 3. Redirigir a dashboard
  navigate('/dashboard')
}
```

**Posible problema:**
- Si el backend no devuelve sesión en signup
- El frontend no guarda el usuario en el cache correctamente
- El `useCurrentUserQuery` hace GET /me que devuelve 401

**Solución potencial:**
- Backend debe establecer la sesión en signup
- O frontend debe hacer signin automático después de signup

---

### Tarea 2.4: Debugging en Tiempo Real

**Agregar logs temporales:**

```typescript
// En useSignUpMutation.ts
onSuccess: (data) => {
  console.log('🎉 SIGNUP SUCCESS - Data received:', data)
  console.log('🎉 Setting user in cache:', data.user)
  queryClient.setQueryData(['auth', 'currentUser'], data.user)
  console.log('🎉 Cache updated, navigating to dashboard')
}
```

```typescript
// En useCurrentUserQuery.ts
export function useCurrentUserQuery() {
  return useQuery({
    queryKey: ['auth', 'currentUser'],
    queryFn: async () => {
      console.log('🔍 Fetching current user...')
      const result = await authService.getCurrentUser()
      console.log('🔍 Current user result:', result)
      return result.user
    },
    retry: false,
    staleTime: 5 * 60 * 1000
  })
}
```

**Ejecutar prueba y revisar logs:**
1. Abrir DevTools Console
2. Registrar nuevo usuario
3. Observar secuencia de logs
4. Identificar dónde se pierde la sesión

---

## Fase 3: Migración Completa al Nuevo Sistema

**Objetivo:** Migrar todos los componentes restantes
**Tiempo estimado:** 45-60 minutos

### Tarea 3.1: Buscar todos los usos del hook viejo

```bash
# Buscar imports del hook viejo
grep -r "from '@/hooks/useAuth'" src/ --include="*.tsx" --include="*.ts"

# Buscar imports de auth.ts viejo
grep -r "from '@/lib/auth'" src/ --include="*.tsx" --include="*.ts"

# Buscar imports del store viejo
grep -r "from '@/store/auth'" src/ --include="*.tsx" --include="*.ts"
```

**Documentar resultados:**
```
src/components/dashboard/Dashboard.tsx:2
src/components/layout/Navigation.tsx:12
src/components/pages/ProfilePage.tsx:X  (si existe)
src/components/pages/NetworkPage.tsx:X  (si existe)
... etc
```

---

### Tarea 3.2: Migrar cada archivo encontrado

**Para cada archivo:**

1. Abrir archivo
2. Cambiar import:
   ```typescript
   // ANTES
   import { useAuth } from '@/hooks/useAuth'

   // DESPUÉS
   import { useAuthContext } from '@/app/features/auth/hooks/useAuthContext'
   ```
3. Cambiar destructuring (si es diferente):
   ```typescript
   // ANTES
   const { user, loading, signOut, signIn, signUp } = useAuth()

   // DESPUÉS
   const {
     user,
     isLoading: loading,  // Nombre diferente
     signOut,
     signIn,
     signUp
   } = useAuthContext()
   ```
4. Actualizar referencias a `loading` → `isLoading` si es necesario
5. Guardar archivo
6. Probar componente

---

### Tarea 3.3: Eliminar ProtectedRoute viejo

**Archivos a eliminar:**
```bash
rm src/components/auth/ProtectedRoute.tsx
rm src/components/auth/LoginForm.tsx  # Si no se usa
rm src/components/auth/RegisterForm.tsx  # Si no se usa
```

**Verificar que no se usen:**
```bash
grep -r "from '@/components/auth/ProtectedRoute'" src/
grep -r "from '@/components/auth/LoginForm'" src/
grep -r "from '@/components/auth/RegisterForm'" src/
```

---

## Fase 4: Deprecación del Sistema Viejo

**Objetivo:** Marcar sistema viejo como deprecated, preparar para eliminación
**Tiempo estimado:** 15-30 minutos

### Tarea 4.1: Marcar archivos como deprecated

**Archivo:** `src/hooks/useAuth.ts`

Agregar al inicio:
```typescript
/**
 * @deprecated This hook is deprecated. Use useAuthContext from @/app/features/auth/hooks/useAuthContext instead.
 * This file will be removed in a future version.
 *
 * Migration guide:
 * - Replace `import { useAuth } from '@/hooks/useAuth'`
 *   with `import { useAuthContext } from '@/app/features/auth/hooks/useAuthContext'`
 * - Replace `const { user, loading, ... } = useAuth()`
 *   with `const { user, isLoading: loading, ... } = useAuthContext()`
 */
export const useAuth = (): AuthContextType => {
  // ... existing code
}
```

**Archivo:** `src/lib/auth.ts`

Agregar al inicio:
```typescript
/**
 * @deprecated These auth functions are deprecated. Use authService from @/app/features/auth/data/services/auth.service instead.
 * This file will be removed in a future version.
 */
```

---

### Tarea 4.2: Eliminar código no usado

**Verificar y eliminar:**

```bash
# 1. Store de auth (probablemente no usado)
rm src/store/auth.ts

# 2. AuthProvider viejo si existe
grep -r "AuthProvider" src/components/auth/
```

---

## Fase 5: Testing Completo

**Objetivo:** Verificar que todo funciona correctamente
**Tiempo estimado:** 30-45 minutos

### Test Suite Completo

#### Test 1: Signup Flow
```
1. Navegar a /auth
2. Tab "Registrarse"
3. Ingresar: nombre, email, contraseña
4. Click "Crear Cuenta"

VERIFICAR:
✓ Redirige a /dashboard
✓ Muestra nombre de usuario en header
✓ No hay errores en consola
✓ Backend logs: POST /signup 201, NO hay GET /me 401
✓ Al refrescar mantiene sesión
```

#### Test 2: Login Flow
```
1. Logout si está logueado
2. Navegar a /auth
3. Tab "Iniciar Sesión"
4. Ingresar credenciales válidas
5. Click "Iniciar Sesión"

VERIFICAR:
✓ Redirige a /dashboard
✓ Muestra datos de usuario
✓ Navigation muestra avatar y nombre
✓ No hay errores en consola
```

#### Test 3: Logout Flow
```
1. Estando logueado en /dashboard
2. Click en "Salir" (Dashboard o Navigation)

VERIFICAR:
✓ Redirige a /auth INMEDIATAMENTE
✓ No puede acceder a /dashboard
✓ Al refrescar sigue en /auth
✓ Backend logs: POST /signout 200
✓ No hay errores en consola
```

#### Test 4: Protected Routes
```
1. Logout completamente
2. Intentar navegar a /dashboard directamente

VERIFICAR:
✓ Redirige a /auth automáticamente
✓ Muestra loading state antes de redirect
```

#### Test 5: Persistencia de Sesión
```
1. Login exitoso
2. Refrescar página (F5)

VERIFICAR:
✓ Mantiene sesión activa
✓ No hace login nuevamente
✓ Datos de usuario disponibles
✓ Una sola llamada GET /me
```

#### Test 6: Navegación entre páginas
```
1. Login exitoso
2. Navegar a /network
3. Navegar a /messages
4. Navegar a /opportunities
5. Volver a /dashboard

VERIFICAR:
✓ Todas las páginas muestran usuario
✓ Navigation muestra datos consistentes
✓ No hay re-fetch innecesarios del usuario
```

---

### Tests Automatizados (Opcional pero Recomendado)

**Archivo:** `src/app/features/auth/__tests__/auth-flow.test.tsx`

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '../hooks/useAuthContext'
import App from '@/App'

describe('Authentication Flow', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    })
  })

  it('should logout and redirect to auth', async () => {
    const user = userEvent.setup()

    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </AuthProvider>
      </QueryClientProvider>
    )

    // Simulate logged in state
    // ... setup

    // Click logout
    const logoutButton = screen.getByRole('button', { name: /salir/i })
    await user.click(logoutButton)

    // Verify redirect
    await waitFor(() => {
      expect(window.location.pathname).toBe('/auth')
    })
  })
})
```

---

## Fase 6: Documentación y Cleanup

**Objetivo:** Actualizar documentación y limpiar código
**Tiempo estimado:** 15-30 minutos

### Tarea 6.1: Actualizar CLAUDE.md

**Archivo:** `CLAUDE.md`

**Sección a actualizar:** "Authentication Flow"

```markdown
### Authentication Flow

**Sistema de Autenticación:** Feature-based con React Query + Hexagonal Architecture

**Frontend:**
- Hook principal: `useAuthContext` ([src/app/features/auth/hooks/useAuthContext.tsx](src/app/features/auth/hooks/useAuthContext.tsx))
- Context provider: `AuthProvider` (wraps entire app in [src/main.tsx](src/main.tsx))
- Protected routes: `ProtectedRoute` ([src/app/features/auth/components/ProtectedRoute.tsx](src/app/features/auth/components/ProtectedRoute.tsx))

**Backend API:**
- POST `/api/auth/signup` - Register new user
- POST `/api/auth/signin` - Authenticate user
- POST `/api/auth/signout` - Sign out current user
- GET `/api/auth/me` - Get current authenticated user

**Estado:**
- React Query cache con key `['auth', 'currentUser']`
- Supabase Auth para persistencia de sesión
- Auto-refresh de tokens habilitado

**Uso en componentes:**
```typescript
import { useAuthContext } from '@/app/features/auth/hooks/useAuthContext'

function MyComponent() {
  const { user, isLoading, signIn, signOut, signUp } = useAuthContext()

  if (isLoading) return <Loading />
  if (!user) return <Login />

  return <div>Hello {user.name}</div>
}
```

**⚠️ Sistema viejo DEPRECATED:**
Los siguientes archivos están deprecated y serán eliminados:
- `src/lib/auth.ts`
- `src/hooks/useAuth.ts`
- `src/store/auth.ts`

NO usar estos archivos en código nuevo.
```

---

### Tarea 6.2: Agregar comentarios a archivos migrados

En cada archivo migrado, agregar comentario:

```typescript
// Migrated to useAuthContext on 2025-10-22
// Previous version used deprecated useAuth hook
import { useAuthContext } from '@/app/features/auth/hooks/useAuthContext'
```

---

### Tarea 6.3: Crear changelog entry

**Archivo:** `.claude/doc/auth-repair/CHANGELOG.md`

```markdown
# Changelog - Auth System Repair

## 2025-10-22 - Migration to New Auth System

### Changed
- Migrated Dashboard to useAuthContext
- Migrated Navigation to useAuthContext
- Added redirect on logout to `/auth`
- [List other migrated components]

### Fixed
- ✅ Logout now works correctly and redirects to /auth
- ✅ User state is consistent across all components
- ✅ Single source of truth for auth state (React Query)
- [Session persistence fix if applied]

### Deprecated
- `src/hooks/useAuth.ts` - Use `useAuthContext` instead
- `src/lib/auth.ts` - Use `authService` instead
- `src/store/auth.ts` - Not used

### Removed
- `src/components/auth/ProtectedRoute.tsx` (duplicate)
- `src/components/auth/LoginForm.tsx` (not used)
- `src/components/auth/RegisterForm.tsx` (not used)

### Technical Details
- System: React Query + Hexagonal Architecture
- Backend: Express REST API
- Auth Provider: Supabase
- State Management: React Query cache
```

---

## Checklist Final

### Pre-Deployment
```
□ Todos los componentes migrados a useAuthContext
□ Logout funciona y redirige a /auth
□ Sesión persiste después de signup
□ Sesión persiste después de refresh
□ No hay errores en consola del navegador
□ No hay errores 401/500 inesperados en backend
□ Tests manuales completos ejecutados
□ CLAUDE.md actualizado
□ Changelog creado
```

### Post-Deployment (Futura iteración)
```
□ Monitorear logs de producción
□ Verificar que usuarios pueden hacer logout
□ Eliminar archivos deprecated después de 1-2 sprints
□ Agregar tests automatizados
□ Implementar métricas de autenticación
```

---

## Rollback Plan (Si algo sale mal)

### Rollback Rápido

**Si el logout sigue sin funcionar:**

```bash
# Revertir cambios
git checkout HEAD -- src/components/dashboard/Dashboard.tsx
git checkout HEAD -- src/components/layout/Navigation.tsx
git checkout HEAD -- src/app/features/auth/hooks/mutations/useSignOutMutation.ts

# Reiniciar servidor
yarn dev:full
```

### Rollback Completo

```bash
# Revertir todos los cambios de la migración
git log --oneline  # Find the commit before migration
git revert <commit-hash>

# O reset completo (solo en desarrollo)
git reset --hard HEAD~N  # donde N es el número de commits
```

---

## Notas Finales

### Dependencias
- ✅ React Query ya está configurado
- ✅ React Router ya está configurado
- ✅ Backend hexagonal ya está implementado
- ✅ No se necesitan nuevas dependencias

### Riesgos Conocidos
- **Bajo:** Posibles componentes no encontrados usando hook viejo
- **Bajo:** Configuración de Supabase puede necesitar ajustes
- **Muy Bajo:** Incompatibilidades entre sistemas viejo y nuevo

### Mitigación de Riesgos
1. Hacer búsqueda exhaustiva de usos del hook viejo
2. Probar cada componente después de migrarlo
3. Mantener git history limpio para rollback fácil
4. No eliminar archivos viejos hasta confirmar que todo funciona

---

**Siguiente paso:** Esperar confirmación de Iban para comenzar implementación.
