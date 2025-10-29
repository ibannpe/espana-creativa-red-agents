# Plan de Implementación de RLS (Row Level Security)

## Objetivo
Implementar políticas de seguridad RLS en las tablas sin romper la funcionalidad existente de la aplicación.

## Estrategia: Política Permisiva Primero

En lugar de restringir acceso desde el principio, vamos a crear políticas **MUY PERMISIVAS** que básicamente permitan todo, y luego iremos refinando poco a poco.

---

## Fase 1: Tabla `roles` (La más simple)

### Estado actual
- ❌ RLS deshabilitado
- ⚠️ Problema: Cualquiera puede leer/modificar los roles del sistema

### Plan de acción

#### Paso 1.1: Habilitar RLS con política permisiva
```sql
-- Habilitar RLS
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;

-- Política SUPER PERMISIVA: Todos los usuarios autenticados pueden VER roles
CREATE POLICY "Everyone can view roles"
ON roles
FOR SELECT
USING (true);  -- ← SUPER PERMISIVO: permite a todos

-- Política para modificaciones: Solo service role (backend)
CREATE POLICY "Service role can manage roles"
ON roles
FOR ALL
USING (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role')
WITH CHECK (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role');
```

#### Paso 1.2: Verificar que funciona
1. Ejecutar el SQL
2. Probar login en la aplicación
3. Verificar que el dashboard carga correctamente
4. Si falla, revertir inmediatamente

#### Paso 1.3: Script de reversión
```sql
DROP POLICY IF EXISTS "Everyone can view roles" ON roles;
DROP POLICY IF EXISTS "Service role can manage roles" ON roles;
ALTER TABLE roles DISABLE ROW LEVEL SECURITY;
```

---

## Fase 2: Tabla `user_roles` (Relación usuario-rol)

### Estado actual
- ❌ RLS deshabilitado
- ⚠️ Problema: Cualquiera puede asignar roles a cualquier usuario

### Plan de acción

#### Paso 2.1: Habilitar RLS con política permisiva
```sql
-- Habilitar RLS
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Política SUPER PERMISIVA: Todos pueden VER todas las relaciones user-role
CREATE POLICY "Everyone can view user roles"
ON user_roles
FOR SELECT
USING (true);  -- ← SUPER PERMISIVO

-- Política para INSERT: Permitir al service role (backend) insertar roles al crear usuarios
CREATE POLICY "Service role can insert user roles"
ON user_roles
FOR INSERT
WITH CHECK (true);  -- ← SUPER PERMISIVO inicialmente

-- Política para modificaciones: Solo service role
CREATE POLICY "Service role can update user roles"
ON user_roles
FOR UPDATE
USING (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role')
WITH CHECK (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role');

-- Política para DELETE: Solo service role
CREATE POLICY "Service role can delete user roles"
ON user_roles
FOR DELETE
USING (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role');
```

#### Paso 2.2: Verificar que funciona
1. Ejecutar el SQL
2. Probar login existente
3. Probar crear un nuevo usuario (signup)
4. Verificar que el rol se asigna correctamente
5. Si falla, revertir inmediatamente

#### Paso 2.3: Script de reversión
```sql
DROP POLICY IF EXISTS "Everyone can view user roles" ON user_roles;
DROP POLICY IF EXISTS "Service role can insert user roles" ON user_roles;
DROP POLICY IF EXISTS "Service role can update user roles" ON user_roles;
DROP POLICY IF EXISTS "Service role can delete user roles" ON user_roles;
ALTER TABLE user_roles DISABLE ROW LEVEL SECURITY;
```

---

## Fase 3: Tabla `users` (Perfiles de usuario)

### Estado actual
- ❌ RLS deshabilitado
- ⚠️ Problema: Cualquiera puede leer/modificar perfiles de otros usuarios

### Plan de acción

#### Paso 3.1: Habilitar RLS con política permisiva
```sql
-- Habilitar RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Política SUPER PERMISIVA: Todos pueden VER todos los perfiles (necesario para red social)
CREATE POLICY "Everyone can view all profiles"
ON users
FOR SELECT
USING (true);  -- ← SUPER PERMISIVO: necesario para buscar usuarios, ver perfiles, etc.

-- Política para INSERT: Permitir crear su propio perfil
CREATE POLICY "Users can insert own profile"
ON users
FOR INSERT
WITH CHECK (auth.uid() = id OR current_setting('request.jwt.claims', true)::json->>'role' = 'service_role');

-- Política para UPDATE: Solo puede actualizar su propio perfil
CREATE POLICY "Users can update own profile"
ON users
FOR UPDATE
USING (auth.uid() = id OR current_setting('request.jwt.claims', true)::json->>'role' = 'service_role')
WITH CHECK (auth.uid() = id OR current_setting('request.jwt.claims', true)::json->>'role' = 'service_role');

-- Política para DELETE: Solo service role (no queremos que usuarios se borren a sí mismos)
CREATE POLICY "Service role can delete users"
ON users
FOR DELETE
USING (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role');
```

