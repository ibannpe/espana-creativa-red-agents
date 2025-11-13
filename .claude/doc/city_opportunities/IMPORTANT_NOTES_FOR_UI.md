# Notas Importantes para Implementación UI

**LEER ANTES DE IMPLEMENTAR COMPONENTES Y PÁGINAS**

---

## 1. Hooks Disponibles - Cómo Usarlos

### Cities Feature

#### `useCitiesQuery()`
```typescript
import { useCitiesQuery } from '@/app/features/cities/hooks/queries/useCitiesQuery'

const { data: cities, isLoading, error } = useCitiesQuery()
// cities: CityWithStats[] | undefined
// CityWithStats incluye: opportunities_count, active_opportunities_count
```

#### `useCityBySlugQuery(slug)`
```typescript
import { useCityBySlugQuery } from '@/app/features/cities/hooks/queries/useCityBySlugQuery'

const { citySlug } = useParams()
const { data: city, isLoading, error } = useCityBySlugQuery(citySlug!)
// city: CityWithStats | undefined
```

#### `useIsCityManagerQuery()`
```typescript
import { useIsCityManagerQuery } from '@/app/features/cities/hooks/queries/useIsCityManagerQuery'

const { data: cityManagerInfo, isLoading } = useIsCityManagerQuery()
// cityManagerInfo: { isCityManager: boolean, managedCities: ManagedCity[] }
```

#### `useMyCitiesQuery()`
```typescript
import { useMyCitiesQuery } from '@/app/features/cities/hooks/queries/useMyCitiesQuery'

const { data: managedCities, isCityManager, isLoading } = useMyCitiesQuery()
// managedCities: ManagedCity[] - Array directo, no necesitas .data
// isCityManager: boolean
```

#### `useCityPermissions(cityId?)`
```typescript
import { useCityPermissions } from '@/app/features/cities/hooks/useCityPermissions'

// Sin cityId - Verificar si puede gestionar alguna ciudad
const { canManageAnyCity, managedCities } = useCityPermissions()

// Con cityId - Verificar si puede gestionar ciudad específica
const { canManageCity } = useCityPermissions(city.id)

if (canManageCity) {
  // Mostrar botón "Crear Oportunidad"
}
```

### Opportunities Feature

#### `useOpportunitiesByCityQuery(cityId, filters?, options?)`
```typescript
import { useOpportunitiesByCityQuery } from '@/app/features/opportunities/hooks/queries/useOpportunitiesByCityQuery'

const { data, isLoading } = useOpportunitiesByCityQuery(
  city.id,
  { type: 'empleo', status: 'abierta' }, // filters opcionales
  { enabled: !!city.id } // opciones React Query
)
// data: { opportunities: OpportunityWithCreator[], total: number }
```

#### `useOpportunityPermissions(opportunity)`
```typescript
import { useOpportunityPermissions } from '@/app/features/opportunities/hooks/useOpportunityPermissions'

const { canEdit, canDelete } = useOpportunityPermissions(opportunity)

{canEdit && <EditButton />}
{canDelete && <DeleteButton />}
```

---

## 2. TypeScript Types - Imports Correctos

```typescript
// City types
import type {
  City,
  CityWithStats,
  CityWithManagers
} from '@/app/features/cities/data/schemas/city.schema'

// Opportunity types
import type {
  Opportunity,
  OpportunityWithCreator,
  OpportunityWithCity, // NUEVO - Con info de ciudad
  CreateOpportunityRequest,
  FilterOpportunitiesRequest
} from '@/app/features/opportunities/data/schemas/opportunity.schema'

// City manager types
import type {
  ManagedCity,
  CityManagerInfo
} from '@/app/features/cities/hooks/queries/useIsCityManagerQuery'
```

---

## 3. CreateOpportunityRequest - BREAKING CHANGE

**`city_id` es OBLIGATORIO**

```typescript
// ❌ ANTIGUO - YA NO FUNCIONA
const data: CreateOpportunityRequest = {
  title: 'Mi oportunidad',
  description: 'Descripción...',
  type: 'empleo',
  skills_required: ['React'],
  location: 'Madrid', // DEPRECADO
  remote: false
}

// ✅ NUEVO - OBLIGATORIO city_id
const data: CreateOpportunityRequest = {
  title: 'Mi oportunidad',
  description: 'Descripción...',
  type: 'empleo',
  skills_required: ['React'],
  city_id: 1, // OBLIGATORIO
  remote: false
  // location ya NO se usa
}
```

