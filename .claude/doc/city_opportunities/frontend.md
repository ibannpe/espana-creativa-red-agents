# Frontend Architecture Plan: Sistema de Ciudades y Oportunidades

**Fecha**: 2025-11-13
**Feature**: City-based Opportunities System
**Tipo**: Nueva Feature + Refactor de Opportunities

---

## 1. Estructura de Carpetas Recomendada

### Decisión: Feature Separada `cities/` + Refactor de `opportunities/`

**Razón**: Las ciudades son una entidad de dominio independiente que:
- Tiene su propio ciclo de vida (CRUD por admins)
- Será consumida por múltiples features (opportunities ahora, posiblemente events/projects en futuro)
- Representa un concepto de negocio diferente a las oportunidades

```
src/app/features/
├── cities/                              # ✨ NUEVA FEATURE
│   ├── components/
│   │   ├── CityCard.tsx                # Tarjeta de ciudad con imagen
│   │   ├── CityHeader.tsx              # Header de info de ciudad
│   │   └── CityManagerBadge.tsx        # Badge indicando gestores
│   ├── data/
│   │   ├── schemas/
│   │   │   └── city.schema.ts          # Zod schemas
│   │   └── services/
│   │       └── city.service.ts         # API calls
│   ├── hooks/
│   │   ├── mutations/
│   │   │   └── (futuro para admin CRUD)
│   │   ├── queries/
│   │   │   ├── useCitiesQuery.ts
│   │   │   ├── useCityBySlugQuery.ts
│   │   │   ├── useIsCityManagerQuery.ts
│   │   │   └── useMyCitiesQuery.ts
│   │   └── useCityPermissions.ts       # Business hook para permisos
│   └── pages/
│       └── CitiesGridPage.tsx          # Grid de ciudades
│
├── opportunities/                       # 🔄 REFACTOR EXISTENTE
│   ├── components/
│   │   ├── OpportunityCard.tsx         # [MODIFICAR] Mostrar ciudad
│   │   ├── CreateOpportunityDialog.tsx # [MODIFICAR] Integrar ciudad
│   │   └── OpportunitiesList.tsx       # [NUEVO] Lista filtrada
│   ├── data/
│   │   ├── schemas/
│   │   │   └── opportunity.schema.ts   # [MODIFICAR] Añadir city_id
│   │   └── services/
│   │       └── opportunity.service.ts  # [MODIFICAR] Filtro por ciudad
│   ├── hooks/
│   │   ├── mutations/
│   │   │   ├── useCreateOpportunityMutation.ts  # [MODIFICAR] Validar permisos
│   │   │   ├── useUpdateOpportunityMutation.ts
│   │   │   └── useDeleteOpportunityMutation.ts
│   │   ├── queries/
│   │   │   ├── useOpportunitiesQuery.ts
│   │   │   ├── useOpportunitiesByCityQuery.ts  # [NUEVO]
│   │   │   ├── useMyOpportunitiesQuery.ts
│   │   │   └── useOpportunityQuery.ts
│   │   └── useOpportunityPermissions.ts         # [NUEVO] Business hook
│   └── pages/
│       └── CityOpportunitiesPage.tsx            # [NUEVO] Oportunidades de ciudad
```

---

## 2. Data Layer - Schemas y Services

### 2.1 City Schema (`cities/data/schemas/city.schema.ts`)

```typescript
// ABOUTME: Zod schemas for cities feature with validation
// ABOUTME: Defines types for city entities and API responses

import { z } from 'zod'

// City slug format validation (lowercase, hyphens, no spaces)
const citySlugSchema = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'El slug debe ser lowercase con guiones')
  .min(2, 'El slug debe tener al menos 2 caracteres')
  .max(100, 'El slug no puede superar 100 caracteres')

// Base city schema
export const citySchema = z.object({
  id: z.number(),
  name: z.string().min(2).max(100),
  slug: citySlugSchema,
  image_url: z.string().url('Debe ser una URL válida'),
  description: z.string().nullable(),
  active: z.boolean(),
  display_order: z.number().default(0),
  created_at: z.string(),
  updated_at: z.string()
})

// City with opportunities count
export const cityWithStatsSchema = citySchema.extend({
  opportunities_count: z.number().default(0),
  active_opportunities_count: z.number().default(0)
})

// City with managers info
export const cityWithManagersSchema = citySchema.extend({
  managers: z.array(z.object({
    id: z.string().uuid(),
    name: z.string(),
    avatar_url: z.string().nullable()
  }))
})

// API Response schemas
export const getCityResponseSchema = z.object({
  city: cityWithStatsSchema
})

export const getCitiesResponseSchema = z.object({
  cities: z.array(cityWithStatsSchema)
})

export const getIsCityManagerResponseSchema = z.object({
  isCityManager: z.boolean(),
  managedCities: z.array(z.object({
    id: z.number(),
    name: z.string(),
    slug: z.string()
  }))
})

// TypeScript types
export type City = z.infer<typeof citySchema>
export type CityWithStats = z.infer<typeof cityWithStatsSchema>
export type CityWithManagers = z.infer<typeof cityWithManagersSchema>
export type GetCityResponse = z.infer<typeof getCityResponseSchema>
export type GetCitiesResponse = z.infer<typeof getCitiesResponseSchema>
export type GetIsCityManagerResponse = z.infer<typeof getIsCityManagerResponseSchema>
```

**Notas importantes**:
- `slug` valida formato kebab-case estricto para URLs limpias
- `image_url` requiere URL válida (Unsplash/Pexels)
- `cityWithStatsSchema` incluye contadores para UI
- Separación clara entre entidad base y extensiones con relaciones

---

### 2.2 City Service (`cities/data/services/city.service.ts`)

