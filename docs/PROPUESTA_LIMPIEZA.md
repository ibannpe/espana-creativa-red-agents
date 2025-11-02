# Propuesta de Limpieza y Reorganización del Proyecto

**Fecha**: 2025-11-02
**Autor**: Claude Code (para Iban)
**Estado**: Pendiente de aprobación

## Resumen Ejecutivo

Este documento propone una limpieza profunda del proyecto España Creativa Red para prepararlo para producción. Se han identificado:

- **12 archivos para eliminar** (obsoletos, duplicados, legacy)
- **5 archivos para mover** a carpeta docs/
- **3 áreas de código legacy** para deprecar
- **1 carpeta vacía** para eliminar

## 1. Archivos para Eliminar (ALTA PRIORIDAD)

### 1.1 Código Legacy de Autenticación (NO USADO)

Estos archivos fueron reemplazados por el nuevo sistema basado en React Query + Backend API.

```bash
# ELIMINAR (confirmado que no hay importaciones activas)
src/hooks/useAuth.ts                    # 109 líneas - Hook legacy de Zustand
src/hooks/useAuth.test.tsx              # 234 líneas - Tests del hook legacy
src/store/auth.ts                       # 85 líneas - Store Zustand legacy
src/lib/auth.ts                         # ~200 líneas - Funciones auth legacy
```

**Justificación**:
- Grep confirmó que NO hay importaciones de estos archivos en el código actual
- El sistema actual usa `useAuthContext` de `src/app/features/auth/hooks/useAuthContext.tsx`
- Mantener estos archivos puede causar confusión y uso accidental

**Acción**: ✅ Eliminar completamente

---

### 1.2 ProtectedRoute Duplicado

```bash
# ELIMINAR (duplicado)
src/components/layout/ProtectedRoute.tsx    # Versión legacy
```

**Justificación**:
- Existe versión actualizada en `src/app/features/auth/components/ProtectedRoute.tsx`
- No hay importaciones activas del archivo legacy
- Grep confirmó que no se usa en el código actual

**Acción**: ✅ Eliminar

---

### 1.3 Carpeta Vacía en Server

```bash
# ELIMINAR (carpeta vacía sin contenido útil)
server/src/components/profile/    # Carpeta vacía legacy
server/src/components/             # Carpeta padre vacía
server/src/                        # Directorio completo vacío
```

**Justificación**:
- No contiene archivos
- Residuo de estructura antigua
- No aporta valor

**Acción**: ✅ Eliminar directorio completo `server/src/`

---

### 1.4 Logos Heredados

```bash
# ELIMINAR (no aplicable al proyecto)
public/next.svg                   # Logo de Next.js (proyecto usa Vite)
```

**Justificación**:
- El proyecto usa Vite, NO Next.js
- Logo innecesario que puede causar confusión

**Acción**: ✅ Eliminar

---

### 1.5 Archivos de Sesión Eliminados

Ya están marcados para eliminación en git:

```bash
# Ya eliminados localmente (pendiente commit)
.claude/sessions/context_session_profile-form.md
animación-3_transparente.gif
fix-profile-completion.sql
```

**Acción**: ✅ Confirmar eliminación con commit git

---

## 2. Archivos para Reorganizar (Mover a docs/)

### 2.1 Documentación de Database

```bash
# MOVER a docs/database/
supabase-schema.sql  →  docs/database/supabase-schema.sql
```

**Justificación**: Mejor organización, docs/ centraliza toda la documentación

---

### 2.2 Documentación de Deployment

```bash
# MOVER a docs/deployment/
DEPLOYMENT.md  →  docs/deployment/DEPLOYMENT.md
```

---

### 2.3 Documentación de Scripts

```bash
# MOVER a docs/scripts/
scripts/README.md                    →  docs/scripts/README.md
scripts/CLEAN-DEV-README.md          →  docs/scripts/CLEAN-DEV-README.md
scripts/setup-storage-manual.md      →  docs/scripts/setup-storage-manual.md
scripts/rls-implementation-plan.md   →  docs/scripts/rls-implementation-plan.md
```

