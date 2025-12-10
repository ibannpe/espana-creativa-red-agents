# CLAUDE.md

Guía de configuración y comportamiento para el proyecto **España Creativa Red**.

## 1. Comandos Principales

### Ejecución
- **Frontend (8080):** `yarn dev`
- **Backend (3001):** `yarn dev:server`
- **Full Stack:** `yarn dev:full`

### Calidad y Tests (Critical Path)
- **Lint:** `yarn lint`
- **Test (Run):** `yarn test:run`
- **🔴 CRITICAL (Pre-commit/Merge):** `yarn test:critical` (Auth, Messages, Users)
- **Base de Datos:** `yarn clean-db` (Limpiar test data)

### Base de Datos (PostgreSQL/Supabase)
- **Migración:** Usar string completo con `?gssencmode=disable`.
- **Credenciales:** Ver `.env` (User: `postgres.jbkzymvswvnkrxriyzdx`).
- **Schema:** Ver `docs/database/supabase-schema.sql`.

## 2. Arquitectura y Estructura

**Stack:** Vite + React + TS (Frontend) | Express + TS Hexagonal (Backend) | Supabase.
**Patrón:** Feature-based (`src/app/features/`).

### Mapa de Directorios Clave
- `src/app/features/` → Lógica de negocio Frontend (Auth, Profile, Messages).
- `server/domain/` → Entidades y Value Objects (Puro).
- `server/application/` → Casos de uso y Puertos.
- `server/infrastructure/` → Implementación de Adapters, API y Repositorios.
- `docs/` → Documentación detallada (Leer si se requiere contexto profundo).

## 3. Pautas de Código y Estilo

### Reglas Generales
1.  **ABOUTME:** Todo archivo debe iniciar con 2 líneas `ABOUTME:` explicando su propósito.
2.  **Simplicidad:** Preferir código mantenible sobre ingenioso.
3.  **Tests:** OBLIGATORIOS salvo autorización explícita de Iban ("AUTORIZO QUE OMITAS LAS PRUEBAS ESTA VEZ").
4.  **Idioma:** Responder y comentar siempre en **Español**.
5.  **User:** Dirigirse al usuario siempre como **Iban**.

### Backend (Arquitectura Hexagonal)
- **Dominio Puro:** Sin dependencias externas en `domain/`.
- **Inyección:** Todo vía constructor.
- **Controladores:** Delgados, delegan a Use Cases.

### Frontend
- **Componentes:** shadcn/ui + Tailwind.
- **Estado:** React Query (Server state) + Zustand (Global ui state).
- **Logger:** Usar `devLogger` (no console.log).

## 4. Flujo de Trabajo del Agente

Antes de ejecutar cambios complejos, sigue este proceso mental.
1.  **Fase de Planificación (Architect Mode):**
    - Analizar estructura actual.
    - Revisar/Crear archivo de sesión en `.claude/sessions/context_session_{feature}.md`.
    - Consultar `docs/` si hay dudas de arquitectura.

2.  **Fase de Implementación (Dev Mode):**
    - Implementar cambios mínimos necesarios.
    - Mantener consistencia de estilo existente.
    - **No** usar nombres temporales ("nuevo", "mejorado").

3.  **Fase de Verificación (QA/Test Mode):**
    - Ejecutar `yarn test:critical` si se toca lógica core.
    - Asegurar que no hay errores de TypeScript.