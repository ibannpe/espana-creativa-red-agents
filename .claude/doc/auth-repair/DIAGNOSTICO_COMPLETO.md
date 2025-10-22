# Diagnóstico Completo del Sistema de Autenticación

**Fecha:** 2025-10-22
**Investigador:** Claude Code
**Autorización:** Iban

---

## Resumen Ejecutivo

Se detectaron **6 problemas** en el sistema de autenticación, siendo **2 críticos** que impiden el funcionamiento correcto del logout y causan inconsistencias en el estado de autenticación.

### Problema Principal

**El sistema tiene DOS arquitecturas de autenticación funcionando simultáneamente**, causando que:
- ✅ Login funciona (usa sistema nuevo)
- ❌ Logout NO funciona (Dashboard usa sistema viejo)
- ⚠️ Estado inconsistente entre componentes

---

## Problemas Detectados

### 🔴 CRÍTICO 1: Logout No Funciona

**Severidad:** Crítica
**Impacto:** Los usuarios no pueden cerrar sesión correctamente
**Componentes Afectados:** Dashboard, Navigation

**Descripción:**
Cuando el usuario hace click en el botón "Salir", la página NO redirige a `/auth` y el usuario permanece visualmente logueado.

**Causa Raíz:**
```typescript
// src/components/dashboard/Dashboard.tsx:2, 23, 59
import { useAuth } from '@/hooks/useAuth';  // ← Hook VIEJO

const { user, signOut } = useAuth();

<Button onClick={() => signOut()}>  // ← Llama a Supabase directamente
  Salir
</Button>
```

El hook viejo `useAuth`:
1. Llama a `supabase.auth.signOut()` directamente
2. NO llama al endpoint `/api/auth/signout` del backend
3. NO invalida el cache de React Query
4. NO redirige a `/auth`
5. NO está sincronizado con el nuevo sistema de auth

**Evidencia:**
- Logs del servidor: NO hay llamada a `POST /api/auth/signout`
- Comportamiento: Usuario permanece en `/dashboard` después de logout
- Screenshot: `logout-failed-still-on-dashboard.png`

**Solución:**
Migrar Dashboard y Navigation a `useAuthContext` del nuevo sistema.

---

### 🔴 CRÍTICO 2: Arquitectura Dual Causa Inconsistencias

**Severidad:** Crítica
**Impacto:** Estado de autenticación inconsistente entre componentes

**Descripción:**
Existen DOS sistemas de autenticación completos operando simultáneamente:

**Sistema Viejo (Legacy):**
- Ubicación: `src/lib/auth.ts`, `src/hooks/useAuth.ts`, `src/store/auth.ts`
- Funcionamiento: Llama directamente a Supabase Auth desde el cliente
- Usado por: Dashboard, Navigation
- Características:
  - Manejo manual de estado con hooks y useEffect
  - Sin cache persistente
  - Sin integración con backend
  - Listeners de Supabase manejados manualmente

**Sistema Nuevo (Feature-based):**
- Ubicación: `src/app/features/auth/`
- Funcionamiento: Arquitectura hexagonal con React Query
- Usado por: AuthPage, App.tsx, ProtectedRoute
- Características:
  - React Query para cache y estado
  - Llama a endpoints backend REST
  - Backend valida y maneja auth
  - Cache automático e invalidación

**Problema:**
Los dos sistemas NO se comunican entre sí:
- AuthPage (nuevo) hace login → backend → actualiza cache de React Query
- Dashboard (viejo) consulta Supabase directamente → NO ve el usuario del cache nuevo
- Dashboard (viejo) hace logout → Supabase → NO invalida cache de React Query
- Navigation muestra usuario vacío porque usa hook viejo

**Evidencia:**
```typescript
// App.tsx - USA NUEVO SISTEMA ✓
import { useAuthContext } from '@/app/features/auth/hooks/useAuthContext'

// Dashboard.tsx - USA VIEJO SISTEMA ✗
import { useAuth } from '@/hooks/useAuth'

// AuthPage.tsx - USA NUEVO SISTEMA ✓
import { useAuthContext } from '@/app/features/auth/hooks/useAuthContext'

// Navigation.tsx - USA VIEJO SISTEMA ✗
import { useAuth } from '@/hooks/useAuth'
```