---

## 3. Consolidar Archivos de Logging

### 3.1 Logger Duplicado en Server

**Archivos actuales**:
```bash
server/logger.ts       # TypeScript logger (237 líneas)
server/logger.js       # JavaScript logger (108 líneas)
```

**Propuesta**:
- Mantener SOLO `server/logger.ts`
- Eliminar `server/logger.js` (duplicado legacy)
- Actualizar importaciones si existen

**Acción**: ⚠️ REVISAR importaciones antes de eliminar

---

## 4. Consolidar Variables de Entorno

### 4.1 Archivos ENV Múltiples

**Archivos actuales**:
```bash
.env                    # Desarrollo local (USAR ESTE)
.env.example            # Template (MANTENER)
.env.vercel.local       # Vercel local (¿necesario?)
proVars.env             # Variables producción (¿puede eliminarse?)
railway.env             # Railway (¿puede eliminarse?)
```

**Propuesta**:
- **MANTENER**: `.env` (desarrollo), `.env.example` (template)
- **REVISAR**: ¿Realmente se usan `proVars.env` y `railway.env`?
- **CONSIDERAR**: Mover configs de deployment a docs/deployment/

**Acción**: ⚠️ REVISAR con Iban qué archivos ENV son necesarios

---

## 5. Plan de Reorganización de Documentación

### 5.1 Nueva Estructura Propuesta

```
docs/
├── arquitectura/
│   ├── frontend-features.md       # Documentación de arquitectura por features
│   ├── backend-hexagonal.md       # Arquitectura hexagonal del backend
│   └── design-system.md           # Sistema de diseño y componentes
│
├── database/
│   ├── supabase-schema.sql        # Schema completo (MOVIDO)
│   ├── migrations-guide.md        # Guía de migraciones
│   └── rls-policies.md            # Documentación de RLS
│
├── deployment/
│   ├── DEPLOYMENT.md              # Guía de deployment (MOVIDO)
│   ├── vercel-frontend.md         # Deployment frontend
│   └── railway-backend.md         # Deployment backend
│
├── scripts/
│   ├── README.md                  # Índice de scripts (MOVIDO)
│   ├── CLEAN-DEV-README.md        # Limpieza desarrollo (MOVIDO)
│   ├── setup-storage-manual.md    # Setup storage (MOVIDO)
│   └── rls-implementation-plan.md # Plan RLS (MOVIDO)
│
└── PROPUESTA_LIMPIEZA.md          # Este archivo
```

---

## 6. Resumen de Acciones

### Eliminaciones Confirmadas (12 archivos)

```bash
# Auth Legacy (4 archivos)
rm src/hooks/useAuth.ts
rm src/hooks/useAuth.test.tsx
rm src/store/auth.ts
rm src/lib/auth.ts

# ProtectedRoute duplicado (1 archivo)
rm src/components/layout/ProtectedRoute.tsx

# Server vacío (1 directorio)
rm -rf server/src/

# Logo innecesario (1 archivo)
rm public/next.svg

# Ya eliminados - confirmar commit (3 archivos)
git add .claude/sessions/context_session_profile-form.md
git add animación-3_transparente.gif
git add fix-profile-completion.sql
```

### Movimientos a docs/ (5 archivos)

```bash
mv supabase-schema.sql docs/database/
mv DEPLOYMENT.md docs/deployment/
mv scripts/README.md docs/scripts/
mv scripts/CLEAN-DEV-README.md docs/scripts/
mv scripts/setup-storage-manual.md docs/scripts/
mv scripts/rls-implementation-plan.md docs/scripts/
```

### Pendiente de Revisión (3 áreas)

```bash
# 1. Logger duplicado
# Revisar importaciones de server/logger.js antes de eliminar

# 2. Archivos ENV
# Confirmar con Iban cuáles son necesarios:
# - .env.vercel.local
# - proVars.env
# - railway.env

# 3. Components legacy en src/components/
# Revisar si componentes en src/components/ pueden migrarse a features/
```