```typescript
// ABOUTME: City service for API communication with Axios and Zod validation
// ABOUTME: Handles fetching cities and checking city manager permissions

import { axiosInstance } from '@/lib/axios'
import {
  type GetCitiesResponse,
  type GetCityResponse,
  type GetIsCityManagerResponse,
  getCitiesResponseSchema,
  getCityResponseSchema,
  getIsCityManagerResponseSchema
} from '../schemas/city.schema'

export const cityService = {
  /**
   * Get all active cities ordered by display_order
   */
  async getCities(): Promise<GetCitiesResponse> {
    const response = await axiosInstance.get('/cities')
    return getCitiesResponseSchema.parse(response.data)
  },

  /**
   * Get a single city by slug
   */
  async getCityBySlug(slug: string): Promise<GetCityResponse> {
    const response = await axiosInstance.get(`/cities/${slug}`)
    return getCityResponseSchema.parse(response.data)
  },

  /**
   * Check if current user is a city manager and get their managed cities
   */
  async getIsCityManager(): Promise<GetIsCityManagerResponse> {
    const response = await axiosInstance.get('/cities/my-managed')
    return getIsCityManagerResponseSchema.parse(response.data)
  },

  /**
   * Check if current user can manage a specific city
   */
  async canManageCity(cityId: number): Promise<boolean> {
    const response = await axiosInstance.get(`/cities/${cityId}/can-manage`)
    return response.data.canManage
  }
}
```

**Puntos clave**:
- Todos los métodos retornan promesas tipadas
- Validación con Zod en cada respuesta
- Método `canManageCity()` para verificar permisos de UI específicos
- Método `getIsCityManager()` retorna lista de ciudades gestionadas (útil para dropdown en CreateOpportunity)

---

### 2.3 Actualización de Opportunity Schema

**Cambios necesarios en `opportunities/data/schemas/opportunity.schema.ts`**:

```typescript
// [AÑADIR] Campo city_id en base schema
export const opportunitySchema = z.object({
  id: z.union([z.string(), z.number()]).transform(val => String(val)),
  title: z.string(),
  description: z.string(),
  type: opportunityTypeSchema,
  status: opportunityStatusSchema,
  skills_required: z.array(z.string()),
  created_by: z.string().uuid(),

  // ✨ NUEVO - Relación con ciudad (REQUERIDO)
  city_id: z.number().positive('La oportunidad debe estar asignada a una ciudad'),

  // DEPRECADO - Mantener para migración pero hacer opcional
  location: z.string().nullish().optional(),

  remote: z.boolean(),
  duration: z.string().nullish(),
  compensation: z.string().nullish(),
  created_at: z.string(),
  updated_at: z.string()
})

// [AÑADIR] Opportunity con info de ciudad poblada
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

// [MODIFICAR] Create request - city_id obligatorio
export const createOpportunityRequestSchema = z.object({
  title: z.string().min(5).max(100),
  description: z.string().min(20).max(2000),
  type: opportunityTypeSchema,
  skills_required: z.array(z.string()).min(1),

  // ✨ NUEVO - Ciudad obligatoria
  city_id: z.number().positive('Debes seleccionar una ciudad'),

  // location ya no se usa en creación (deprecado)
  remote: z.boolean().default(false),
  duration: z.string().max(100).nullable().optional(),
  compensation: z.string().max(200).nullable().optional()
})

// [NUEVO] Filter con city_id
export const filterOpportunitiesRequestSchema = z.object({
  type: opportunityTypeSchema.optional(),
  status: opportunityStatusSchema.optional(),
  skills: z.array(z.string()).optional(),
  remote: z.boolean().optional(),
  search: z.string().optional(),
  city_id: z.number().optional(), // ✨ Filtrar por ciudad
  limit: z.number().optional()
})

// Export new type
export type OpportunityWithCity = z.infer<typeof opportunityWithCitySchema>
```

**Migración estrategia**:
- `city_id` es **REQUERIDO** en nuevas oportunidades
- `location` se mantiene como opcional para retrocompatibilidad (pero no se usa en UI)
- Backend debe validar que user tiene permisos sobre esa ciudad al crear

---

### 2.4 Actualización de Opportunity Service

**Cambios en `opportunities/data/services/opportunity.service.ts`**:

```typescript
// [AÑADIR] Nuevo método para filtrar por ciudad
/**
 * Get opportunities for a specific city
 */
async getOpportunitiesByCity(
  cityId: number,
  filters?: Omit<FilterOpportunitiesRequest, 'city_id'>
): Promise<GetOpportunitiesResponse> {
  const response = await axiosInstance.get('/opportunities', {
    params: {
      city_id: cityId, // ✨ Forzar filtro por ciudad
      type: filters?.type,
      status: filters?.status,
      skills: filters?.skills?.join(','),
      remote: filters?.remote,
      search: filters?.search,
      limit: filters?.limit
    }
  })
  return getOpportunitiesResponseSchema.parse(response.data)
}
```

---

## 3. Query Hooks - React Query Configuration

### 3.1 Cities Query Hooks

#### `cities/hooks/queries/useCitiesQuery.ts`

```typescript
// ABOUTME: React Query hook for fetching all cities with stats
// ABOUTME: Returns list of cities with opportunity counts

import { useQuery } from '@tanstack/react-query'
import { cityService } from '../../data/services/city.service'
import type { CityWithStats } from '../../data/schemas/city.schema'

/**
 * Query hook to fetch all active cities ordered by display_order
 *
 * @returns Query result with array of cities including stats
 */
export const useCitiesQuery = () => {
  return useQuery<CityWithStats[], Error>({
    queryKey: ['cities'], // Simple key - no filters
    queryFn: async () => {
      const response = await cityService.getCities()
      return response.cities
    },
    staleTime: 5 * 60 * 1000, // 5 minutos - ciudades no cambian frecuentemente
    gcTime: 10 * 60 * 1000,   // 10 minutos
    refetchOnWindowFocus: false // No refetch en focus (datos estables)
  })
}
```

**Decisiones de configuración**:
- `staleTime: 5min` - Ciudades son datos relativamente estáticos
- `refetchOnWindowFocus: false` - Evita refetch innecesarios
- Query key simple `['cities']` - No hay filtros complejos
- `gcTime` largo - Mantener en caché para navegación rápida

---

#### `cities/hooks/queries/useCityBySlugQuery.ts`

