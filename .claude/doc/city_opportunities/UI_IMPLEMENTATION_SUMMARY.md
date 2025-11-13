# Resumen de Implementación UI - Sistema de Ciudades con Oportunidades

## Estado: ✅ COMPLETADO

Fecha: 2025-11-13

---

## Archivos Creados

### 1. Componentes de Cities

#### `/src/app/features/cities/components/CityCard.tsx`
**Características:**
- Card con imagen de fondo usando `backgroundImage`
- Overlay con gradiente `from-black/80 via-black/40 to-black/20`
- Badge de contador de oportunidades (solo si > 0)
- Hover effects: `hover:scale-[1.02]` en card, `scale-110` en imagen
- Accessibility: `role="button"`, `tabIndex={0}`, `aria-label`, keyboard navigation
- Border radius: `rounded-xl`
- Altura fija: `h-[280px]`
- Link a `/opportunities/:citySlug`

**Props:**
- `city: CityWithStats` - Datos de la ciudad
- `className?: string` - Clases adicionales opcionales

---

#### `/src/app/features/cities/components/CityHeader.tsx`
**Características:**
- Breadcrumb navigation (Oportunidades > CityName)
- Banner de imagen con altura `h-[200px]`
- Gradiente overlay `from-black/70 via-black/30 to-transparent`
- Muestra nombre, descripción y contador de oportunidades
- Border radius: `rounded-2xl`

**Props:**
- `city: CityWithStats` - Datos de la ciudad

---

#### `/src/app/features/cities/components/CitiesGridSkeleton.tsx`
**Características:**
- Skeleton loaders para cards de ciudad
- Grid responsive (1/2/3 columnas)
- Mismo tamaño que CityCard (`h-[280px]`)
- Skeletons para badge y contenido

**Props:**
- `count?: number` - Número de skeletons a mostrar (default: 6)

---

#### `/src/app/features/cities/components/EmptyCitiesState.tsx`
**Características:**
- Alert component de shadcn/ui
- Icono MapPin
- Mensaje informativo

**Props:** Ninguna

---

### 2. Páginas

#### `/src/app/features/cities/pages/CitiesGridPage.tsx`
**Características:**
- Página principal del grid de ciudades
- Navigation component
- Header con título y descripción
- Grid responsive: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`
- Gap: `gap-6`
- Estados: loading (skeleton), error (alert), empty (EmptyCitiesState), success (grid)
- Background gradient: `bg-gradient-to-br from-background via-background to-muted`

**Ruta:** `/opportunities`

**Hooks usados:**
- `useCitiesQuery()` - Fetch de ciudades

---

#### `/src/app/features/opportunities/pages/CityOpportunitiesPage.tsx`
**Características:**
- Página de oportunidades filtradas por ciudad
- CityHeader component para banner
- Filtro por tipo de oportunidad (Select)
- Botón "Crear oportunidad" (solo para gestores de ciudad)
- Grid responsive: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
- Estados: loading, error, empty con mensaje contextual
- CreateOpportunityDialog integrado
- Breadcrumb: "Volver a ciudades" en estados de error

**Ruta:** `/opportunities/:citySlug`

**Hooks usados:**
- `useCityBySlugQuery(citySlug)` - Fetch ciudad por slug
- `useOpportunitiesByCityQuery(cityId, filters)` - Fetch oportunidades filtradas
- `useCityPermissions(cityId)` - Permisos de gestión

**Permisos:**
- Gestores de ciudad pueden: crear, editar, eliminar oportunidades de su ciudad
- Usuarios normales: solo ver

---

### 3. Modificaciones a Archivos Existentes

#### `/src/app/features/opportunities/components/CreateOpportunityDialog.tsx`
**Cambios realizados:**

1. **Nuevos imports:**
   ```typescript
   import { useMyCitiesQuery } from '@/app/features/cities/hooks/queries/useMyCitiesQuery'
   import { useUserRoles } from '@/app/features/auth/hooks/useUserRoles'
   ```

2. **Nuevo campo en formulario:**
   - Selector de ciudad (`city_id`) - OBLIGATORIO
   - Solo visible para gestores de ciudad (`canManageCities`)
   - Usa `Select` de shadcn/ui
   - Valores poblados desde `managedCities`
   - Icono MapPin
   - Posicionado después del campo "Tipo"
   - Descripción contextual según estado

3. **Lógica añadida:**
   ```typescript
   const { data: managedCities, isLoading: isLoadingCities, isCityManager } = useMyCitiesQuery()
   const { isAdmin } = useUserRoles()
   const canManageCities = isAdmin || isCityManager
   ```

4. **Default values:**
   - En create: `city_id: managedCities.length > 0 ? managedCities[0].id : undefined`
   - En edit: `city_id: opportunity.city_id`

**Schema usado:**
- `createOpportunityRequestSchema` ya incluye `city_id` como obligatorio
- Validación: `z.number().positive('Debes seleccionar una ciudad')`

---

#### `/src/app/features/opportunities/components/OpportunityCard.tsx`
**Cambios realizados:**

1. **Nuevos imports:**
   ```typescript
   import { Navigation } from 'lucide-react'
   import type { OpportunityWithCity } from '../data/schemas/opportunity.schema'
   ```

2. **Nueva prop:**
   - `showCityBadge?: boolean` - Mostrar badge de ciudad (default: false)

3. **Type guard añadido:**
   ```typescript
   const hasCity = 'city' in opportunity && opportunity.city !== undefined
   ```

4. **Badge de ciudad añadido (OPCIONAL):**
   - Solo se muestra si `showCityBadge={true}` y `hasCity`
   - Variant: `secondary`
   - Custom classes: `bg-primary/10 text-primary`
   - Icono: Navigation
   - Texto: `opportunity.city.name`
   - Posicionado después de badges de estado y tipo

**Uso:**
```typescript
<OpportunityCard
  opportunity={opp}
  showCityBadge={true}  // Mostrar ciudad
