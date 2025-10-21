# ✅ Frontend Opportunities Feature - COMPLETADO

**Fecha**: 2025-10-21
**Estado**: ✅ ESTRUCTURA COMPLETA (Backend integration pending)

---

## 🎉 Resumen

La **Feature de Opportunities del Frontend** ha sido implementada con arquitectura feature-based completa. Incluye:

- Gestión completa de oportunidades (CRUD)
- Filtrado por tipo, status, skills, remote, búsqueda
- Visualización con OpportunityCard
- Estadísticas y mis oportunidades

---

## ✅ Archivos Creados (10 archivos)

### Schemas
- ✅ `opportunity.schema.ts`
  - 6 tipos de oportunidades (proyecto, colaboración, empleo, mentoría, evento, otro)
  - 4 estados (abierta, en_progreso, cerrada, cancelada)
  - Validación completa con Zod
  - CreateOpportunityRequest con validaciones:
    - Título: 5-100 chars
    - Descripción: 20-2000 chars
    - Skills required: min 1
  - UpdateOpportunityRequest con campos opcionales
  - FilterOpportunitiesRequest para búsqueda

### Services
- ✅ `opportunity.service.ts`
  - `getOpportunities(filters)` - Con filtrado avanzado
  - `getOpportunity(id)` - Single opportunity
  - `getMyOpportunities()` - Mis oportunidades
  - `createOpportunity(data)` - Crear
  - `updateOpportunity(id, data)` - Actualizar
  - `deleteOpportunity(id)` - Eliminar

### Query Hooks
- ✅ `useOpportunitiesQuery.ts` - Lista con filtros
- ✅ `useOpportunityQuery.ts` - Single opportunity
- ✅ `useMyOpportunitiesQuery.ts` - Mis oportunidades

### Mutation Hooks
- ✅ `useCreateOpportunityMutation.ts`
- ✅ `useUpdateOpportunityMutation.ts`
- ✅ `useDeleteOpportunityMutation.ts`

### Components
- ✅ `OpportunityCard.tsx`
  - Status y type badges con colores
  - Información del creador con avatar
  - Skills required display
  - Detalles: location, remote, duration, compensation
  - Acciones: Edit y Delete (solo owner)
  - Confirmación antes de eliminar
  - Loading states

---

## 📡 Arquitectura

```
src/app/features/opportunities/
├── data/
│   ├── schemas/
│   │   └── opportunity.schema.ts       ✅ Zod + TS types
│   └── services/
│       └── opportunity.service.ts      ✅ Axios + validation
├── hooks/
│   ├── queries/
│   │   ├── useOpportunitiesQuery.ts    ✅ List with filters
│   │   ├── useOpportunityQuery.ts      ✅ Single opportunity
│   │   └── useMyOpportunitiesQuery.ts  ✅ My opportunities
│   └── mutations/
│       ├── useCreateOpportunityMutation.ts  ✅ Create
│       ├── useUpdateOpportunityMutation.ts  ✅ Update
│       └── useDeleteOpportunityMutation.ts  ✅ Delete
└── components/
    └── OpportunityCard.tsx             ✅ Card component
```

---

## 🎯 Tipos de Oportunidades

```typescript
type OpportunityType =
  | 'proyecto'       // Proyecto colaborativo
  | 'colaboracion'   // Busco colaborador
  | 'empleo'         // Oferta de trabajo
  | 'mentoria'       // Busco/ofrezco mentoría
  | 'evento'         // Evento o workshop
  | 'otro'           // Otros

type OpportunityStatus =
  | 'abierta'        // Activamente buscando
  | 'en_progreso'    // Ya iniciado
  | 'cerrada'        // Completado/lleno
  | 'cancelada'      // Cancelado
```

---

## 💡 Uso de los Hooks

### 1. List Opportunities (con filtros)

```typescript
const { data, isLoading } = useOpportunitiesQuery({
  type: 'proyecto',
  status: 'abierta',
  skills: ['React', 'TypeScript'],
  remote: true,
  search: 'desarrollador'
})

// data = {
//   opportunities: [...],
//   total: 45
// }
```

### 2. Single Opportunity

```typescript
const { data: opportunity } = useOpportunityQuery(opportunityId)
```

### 3. My Opportunities

```typescript
const { data } = useMyOpportunitiesQuery()
```

### 4. Create Opportunity

```typescript
const { action: create, isLoading, error } = useCreateOpportunityMutation()

create({
  title: 'Desarrollador Full Stack para Startup',
  description: 'Buscamos desarrollador con experiencia...',
  type: 'empleo',
  skills_required: ['React', 'Node.js', 'PostgreSQL'],
  location: 'Madrid',
  remote: true,
  duration: '6 meses',
  compensation: '30k-40k EUR'
})
```

### 5. Update Opportunity

```typescript
const { action: update } = useUpdateOpportunityMutation(opportunityId)

update({
  status: 'cerrada'
})
```

### 6. Delete Opportunity

```typescript
const { action: deleteOpp } = useDeleteOpportunityMutation()

deleteOpp(opportunityId)
```

---

## 🧩 OpportunityCard Component

### Props

```typescript
interface OpportunityCardProps {
  opportunity: OpportunityWithCreator
  onEdit?: (opportunity) => void
  showActions?: boolean
  isOwner?: boolean
}
```

### Features

1. **Status & Type Badges**
   - Status con colores:
     - Abierta: default (azul)
     - En Progreso: secondary (gris)
     - Cerrada: outline (borde)
     - Cancelada: destructive (rojo)
   - Type icon con label