```typescript
// ABOUTME: React Query hook for fetching single city by slug
// ABOUTME: Used in city opportunities page for city header

import { useQuery } from '@tanstack/react-query'
import { cityService } from '../../data/services/city.service'
import type { CityWithStats } from '../../data/schemas/city.schema'

/**
 * Query hook to fetch a city by slug with stats
 *
 * @param slug - City slug from URL params
 * @param options - React Query options
 * @returns Query result with city data
 */
export const useCityBySlugQuery = (
  slug: string,
  options?: {
    enabled?: boolean
  }
) => {
  return useQuery<CityWithStats, Error>({
    queryKey: ['cities', slug], // Include slug in key for caching
    queryFn: async () => {
      const response = await cityService.getCityBySlug(slug)
      return response.city
    },
    enabled: options?.enabled !== false && !!slug, // Solo si hay slug
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 1, // Solo 1 retry (404 es común si slug no existe)
    refetchOnWindowFocus: false
  })
}
```

**Nota importante**:
- `enabled: !!slug` previene query con slug vacío
- `retry: 1` - Slug inválido falla rápido
- Query key incluye slug para cache granular

---

#### `cities/hooks/queries/useIsCityManagerQuery.ts`

```typescript
// ABOUTME: React Query hook to check if user is city manager
// ABOUTME: Returns manager status and list of managed cities

import { useQuery } from '@tanstack/react-query'
import { cityService } from '../../data/services/city.service'
import { useAuthContext } from '@/app/features/auth/hooks/useAuthContext'

export interface ManagedCity {
  id: number
  name: string
  slug: string
}

export interface CityManagerInfo {
  isCityManager: boolean
  managedCities: ManagedCity[]
}

/**
 * Query hook to check if current user is a city manager
 * Returns list of cities they can manage
 *
 * @returns Query result with manager status and cities
 */
export const useIsCityManagerQuery = () => {
  const { isAuthenticated, user } = useAuthContext()

  return useQuery<CityManagerInfo, Error>({
    queryKey: ['city-manager', user?.id], // Invalidar si user cambia
    queryFn: async () => {
      return await cityService.getIsCityManager()
    },
    enabled: isAuthenticated, // Solo si está autenticado
    staleTime: 3 * 60 * 1000, // 3 minutos
    gcTime: 5 * 60 * 1000,
    // Este dato es crítico para permisos UI
    refetchOnWindowFocus: true // SI refetch para mantener permisos actualizados
  })
}
```

**Uso en componentes**:
```typescript
const { data: cityManagerInfo, isLoading } = useIsCityManagerQuery()

// Verificar si puede crear oportunidades
const canCreateOpportunity = cityManagerInfo?.isCityManager || false

// Obtener ciudades para dropdown
const managedCities = cityManagerInfo?.managedCities || []
```

---

#### `cities/hooks/queries/useMyCitiesQuery.ts`

```typescript
// ABOUTME: React Query hook for fetching cities managed by current user
// ABOUTME: Used in CreateOpportunity dialog for city selection

import { useQuery } from '@tanstack/react-query'
import { useIsCityManagerQuery } from './useIsCityManagerQuery'
import type { ManagedCity } from './useIsCityManagerQuery'

/**
 * Query hook to fetch only the cities managed by current user
 * Convenience wrapper around useIsCityManagerQuery
 *
 * @returns Query result with array of managed cities
 */
export const useMyCitiesQuery = () => {
  const {
    data: cityManagerInfo,
    isLoading,
    error
  } = useIsCityManagerQuery()

  return {
    data: cityManagerInfo?.managedCities || [],
    isLoading,
    error,
    isCityManager: cityManagerInfo?.isCityManager || false
  }
}
```

**Por qué este wrapper**:
- Simplifica el código de componentes que solo necesitan la lista
- Mantiene la lógica de permisos centralizada
- Más fácil de usar en formularios

---

### 3.2 Opportunities Query Hooks - Modificaciones

#### `opportunities/hooks/queries/useOpportunitiesByCityQuery.ts` [NUEVO]

```typescript
// ABOUTME: React Query hook for fetching opportunities filtered by city
// ABOUTME: Used in CityOpportunitiesPage to show city-specific opportunities

import { useQuery } from '@tanstack/react-query'
import { opportunityService } from '../../data/services/opportunity.service'
import type {
  OpportunityWithCity,
  FilterOpportunitiesRequest
} from '../../data/schemas/opportunity.schema'

/**
 * Query hook to fetch opportunities for a specific city
 *
 * @param cityId - ID of the city to filter by
 * @param filters - Optional additional filters (type, status, skills)
 * @param options - React Query options
 * @returns Query result with opportunities filtered by city
 */
export const useOpportunitiesByCityQuery = (
  cityId: number,
  filters?: Omit<FilterOpportunitiesRequest, 'city_id'>,
  options?: {
    enabled?: boolean
  }
) => {
  // Query key incluye cityId y filters para cache granular
  const queryKey = ['opportunities', 'by-city', cityId, filters || {}]

  return useQuery<
    { opportunities: OpportunityWithCity[]; total: number },
    Error
  >({
    queryKey,
    queryFn: async () => {
      return await opportunityService.getOpportunitiesByCity(cityId, filters)
    },
    enabled: options?.enabled !== false && !!cityId,
    staleTime: 2 * 60 * 1000, // 2 minutos
    gcTime: 5 * 60 * 1000
  })
}
```

**Estrategia de Query Keys**:
```typescript
['opportunities']                              // Todas las oportunidades
['opportunities', 'by-city', 1]               // Oportunidades de ciudad 1
['opportunities', 'by-city', 1, { type: 'empleo' }] // Con filtros
['opportunities', 'my']                        // Mis oportunidades
```

Esto permite invalidación granular:
```typescript
// Invalidar todas las oportunidades de una ciudad específica
queryClient.invalidateQueries({ queryKey: ['opportunities', 'by-city', cityId] })

// Invalidar todas las oportunidades (todas las ciudades)
queryClient.invalidateQueries({ queryKey: ['opportunities'] })
```

---

## 4. Mutation Hooks

### 4.1 Cities Mutations [FUTURO - Admin Panel]

**No implementar ahora**, pero la estructura sería:

```typescript
// cities/hooks/mutations/useAssignCityManagerMutation.ts
// cities/hooks/mutations/useRemoveCityManagerMutation.ts
// cities/hooks/mutations/useCreateCityMutation.ts (admin)
// cities/hooks/mutations/useUpdateCityMutation.ts (admin)
```