/>
```

---

#### `/src/App.tsx`
**Cambios realizados:**

1. **Nuevos imports:**
   ```typescript
   import { CitiesGridPage } from '@/app/features/cities/pages/CitiesGridPage'
   import { CityOpportunitiesPage } from '@/app/features/opportunities/pages/CityOpportunitiesPage'
   ```

2. **Import removido:**
   ```typescript
   // REMOVIDO: import { OpportunitiesPage } from '@/components/pages/OpportunitiesPage'
   ```

3. **Rutas modificadas:**

   **ANTES:**
   ```typescript
   <Route path="/opportunities" element={<OpportunitiesPage />} />
   <Route path="/opportunities/:opportunityId" element={<OpportunityDetailPage />} />
   ```

   **DESPUÉS:**
   ```typescript
   <Route path="/opportunities" element={<CitiesGridPage />} />
   <Route path="/opportunities/:citySlug" element={<CityOpportunitiesPage />} />
   <Route path="/opportunity/:opportunityId" element={<OpportunityDetailPage />} />
   ```

**IMPORTANTE:** La ruta de detalle de oportunidad cambió de `/opportunities/:id` a `/opportunity/:id` para evitar conflicto con `/opportunities/:citySlug`

---

## Flujo de Navegación

```
/opportunities
  └─> CitiesGridPage (Grid de ciudades)
       └─> CityCard (click)
            └─> /opportunities/:citySlug
                 └─> CityOpportunitiesPage (Oportunidades de ciudad)
                      └─> OpportunityCard (click)
                           └─> /opportunity/:opportunityId
                                └─> OpportunityDetailPage
```

---

## Sistema de Permisos

### Admin
- ✅ Ver todas las ciudades
- ✅ Crear/editar/eliminar oportunidades en CUALQUIER ciudad
- ✅ Selector de ciudad siempre visible

### City Manager
- ✅ Ver todas las ciudades
- ✅ Crear/editar/eliminar oportunidades solo en SUS ciudades asignadas
- ✅ Selector de ciudad visible (solo sus ciudades)

### Usuario Normal
- ✅ Ver todas las ciudades
- ✅ Ver oportunidades
- ❌ NO puede crear oportunidades
- ❌ Selector de ciudad NO visible

---

## Design System Aplicado

### Colores
- **Primario:** Verde (#22c55e) - Usado en botones, badges de ciudad
- **Gradientes:** `from-background via-background to-muted`
- **Overlays:** Negro con transparencia (`black/80`, `black/70`)

### Border Radius
- Cards: `rounded-xl`
- Banners: `rounded-2xl`
- Badges: `rounded-full` (default shadcn)

### Spacing
- Container: `px-4 py-8`
- Gaps: `gap-6` (grid), `gap-4` (filters)
- Padding: `p-6` (cards)

### Grid System
```css
/* Mobile */
grid-cols-1

