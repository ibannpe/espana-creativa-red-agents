# Sesión: Rediseño de Feature Oportunidades por Ciudades

**Fecha de inicio**: 2025-11-13
**Estado**: 🔍 Exploración
**Feature**: City-based Opportunities

---

## 📋 Requisito del Usuario

Iban solicita cambiar la funcionalidad de la feature Oportunidades con los siguientes cambios:

### Cambio Principal
En `/oportunidades`, en lugar de mostrar una lista de oportunidades, mostrar:
- **Grid de ciudades** con imágenes representativas
- Al hacer clic en una ciudad → vista de oportunidades de esa ciudad
- **Usuarios con rol específico** podrán crear oportunidades para su ciudad

### Ciudades Iniciales
1. Córdoba
2. Tenerife
3. Quinto
4. Denia
5. Riveria Sacra
6. Mondoñedo

---

## 🔍 EXPLORACIÓN - Estado Actual

### Estructura de Archivos Actual

#### Frontend
```
src/app/features/opportunities/
├── components/
│   ├── OpportunityCard.tsx
│   └── CreateOpportunityDialog.tsx
├── data/
│   ├── schemas/opportunity.schema.ts
│   └── services/opportunity.service.ts
├── hooks/
│   ├── mutations/
│   │   ├── useCreateOpportunityMutation.ts
│   │   ├── useUpdateOpportunityMutation.ts
│   │   └── useDeleteOpportunityMutation.ts
│   └── queries/
│       ├── useOpportunitiesQuery.ts
│       ├── useMyOpportunitiesQuery.ts
│       └── useOpportunityQuery.ts
└── pages/
    └── (actualmente en src/components/pages/OpportunitiesPage.tsx)
```

#### Backend
```
server/
├── domain/entities/Opportunity.ts
├── application/
│   ├── ports/OpportunityRepository.ts
│   └── use-cases/opportunities/
│       ├── GetOpportunitiesUseCase.ts
│       ├── GetMyOpportunitiesUseCase.ts
│       ├── CreateOpportunityUseCase.ts
│       ├── UpdateOpportunityUseCase.ts
│       └── DeleteOpportunityUseCase.ts
└── infrastructure/
    ├── adapters/repositories/SupabaseOpportunityRepository.ts
    └── api/routes/opportunities.routes.ts
```

### Base de Datos Actual

#### Tabla `opportunities`
```sql
CREATE TABLE opportunities (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'proyecto',
    skills_required TEXT[],
    location VARCHAR(255),           -- ⚠️ Campo libre (texto)
    remote BOOLEAN DEFAULT false,
    duration VARCHAR(100),
    compensation VARCHAR(255),
    project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'abierta',
    created_by UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT valid_opportunity_type CHECK (type IN ('proyecto', 'colaboracion', 'empleo', 'mentoria', 'evento', 'otro')),
    CONSTRAINT valid_opportunity_status CHECK (status IN ('abierta', 'en_progreso', 'cerrada', 'cancelada'))
);
```

#### Tabla `roles`
```sql
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Tabla `user_roles`
```sql
CREATE TABLE user_roles (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (user_id, role_id)
);
```

### Endpoints API Actuales
- `GET /api/opportunities` - Lista todas las oportunidades con filtros
- `GET /api/opportunities/my` - Oportunidades del usuario actual
- `GET /api/opportunities/:id` - Detalle de oportunidad
- `POST /api/opportunities` - Crear oportunidad
- `PUT /api/opportunities/:id` - Actualizar oportunidad
- `DELETE /api/opportunities/:id` - Eliminar oportunidad

### Tipo de Oportunidad (Enum)
```typescript
type OpportunityType =
  | 'proyecto'
  | 'colaboracion'
  | 'empleo'
  | 'mentoria'
  | 'evento'
  | 'otro'
```

### Estado de Oportunidad (Enum)
```typescript
type OpportunityStatus =
  | 'abierta'
  | 'en_progreso'
  | 'cerrada'
  | 'cancelada'