---

### 4.2 Opportunities Mutations - Modificaciones

#### `opportunities/hooks/mutations/useCreateOpportunityMutation.ts` [MODIFICAR]

```typescript
// ABOUTME: React Query mutation hook for creating opportunities
// ABOUTME: Validates city manager permissions and invalidates appropriate queries

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { opportunityService } from '../../data/services/opportunity.service'
import type {
  CreateOpportunityRequest,
  Opportunity
} from '../../data/schemas/opportunity.schema'

/**
 * Mutation hook to create a new opportunity
 *
 * IMPORTANT: Backend validates city manager permissions
 * Frontend should only show button if user has permissions
 *
 * @returns Mutation object with standardized interface
 */
export const useCreateOpportunityMutation = () => {
  const queryClient = useQueryClient()

  const mutation = useMutation<Opportunity, Error, CreateOpportunityRequest>({
    mutationFn: async (data: CreateOpportunityRequest) => {
      // Backend validará que user es gestor de data.city_id
      const response = await opportunityService.createOpportunity(data)
      return response.opportunity
    },
    onSuccess: (newOpportunity) => {
      // ✨ CAMBIO: Invalidar queries de la ciudad específica
      queryClient.invalidateQueries({
        queryKey: ['opportunities', 'by-city', newOpportunity.city_id]
      })

      // También invalidar queries generales
      queryClient.invalidateQueries({ queryKey: ['opportunities'] })
      queryClient.invalidateQueries({ queryKey: ['my-opportunities'] })

      // ✨ NUEVO: Invalidar stats de la ciudad (contador)
      queryClient.invalidateQueries({
        queryKey: ['cities', 'stats']
      })
    }
  })

  return {
    action: mutation.mutate,
    isLoading: mutation.isPending,
    error: mutation.error,
    isSuccess: mutation.isSuccess,
    data: mutation.data
  }
}
```

**Cambios clave**:
- Invalidación granular por `city_id` de la oportunidad creada
- Invalidar stats de ciudades para actualizar contadores
- Backend hace la validación real de permisos (frontend solo oculta UI)

---

## 5. Business Hooks (Custom Hooks)

### 5.1 `cities/hooks/useCityPermissions.ts`

```typescript
// ABOUTME: Business hook for city management permissions
// ABOUTME: Centralizes permission logic for city-related actions

import { useMemo } from 'react'
import { useUserRoles, ROLE_IDS } from '@/app/features/auth/hooks/useUserRoles'
import { useIsCityManagerQuery } from './queries/useIsCityManagerQuery'

/**
 * Hook to check city management permissions
 *
 * Combines admin role check with city manager status
 *
 * @param cityId - Optional city ID to check specific permissions
 * @returns Permission flags and managed cities list
 */
export const useCityPermissions = (cityId?: number) => {
  const { isAdmin } = useUserRoles()
  const { data: cityManagerInfo, isLoading } = useIsCityManagerQuery()

  // Memoize permissions to avoid recalculation
  const permissions = useMemo(() => {
    if (isLoading) {
      return {
        canManageAnyCity: false,
        canManageCity: false,
        managedCities: [],
        isLoading: true
      }
    }

    const isCityManager = cityManagerInfo?.isCityManager || false
    const managedCities = cityManagerInfo?.managedCities || []

    // Admin puede gestionar cualquier ciudad
    if (isAdmin) {
      return {
        canManageAnyCity: true,
        canManageCity: true,
        managedCities: [], // Admins no están en lista de gestores específicos
        isLoading: false
      }
    }

    // City manager solo puede gestionar sus ciudades asignadas
    const canManageSpecificCity = cityId
      ? managedCities.some(city => city.id === cityId)
      : false

    return {
      canManageAnyCity: isCityManager,
      canManageCity: cityId ? canManageSpecificCity : isCityManager,
      managedCities,
      isLoading: false
    }
  }, [isAdmin, cityManagerInfo, cityId, isLoading])

  return permissions
}
```

**Uso en componentes**:
```typescript
// En CityOpportunitiesPage
const { canManageCity } = useCityPermissions(city.id)

// Mostrar botón solo si puede gestionar
{canManageCity && <CreateOpportunityButton />}

// En CreateOpportunityDialog
const { managedCities } = useCityPermissions()

// Dropdown de ciudades solo con las que puede gestionar
<Select options={managedCities} />
```

---

### 5.2 `opportunities/hooks/useOpportunityPermissions.ts` [NUEVO]

```typescript
// ABOUTME: Business hook for opportunity edit/delete permissions
// ABOUTME: Checks if user can modify a specific opportunity

import { useMemo } from 'react'
import { useAuthContext } from '@/app/features/auth/hooks/useAuthContext'
import { useUserRoles, ROLE_IDS } from '@/app/features/auth/hooks/useUserRoles'
import { useCityPermissions } from '@/app/features/cities/hooks/useCityPermissions'
import type { Opportunity } from '../data/schemas/opportunity.schema'

/**
 * Hook to check opportunity edit/delete permissions
 *
 * Rules:
 * - Creator can always edit/delete
 * - City managers of the opportunity's city can edit/delete
 * - Admins can always edit/delete
 *
 * @param opportunity - The opportunity to check permissions for
 * @returns Permission flags for edit and delete
 */
export const useOpportunityPermissions = (opportunity: Opportunity) => {
  const { user } = useAuthContext()
  const { isAdmin } = useUserRoles()
  const { canManageCity } = useCityPermissions(opportunity.city_id)

  const permissions = useMemo(() => {
    if (!user) {
      return { canEdit: false, canDelete: false }
    }

    // Admin puede todo
    if (isAdmin) {
      return { canEdit: true, canDelete: true }
    }

    // Creador puede editar y eliminar
    const isCreator = user.id === opportunity.created_by

    // Gestor de la ciudad puede editar y eliminar
    const isCityManager = canManageCity

    const canModify = isCreator || isCityManager

    return {
      canEdit: canModify,
      canDelete: canModify
    }
  }, [user, isAdmin, opportunity.created_by, canManageCity])

  return permissions
}
```