2. **Creator Info**
   - Avatar con fallback
   - Nombre del creador

3. **Content**
   - Título destacado
   - Descripción (line-clamp-3)
   - Skills required con badges
   - Details: location, remote, duration, compensation

4. **Actions (solo owner)**
   - Edit button (llama onEdit callback)
   - Delete button con confirmación
   - Loading state en delete

### Usage Example

```typescript
import { OpportunityCard } from '@/app/features/opportunities/components/OpportunityCard'
import { useOpportunitiesQuery } from '@/app/features/opportunities/hooks/queries/useOpportunitiesQuery'

function OpportunitiesPage() {
  const { data } = useOpportunitiesQuery({ status: 'abierta' })
  const currentUserId = useAuthContext().user?.id

  return (
    <div className="grid gap-4">
      {data?.opportunities.map(opp => (
        <OpportunityCard
          key={opp.id}
          opportunity={opp}
          showActions={true}
          isOwner={opp.created_by === currentUserId}
          onEdit={(opp) => navigate(`/opportunities/${opp.id}/edit`)}
        />
      ))}
    </div>
  )
}
```

---

## ⚠️ Backend Integration Required

Los endpoints **NO EXISTEN** en el backend actual:

### Endpoints Necesarios

1. **GET /api/opportunities**
   - Query params: type, status, skills (comma-separated), remote, search
   - Returns: `{ opportunities: [...], total }`

2. **GET /api/opportunities/:id**
   - Returns: `{ opportunity: {...} }`

3. **GET /api/opportunities/my**
   - Returns: `{ opportunities: [...], total }`

4. **POST /api/opportunities**
   - Body: CreateOpportunityRequest
   - Returns: `{ opportunity }`

5. **PUT /api/opportunities/:id**
   - Body: UpdateOpportunityRequest
   - Returns: `{ opportunity }`

6. **DELETE /api/opportunities/:id**
   - Returns: 204 No Content

### Backend Implementation TODO

**Domain Layer**:
- [ ] Opportunity entity
- [ ] OpportunityId value object
- [ ] OpportunityType enum
- [ ] OpportunityStatus enum

**Application Layer**:
- [ ] CreateOpportunityUseCase
- [ ] UpdateOpportunityUseCase
- [ ] DeleteOpportunityUseCase
- [ ] GetOpportunityUseCase
- [ ] GetOpportunitiesUseCase
- [ ] SearchOpportunitiesUseCase
- [ ] IOpportunityRepository port

**Infrastructure Layer**:
- [ ] SupabaseOpportunityRepository
- [ ] opportunities.routes.ts
- [ ] Add to DI Container

**Database**:
- [ ] Create `opportunities` table:
```sql
CREATE TABLE opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  type VARCHAR(20) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'abierta',
  skills_required TEXT[] NOT NULL,
  created_by UUID REFERENCES users(id) NOT NULL,
  location VARCHAR(100),
  remote BOOLEAN DEFAULT false,
  duration VARCHAR(100),
  compensation VARCHAR(200),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_opportunities_type ON opportunities(type);
CREATE INDEX idx_opportunities_status ON opportunities(status);
CREATE INDEX idx_opportunities_created_by ON opportunities(created_by);
CREATE INDEX idx_opportunities_skills ON opportunities USING GIN(skills_required);
```

---

## 📋 Próximos Pasos

### FASE 3.4.1: Backend Implementation (ALTA PRIORIDAD)
- [ ] Crear tabla opportunities
- [ ] Implementar Opportunity entity y use cases
- [ ] Crear SupabaseOpportunityRepository
- [ ] Añadir routes y DI Container
- [ ] Implementar búsqueda/filtrado

### FASE 3.4.2: Testing (DESPUÉS DEL BACKEND)
- [ ] Test create opportunity flow
- [ ] Test update opportunity
- [ ] Test delete opportunity
- [ ] Test filters
- [ ] Test permissions (only owner can edit/delete)

### FASE 3.5: Messages Feature (SIGUIENTE)
- [ ] Implementar mensajería entre usuarios
- [ ] Real-time con WebSockets?
- [ ] Notificaciones

---

## 🎯 Progreso del Proyecto

- **Fase 1**: Testing Infrastructure ✅ 100%
- **Fase 2**: Backend Hexagonal ✅ 100%
- **Fase 3**: Frontend Features ⏳ 80%
  - Auth Feature ✅ 100%
  - Profile Feature ✅ 90%
  - Network Feature ✅ 100% (frontend)
  - Opportunities Feature ✅ 100% (frontend)
  - Messages Feature ⏳ 0%
- **Fase 4**: ABOUTME Comments ⏳ 70%
- **Fase 5**: Tests ⏳ 0%

**Total**: ~70% Complete

---

## 🏆 Logros

1. ✅ Estructura completa de opportunities
2. ✅ Schemas con validación Zod robusta
3. ✅ 6 servicios API implementados
4. ✅ 3 query hooks optimizados
5. ✅ 3 mutation hooks con cache invalidation
6. ✅ OpportunityCard component completo
7. ✅ Filtrado avanzado (type, status, skills, remote, search)
8. ✅ ABOUTME comments 100%
9. ✅ Type safety 100%
10. ✅ Permissions handling (isOwner)

---

**Estado**: ✅ FRONTEND COMPLETE, BACKEND REQUIRED