---

## 7. Beneficios Esperados

### Código más Limpio
- ✅ Eliminación de 628+ líneas de código obsoleto (auth legacy)
- ✅ Reducción de confusión sobre qué sistema de auth usar
- ✅ Eliminación de archivos duplicados

### Documentación Organizada
- ✅ Toda la documentación centralizada en `docs/`
- ✅ Estructura clara por tipo de documentación
- ✅ Fácil localización de información

### Preparación para Producción
- ✅ Código base más mantenible
- ✅ Menos superficie de error
- ✅ Onboarding más claro para nuevos desarrolladores

---

## 8. Comandos para Ejecución

### Fase 1: Eliminar Archivos Legacy (Requiere Aprobación)

```bash
# Crear branch para limpieza
git checkout -b cleanup/remove-legacy-code

# Eliminar auth legacy
rm src/hooks/useAuth.ts
rm src/hooks/useAuth.test.tsx
rm src/store/auth.ts
rm src/lib/auth.ts

# Eliminar ProtectedRoute duplicado
rm src/components/layout/ProtectedRoute.tsx

# Eliminar carpeta server/src vacía
rm -rf server/src/

# Eliminar logo Next.js
rm public/next.svg

# Commit de eliminaciones
git add -A
git commit -m "chore: eliminar código legacy y archivos obsoletos

- Eliminar sistema de auth legacy (useAuth, useAuthStore, auth.ts)
- Eliminar ProtectedRoute duplicado
- Eliminar carpeta server/src/ vacía
- Eliminar logo Next.js innecesario

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"
```

### Fase 2: Reorganizar Documentación

```bash
# Mover archivos a docs/
mv supabase-schema.sql docs/database/
mv DEPLOYMENT.md docs/deployment/
mv scripts/README.md docs/scripts/
mv scripts/CLEAN-DEV-README.md docs/scripts/
mv scripts/setup-storage-manual.md docs/scripts/
mv scripts/rls-implementation-plan.md docs/scripts/

# Commit de reorganización
git add -A
git commit -m "docs: reorganizar documentación en carpeta docs/

- Mover supabase-schema.sql a docs/database/
- Mover DEPLOYMENT.md a docs/deployment/
- Mover documentación de scripts a docs/scripts/
- Centralizar documentación para mejor organización

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"
```

### Fase 3: Actualizar CLAUDE.md

```bash
# Ya ejecutado - CLAUDE.md actualizado
git add CLAUDE.md
git commit -m "docs: actualizar CLAUDE.md con información actual en español

- Eliminar referencias a código legacy
- Actualizar estructura de proyecto
- Documentar arquitectura actual
- Agregar flujos de trabajo actualizados

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## 9. Próximos Pasos Recomendados

### Después de esta Limpieza

1. **Revisar Tests**
   - Ejecutar `yarn test:run` para verificar que todo funciona
   - Asegurar que eliminación de código legacy no rompió nada

2. **Actualizar Imports**
   - Buscar y reemplazar cualquier import a archivos eliminados
   - Verificar que todo usa `useAuthContext` y no `useAuth`

3. **Documentar Arquitectura**
   - Crear `docs/arquitectura/frontend-features.md`
   - Crear `docs/arquitectura/backend-hexagonal.md`
   - Documentar patrones de diseño actuales

4. **Preparar para Producción**
   - Revisar variables de entorno de producción
   - Verificar configuración de deployment
   - Ejecutar build de producción y verificar

---

## 10. Checklist de Aprobación

- [ ] Iban aprueba eliminación de código legacy de auth
- [ ] Iban aprueba eliminación de ProtectedRoute duplicado
- [ ] Iban aprueba reorganización de documentación
- [ ] Iban confirma qué archivos ENV mantener
- [ ] Ejecutar tests después de limpieza
- [ ] Verificar que build de producción funciona
- [ ] Mergear a main

---

**¿Procedo con la ejecución de esta limpieza, Iban?**

Puedo ejecutar las fases automáticamente o esperar tu aprobación para cada fase.