**Uso**:
```typescript
// En OpportunityCard
const { canEdit, canDelete } = useOpportunityPermissions(opportunity)

{canEdit && <EditButton />}
{canDelete && <DeleteButton />}
```

---

## 6. Integration con Auth Context

### Verificación de Gestores de Ciudad

**El sistema actual ya soporta esta integración**:

1. **`useUserRoles` hook** ya existe y detecta roles
2. **Necesitas crear nuevo rol** en base de datos: `gestor_ciudad` (ID a definir)
3. **Actualizar `useUserRoles.ts`** con nueva constante:

```typescript
// auth/hooks/useUserRoles.ts [MODIFICAR]
export const ROLE_IDS = {
  ADMIN: 1,
  MENTOR: 2,
  EMPRENDEDOR: 3,
  GESTOR_CIUDAD: 4 // ✨ AÑADIR
} as const
```

4. **Usar en combinación con `useCityPermissions`**:

```typescript
const { roleIds } = useUserRoles()
const hasCityManagerRole = roleIds.includes(ROLE_IDS.GESTOR_CIUDAD)

// Pero mejor usar hook específico
const { canManageAnyCity } = useCityPermissions()
```

---

## 7. React Query Configuration

### 7.1 Query Keys Structure

**Convención de Query Keys para este feature**:

```typescript
// Cities
['cities']                        // Lista de todas las ciudades
['cities', slug]                  // Ciudad específica por slug
['cities', 'stats']              // Stats de ciudades (invalidar tras crear opportunity)
['city-manager', userId]         // Info de gestión de ciudades por usuario

// Opportunities (actualizado)
['opportunities']                               // Todas
['opportunities', filters]                     // Con filtros generales
['opportunities', 'by-city', cityId]          // Por ciudad
['opportunities', 'by-city', cityId, filters] // Por ciudad con filtros
['opportunities', 'my']                        // Mis oportunidades
['opportunities', opportunityId]               // Oportunidad específica
```

---

### 7.2 Stale Time Recommendations

**Configuración por tipo de dato**:

```typescript
// Datos ESTÁTICOS (cambian raramente)
{
  staleTime: 5 * 60 * 1000,  // 5 minutos
  gcTime: 10 * 60 * 1000,    // 10 minutos
  refetchOnWindowFocus: false
}
// Ejemplos: cities, user roles

// Datos MODERADOS (actualizaciones ocasionales)
{
  staleTime: 2 * 60 * 1000,  // 2 minutos
  gcTime: 5 * 60 * 1000,     // 5 minutos
  refetchOnWindowFocus: false
}
// Ejemplos: opportunities list

// Datos SENSIBLES (permisos críticos)
{
  staleTime: 3 * 60 * 1000,  // 3 minutos
  gcTime: 5 * 60 * 1000,
  refetchOnWindowFocus: true  // ✅ SÍ refetch
}
// Ejemplos: city manager status (permisos UI)

// Datos DINÁMICOS (tiempo real)
{
  staleTime: 30 * 1000,      // 30 segundos
  gcTime: 2 * 60 * 1000,
  refetchOnWindowFocus: true
}
// Ejemplos: unread messages count (si aplica)
```

---

### 7.3 Prefetching Strategies

**Optimización de navegación**:

```typescript
// En CitiesGridPage - prefetch oportunidades al hover sobre ciudad
const queryClient = useQueryClient()

const handleCityCardHover = (cityId: number) => {
  queryClient.prefetchQuery({
    queryKey: ['opportunities', 'by-city', cityId],
    queryFn: () => opportunityService.getOpportunitiesByCity(cityId),
    staleTime: 2 * 60 * 1000
  })
}

// En CityOpportunitiesPage - prefetch detalle al hover sobre card
const handleOpportunityCardHover = (opportunityId: string) => {
  queryClient.prefetchQuery({
    queryKey: ['opportunities', opportunityId],
    queryFn: () => opportunityService.getOpportunity(opportunityId),
    staleTime: 2 * 60 * 1000
  })
}
```

**Prefetch en navegación programática**:
```typescript
// Después de crear oportunidad exitosamente
onSuccess: (newOpportunity) => {
  // Navegar a la ciudad
  navigate(`/opportunities/${citySlug}`)

  // Prefetch la lista de oportunidades de esa ciudad
  queryClient.prefetchQuery({
    queryKey: ['opportunities', 'by-city', newOpportunity.city_id]
  })
}
```

---

## 8. TypeScript Types - Shared Types

### 8.1 Ubicación de Tipos Compartidos

**Decisión**: Mantener tipos en schemas de cada feature

**NO crear archivo centralizado de tipos** porque:
- Cada feature es autosuficiente
- Schemas Zod ya generan los tipos
- Evita dependencias circulares
- Facilita tree-shaking

**Importar tipos entre features cuando necesario**:
```typescript
// En opportunities/components/OpportunityCard.tsx
import type { City } from '@/app/features/cities/data/schemas/city.schema'
```

---

### 8.2 Type Safety entre Features

**Patrón recomendado para relaciones**:

```typescript
// opportunities/data/schemas/opportunity.schema.ts
import { z } from 'zod'
// ✅ IMPORTAR schema completo de ciudad (no tipo)
import { citySchema } from '@/app/features/cities/data/schemas/city.schema'

export const opportunityWithCitySchema = opportunitySchema.extend({
  city: citySchema.pick({
    id: true,
    name: true,
    slug: true,
    image_url: true
  })
})
```

**Ventajas**:
- Type safety completo
- Validación runtime automática
- Refactors seguros (si cambias City, TypeScript te avisa)

---

## 9. Component Structure Examples

### 9.1 CitiesGridPage Component

```typescript
// cities/pages/CitiesGridPage.tsx
// ABOUTME: Main page showing grid of cities with opportunity counts
// ABOUTME: Links to individual city opportunities pages

import { useCitiesQuery } from '../hooks/queries/useCitiesQuery'
import { CityCard } from '../components/CityCard'
import { Loader2 } from 'lucide-react'

export function CitiesGridPage() {
  const { data: cities, isLoading, error } = useCitiesQuery()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center text-red-600">
        Error al cargar ciudades: {error.message}
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Oportunidades por Ciudad</h1>

      {/* Grid responsive con auto-fit */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-6">
        {cities?.map(city => (
          <CityCard key={city.id} city={city} />
        ))}
      </div>
    </div>
  )
}
```