```

---

## 🎯 ANÁLISIS DE CAMBIOS NECESARIOS

### 1. Modelo de Datos

#### Nuevo: Tabla `cities`
```sql
CREATE TABLE cities (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    image_url TEXT NOT NULL,
    description TEXT,
    active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Nuevo: Rol de "Gestor de Ciudad"
- Crear rol específico: `city_manager` o `gestor_ciudad`
- Relación usuario-ciudad

#### Cambio: Tabla `opportunities`
- **Opción A**: Cambiar `location VARCHAR(255)` → `city_id INTEGER REFERENCES cities(id)`
- **Opción B**: Mantener ambos campos (migration)

### 2. Frontend

#### Nuevas Páginas/Componentes
1. **CitiesGridPage** (`/oportunidades`)
   - Grid de tarjetas de ciudades
   - Imágenes representativas
   - Click → navega a `/oportunidades/:citySlug`

2. **CityOpportunitiesPage** (`/oportunidades/:citySlug`)
   - Lista de oportunidades filtradas por ciudad
   - Botón "Crear oportunidad" solo visible para gestores de esa ciudad
   - Información de la ciudad (header)

3. **CityCard Component**
   - Imagen de ciudad
   - Nombre
   - Contador de oportunidades activas
   - Estado activo/inactivo

#### Modificar
- **CreateOpportunityDialog**: Añadir selector de ciudad (automático si usuario tiene ciudad asignada)

### 3. Backend

#### Nuevos Use Cases
- `GetCitiesUseCase`
- `GetCityBySlugUseCase`
- `GetOpportunitiesByCityUseCase`

#### Nuevas Entidades
- `City` (domain entity)

#### Nuevos Repositorios
- `CityRepository` (port + adapter)

#### Modificar Use Cases
- `CreateOpportunityUseCase`: Validar rol de gestor de ciudad
- `GetOpportunitiesUseCase`: Añadir filtro por city_id

### 4. Rutas y Navegación

#### Cambios en App.tsx
```tsx
// ANTES
<Route path="/opportunities" element={<OpportunitiesPage />} />

// DESPUÉS
<Route path="/opportunities" element={<CitiesGridPage />} />
<Route path="/opportunities/:citySlug" element={<CityOpportunitiesPage />} />
<Route path="/opportunities/:citySlug/:opportunityId" element={<OpportunityDetailPage />} />
```

---

## ✅ REQUISITOS CONFIRMADOS (por Iban)

### Gestión de Ciudades y Roles
1. **Solo admins asignan gestores de ciudad** - Interface de admin para asignar rol
2. **Un usuario puede gestionar múltiples ciudades** - Relación many-to-many users ↔ cities
3. **SOLO gestores pueden crear oportunidades** - Para sus ciudades asignadas
4. **Permisos de edición**: Creador + Gestores de esa ciudad + Admins

### Migración de Datos
5. **Iniciamos limpio** - Eliminar oportunidades existentes, comenzar con sistema de ciudades nuevo

### UI/UX
6. **Grid fluido responsive** - auto-fit (adapta columnas según espacio disponible)
7. **Imágenes de URLs externas** - Usar Unsplash/Pexels
8. **Mostrar contador de oportunidades activas** en cada tarjeta de ciudad

---

## 📝 NOTAS DE ARQUITECTURA

- Mantener arquitectura hexagonal en backend
- Seguir patrón de features en frontend
- Tests unitarios requeridos (política estricta)
- Usar React Query para estado remoto
- Schemas Zod para validación
- shadcn/ui para componentes UI

---

---

## 🎯 ADVICE DE SUB-AGENTES (Completado)

Los siguientes documentos han sido creados con advice detallado:

### 1. Backend Architecture (hexagonal-backend-architect)
**Documento**: `.claude/doc/city_opportunities/backend.md`

**Contenido clave**:
- ✅ Entidad `City` completa con validaciones
- ✅ Value Object `CitySlug`
- ✅ 5 nuevos Use Cases (GetCities, GetCityBySlug, GetOpportunitiesByCity, AssignCityManager, CheckUserIsCityManager)
- ✅ Modificaciones a CreateOpportunityUseCase con validación de permisos
- ✅ 2 nuevos Ports (CityRepository, CityManagerRepository)
- ✅ Adaptadores Supabase completos
- ✅ Migración SQL destructiva (recrea tabla opportunities)
- ✅ RLS policies actualizadas
- ✅ 3 capas de validación de seguridad

### 2. UI/UX Design (shadcn-ui-architect)
**Documento**: `.claude/doc/city_opportunities/shadcn_ui.md`

**Contenido clave**:
- ✅ CityCard con imagen de fondo + overlay gradiente
- ✅ Grid responsivo auto-fit (320px mínimo)
- ✅ Contador de oportunidades con Badge
- ✅ Hover effects (zoom + scale)
- ✅ Loading skeletons
- ✅ Empty states y error handling
- ✅ Accesibilidad completa (ARIA, keyboard navigation)
- ⚠️ **CORRECCIÓN**: Primary color es ROJO (#ef4444), NO verde

### 3. Frontend Architecture (frontend-developer)
**Documento**: `.claude/doc/city_opportunities/frontend.md`

**Contenido clave**:
- ✅ Feature separada `cities/` recomendada
- ✅ Schemas Zod completos
- ✅ Services con error handling
- ✅ Query hooks con stale time strategy
- ✅ Mutation hooks con invalidación granular
- ✅ Business hooks para permisos (useCityPermissions, useOpportunityPermissions)
- ✅ Query keys jerárquicas
- ⚠️ **NOTA**: React Query v5 (usar `isPending` no `isLoading`)

### 4. Testing Strategy (typescript-test-explorer)
**Documento**: Pendiente de verificar ubicación

**Contenido esperado**:
- Tests de entidad City
- Tests de use cases con permisos
- Tests de schemas frontend
- Tests de hooks
- Edge cases críticos

---

## 📋 PLAN FINAL DE IMPLEMENTACIÓN

### ⚠️ IMPORTANTE: Este es un BREAKING CHANGE
La tabla `opportunities` será **recreada desde cero**. Todas las oportunidades existentes se perderán (confirmado por Iban).

### Orden de Implementación

#### **FASE 1: Migración de Base de Datos** ⚠️ DESTRUCTIVA
```sql
-- Ver migración completa en .claude/doc/city_opportunities/backend.md
1. DROP TABLE opportunities CASCADE
2. CREATE TABLE cities
3. CREATE TABLE city_managers
4. CREATE TABLE opportunities (con city_id NOT NULL)
5. INSERT 6 ciudades iniciales
6. RLS policies actualizadas
```

**Archivos**:
- `migrations/XXX_create_cities_system.sql`

#### **FASE 2: Backend - Domain Layer**
```
server/domain/
├── entities/
│   ├── City.ts                          [NUEVO]
│   └── Opportunity.ts                   [MODIFICAR - añadir cityId]
└── value-objects/
    └── CitySlug.ts                      [NUEVO]
```

**Tests requeridos**:
- [ ] `City.test.ts` - Validaciones, factory methods
- [ ] `CitySlug.test.ts` - Formato válido/inválido
- [ ] `Opportunity.test.ts` - cityId obligatorio

#### **FASE 3: Backend - Application Layer (Ports)**
```
server/application/ports/
├── CityRepository.ts                    [NUEVO]
├── CityManagerRepository.ts             [NUEVO]
└── OpportunityRepository.ts             [MODIFICAR - añadir métodos]
```

**Interfaces necesarias**:
- CityRepository: findAll, findById, findBySlug, create, update, delete, getWithOpportunityCount, isActive
- CityManagerRepository: assignManager, removeManager, isManager, getManagedCities, getCityManagers, hasManagedCities, assignMultiple

#### **FASE 4: Backend - Application Layer (Use Cases)**
```
server/application/use-cases/
├── cities/
│   ├── GetCitiesUseCase.ts              [NUEVO]
│   ├── GetCityBySlugUseCase.ts          [NUEVO]
│   ├── GetOpportunitiesByCityUseCase.ts [NUEVO]
│   ├── AssignCityManagerUseCase.ts      [NUEVO]
│   └── CheckUserIsCityManagerUseCase.ts [NUEVO]
└── opportunities/
    ├── CreateOpportunityUseCase.ts      [MODIFICAR - validar permisos]
    ├── UpdateOpportunityUseCase.ts      [MODIFICAR - validar permisos]
    └── DeleteOpportunityUseCase.ts      [MODIFICAR - validar permisos]
```

**Tests CRÍTICOS** (Policy: tests obligatorios):
- [ ] GetCitiesUseCase.test.ts
- [ ] AssignCityManagerUseCase.test.ts - solo admins
- [ ] CreateOpportunityUseCase.test.ts - validar gestor de ciudad
- [ ] CheckUserIsCityManagerUseCase.test.ts - permisos

#### **FASE 5: Backend - Infrastructure Layer**
```
server/infrastructure/
├── adapters/repositories/
│   ├── SupabaseCityRepository.ts        [NUEVO]
│   ├── SupabaseCityManagerRepository.ts [NUEVO]
│   └── SupabaseOpportunityRepository.ts [MODIFICAR - añadir city_id]
└── api/routes/
    ├── cities.routes.ts                 [NUEVO]
    ├── city-managers.routes.ts          [NUEVO] (admin only)
    └── opportunities.routes.ts          [MODIFICAR - filtro por ciudad]
```

**Endpoints API nuevos**:
- `GET /api/cities` - Lista de ciudades activas
- `GET /api/cities/:slug` - Ciudad por slug
- `GET /api/cities/:cityId/opportunities` - Oportunidades de ciudad
- `POST /api/city-managers` - Asignar gestor (admin)
- `DELETE /api/city-managers/:userId/:cityId` - Remover gestor (admin)
- `GET /api/city-managers/my-cities` - Ciudades que gestiono

#### **FASE 6: Backend - DI Container**
```
server/infrastructure/di/Container.ts    [MODIFICAR]
```

Registrar:
- CityRepository
- CityManagerRepository
- 5 nuevos use cases de cities

#### **FASE 7: Frontend - Data Layer**
```
src/app/features/
└── cities/                              [NUEVA FEATURE]
    └── data/
        ├── schemas/
        │   └── city.schema.ts           [NUEVO]
        └── services/
            └── city.service.ts          [NUEVO]
```

**Schemas Zod**:
- citySchema
- cityWithStatsSchema
- assignCityManagerRequestSchema

**Tests requeridos**:
- [ ] city.schema.test.ts
- [ ] city.service.test.ts

#### **FASE 8: Frontend - Hooks Layer**
```
src/app/features/cities/
└── hooks/
    ├── queries/
    │   ├── useCitiesQuery.ts            [NUEVO]
    │   ├── useCityBySlugQuery.ts        [NUEVO]
    │   ├── useOpportunitiesByCityQuery.ts [NUEVO]
    │   └── useIsCityManagerQuery.ts     [NUEVO]
    └── mutations/
        └── useAssignCityManagerMutation.ts [NUEVO] (admin)
```

**Query configuration**:
- Cities: staleTime 5min
- Permissions: staleTime 3min + refetchOnFocus
- Opportunities: staleTime 2min

**Tests requeridos**:
- [ ] useCitiesQuery.test.ts
- [ ] useIsCityManagerQuery.test.ts

#### **FASE 9: Frontend - Components**
```
src/app/features/cities/
└── components/
    ├── CityCard.tsx                     [NUEVO]
    ├── CitiesGrid.tsx                   [NUEVO]
    └── CitiesGridSkeleton.tsx           [NUEVO]
```

**CityCard specs**:
- Imagen de fondo con overlay gradiente
- Altura 280px
- Hover: zoom imagen + scale card
- Badge contador oportunidades
- Navegable por teclado

**Tests de componentes** (opcional pero recomendado):
- [ ] CityCard.test.tsx - render, click, hover

#### **FASE 10: Frontend - Pages**
```
src/app/features/cities/
└── pages/
    ├── CitiesGridPage.tsx               [NUEVO - /opportunities]
    └── CityOpportunitiesPage.tsx        [NUEVO - /opportunities/:citySlug]
```

**CitiesGridPage**:
- Grid auto-fit
- Loading skeleton
- Empty state
- Error state

**CityOpportunitiesPage**:
- Header con info de ciudad
- Breadcrumb navegación
- Lista oportunidades (reutilizar OpportunityCard)
- Botón "Crear" solo para gestores

#### **FASE 11: Frontend - Routing**
```
src/App.tsx                              [MODIFICAR]
src/components/layout/Navigation.tsx     [MODIFICAR]
```

**Rutas nuevas**:
```tsx
<Route path="/opportunities" element={<CitiesGridPage />} />
<Route path="/opportunities/:citySlug" element={<CityOpportunitiesPage />} />
<Route path="/opportunities/:citySlug/:opportunityId" element={<OpportunityDetailPage />} />
```

#### **FASE 12: Admin UI (Gestión de Gestores)**
```
src/app/features/admin-management/city-managers/
├── pages/
│   └── CityManagersPage.tsx             [NUEVO]
└── components/
    ├── AssignCityManagerDialog.tsx      [NUEVO]
    └── CityManagersList.tsx             [NUEVO]
```

Interfaz admin para:
- Ver gestores por ciudad
- Asignar usuarios como gestores
- Remover gestores

#### **FASE 13: Testing e Integración**
- [ ] Ejecutar `yarn test:critical`
- [ ] Verificar todos los tests pasan
- [ ] Probar flujo completo manualmente:
  1. Ver grid de ciudades
  2. Click en ciudad → ver oportunidades
  3. Como gestor: crear oportunidad
  4. Como no-gestor: NO ver botón crear
  5. Como admin: asignar gestor
- [ ] Validar con `ui-ux-analyzer` sub-agente

#### **FASE 14: Documentación**
- [ ] Actualizar CLAUDE.md con nuevos endpoints
- [ ] Actualizar docs/database/supabase-schema.sql
- [ ] Documentar rol gestor_ciudad en README

---

## 🔑 DECISIONES ARQUITECTÓNICAS CLAVE

### 1. Feature Separada vs Integrada
**Decisión**: Feature `cities/` separada de `opportunities/`

**Razón**:
- Cities es entidad de dominio independiente
- Será consumida por múltiples features
- Facilita testing y mantenimiento

### 2. Permisos en 3 Capas
**Decisión**: Validar permisos en DB (RLS) + Use Cases + API Routes

**Razón**:
- Defense in depth
- Use Cases son la capa crítica (lógica de negocio)
- RLS es fallback de seguridad

### 3. Gestores Many-to-Many
**Decisión**: Tabla `city_managers` con many-to-many

**Razón**:
- Escalabilidad (un gestor puede manejar múltiples ciudades)
- Fácil de query y modificar
- Soporta futuras features (notificaciones por ciudad, etc.)

### 4. cityId Obligatorio
**Decisión**: `city_id INTEGER NOT NULL` en opportunities

**Razón**:
- Toda oportunidad DEBE pertenecer a una ciudad
- Simplifica queries y permisos
- Evita estados inválidos

### 5. Imágenes Externas
**Decisión**: URLs de Unsplash/Pexels, no Supabase Storage

**Razón**:
- Simplicidad (no gestionar uploads)
- CDN optimizado de Unsplash
- Posibilidad de cambiar fácilmente

---

## ⚠️ RIESGOS Y MITIGACIONES

### Riesgo 1: Migración Destructiva
**Impacto**: Pérdida de todas las oportunidades existentes

**Mitigación**:
- ✅ Confirmado por Iban (iniciar limpio)
- ⚠️ Hacer backup de DB antes de migrar
- ⚠️ Ejecutar en entorno de desarrollo primero

### Riesgo 2: Breaking Change Frontend
**Impacto**: Frontend actual dejará de funcionar durante implementación

**Mitigación**:
- Implementar backend completo primero
- Testear endpoints con Postman/curl
- Implementar frontend después de validar backend

### Riesgo 3: Permisos Complejos
**Impacto**: Bugs de seguridad si no se valida correctamente

**Mitigación**:
- Tests exhaustivos de permisos
- Validación en 3 capas (RLS + Use Cases + Routes)
- Code review crítico de CreateOpportunityUseCase

### Riesgo 4: React Query v5 Breaking Changes
**Impacto**: Código desactualizado si se usa conocimiento antiguo

**Mitigación**:
- Usar `isPending` en lugar de `isLoading` en mutations
- Seguir ejemplos en `.claude/doc/city_opportunities/frontend.md`

---

## 📊 CHECKLIST PRE-IMPLEMENTACIÓN

Antes de comenzar, verificar:

- [ ] Backup de base de datos creado
- [ ] Oportunidades existentes no son necesarias (confirmado)
- [ ] Imágenes de Unsplash para las 6 ciudades seleccionadas
- [ ] Rol `admin` existe en tabla `roles`
- [ ] Al menos un usuario tiene rol admin
- [ ] Entorno de desarrollo funcional (yarn dev:full)
- [ ] Tests actuales pasan (yarn test:critical)

---

## 📈 MÉTRICAS DE ÉXITO

### Funcionales
- ✅ Solo gestores pueden crear oportunidades para sus ciudades
- ✅ Grid de ciudades carga en < 2 segundos
- ✅ Navegación ciudad → oportunidades fluida
- ✅ Permisos validados correctamente en todos los casos

### Técnicas
- ✅ 100% tests críticos pasan (yarn test:critical)
- ✅ Cobertura de tests > 80% en nuevos use cases
- ✅ 0 vulnerabilidades de seguridad en permisos
- ✅ Arquitectura hexagonal mantenida

### UX
- ✅ Grid responsive en móvil, tablet, desktop
- ✅ Imágenes de ciudades cargadas y optimizadas
- ✅ Contador de oportunidades visible y actualizado
- ✅ Feedback claro cuando usuario NO es gestor

---

**Próximo Paso**: Presentar Plan Final a Iban para Aprobación