**En CreateOpportunityDialog**:
```typescript
import { useMyCitiesQuery } from '@/app/features/cities/hooks/queries/useMyCitiesQuery'

const { data: managedCities, isCityManager } = useMyCitiesQuery()

// Mostrar selector SOLO con ciudades que el usuario gestiona
<Select>
  {managedCities.map(city => (
    <SelectItem key={city.id} value={city.id.toString()}>
      {city.name}
    </SelectItem>
  ))}
</Select>

// Si viene de CityOpportunitiesPage, pre-seleccionar
const form = useForm({
  defaultValues: {
    city_id: defaultCityId || managedCities[0]?.id
  }
})
```

---

## 4. Color Primario - IMPORTANTE

**El color primario es VERDE (#22c55e), NO rojo**

```typescript
// ✅ CORRECTO
className="bg-primary text-primary-foreground"
className="border-primary"
className="text-primary"
className="hover:bg-primary/10"

// Variables disponibles en src/index.css
--primary: #22c55e        // Verde principal
--primary-foreground: #fff
```

---

## 5. React Query v5 - Sintaxis Actualizada

```typescript
// ❌ ANTIGUO (v4)
const { isLoading } = useMutation(...)
mutation.isLoading

// ✅ NUEVO (v5)
const { isPending } = useMutation(...)
mutation.isPending

// Usar isPending en lugar de isLoading para mutations
const { action: createOpportunity, isLoading: isPending } = useCreateOpportunityMutation()
```

---

## 6. Estructura de Páginas Recomendada

### CitiesGridPage (`/opportunities`)

```typescript
export function CitiesGridPage() {
  const { data: cities, isLoading, error } = useCitiesQuery()

  if (isLoading) return <LoadingSkeleton />
  if (error) return <ErrorState error={error} />
  if (!cities?.length) return <EmptyState />

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Oportunidades por Ciudad</h1>

      {/* Grid responsive con auto-fit */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-6">
        {cities.map(city => (
          <CityCard key={city.id} city={city} />
        ))}
      </div>
    </div>
  )
}
```

### CityOpportunitiesPage (`/opportunities/:citySlug`)

```typescript
export function CityOpportunitiesPage() {
  const { citySlug } = useParams<{ citySlug: string }>()
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  // Fetch city
  const { data: city, isLoading: isCityLoading } = useCityBySlugQuery(citySlug!)

  // Fetch opportunities for this city
  const { data: opportunitiesData, isLoading: isOpportunitiesLoading } =
    useOpportunitiesByCityQuery(
      city?.id!,
      {},
      { enabled: !!city?.id }
    )

  // Check permissions
  const { canManageCity } = useCityPermissions(city?.id)

  if (isCityLoading) return <LoadingSkeleton />
  if (!city) return <NotFoundState />

  return (
    <div className="container mx-auto px-4 py-8">
      <CityHeader city={city} />

      {/* Create Button - SOLO para gestores */}
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
        <LoadingSkeleton />
      ) : (
        <OpportunitiesList opportunities={opportunitiesData?.opportunities || []} />
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

## 7. CityCard - Especificaciones UI

```typescript
interface CityCardProps {
  city: CityWithStats
}

export function CityCard({ city }: CityCardProps) {
  return (
    <Link
      to={`/opportunities/${city.slug}`}
      className="group relative overflow-hidden rounded-2xl h-[280px] block"
    >
      {/* Imagen de fondo */}
      <img
        src={city.image_url}
        alt={city.name}
        loading="lazy"
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
      />

      {/* Overlay gradiente */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

      {/* Content */}
      <div className="relative h-full flex flex-col justify-end p-6">
        <h3 className="text-2xl font-bold text-white mb-2">
          {city.name}
        </h3>

        {/* Badge de contador */}
        <Badge variant="secondary" className="w-fit">
          {city.active_opportunities_count} oportunidades activas
        </Badge>
      </div>
    </Link>
  )
}
```

**Efectos hover**:
- Imagen: `scale-110` (zoom)
- Card: opcional `transform scale-105`

---

## 8. Loading States - Patrones

```typescript
// Loading Skeleton para grid
export function CitiesGridSkeleton() {
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-[280px] rounded-2xl bg-gray-200 animate-pulse" />
      ))}
    </div>
  )
}

// Loading inline
{isLoading && (
  <div className="flex justify-center py-8">
    <Loader2 className="w-8 h-8 animate-spin text-primary" />
  </div>
)}
```

---

## 9. Empty States - Patrones

```typescript
// Sin ciudades
{!cities?.length && (
  <div className="text-center py-12">
    <p className="text-gray-500 text-lg">
      No hay ciudades disponibles en este momento
    </p>
  </div>
)}