---

### 9.2 CityOpportunitiesPage Component

```typescript
// opportunities/pages/CityOpportunitiesPage.tsx
// ABOUTME: Page showing opportunities for a specific city
// ABOUTME: Includes city header and create button for managers

import { useParams } from 'react-router-dom'
import { useCityBySlugQuery } from '@/app/features/cities/hooks/queries/useCityBySlugQuery'
import { useOpportunitiesByCityQuery } from '../hooks/queries/useOpportunitiesByCityQuery'
import { useCityPermissions } from '@/app/features/cities/hooks/useCityPermissions'
import { CityHeader } from '@/app/features/cities/components/CityHeader'
import { OpportunityCard } from '../components/OpportunityCard'
import { CreateOpportunityDialog } from '../components/CreateOpportunityDialog'
import { Button } from '@/components/ui/button'
import { Plus, Loader2 } from 'lucide-react'
import { useState } from 'react'

export function CityOpportunitiesPage() {
  const { citySlug } = useParams<{ citySlug: string }>()
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  // Fetch city data
  const {
    data: city,
    isLoading: isCityLoading,
    error: cityError
  } = useCityBySlugQuery(citySlug!)

  // Fetch opportunities for this city
  const {
    data: opportunitiesData,
    isLoading: isOpportunitiesLoading
  } = useOpportunitiesByCityQuery(
    city?.id!,
    {},
    { enabled: !!city?.id }
  )

  // Check permissions
  const { canManageCity } = useCityPermissions(city?.id)

  if (isCityLoading) {
    return <div className="flex justify-center py-12">
      <Loader2 className="w-8 h-8 animate-spin" />
    </div>
  }

  if (cityError || !city) {
    return <div className="text-center py-12 text-red-600">
      Ciudad no encontrada
    </div>
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* City Header */}
      <CityHeader city={city} />

      {/* Create Button (solo para gestores) */}
      <div className="flex justify-between items-center mb-6 mt-8">
        <h2 className="text-2xl font-semibold">Oportunidades Activas</h2>
        {canManageCity && (
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Crear Oportunidad
          </Button>
        )}
      </div>

      {/* Opportunities List */}
      {isOpportunitiesLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {opportunitiesData?.opportunities.map(opportunity => (
            <OpportunityCard
              key={opportunity.id}
              opportunity={opportunity}
            />
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <CreateOpportunityDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        defaultCityId={city.id}
      />
    </div>
  )
}
```

---

### 9.3 CreateOpportunityDialog - Integración con Ciudades

```typescript
// opportunities/components/CreateOpportunityDialog.tsx [MODIFICAR]
// ABOUTME: Dialog for creating new opportunities with city selection
// ABOUTME: Shows only cities user can manage

import { useMyCitiesQuery } from '@/app/features/cities/hooks/queries/useMyCitiesQuery'
import { useCreateOpportunityMutation } from '../hooks/mutations/useCreateOpportunityMutation'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem } from '@/components/ui/select'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createOpportunityRequestSchema } from '../data/schemas/opportunity.schema'

interface CreateOpportunityDialogProps {
  isOpen: boolean
  onClose: () => void
  defaultCityId?: number // Pre-seleccionar ciudad si viene de CityOpportunitiesPage
}

export function CreateOpportunityDialog({
  isOpen,
  onClose,
  defaultCityId
}: CreateOpportunityDialogProps) {

  const { data: managedCities, isCityManager } = useMyCitiesQuery()
  const { action: createOpportunity, isLoading, isSuccess } = useCreateOpportunityMutation()

  const form = useForm({
    resolver: zodResolver(createOpportunityRequestSchema),
    defaultValues: {
      city_id: defaultCityId || managedCities[0]?.id
    }
  })

  // Si no es city manager, no debería poder abrir el dialog
  if (!isCityManager) {
    return null
  }

  const handleSubmit = form.handleSubmit((data) => {
    createOpportunity(data, {
      onSuccess: () => {
        form.reset()
        onClose()
      }
    })
  })

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          {/* Campo de selección de ciudad */}
          <Select
            value={form.watch('city_id')?.toString()}
            onValueChange={(value) => form.setValue('city_id', parseInt(value))}
          >
            <SelectContent>
              {managedCities.map(city => (
                <SelectItem key={city.id} value={city.id.toString()}>
                  {city.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Resto de campos... */}

          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Creando...' : 'Crear Oportunidad'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
```

---

## 10. Testing Strategy

### 10.1 Schemas Tests

```typescript
// cities/data/schemas/city.schema.test.ts
import { describe, it, expect } from 'vitest'
import { citySchema, citySlugSchema } from './city.schema'

describe('citySlugSchema', () => {
  it('should accept valid slug', () => {
    expect(citySlugSchema.parse('cordoba')).toBe('cordoba')
    expect(citySlugSchema.parse('rivera-sacra')).toBe('rivera-sacra')
  })

  it('should reject invalid slug', () => {
    expect(() => citySlugSchema.parse('Córdoba')).toThrow() // uppercase
    expect(() => citySlugSchema.parse('córdoba')).toThrow() // accents
    expect(() => citySlugSchema.parse('río tinto')).toThrow() // spaces
  })
})

describe('citySchema', () => {
  it('should parse valid city', () => {
    const valid = {
      id: 1,
      name: 'Córdoba',
      slug: 'cordoba',
      image_url: 'https://images.unsplash.com/photo-123',
      description: 'Ciudad histórica',
      active: true,
      display_order: 0,
      created_at: '2025-01-01',
      updated_at: '2025-01-01'
    }
    expect(citySchema.parse(valid)).toEqual(valid)
  })

  it('should reject invalid image_url', () => {
    const invalid = { ...validCity, image_url: 'not-a-url' }
    expect(() => citySchema.parse(invalid)).toThrow('Debe ser una URL válida')
  })
})
```

---

### 10.2 Service Tests