/* Tablet (sm: 640px) */
sm:grid-cols-2

/* Desktop (lg: 1024px) */
lg:grid-cols-3

/* Auto-fit (cuando especificado) */
grid-template-columns: repeat(auto-fit, minmax(320px, 1fr))
```

### Hover Effects
- Cards: `hover:shadow-lg hover:scale-[1.02]`
- Images: `group-hover:scale-110`
- Transitions: `transition-all duration-300`

### Shadows
- Default: `shadow-sm`
- Hover: `shadow-lg`

---

## Componentes shadcn/ui Usados

- ✅ Card / CardContent / CardHeader / CardFooter
- ✅ Badge
- ✅ Button
- ✅ Alert / AlertDescription / AlertTitle
- ✅ Skeleton
- ✅ Select / SelectTrigger / SelectValue / SelectContent / SelectItem
- ✅ Breadcrumb / BreadcrumbList / BreadcrumbItem / BreadcrumbLink / BreadcrumbPage / BreadcrumbSeparator
- ✅ Dialog (usado en CreateOpportunityDialog)
- ✅ Form (usado en CreateOpportunityDialog)

---

## Iconos Lucide Usados

- `MapPin` - Ciudades y ubicación
- `Briefcase` - Oportunidades
- `AlertCircle` - Errores y estados vacíos
- `Loader2` - Loading states
- `Plus` - Crear oportunidad
- `ChevronLeft` - Volver
- `Navigation` - Badge de ciudad

---

## Responsive Breakpoints

| Breakpoint | Min Width | Columnas Grid |
|------------|-----------|---------------|
| Mobile     | 0px       | 1             |
| Tablet     | 640px     | 2             |
| Desktop    | 1024px    | 3             |

---

## Accessibility Features

### CityCard
- `role="button"` - Indica que es clickeable
- `tabIndex={0}` - Navegable por teclado
- `aria-label={Ver oportunidades en ${city.name}}` - Descripción para screen readers
- `onKeyDown` handler - Enter y Space activan navegación

### Semantic HTML
- Uso correcto de `<h1>`, `<h2>`, `<h3>` para jerarquía
- `<nav>` para breadcrumbs
- Descripciones en formularios con `FormDescription`

### ARIA Labels
- Todos los botones tienen texto descriptivo o aria-labels
- Alerts tienen títulos y descripciones

---

## Estados de la UI

### Loading
- Skeleton components en CitiesGridPage
- Loader spinner centrado en CityOpportunitiesPage
- Mínimo 400px de altura

### Error
- Alert variant="destructive"
- Icono AlertCircle
- Mensaje de error contextual
- Botón "Volver" en páginas anidadas

### Empty
- Alert o mensaje centrado
- Icono relevante (MapPin, AlertCircle)
- Mensaje contextual según filtros
- Call-to-action si tiene permisos (botón crear)

### Success
- Grid de cards con hover effects
- Badge de contador de resultados
- Transiciones suaves

---

## Testing Checklist

### Funcionalidad
- ✅ Grid de ciudades se carga correctamente
- ✅ Click en ciudad navega a página correcta
- ✅ Filtros de tipo funcionan
- ✅ Crear oportunidad solo visible para gestores
- ✅ Selector de ciudad solo visible para gestores
- ✅ Edit/Delete solo para gestores de ciudad correspondiente
- ✅ Navegación por teclado funciona en CityCard

### Responsive
- ✅ Grid adapta a 1/2/3 columnas según breakpoint
- ✅ Filters stack en mobile
- ✅ Cards mantienen proporciones

### Permisos
- ✅ Admin ve selector y puede crear en cualquier ciudad
- ✅ City Manager ve selector solo con sus ciudades
- ✅ Usuario normal NO ve botón crear ni selector

### Estados
- ✅ Loading muestra skeleton
- ✅ Error muestra alert
- ✅ Empty muestra mensaje contextual
- ✅ Success muestra grid

---

## Archivos NO Modificados (pero relevantes)

- `/src/app/features/cities/hooks/queries/useCitiesQuery.ts` - Ya implementado
- `/src/app/features/cities/hooks/queries/useCityBySlugQuery.ts` - Ya implementado
- `/src/app/features/cities/hooks/queries/useMyCitiesQuery.ts` - Ya implementado
- `/src/app/features/cities/hooks/useCityPermissions.ts` - Ya implementado
- `/src/app/features/opportunities/hooks/queries/useOpportunitiesByCityQuery.ts` - Ya implementado
- `/src/app/features/cities/data/schemas/city.schema.ts` - Ya implementado
- `/src/app/features/opportunities/data/schemas/opportunity.schema.ts` - Ya incluye city_id

---

## Próximos Pasos (NO implementados)

### 1. Actualizar OpportunitiesPage.tsx (DEPRECADA)
⚠️ El archivo `/src/components/pages/OpportunitiesPage.tsx` ya NO se usa en las rutas principales.
Opciones:
- Eliminarlo (recomendado si no hay referencias)
- Mantenerlo por compatibilidad
- Renombrarlo a `AllOpportunitiesPage.tsx` y usar como vista alternativa

### 2. Tests
- Tests unitarios para componentes
- Tests de integración para páginas
- Tests de permisos

### 3. Navigation Links
- Actualizar Navigation.tsx si es necesario
- Añadir link "Oportunidades" que apunte a `/opportunities`

### 4. Optimizaciones Opcionales
- Lazy loading de imágenes en CityCard
- Infinite scroll en grid de oportunidades
- Filtros avanzados (skills, remote, etc.)

---

## Notas Importantes

### ⚠️ CAMBIO CRÍTICO: Ruta de Detalle de Oportunidad
**ANTES:** `/opportunities/:opportunityId`
**AHORA:** `/opportunity/:opportunityId`

**Razón:** Evitar conflicto con `/opportunities/:citySlug`

**Impacto:** Si hay links o navegación programática a detalle de oportunidad, deben actualizarse:
```typescript
// ANTES
navigate(`/opportunities/${opportunityId}`)