// Sin oportunidades en ciudad
{!opportunities?.length && (
  <div className="text-center py-12">
    <p className="text-gray-500 text-lg mb-4">
      No hay oportunidades activas en {city.name}
    </p>
    {canManageCity && (
      <Button onClick={() => setIsCreateDialogOpen(true)}>
        Crear la primera oportunidad
      </Button>
    )}
  </div>
)}
```

---

## 10. Error Handling - Patrones

```typescript
// Error state
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

// Ciudad no encontrada (404)
if (!city && !isLoading) {
  return (
    <div className="container mx-auto px-4 py-8 text-center">
      <h2 className="text-2xl font-bold mb-4">Ciudad no encontrada</h2>
      <p className="text-gray-600 mb-6">
        La ciudad "{citySlug}" no existe o ha sido desactivada
      </p>
      <Button asChild>
        <Link to="/opportunities">Ver todas las ciudades</Link>
      </Button>
    </div>
  )
}
```

---

## 11. Accesibilidad - Requisitos

```typescript
// Keyboard navigation
<Link
  to={`/opportunities/${city.slug}`}
  className="focus:ring-2 focus:ring-primary focus:outline-none"
  aria-label={`Ver oportunidades en ${city.name}`}
>

// Screen readers
{isLoading && (
  <div role="status" aria-live="polite">
    <Loader2 className="animate-spin" />
    <span className="sr-only">Cargando ciudades...</span>
  </div>
)}

// Success announcements
{isSuccess && (
  <div role="alert" aria-live="assertive" className="sr-only">
    Oportunidad creada exitosamente
  </div>
)}
```

---

## 12. Rutas a Actualizar en App.tsx

```typescript
import { lazy, Suspense } from 'react'

const CitiesGridPage = lazy(() => import('./app/features/cities/pages/CitiesGridPage'))
const CityOpportunitiesPage = lazy(() => import('./app/features/opportunities/pages/CityOpportunitiesPage'))

// En routes
<Route
  path="/opportunities"
  element={
    <ProtectedRoute>
      <Suspense fallback={<LoadingPage />}>
        <CitiesGridPage />
      </Suspense>
    </ProtectedRoute>
  }
/>
<Route
  path="/opportunities/:citySlug"
  element={
    <ProtectedRoute>
      <Suspense fallback={<LoadingPage />}>
        <CityOpportunitiesPage />
      </Suspense>
    </ProtectedRoute>
  }
/>
```

---

## 13. Componentes shadcn/ui Disponibles

Ya instalados en el proyecto:
- `Button`
- `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`
- `Select`, `SelectContent`, `SelectItem`, `SelectTrigger`, `SelectValue`
- `Card`, `CardHeader`, `CardContent`, `CardTitle`
- `Badge`
- `Input`, `Textarea`, `Label`
- `Form` (con react-hook-form)

**NO instalar componentes nuevos sin consultar**

---

## 14. Prefetching Opcional (Performance)

```typescript
import { useQueryClient } from '@tanstack/react-query'
import { opportunityService } from '@/app/features/opportunities/data/services/opportunity.service'

const queryClient = useQueryClient()

// En CityCard - Prefetch oportunidades al hover
const handleMouseEnter = () => {
  queryClient.prefetchQuery({
    queryKey: ['opportunities', 'by-city', city.id],
    queryFn: () => opportunityService.getOpportunitiesByCity(city.id),
    staleTime: 2 * 60 * 1000
  })
}

<Link
  to={`/opportunities/${city.slug}`}
  onMouseEnter={handleMouseEnter}
>
```

---

## 15. Testing - Checklist Mínimo

Antes de considerar implementación completa:

- [ ] Renderiza CitiesGridPage sin errors
- [ ] Click en CityCard navega a CityOpportunitiesPage
- [ ] CityOpportunitiesPage muestra oportunidades de ciudad
- [ ] Botón "Crear Oportunidad" solo visible para gestores
- [ ] CreateOpportunityDialog solo muestra ciudades gestionadas
- [ ] `city_id` se envía en request de crear oportunidad
- [ ] Queries se invalidan correctamente tras crear
- [ ] Loading states funcionan
- [ ] Error states funcionan
- [ ] Empty states funcionan

---

## Recursos de Referencia

- **Plan completo**: `.claude/doc/city_opportunities/frontend.md`
- **Plan UI/UX**: `.claude/doc/city_opportunities/shadcn_ui.md`
- **Status implementación**: `.claude/doc/city_opportunities/frontend_implementation_status.md`
- **CLAUDE.md**: Patrones del proyecto y arquitectura

---

**Última actualización**: 2025-11-13
**Para dudas**: Consultar con Iban antes de desviarse del plan