```typescript
// cities/data/services/city.service.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { cityService } from './city.service'
import { axiosInstance } from '@/lib/axios'

vi.mock('@/lib/axios')

describe('cityService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getCities', () => {
    it('should fetch and parse cities', async () => {
      const mockResponse = {
        data: {
          cities: [
            { id: 1, name: 'Córdoba', slug: 'cordoba', /* ... */ }
          ]
        }
      }
      vi.mocked(axiosInstance.get).mockResolvedValue(mockResponse)

      const result = await cityService.getCities()

      expect(axiosInstance.get).toHaveBeenCalledWith('/cities')
      expect(result.cities).toHaveLength(1)
      expect(result.cities[0].name).toBe('Córdoba')
    })
  })

  describe('canManageCity', () => {
    it('should return true if user can manage', async () => {
      vi.mocked(axiosInstance.get).mockResolvedValue({
        data: { canManage: true }
      })

      const result = await cityService.canManageCity(1)

      expect(result).toBe(true)
      expect(axiosInstance.get).toHaveBeenCalledWith('/cities/1/can-manage')
    })
  })
})
```

---

### 10.3 Hook Tests

```typescript
// cities/hooks/queries/useCitiesQuery.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useCitiesQuery } from './useCitiesQuery'
import { cityService } from '../../data/services/city.service'

vi.mock('../../data/services/city.service')

describe('useCitiesQuery', () => {
  const wrapper = ({ children }) => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false }
      }
    })
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    )
  }

  it('should fetch cities successfully', async () => {
    const mockCities = [
      { id: 1, name: 'Córdoba', slug: 'cordoba', /* ... */ }
    ]
    vi.mocked(cityService.getCities).mockResolvedValue({ cities: mockCities })

    const { result } = renderHook(() => useCitiesQuery(), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual(mockCities)
    expect(cityService.getCities).toHaveBeenCalledOnce()
  })

  it('should handle errors', async () => {
    vi.mocked(cityService.getCities).mockRejectedValue(
      new Error('Network error')
    )

    const { result } = renderHook(() => useCitiesQuery(), { wrapper })

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(result.current.error?.message).toBe('Network error')
  })
})
```

---

## 11. Migration Path & Considerations

### 11.1 Orden de Implementación

**Recomendación de fases**:

1. **Fase 1: Backend + DB** (Hacer primero)
   - Crear tabla `cities`
   - Crear tabla `city_managers` (many-to-many)
   - Migración: eliminar oportunidades existentes
   - Implementar use cases de cities
   - Implementar endpoints API

2. **Fase 2: Frontend Data Layer**
   - Crear feature `cities/` (schemas, services)
   - Modificar `opportunities/` schemas (añadir city_id)
   - Crear query hooks de cities
   - Modificar query hooks de opportunities

3. **Fase 3: Frontend UI**
   - Crear `CitiesGridPage`
   - Crear `CityCard` component
   - Modificar `CityOpportunitiesPage`
   - Modificar `CreateOpportunityDialog`

4. **Fase 4: Permissions & Integration**
   - Implementar `useCityPermissions` hook
   - Implementar `useOpportunityPermissions` hook
   - Integrar con auth context
   - Testing end-to-end

---

### 11.2 Datos Iniciales (Seed)

**Script para popular ciudades**:

```sql
-- migrations/seed_cities.sql
INSERT INTO cities (name, slug, image_url, description, active, display_order) VALUES
('Córdoba', 'cordoba', 'https://images.unsplash.com/photo-cordoba-xyz', 'Ciudad histórica de Andalucía', true, 1),
('Tenerife', 'tenerife', 'https://images.unsplash.com/photo-tenerife-xyz', 'Isla canaria con gran actividad emprendedora', true, 2),
('Quinto', 'quinto', 'https://images.unsplash.com/photo-quinto-xyz', 'Municipio de Zaragoza', true, 3),
('Denia', 'denia', 'https://images.unsplash.com/photo-denia-xyz', 'Ciudad costera de Alicante', true, 4),
('Ribeira Sacra', 'ribeira-sacra', 'https://images.unsplash.com/photo-ribeira-xyz', 'Comarca de Galicia', true, 5),
('Mondoñedo', 'mondonedo', 'https://images.unsplash.com/photo-mondonedo-xyz', 'Ciudad episcopal de Lugo', true, 6);
```

**Obtener imágenes de Unsplash**:
```
https://unsplash.com/s/photos/cordoba-spain
https://unsplash.com/s/photos/tenerife
https://unsplash.com/s/photos/denia-spain
```

---

### 11.3 Breaking Changes

**Cambios que rompen compatibilidad**:

❌ **`location: string` deprecado** - Eliminado en formularios
✅ **`city_id: number` requerido** - Nuevo campo obligatorio
❌ **Oportunidades sin ciudad** - No permitidas en nueva versión

**Estrategia de migración**:
- Eliminar oportunidades existentes (confirmado por Iban)
- Comenzar limpio con sistema de ciudades
- No necesitas migración de datos

---

## 12. Performance Optimizations

### 12.1 Image Loading

**Usar lazy loading para imágenes de ciudades**:

```typescript
// cities/components/CityCard.tsx
<img
  src={city.image_url}
  alt={city.name}
  loading="lazy" // ✅ Lazy load
  className="w-full h-48 object-cover"
/>
```

---

### 12.2 Grid Virtualization

**Si hay muchas ciudades (>50), considerar virtualization**:

```bash
yarn add @tanstack/react-virtual
```

```typescript
import { useVirtualizer } from '@tanstack/react-virtual'

// Para lista de oportunidades larga
const virtualizer = useVirtualizer({
  count: opportunities.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 200
})
```

**Nota**: No implementar ahora (solo 6 ciudades), pero tener en cuenta para el futuro.

---

### 12.3 Code Splitting

**Lazy load de páginas**:

```typescript
// App.tsx
import { lazy, Suspense } from 'react'

const CitiesGridPage = lazy(() => import('./app/features/cities/pages/CitiesGridPage'))
const CityOpportunitiesPage = lazy(() => import('./app/features/opportunities/pages/CityOpportunitiesPage'))

// En routes
<Route
  path="/opportunities"
  element={
    <Suspense fallback={<Loading />}>
      <CitiesGridPage />
    </Suspense>
  }
/>
```