**Solución:**
Migrar todos los componentes al nuevo sistema y deprecar el viejo.

---

### 🟡 IMPORTANTE 3: Sesión No Persiste Después del Signup

**Severidad:** Alta
**Impacto:** Usuario recién registrado no queda autenticado

**Descripción:**
Después de un signup exitoso (POST /signup devuelve 201), inmediatamente GET /me devuelve 401 (no autenticado).

**Evidencia de Logs:**
```
[Backend]
POST /api/auth/signup - 201 (1615ms) ✓
GET /api/auth/me - 401 (0ms) ✗

[Frontend]
📡 Sesión obtenida: {hasSession: false, userId: undefined}
🚪 No hay usuario autenticado
```

**Comportamiento Observado:**
1. Usuario se registra con éxito
2. Redirige a /dashboard
3. Dashboard muestra "¡Bienvenido, !" (sin nombre)
4. Usuario aparenta estar logueado pero sin datos

**Posibles Causas:**
1. Supabase configurado para requerir confirmación de email
2. Backend crea usuario pero no devuelve/establece sesión
3. Cookies no se guardan entre signup y siguiente request
4. Frontend no procesa correctamente la respuesta del signup

**Investigación Requerida:**
- Revisar configuración de Supabase (email confirmation)
- Revisar `SignUpUseCase` en backend
- Revisar `useSignUpMutation` en frontend
- Verificar que cookies/localStorage se están guardando

---

### 🟡 IMPORTANTE 4: Renderizados Múltiples del Auth Hook

**Severidad:** Media
**Impacto:** Performance, llamadas API duplicadas

**Descripción:**
El hook `useAuth` se inicializa 4 veces en menos de 1ms.

**Evidencia de Logs:**
```
[LOG] 🔐 Auth hook iniciando @ 08:37:01.220Z
[LOG] 🔐 Auth hook iniciando @ 08:37:01.220Z
[LOG] 🔐 Auth hook iniciando @ 08:37:01.220Z
[LOG] 🔐 Auth hook iniciando @ 08:37:01.221Z
```

**Causas Probables:**
1. React Strict Mode causa doble renderizado (2x)
2. Múltiples componentes usan el hook simultáneamente
3. Falta memoización del AuthProvider value
4. Re-renderizados innecesarios

**Impacto:**
- 4 llamadas a `supabase.auth.getSession()` simultáneas
- Múltiples subscripciones al `onAuthStateChange`
- Performance degradada
- Posibles race conditions

**Solución:**
- Usar `useMemo` para memoizar el value del AuthContext
- Verificar que hay un solo AuthProvider en el árbol
- Optimizar dependencies del useEffect

---

### 🟢 MENOR 5: Nombre de Usuario No Se Muestra

**Severidad:** Baja
**Impacto:** UX degradada

**Descripción:**
Dashboard muestra "¡Bienvenido, !" sin el nombre del usuario.

**Evidencia:**
Screenshot `dashboard-after-signup.png` muestra heading "¡Bienvenido, !"

**Causa:**
Dashboard usa hook viejo que no tiene el usuario actualizado del cache del nuevo sistema.

**Solución:**
Se resolverá automáticamente al migrar Dashboard al nuevo sistema.

---

### 🟢 MENOR 6: ProtectedRoute Duplicado

**Severidad:** Baja
**Impacto:** Confusión en el código, mantenibilidad

**Descripción:**
Existen dos archivos ProtectedRoute:

1. `src/components/auth/ProtectedRoute.tsx` (viejo)
   - Usa `useAuth` del hook viejo
   - Importado por: nadie actualmente

2. `src/app/features/auth/components/ProtectedRoute.tsx` (nuevo)
   - Usa `useAuthContext` del nuevo sistema
   - Importado por: App.tsx

**Problema:**
Código duplicado que puede causar confusión sobre cuál usar.

**Solución:**
Eliminar el archivo viejo después de confirmar que no se usa en ningún lugar.

---

## Evidencias de Testing

### Screenshots Capturados

1. `auth-page-initial.png` - Página de login/signup inicial
2. `login-error-401.png` - Error al intentar login con usuario inexistente
3. `dashboard-after-signup.png` - Dashboard después de signup (sin nombre de usuario)
4. `logout-failed-still-on-dashboard.png` - Usuario sigue en dashboard después de logout

### Logs del Backend

