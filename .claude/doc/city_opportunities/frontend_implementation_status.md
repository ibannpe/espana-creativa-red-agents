# Frontend Implementation Status: Sistema de Ciudades y Oportunidades

**Fecha de implementación**: 2025-11-13
**Estado**: COMPLETADO (Data Layer + Hooks)
**Branch**: feature-issue-10

---

## Resumen de Implementación

Se ha completado la implementación de la capa de datos y hooks para el sistema de ciudades con oportunidades. **NO se han implementado componentes UI ni páginas** según lo solicitado.

---

## Archivos Creados

### Feature Cities - Data Layer

1. **`src/app/features/cities/data/schemas/city.schema.ts`**
   - Esquemas Zod completos para City, CityWithStats, CityWithManagers
   - Validación de slug con formato kebab-case estricto
   - Schemas de respuesta API (GetCityResponse, GetCitiesResponse, GetIsCityManagerResponse)
   - TypeScript types exportados

2. **`src/app/features/cities/data/services/city.service.ts`**
   - `getCities()` - Obtener todas las ciudades activas
   - `getCityBySlug(slug)` - Obtener ciudad por slug
   - `getIsCityManager()` - Verificar si usuario es gestor y obtener ciudades gestionadas
   - `canManageCity(cityId)` - Verificar si puede gestionar ciudad específica
   - Validación Zod en todas las respuestas

### Feature Cities - Query Hooks

3. **`src/app/features/cities/hooks/queries/useCitiesQuery.ts`**
   - Query key: `['cities']`
   - StaleTime: 5 minutos
   - NO refetch on window focus
   - Retorna array de CityWithStats

4. **`src/app/features/cities/hooks/queries/useCityBySlugQuery.ts`**
   - Query key: `['cities', slug]`
   - StaleTime: 5 minutos
   - Retry: 1 (404 común si slug inválido)
   - Habilitado solo si slug existe

5. **`src/app/features/cities/hooks/queries/useIsCityManagerQuery.ts`**
   - Query key: `['city-manager', userId]`
   - StaleTime: 3 minutos
   - **SÍ refetch on window focus** (permisos críticos)
   - Solo habilitado si usuario autenticado
   - Retorna `{ isCityManager: boolean, managedCities: ManagedCity[] }`

6. **`src/app/features/cities/hooks/queries/useMyCitiesQuery.ts`**
   - Wrapper conveniente de `useIsCityManagerQuery`
   - Retorna solo la lista de ciudades gestionadas
   - Usado en CreateOpportunityDialog para selector

### Feature Cities - Business Hooks

7. **`src/app/features/cities/hooks/useCityPermissions.ts`**
   - Lógica centralizada de permisos de gestión de ciudades
   - Combina rol admin + gestor de ciudad
   - Parámetro opcional `cityId` para verificar permisos específicos
   - Retorna:
     - `canManageAnyCity` - Si puede gestionar alguna ciudad
     - `canManageCity` - Si puede gestionar la ciudad específica
     - `managedCities` - Array de ciudades que gestiona
     - `isLoading` - Estado de carga

---

## Archivos Modificados

### Opportunities - Schemas

8. **`src/app/features/opportunities/data/schemas/opportunity.schema.ts`**

   **Cambios en `opportunitySchema`**:
   ```typescript
   // AÑADIDO
   city_id: z.number().positive('La oportunidad debe estar asignada a una ciudad')

   // CAMBIADO - ahora opcional
   location: z.string().nullish().optional()
   ```

   **Nuevo schema `opportunityWithCitySchema`**:
   ```typescript
   export const opportunityWithCitySchema = opportunitySchema.extend({
     city: z.object({
       id: z.number(),
       name: z.string(),
       slug: z.string(),
       image_url: z.string().url()
     }),
     creator: z.object({
       id: z.string().uuid(),
       name: z.string(),
       avatar_url: z.string().nullable().optional(),
       professional_title: z.string().nullable().optional()
     })
   })
   ```

   **Cambios en `createOpportunityRequestSchema`**:
   ```typescript
   // AÑADIDO - OBLIGATORIO
   city_id: z.number().positive('Debes seleccionar una ciudad')

   // ELIMINADO - location ya no se usa en creación
   ```

   **Cambios en `filterOpportunitiesRequestSchema`**:
   ```typescript
   // AÑADIDO
   city_id: z.number().optional() // Filtrar por ciudad
   ```

   **Nuevo type exportado**:
   ```typescript
   export type OpportunityWithCity = z.infer<typeof opportunityWithCitySchema>
   ```