---

## 13. Accessibility Considerations

### 13.1 Keyboard Navigation

```typescript
// cities/components/CityCard.tsx
<Link
  to={`/opportunities/${city.slug}`}
  className="focus:ring-2 focus:ring-primary focus:outline-none"
  aria-label={`Ver oportunidades en ${city.name}`}
>
  {/* Card content */}
</Link>
```

---

### 13.2 Screen Readers

```typescript
// CityOpportunitiesPage - Anunciar loading states
{isLoading && (
  <div role="status" aria-live="polite">
    <Loader2 className="animate-spin" />
    <span className="sr-only">Cargando oportunidades...</span>
  </div>
)}

// Anunciar success tras crear oportunidad
{isSuccess && (
  <div role="alert" aria-live="assertive" className="sr-only">
    Oportunidad creada exitosamente
  </div>
)}
```

---

## 14. Error Handling

### 14.1 Query Errors

```typescript
// En CitiesGridPage
if (error) {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h2 className="text-red-800 font-semibold mb-2">
          Error al cargar ciudades
        </h2>
        <p className="text-red-600 mb-4">{error.message}</p>
        <Button onClick={() => refetch()}>
          Reintentar
        </Button>
      </div>
    </div>
  )
}
```

---

### 14.2 Mutation Errors

```typescript
// En CreateOpportunityDialog
const { action: createOpportunity, error, isLoading } = useCreateOpportunityMutation()

// Mostrar error en form
{error && (
  <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-700">
    {error.message}
  </div>
)}

// Manejar errores específicos
const handleSubmit = (data) => {
  createOpportunity(data, {
    onError: (error) => {
      if (error.message.includes('No tienes permisos')) {
        toast.error('No puedes crear oportunidades en esta ciudad')
      } else {
        toast.error('Error al crear oportunidad')
      }
    }
  })
}
```

---

## 15. Important Notes for Implementation

### 15.1 Conocimiento Desactualizado que Pueden Tener

**Avisos importantes para otros developers**:

1. **React Query v5 Syntax**:
   ```typescript
   // ❌ ANTIGUO (v4)
   isLoading: mutation.isLoading

   // ✅ NUEVO (v5)
   isLoading: mutation.isPending
   ```

2. **Zod Transform**:
   ```typescript
   // IDs vienen como number de DB pero los usamos como string en frontend
   id: z.union([z.string(), z.number()]).transform(val => String(val))
   ```

3. **Query Keys con Objetos**:
   ```typescript
   // ✅ CORRECTO - React Query compara por deep equality
   queryKey: ['opportunities', 'by-city', cityId, { type: 'empleo' }]

   // ❌ INCORRECTO - Nueva instancia en cada render
   queryKey: ['opportunities', filters] // filters es nuevo objeto cada vez

   // ✅ SOLUCIÓN
   const queryKey = useMemo(() => ['opportunities', filters], [filters])
   ```

4. **Invalidación de Queries**:
   ```typescript
   // Invalidar TODO lo que empiece con ['opportunities']
   queryClient.invalidateQueries({ queryKey: ['opportunities'] })

   // Invalidar SOLO queries exactas
   queryClient.invalidateQueries({
     queryKey: ['opportunities', 'by-city', cityId],
     exact: true
   })
   ```

---

### 15.2 Colors from index.css

**Usar variables CSS definidas**:

```typescript
// Colores disponibles en @/index.css
--primary: #22c55e        // Verde principal
--primary-foreground: #fff

// Uso en Tailwind
className="bg-primary text-primary-foreground"
className="border-primary hover:bg-primary/10"
```

---

### 15.3 shadcn/ui Components Available

**Componentes ya instalados** en el proyecto:

- `Button`
- `Dialog`, `DialogContent`, `DialogHeader`
- `Select`, `SelectContent`, `SelectItem`
- `Card`, `CardHeader`, `CardContent`
- `Badge`
- `Input`, `Textarea`
- `Form` (react-hook-form integration)

**NO instalar nuevos componentes** sin consultar.

---

## 16. Summary & Next Steps

### Feature Structure Decision
✅ **Crear feature separada `cities/`** para mantener separación de concerns
✅ **Refactor `opportunities/`** para integrar city_id

### Key Implementation Points

1. **Data Layer**:
   - `city.schema.ts` con validación estricta de slugs
   - `city.service.ts` con métodos para permisos
   - Actualizar `opportunity.schema.ts` con `city_id` requerido

2. **Query Hooks**:
   - `useCitiesQuery` - staleTime 5min, no refetch on focus
   - `useCityBySlugQuery` - incluir slug en query key
   - `useIsCityManagerQuery` - SÍ refetch on focus (permisos críticos)
   - `useOpportunitiesByCityQuery` - query key granular para invalidación

3. **Business Hooks**:
   - `useCityPermissions` - Centralizar lógica de permisos
   - `useOpportunityPermissions` - Validar edit/delete

4. **Components**:
   - `CitiesGridPage` - Grid responsive con auto-fit
   - `CityOpportunitiesPage` - Header + lista + create button condicional
   - `CreateOpportunityDialog` - Dropdown de ciudades gestionadas

5. **Query Configuration**:
   - Query keys jerárquicas para invalidación granular
   - StaleTime según tipo de dato (estático vs dinámico)
   - Prefetching en hover para navegación fluida

### Testing Requirements
- ✅ Tests de schemas (validación Zod)
- ✅ Tests de services (mocking axios)
- ✅ Tests de hooks (renderHook + waitFor)
- ✅ Tests de permissions logic

---

## Final Checklist

Antes de empezar implementación, confirmar:

- [ ] Backend tiene tabla `cities` y `city_managers`
- [ ] Endpoints API `/api/cities/*` funcionando
- [ ] Rol `gestor_ciudad` creado en DB
- [ ] Imágenes de Unsplash seleccionadas
- [ ] Oportunidades existentes eliminadas (confirmado por Iban)
- [ ] Revisar este documento completo
- [ ] Entender arquitectura de features existente
- [ ] Conocer sintaxis React Query v5

---

**Documento creado**: 2025-11-13
**Para preguntas**: Consultar con Iban antes de implementar desviaciones de este plan