```
GET /health - 200
GET /me - 401 (usuario no autenticado)
POST /signin - 401 (usuario no existe)
POST /signup - 201 (usuario creado exitosamente)
[Cliente muestra hasSession: false inmediatamente después]
```

### Logs del Frontend

```javascript
// Inicialización múltiple
🔐 Auth hook iniciando (x4)
📡 Obteniendo sesión... (x4)

// Después de signup
📡 Sesión obtenida: {hasSession: false, userId: undefined}
🚪 No hay usuario autenticado
🔔 Auth cambió: INITIAL_SESSION {hasSession: false}
```

---

## Análisis de Código Clave

### Dashboard.tsx (Problemático)

```typescript
// LÍNEA 2 - Import del hook VIEJO
import { useAuth } from '@/hooks/useAuth';

// LÍNEA 23 - Uso del hook viejo
const { user, signOut } = useAuth();

// LÍNEA 57-63 - Logout que NO funciona
<Button variant="ghost" size="sm" onClick={() => {
  signOut();  // ← Llama a supabase.auth.signOut() directamente
}}>
  <LogOut className="h-4 w-4 mr-2" />
  Salir
</Button>

// LÍNEA 73 - Usuario no tiene nombre
<h2>¡Bienvenido, {user?.name || user?.email}!</h2>
```

### useAuth.ts Viejo (Hook Problemático)

```typescript
// LÍNEA 232-254 - SignOut del hook viejo
const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();  // ← Directo a Supabase
    if (error) {
      toast({ /* ... */ });
    } else {
      toast({ /* ... */ });
    }
  } catch (error: unknown) {
    toast({ /* ... */ });
  }
  // ❌ NO redirige a /auth
  // ❌ NO invalida cache de React Query
  // ❌ NO llama al backend
};
```

### useSignOutMutation.ts Nuevo (Correcto pero falta redirect)

```typescript
export function useSignOutMutation() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: () => authService.signOut(),  // ← Llama al backend ✓
    onSuccess: () => {
      queryClient.setQueryData(['auth', 'currentUser'], null)  // ✓
      queryClient.invalidateQueries()  // ✓
      // ❌ FALTA: navigate('/auth', { replace: true })
    }
  })

  return { /* ... */ }
}
```

---

## Impacto en Usuarios

### Flujo Actual (Roto)

1. Usuario va a /auth
2. Registra cuenta → ✓ Funciona
3. Redirige a /dashboard → ✓ Funciona
4. Dashboard muestra "¡Bienvenido, !" → ⚠️ Sin nombre
5. Usuario hace click en "Salir" → ❌ NO funciona
6. Usuario sigue viendo el dashboard → ❌ Comportamiento incorrecto

### Flujo Esperado (Después de reparación)

1. Usuario va a /auth
2. Registra cuenta → ✓ Funciona
3. Redirige a /dashboard → ✓ Funciona
4. Dashboard muestra "¡Bienvenido, [Nombre]!" → ✓ Con nombre
5. Usuario hace click en "Salir" → ✓ Funciona
6. Redirige inmediatamente a /auth → ✓ Comportamiento correcto

---

## Métricas del Problema

- **Componentes afectados:** 2 críticos (Dashboard, Navigation)
- **Sistemas en conflicto:** 2 (viejo vs nuevo)
- **Archivos a migrar:** ~5-10 componentes
- **Líneas de código a cambiar:** ~20-30 (solo imports y nombres)
- **Complejidad de migración:** BAJA (straightforward)
- **Riesgo de regresión:** BAJO (nuevo sistema ya está probado)

---

## Recomendación Final

**MIGRAR COMPLETAMENTE AL NUEVO SISTEMA**

**Razones:**
1. El nuevo sistema es superior (React Query, hexagonal architecture)
2. El viejo sistema causa bugs críticos
3. La migración es simple (cambiar imports)
4. El backend ya está diseñado para el nuevo sistema
5. Mantener dual es insostenible

**Prioridad de Ejecución:**
1. **URGENTE:** Reparar logout (Dashboard + Navigation)
2. **ALTA:** Investigar persistencia de sesión post-signup
3. **MEDIA:** Optimizar renderizados
4. **BAJA:** Cleanup de código duplicado

---

**Siguiente paso:** Esperar aprobación de Iban para proceder con reparación.