### Opportunities - Services

9. **`src/app/features/opportunities/data/services/opportunity.service.ts`**

   **Nuevo método**:
   ```typescript
   async getOpportunitiesByCity(
     cityId: number,
     filters?: Omit<FilterOpportunitiesRequest, 'city_id'>
   ): Promise<GetOpportunitiesResponse>
   ```
   - Fuerza filtro por `city_id`
   - Acepta filtros adicionales (type, status, skills, etc.)
   - Valida respuesta con Zod

### Opportunities - Query Hooks

10. **`src/app/features/opportunities/hooks/queries/useOpportunitiesByCityQuery.ts`** [NUEVO]

    - Query key jerárquico: `['opportunities', 'by-city', cityId, filters]`
    - StaleTime: 2 minutos
    - Habilitado solo si cityId existe
    - Permite invalidación granular por ciudad

### Opportunities - Mutation Hooks

11. **`src/app/features/opportunities/hooks/mutations/useCreateOpportunityMutation.ts`**

    **Cambios en `onSuccess`**:
    ```typescript
    onSuccess: (newOpportunity) => {
      // NUEVO - Invalidación granular por ciudad
      queryClient.invalidateQueries({
        queryKey: ['opportunities', 'by-city', newOpportunity.city_id]
      })

      // Invalidar queries generales
      queryClient.invalidateQueries({ queryKey: ['opportunities'] })
      queryClient.invalidateQueries({ queryKey: ['my-opportunities'] })

      // NUEVO - Invalidar stats de ciudades (contador)
      queryClient.invalidateQueries({ queryKey: ['cities'] })
    }
    ```

### Opportunities - Business Hooks

12. **`src/app/features/opportunities/hooks/useOpportunityPermissions.ts`** [NUEVO]

    - Verifica permisos de edición/eliminación de oportunidad
    - Reglas:
      - Creador puede editar/eliminar
      - Gestores de la ciudad pueden editar/eliminar
      - Admins pueden editar/eliminar
    - Retorna `{ canEdit: boolean, canDelete: boolean }`
    - Usa `useCityPermissions` internamente

---

## Estructura de Query Keys Implementada

```typescript
// Cities
['cities']                        // Lista de ciudades
['cities', slug]                  // Ciudad por slug
['city-manager', userId]         // Info gestor de ciudades

// Opportunities (actualizado)
['opportunities']                               // Todas
['opportunities', 'by-city', cityId]          // Por ciudad
['opportunities', 'by-city', cityId, filters] // Por ciudad con filtros
['opportunities', 'my']                        // Mis oportunidades
['opportunities', opportunityId]               // Oportunidad específica
```

---

## Configuración de StaleTime

| Tipo de Data | StaleTime | Refetch on Focus | Razón |
|--------------|-----------|------------------|-------|
| Cities | 5 min | NO | Datos estáticos |
| City permissions | 3 min | **SÍ** | Permisos críticos para UI |
| Opportunities by city | 2 min | NO | Datos moderados |

---

## Breaking Changes Introducidos

1. **`city_id` es OBLIGATORIO** en `CreateOpportunityRequest`
   - Toda nueva oportunidad debe tener ciudad asignada
   - Frontend debe mostrar selector de ciudades gestionadas

2. **`location` es DEPRECADO**
   - Ya no se usa en creación de oportunidades
   - Se mantiene en schema base solo para retrocompatibilidad con datos antiguos

3. **Permisos de creación cambiados**
   - Solo gestores de ciudad pueden crear oportunidades para sus ciudades
   - Backend valida permisos (frontend solo oculta UI)

---

## Notas Importantes para UI Implementation