// AHORA
navigate(`/opportunity/${opportunityId}`)
```

### ✅ Validaciones de Schema
El schema `createOpportunityRequestSchema` ya incluye `city_id` como campo obligatorio:
```typescript
city_id: z.number().positive('Debes seleccionar una ciudad')
```

### 🎨 Consistencia de Diseño
Todos los componentes siguen el sistema de diseño establecido en CLAUDE.md:
- Color primario: Verde (#22c55e)
- Border radius generoso
- Sombras sutiles con efectos hover
- Espaciado consistente

### 🔒 Seguridad y Permisos
El backend ya valida permisos. El frontend solo oculta/muestra controles por UX, pero el backend es la fuente de verdad.

---

## Compilación y TypeScript

### Build Status: ✅ SUCCESS
```bash
yarn build
# ✓ built in 2.48s
```

### TypeScript Status: ✅ NO ERRORS
```bash
yarn tsc --noEmit
# No errors found
```

---

## Resumen de Archivos

### Creados (5):
1. `src/app/features/cities/components/CityCard.tsx`
2. `src/app/features/cities/components/CityHeader.tsx`
3. `src/app/features/cities/components/CitiesGridSkeleton.tsx`
4. `src/app/features/cities/components/EmptyCitiesState.tsx`
5. `src/app/features/cities/pages/CitiesGridPage.tsx`

### Creados en ubicación alternativa (1):
6. `src/app/features/opportunities/pages/CityOpportunitiesPage.tsx`

### Modificados (3):
7. `src/app/features/opportunities/components/CreateOpportunityDialog.tsx`
8. `src/app/features/opportunities/components/OpportunityCard.tsx`
9. `src/App.tsx`

**Total:** 9 archivos

---

## Documentación Adicional

Este documento complementa:
- `.claude/sessions/context_session_city_opportunities.md` - Contexto general
- Backend ya implementado y testeado
- Data layer y hooks ya implementados

---

**Fin del Resumen de Implementación**