#### Paso 3.2: Verificar que funciona
1. Ejecutar el SQL
2. Probar login
3. Probar búsqueda de usuarios
4. Probar actualización de perfil propio
5. Verificar que no puedes editar perfil de otro usuario
6. Si falla, revertir inmediatamente

#### Paso 3.3: Script de reversión
```sql
DROP POLICY IF EXISTS "Everyone can view all profiles" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Service role can delete users" ON users;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
```

---

## Fase 4: Tabla `connections` (Conexiones entre usuarios)

### Estado actual
- ❌ RLS deshabilitado
- ⚠️ Problema: Cualquiera puede ver/modificar conexiones de otros

### Plan de acción

#### Paso 4.1: Habilitar RLS con política permisiva
```sql
-- Habilitar RLS
ALTER TABLE connections ENABLE ROW LEVEL SECURITY;

-- Política para SELECT: Solo ver conexiones donde estés involucrado
CREATE POLICY "Users can view their own connections"
ON connections
FOR SELECT
USING (
    auth.uid() = requester_id
    OR auth.uid() = addressee_id
    OR current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
);

-- Política para INSERT: Solo puedes crear conexiones donde tú eres el requester
CREATE POLICY "Users can create connections as requester"
ON connections
FOR INSERT
WITH CHECK (
    auth.uid() = requester_id
    OR current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
);

-- Política para UPDATE: Solo si estás involucrado en la conexión
CREATE POLICY "Users can update their connections"
ON connections
FOR UPDATE
USING (
    auth.uid() = requester_id
    OR auth.uid() = addressee_id
    OR current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
)
WITH CHECK (
    auth.uid() = requester_id
    OR auth.uid() = addressee_id
    OR current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
);

-- Política para DELETE: Solo si estás involucrado
CREATE POLICY "Users can delete their connections"
ON connections
FOR DELETE
USING (
    auth.uid() = requester_id
    OR auth.uid() = addressee_id
    OR current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
);
```

#### Paso 4.2: Verificar que funciona
1. Ejecutar el SQL
2. Probar login
3. Probar ver mis conexiones
4. Probar crear nueva conexión
5. Probar aceptar/rechazar conexión
6. Si falla, revertir inmediatamente

#### Paso 4.3: Script de reversión
```sql
DROP POLICY IF EXISTS "Users can view their own connections" ON connections;
DROP POLICY IF EXISTS "Users can create connections as requester" ON connections;
DROP POLICY IF EXISTS "Users can update their connections" ON connections;
DROP POLICY IF EXISTS "Users can delete their connections" ON connections;
ALTER TABLE connections DISABLE ROW LEVEL SECURITY;
```

---

## Checklist de Verificación para cada fase

Después de aplicar cada fase, verificar:

- [ ] El login funciona correctamente
- [ ] El dashboard carga sin errores
- [ ] La búsqueda de usuarios funciona
- [ ] Los perfiles se pueden ver
- [ ] Las conexiones funcionan (si aplica)
- [ ] No hay errores 401/403 en la consola del navegador
- [ ] Los logs del backend no muestran errores de permisos

**Si alguna verificación falla:** Ejecutar inmediatamente el script de reversión de esa fase.

---

## Orden de Ejecución Recomendado

1. **Fase 1: `roles`** (más simple, menos riesgo)
2. **Fase 2: `user_roles`** (depende de roles)
3. **Fase 3: `users`** (crítico, probar muy bien)
4. **Fase 4: `connections`** (menos crítico)

---

## Notas importantes

### ¿Por qué políticas tan permisivas?

1. **`USING (true)` en SELECT**: En una red social, los usuarios NECESITAN ver perfiles de otros usuarios. Es el propósito de la aplicación.

2. **Service role siempre tiene acceso**: El backend usa el `service_role_key`, que bypassa RLS de todas formas. Las políticas con `service_role` son redundantes pero explícitas.

3. **`auth.uid()` para modificaciones**: Solo el dueño puede modificar sus propios datos. Esto es lo mínimo necesario.

### ¿Qué NO estamos protegiendo (por diseño)?

- ❌ Ver perfiles de otros usuarios → **PERMITIDO** (es una red social)
- ❌ Ver roles de usuarios → **PERMITIDO** (necesario para mostrar badges, permisos, etc.)
- ❌ Ver conexiones entre otros usuarios → **BLOQUEADO** (privacidad)

### ¿Qué SÍ estamos protegiendo?

- ✅ Modificar perfil de otro usuario → **BLOQUEADO**
- ✅ Asignar roles a usuarios → **BLOQUEADO** (solo backend/admins)
- ✅ Crear/modificar conexiones de otros → **BLOQUEADO**

---

## Scripts individuales listos para usar

He creado 4 scripts SQL individuales:
- `scripts/rls-phase-1-roles.sql`
- `scripts/rls-phase-2-user-roles.sql`
- `scripts/rls-phase-3-users.sql`
- `scripts/rls-phase-4-connections.sql`

Cada uno con su script de reversión correspondiente.