### 1. Color Primario
**IMPORTANTE**: El color primario del proyecto es **VERDE (#22c55e)**, NO rojo como aparece en algunos documentos.

Usar clases de Tailwind:
```typescript
className="bg-primary text-primary-foreground"
className="border-primary hover:bg-primary/10"
```

### 2. React Query v5 Syntax
**ATENCIÓN**: Proyecto usa React Query v5

```typescript
// ❌ ANTIGUO (v4)
isLoading: mutation.isLoading

// ✅ NUEVO (v5)
isLoading: mutation.isPending
```

### 3. Invalidación de Queries
```typescript
// Invalidar TODO lo que empiece con ['opportunities']
queryClient.invalidateQueries({ queryKey: ['opportunities'] })

// Invalidar SOLO queries exactas
queryClient.invalidateQueries({
  queryKey: ['opportunities', 'by-city', cityId],
  exact: true
})
```

### 4. Permisos UI
Siempre usar hooks de permisos antes de mostrar botones:

```typescript
// En CityOpportunitiesPage
const { canManageCity } = useCityPermissions(city.id)

{canManageCity && <CreateOpportunityButton />}

// En OpportunityCard
const { canEdit, canDelete } = useOpportunityPermissions(opportunity)

{canEdit && <EditButton />}
{canDelete && <DeleteButton />}
```

---

## Pendiente de Implementación (UI Layer)

Los siguientes archivos **NO están implementados** y deben ser creados por otro agente:

### Components
- `src/app/features/cities/components/CityCard.tsx`
- `src/app/features/cities/components/CityHeader.tsx`
- `src/app/features/cities/components/CitiesGrid.tsx`
- `src/app/features/cities/components/CitiesGridSkeleton.tsx`

### Pages
- `src/app/features/cities/pages/CitiesGridPage.tsx`
- `src/app/features/opportunities/pages/CityOpportunitiesPage.tsx`

### Modificaciones necesarias
- `src/app/features/opportunities/components/OpportunityCard.tsx` - Mostrar ciudad
- `src/app/features/opportunities/components/CreateOpportunityDialog.tsx` - Selector de ciudad
- `src/App.tsx` - Rutas actualizadas
- `src/components/layout/Navigation.tsx` - Links actualizados

---

## Estado de Compilación

- **TypeScript**: ✅ Sin errores
- **Build**: No ejecutado (data layer completo, UI pendiente)
- **Tests**: No ejecutados (política: tests obligatorios antes de merge)

---

## Checklist Pre-Merge

Antes de hacer merge a main, verificar:

- [ ] Backend tiene tabla `cities` y `city_managers` creadas
- [ ] Endpoints API `/api/cities/*` funcionando y testeados
- [ ] Rol `gestor_ciudad` creado en DB (ID: 4)
- [ ] UI components implementados
- [ ] Pages implementadas
- [ ] Rutas actualizadas en App.tsx
- [ ] Tests unitarios de schemas creados
- [ ] Tests unitarios de services creados
- [ ] Tests unitarios de hooks creados
- [ ] `yarn test:critical` pasa al 100%
- [ ] Pruebas manuales de flujo completo
- [ ] Documentación actualizada (CLAUDE.md)

---

## Próximos Pasos

1. **UI Implementation** (por otro agente especializado):
   - Implementar componentes de ciudades (CityCard, CitiesGrid)
   - Implementar páginas (CitiesGridPage, CityOpportunitiesPage)
   - Modificar CreateOpportunityDialog para selector de ciudades
   - Actualizar rutas en App.tsx

2. **Testing**:
   - Tests de schemas (city.schema.test.ts)
   - Tests de services (city.service.test.ts)
   - Tests de hooks (useCitiesQuery.test.tsx, useIsCityManagerQuery.test.tsx)
   - Tests de permisos (useCityPermissions.test.tsx, useOpportunityPermissions.test.tsx)

3. **Integration Testing**:
   - Flujo completo: Ver ciudades → Click ciudad → Ver oportunidades → Crear oportunidad (si gestor)
   - Verificar permisos correctamente aplicados
   - Verificar invalidación de queries funciona correctamente

---

## Archivos de Referencia

Para implementación UI, consultar:
- Plan completo: `.claude/doc/city_opportunities/frontend.md`
- Plan backend: `.claude/doc/city_opportunities/backend.md`
- Plan UI/UX: `.claude/doc/city_opportunities/shadcn_ui.md`
- Sesión general: `.claude/sessions/context_session_city_opportunities.md`

---

**Implementado por**: Claude Code (frontend-developer)
**Fecha**: 2025-11-13
**Tiempo estimado**: ~2 horas para UI implementation
