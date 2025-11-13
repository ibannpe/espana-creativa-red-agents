# Plan de Implementación UI/UX: Grid de Ciudades con shadcn/ui

**Feature**: City-based Opportunities Grid
**Fecha**: 2025-11-13
**Autor**: shadcn-ui-architect

---

## Índice
1. [Design System y Paleta de Colores](#design-system-y-paleta-de-colores)
2. [Componente CityCard](#componente-citycard)
3. [CitiesGrid Layout](#citiesgrid-layout)
4. [Página CityOpportunitiesPage](#página-cityopportunitiespage)
5. [Gestión de Imágenes](#gestión-de-imágenes)
6. [Estados UI](#estados-ui)
7. [Accesibilidad](#accesibilidad)
8. [Responsive Design](#responsive-design)
9. [Estructura de Archivos](#estructura-de-archivos)

---

## Design System y Paleta de Colores

### Colores Principales
Según `src/index.css`, el proyecto usa **España Creativa brand colors**:

```css
--primary: 0 78% 54%       /* Rojo vibrante principal */
--secondary: 217 91% 60%   /* Azul medio */
--accent: 217 91% 60%      /* Azul como acento */
```

**IMPORTANTE**: NO usar verde (#22c55e) mencionado en CLAUDE.md. La paleta actual es:
- **Rojo vibrante** para acciones principales
- **Azul** para acentos y elementos secundarios
- **Gris sutil** para backgrounds y borders

### Sombras y Efectos
```css
--shadow-brand: 0 4px 14px -2px hsl(0 78% 54% / 0.15)
--shadow-accent: 0 4px 14px -2px hsl(217 91% 60% / 0.15)
--shadow-elegant: 0 10px 30px -10px hsl(220 8.9% 16.1% / 0.08)
```

### Border Radius
```css
--radius: 1rem /* Equivalente a rounded-xl en Tailwind */
```

---

## Componente CityCard

### Decisión de Diseño: Imagen de Fondo con Overlay

**Recomendación**: Usar imagen de fondo con overlay gradiente y contenido sobre ella. Esta aproximación:
- ✅ Mayor impacto visual
- ✅ Mejor aprovechamiento del espacio
- ✅ Consistente con diseño moderno de cards
- ✅ Permite hover effects atractivos

### Estructura Propuesta

```tsx
// src/app/features/opportunities/components/CityCard.tsx
// ABOUTME: City card component displaying city with opportunity count
// ABOUTME: Clickable card that navigates to city opportunities page

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MapPin, Briefcase } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CityCardProps {
  city: {
    id: number
    name: string
    slug: string
    image_url: string
    description?: string
    active: boolean
    opportunity_count: number
  }
  onClick: () => void
  className?: string
}

export function CityCard({ city, onClick, className }: CityCardProps) {
  return (
    <Card
      className={cn(
        // Base styles
        "group relative overflow-hidden cursor-pointer",
        "h-[280px] border-0",
        // Hover effects
        "transition-all duration-300",
        "hover:shadow-[var(--shadow-elegant)]",
        "hover:scale-[1.02]",
        // Accessibility
        "focus-visible:outline-none focus-visible:ring-2",
        "focus-visible:ring-primary focus-visible:ring-offset-2",
        // Inactive state
        !city.active && "opacity-60 cursor-not-allowed",
        className
      )}
      onClick={city.active ? onClick : undefined}
      role="button"
      tabIndex={city.active ? 0 : -1}
      aria-label={`Ver oportunidades en ${city.name}`}
      onKeyDown={(e) => {
        if (city.active && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          onClick()
        }
      }}
    >
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-110"
        style={{ backgroundImage: `url(${city.image_url})` }}
        aria-hidden="true"
      />

      {/* Gradient Overlay */}
      <div
        className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20"
        aria-hidden="true"
      />

      {/* Content */}
      <div className="relative h-full flex flex-col justify-between p-6">
        {/* Top Section - Status Badge */}
        <div className="flex justify-end">
          {!city.active && (
            <Badge variant="secondary" className="bg-black/50 text-white border-white/20">
              Inactiva
            </Badge>
          )}
        </div>

        {/* Bottom Section - City Info */}
        <div className="space-y-3">
          {/* City Name */}
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-white/90" />
            <h3 className="text-2xl font-bold text-white tracking-tight">
              {city.name}
            </h3>
          </div>

          {/* Description (optional) */}
          {city.description && (
            <p className="text-sm text-white/80 line-clamp-2">
              {city.description}
            </p>
          )}

          {/* Opportunity Counter */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-3 py-1.5 border border-white/20">
              <Briefcase className="h-4 w-4 text-white" />
              <span className="text-sm font-medium text-white">
                {city.opportunity_count} {city.opportunity_count === 1 ? 'oportunidad' : 'oportunidades'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
```

### Componentes shadcn Utilizados

1. **Card** (`@/components/ui/card`)
   - Contenedor principal con shadow y border-radius

2. **Badge** (`@/components/ui/badge`)
   - Estado "Inactiva" para ciudades deshabilitadas
   - Variante `secondary` con fondo translúcido

3. **Lucide Icons**
   - `MapPin`: Icono de ubicación
   - `Briefcase`: Icono para contador de oportunidades

### Efectos y Transiciones

```css
/* Efectos principales del CityCard */
1. Hover Scale: scale-[1.02] (sutil zoom del card)
2. Background Zoom: group-hover:scale-110 (zoom de imagen de fondo)
3. Shadow Transition: hover:shadow-elegant
4. Duration: 300ms para transiciones suaves
```

### Aspect Ratio Recomendado

**Imágenes**: `16:9` o `4:3` para ciudades
- Altura fija del card: `280px`
- Ancho: fluido según grid

---

## CitiesGrid Layout

### Grid CSS con Auto-Fit

```tsx
// src/app/features/opportunities/pages/CitiesGridPage.tsx
// ABOUTME: Main page displaying grid of cities with opportunities
// ABOUTME: Entry point for opportunities feature at /opportunities route

import { useNavigate } from 'react-router-dom'
import { useCitiesQuery } from '../hooks/queries/useCitiesQuery'
import { CityCard } from '../components/CityCard'
import { CitiesGridSkeleton } from '../components/CitiesGridSkeleton'
import { EmptyCitiesState } from '../components/EmptyCitiesState'
import { AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

export function CitiesGridPage() {
  const navigate = useNavigate()
  const { data: cities, isLoading, error } = useCitiesQuery()

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <CitiesGridSkeleton />
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Error al cargar las ciudades. Por favor, intenta de nuevo.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  // Empty state
  if (!cities || cities.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <EmptyCitiesState />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-3">
          Oportunidades por Ciudad
        </h1>
        <p className="text-lg text-muted-foreground">
          Explora oportunidades de colaboración en diferentes ciudades de España Creativa
        </p>
      </div>

      {/* Cities Grid */}
      <div
        className="grid gap-6"
        style={{
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))'
        }}
      >
        {cities.map((city) => (
          <CityCard
            key={city.id}
            city={city}
            onClick={() => navigate(`/opportunities/${city.slug}`)}
          />
        ))}
      </div>
    </div>
  )
}
```

### Grid Breakpoints y Spacing

```css
/* Grid responsivo con auto-fit */
grid-template-columns: repeat(auto-fit, minmax(320px, 1fr))

Resultado:
- Mobile (< 640px): 1 columna
- Tablet (640px - 1024px): 2 columnas
- Desktop (> 1024px): 3-4 columnas (según ancho)
- Wide (> 1536px): 4-5 columnas
```

**Gaps**:
- `gap-6` (24px) entre cards
- Padding contenedor: `px-4` (mobile) a `px-8` (desktop)

---

## Página CityOpportunitiesPage

### Estructura y Layout

```tsx
// src/app/features/opportunities/pages/CityOpportunitiesPage.tsx
// ABOUTME: Page displaying opportunities for a specific city
// ABOUTME: Shows city header and filtered list of opportunities

import { useParams, useNavigate } from 'react-router-dom'
import { useCityBySlugQuery } from '../hooks/queries/useCityBySlugQuery'
import { useOpportunitiesByCityQuery } from '../hooks/queries/useOpportunitiesByCityQuery'
import { useAuthContext } from '@/app/features/auth/hooks/useAuthContext'
import { OpportunityCard } from '../components/OpportunityCard'
import { CreateOpportunityDialog } from '../components/CreateOpportunityDialog'
import { Button } from '@/components/ui/button'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { MapPin, Briefcase, Plus, AlertCircle, ChevronLeft } from 'lucide-react'
import { useState } from 'react'

export function CityOpportunitiesPage() {
  const { citySlug } = useParams<{ citySlug: string }>()
  const navigate = useNavigate()
  const { user } = useAuthContext()
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  const { data: city, isLoading: isCityLoading, error: cityError } = useCityBySlugQuery(citySlug!)
  const { data: opportunities, isLoading: isOpportunitiesLoading } = useOpportunitiesByCityQuery(city?.id)

  // Check if user can create opportunities for this city
  const canCreateOpportunity = user?.city_manager_cities?.some((c) => c.id === city?.id) || user?.is_admin

  // Loading state
  if (isCityLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-8 w-64 mb-4" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    )
  }

  // Error state
  if (cityError || !city) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Ciudad no encontrada. Por favor, verifica la URL.
          </AlertDescription>
        </Alert>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => navigate('/opportunities')}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Volver al listado
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumbs */}
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink onClick={() => navigate('/opportunities')} className="cursor-pointer">
                Oportunidades
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{city.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* City Header */}
        <div className="mb-8 relative overflow-hidden rounded-2xl">
          {/* Background Image with Overlay */}
          <div className="relative h-[240px] rounded-2xl overflow-hidden">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${city.image_url})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/40" />

            {/* Content */}
            <div className="relative h-full flex flex-col justify-end p-8">
              <div className="flex items-center gap-3 mb-2">
                <MapPin className="h-6 w-6 text-white" />
                <h1 className="text-4xl font-bold text-white tracking-tight">
                  {city.name}
                </h1>
              </div>

              {city.description && (
                <p className="text-lg text-white/90 max-w-2xl">
                  {city.description}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Briefcase className="h-5 w-5" />
            <span className="font-medium">
              {opportunities?.length || 0} {opportunities?.length === 1 ? 'oportunidad disponible' : 'oportunidades disponibles'}
            </span>
          </div>

          {canCreateOpportunity && (
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Crear Oportunidad
            </Button>
          )}
        </div>

        {/* Opportunities List */}
        {isOpportunitiesLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-[300px] rounded-xl" />
            ))}
          </div>
        ) : opportunities && opportunities.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {opportunities.map((opportunity) => (
              <OpportunityCard
                key={opportunity.id}
                opportunity={opportunity}
                showActions={false}
              />
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="rounded-full bg-muted p-6 mb-4">
              <Briefcase className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">
              No hay oportunidades disponibles
            </h3>
            <p className="text-muted-foreground text-center max-w-md mb-6">
              Todavía no se han publicado oportunidades para {city.name}.
              {canCreateOpportunity && ' ¡Sé el primero en crear una!'}
            </p>
            {canCreateOpportunity && (
              <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Crear Primera Oportunidad
              </Button>
            )}
          </div>
        )}

        {/* Create Opportunity Dialog */}
        {canCreateOpportunity && (
          <CreateOpportunityDialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
            preselectedCityId={city.id}
          />
        )}
      </div>
    </div>
  )
}
```

### Componentes shadcn Utilizados

1. **Breadcrumb** (`@/components/ui/breadcrumb`)
   - Navegación contextual: Oportunidades > [Ciudad]

2. **Button** (`@/components/ui/button`)
   - "Crear Oportunidad" (solo para gestores)
   - "Volver al listado" en error state

3. **Alert** (`@/components/ui/alert`)
   - Error state cuando ciudad no existe

4. **Skeleton** (`@/components/ui/skeleton`)
   - Loading placeholders

5. **OpportunityCard** (componente existente)
   - Reutilizar para mostrar oportunidades

---

## Gestión de Imágenes

### Fuentes Recomendadas

**Unsplash** (preferido):
```typescript
// URLs de ejemplo para ciudades españolas
const cityImages = {
  cordoba: 'https://images.unsplash.com/photo-1583422409516-2895a77efded',
  tenerife: 'https://images.unsplash.com/photo-1530841377377-3ff06c0ca713',
  quinto: 'https://images.unsplash.com/photo-1558862107-d49ef2a04d72',
  denia: 'https://images.unsplash.com/photo-1570976518732-e75ed62c0de2',
  // Agregar parámetros de optimización
  // ?w=800&h=600&fit=crop&q=80
}
```

**Parámetros de Optimización Unsplash**:
- `w=800`: Ancho máximo
- `h=600`: Alto máximo
- `fit=crop`: Recortar imagen
- `q=80`: Calidad 80%
- `auto=format`: Formato automático (WebP si disponible)

### Implementación de Lazy Loading

```tsx
// Componente ImageWithFallback
// src/components/common/ImageWithFallback.tsx
// ABOUTME: Image component with lazy loading and fallback support
// ABOUTME: Handles loading states and error fallbacks

import { useState } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { ImageOff } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ImageWithFallbackProps {
  src: string
  alt: string
  className?: string
  fallbackIcon?: React.ReactNode
}

export function ImageWithFallback({
  src,
  alt,
  className,
  fallbackIcon
}: ImageWithFallbackProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  if (hasError) {
    return (
      <div className={cn(
        "flex items-center justify-center bg-muted",
        className
      )}>
        {fallbackIcon || <ImageOff className="h-12 w-12 text-muted-foreground" />}
      </div>
    )
  }

  return (
    <>
      {isLoading && (
        <Skeleton className={className} />
      )}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        className={cn(
          isLoading && "hidden",
          className
        )}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false)
          setHasError(true)
        }}
      />
    </>
  )
}
```

### Uso en CityCard

```tsx
// Usar background-image con loading placeholder
<div className="relative h-full">
  {/* Loading State */}
  {imageLoading && (
    <Skeleton className="absolute inset-0" />
  )}

  {/* Image */}
  <div
    className="absolute inset-0 bg-cover bg-center"
    style={{ backgroundImage: `url(${city.image_url})` }}
    onLoad={() => setImageLoading(false)}
  />
</div>
```

---

## Estados UI

### 1. CitiesGridSkeleton

```tsx
// src/app/features/opportunities/components/CitiesGridSkeleton.tsx
// ABOUTME: Loading skeleton for cities grid
// ABOUTME: Shows placeholder cards while cities data is loading

import { Skeleton } from '@/components/ui/skeleton'

export function CitiesGridSkeleton() {
  return (
    <>
      {/* Header Skeleton */}
      <div className="mb-8">
        <Skeleton className="h-10 w-72 mb-3" />
        <Skeleton className="h-6 w-96" />
      </div>

      {/* Grid Skeleton */}
      <div
        className="grid gap-6"
        style={{
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))'
        }}
      >
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-[280px] rounded-xl" />
        ))}
      </div>
    </>
  )
}
```

### 2. EmptyCitiesState

```tsx
// src/app/features/opportunities/components/EmptyCitiesState.tsx
// ABOUTME: Empty state when no cities are available
// ABOUTME: Displays message for admin to add cities

import { MapPin } from 'lucide-react'
import { useAuthContext } from '@/app/features/auth/hooks/useAuthContext'

export function EmptyCitiesState() {
  const { user } = useAuthContext()

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="rounded-full bg-muted p-8 mb-6">
        <MapPin className="h-16 w-16 text-muted-foreground" />
      </div>

      <h2 className="text-2xl font-bold mb-3">
        No hay ciudades disponibles
      </h2>

      <p className="text-muted-foreground text-center max-w-md mb-6">
        {user?.is_admin
          ? 'Como administrador, puedes agregar ciudades desde el panel de administración.'
          : 'Próximamente se agregarán ciudades para explorar oportunidades.'}
      </p>
    </div>
  )
}
```

### 3. EmptyOpportunitiesState (dentro de CityOpportunitiesPage)

Ya incluido en la estructura de CityOpportunitiesPage arriba.

### 4. Error States

```tsx
// Usar Alert component de shadcn
<Alert variant="destructive">
  <AlertCircle className="h-4 w-4" />
  <AlertDescription>
    Error al cargar las ciudades. Por favor, intenta de nuevo.
  </AlertDescription>
</Alert>
```

---

## Accesibilidad

### ARIA Labels y Roles

```tsx
// CityCard - Card completo es clickeable
<Card
  role="button"
  tabIndex={city.active ? 0 : -1}
  aria-label={`Ver oportunidades en ${city.name}`}
  aria-disabled={!city.active}
  onKeyDown={(e) => {
    if (city.active && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault()
      onClick()
    }
  }}
>
```

### Keyboard Navigation

**Cards**:
- `Tab`: Navegar entre cards activos
- `Enter` o `Space`: Activar card
- Cards inactivos: `tabIndex={-1}` (no focuseables)

**Breadcrumbs**:
- Navegación con `Tab`
- `Enter` para activar links

### Focus States

```tsx
// Focus visible con ring
className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
```

### Screen Readers

```tsx
// Ocultar elementos decorativos
<div aria-hidden="true">
  {/* Gradient overlay, background image, etc */}
</div>

// Labels descriptivos
<span className="sr-only">
  {city.opportunity_count} oportunidades disponibles en {city.name}
</span>
```

---

## Responsive Design

### Breakpoints Tailwind

```typescript
// tailwind.config.js default breakpoints
{
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px'
}
```

### Responsive Grid

```css
/* Auto-fit adapta columnas según espacio */
grid-template-columns: repeat(auto-fit, minmax(320px, 1fr))

Resultado:
- < 640px (mobile): 1 columna
- 640px - 1024px (tablet): 2 columnas
- 1024px - 1536px (desktop): 3 columnas
- > 1536px (wide): 4+ columnas
```

### Responsive Typography

```tsx
// Header de página
<h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold">

// Descripción
<p className="text-base sm:text-lg">

// City Card Title
<h3 className="text-xl sm:text-2xl font-bold">
```

### Responsive Spacing

```tsx
// Container padding
<div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

// Grid gaps
<div className="grid gap-4 sm:gap-6 lg:gap-8">
```

### City Header Responsive

```tsx
// CityOpportunitiesPage header
<div className="relative h-[180px] sm:h-[240px] lg:h-[280px] rounded-2xl">
  <div className="p-4 sm:p-6 lg:p-8">
    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">
      {city.name}
    </h1>
  </div>
</div>
```

---

## Estructura de Archivos

### Árbol de Archivos Completo

```
src/app/features/opportunities/
├── components/
│   ├── OpportunityCard.tsx              [EXISTENTE]
│   ├── CreateOpportunityDialog.tsx      [EXISTENTE - MODIFICAR]
│   ├── CityCard.tsx                     [NUEVO]
│   ├── CitiesGridSkeleton.tsx           [NUEVO]
│   ├── EmptyCitiesState.tsx             [NUEVO]
│   └── CityHeader.tsx                   [NUEVO - OPCIONAL]
│
├── data/
│   ├── schemas/
│   │   ├── opportunity.schema.ts        [EXISTENTE - MODIFICAR]
│   │   └── city.schema.ts               [NUEVO]
│   └── services/
│       ├── opportunity.service.ts       [EXISTENTE - MODIFICAR]
│       └── city.service.ts              [NUEVO]
│
├── hooks/
│   ├── mutations/
│   │   ├── useCreateOpportunityMutation.ts  [EXISTENTE - MODIFICAR]
│   │   ├── useUpdateOpportunityMutation.ts  [EXISTENTE]
│   │   └── useDeleteOpportunityMutation.ts  [EXISTENTE]
│   └── queries/
│       ├── useOpportunitiesQuery.ts         [EXISTENTE - DEPRECAR]
│       ├── useMyOpportunitiesQuery.ts       [EXISTENTE]
│       ├── useOpportunityQuery.ts           [EXISTENTE]
│       ├── useCitiesQuery.ts                [NUEVO]
│       ├── useCityBySlugQuery.ts            [NUEVO]
│       └── useOpportunitiesByCityQuery.ts   [NUEVO]
│
└── pages/
    ├── CitiesGridPage.tsx               [NUEVO]
    └── CityOpportunitiesPage.tsx        [NUEVO]
```

### Componentes Compartidos

```
src/components/
├── ui/                                  [shadcn components]
│   ├── card.tsx
│   ├── badge.tsx
│   ├── button.tsx
│   ├── breadcrumb.tsx
│   ├── skeleton.tsx
│   ├── alert.tsx
│   └── ...
│
└── common/                              [Nuevos componentes comunes]
    └── ImageWithFallback.tsx            [NUEVO]
```

---

## Notas Importantes de Implementación

### 1. Migración de Datos

**CONFIRMADO por Iban**: Eliminar oportunidades existentes y comenzar limpio con sistema de ciudades.

```sql
-- Script de limpieza (ejecutar ANTES de migración)
DELETE FROM opportunities;
```

### 2. Cambios en CreateOpportunityDialog

**Agregar campo de ciudad**:
```tsx
// Preseleccionar ciudad si viene de CityOpportunitiesPage
interface CreateOpportunityDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  preselectedCityId?: number  // NUEVO
}

// En el formulario, usar Select de shadcn
<Select
  value={cityId}
  onValueChange={setCityId}
  disabled={!!preselectedCityId}  // Disabled si viene preseleccionado
>
  {/* Options de ciudades */}
</Select>
```

### 3. Validación con Zod

```typescript
// city.schema.ts
import { z } from 'zod'

export const citySchema = z.object({
  id: z.number(),
  name: z.string().min(1, 'Nombre requerido'),
  slug: z.string().min(1, 'Slug requerido'),
  image_url: z.string().url('URL de imagen inválida'),
  description: z.string().optional(),
  active: z.boolean().default(true),
  display_order: z.number().default(0),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
})

export const cityWithCountSchema = citySchema.extend({
  opportunity_count: z.number().default(0),
})

export type City = z.infer<typeof citySchema>
export type CityWithCount = z.infer<typeof cityWithCountSchema>
```

### 4. React Query Keys

```typescript
// query-keys.ts
export const cityKeys = {
  all: ['cities'] as const,
  lists: () => [...cityKeys.all, 'list'] as const,
  list: (filters: string) => [...cityKeys.lists(), { filters }] as const,
  details: () => [...cityKeys.all, 'detail'] as const,
  detail: (slug: string) => [...cityKeys.details(), slug] as const,
}

export const opportunityKeys = {
  all: ['opportunities'] as const,
  lists: () => [...opportunityKeys.all, 'list'] as const,
  list: (filters: string) => [...opportunityKeys.lists(), { filters }] as const,
  byCity: (cityId: number) => [...opportunityKeys.lists(), 'city', cityId] as const,
  details: () => [...opportunityKeys.all, 'detail'] as const,
  detail: (id: number) => [...opportunityKeys.details(), id] as const,
}
```

### 5. Rutas en App.tsx

```tsx
// ANTES
<Route path="/opportunities" element={<OpportunitiesPage />} />

// DESPUÉS
<Route path="/opportunities" element={<CitiesGridPage />} />
<Route path="/opportunities/:citySlug" element={<CityOpportunitiesPage />} />
```

### 6. Navegación

```tsx
// Actualizar Navigation.tsx
const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/opportunities', label: 'Oportunidades', icon: Briefcase },  // Sin cambios en ruta base
  { to: '/messages', label: 'Mensajes', icon: MessageSquare },
  { to: '/network', label: 'Red', icon: Users },
]
```

---

## Testing Considerations

### Unit Tests

```typescript
// CityCard.test.tsx
describe('CityCard', () => {
  it('renders city name and opportunity count', () => {
    // Test básico de rendering
  })

  it('navigates on click when city is active', () => {
    // Test de navegación
  })

  it('does not navigate when city is inactive', () => {
    // Test de ciudad inactiva
  })

  it('is keyboard accessible', () => {
    // Test de accesibilidad (Enter/Space)
  })
})
```

### Integration Tests

```typescript
// CitiesGridPage.test.tsx
describe('CitiesGridPage', () => {
  it('displays loading skeleton while fetching', () => {
    // Test de loading state
  })

  it('displays cities in grid layout', () => {
    // Test de renderizado de grid
  })

  it('displays empty state when no cities', () => {
    // Test de empty state
  })

  it('displays error state on fetch error', () => {
    // Test de error state
  })
})
```

---

## Próximos Pasos para Implementación

1. **Backend First**:
   - Crear entidad `City`
   - Implementar `CityRepository` (port + adapter)
   - Crear use cases (`GetCitiesUseCase`, `GetCityBySlugUseCase`)
   - Implementar endpoints API

2. **Frontend Base**:
   - Crear schemas Zod (`city.schema.ts`)
   - Implementar service (`city.service.ts`)
   - Crear hooks de queries

3. **UI Components**:
   - Implementar `CityCard`
   - Crear `CitiesGridSkeleton` y `EmptyCitiesState`
   - Implementar `ImageWithFallback`

4. **Pages**:
   - Crear `CitiesGridPage`
   - Crear `CityOpportunitiesPage`
   - Actualizar rutas en `App.tsx`

5. **Modificaciones**:
   - Actualizar `CreateOpportunityDialog` para incluir selector de ciudad
   - Modificar schemas de oportunidad para incluir `city_id`

6. **Testing**:
   - Tests unitarios de componentes
   - Tests de integración de páginas
   - Tests de hooks de queries

7. **Migración de Datos**:
   - Ejecutar script de limpieza
   - Seedear ciudades iniciales con imágenes de Unsplash

---

## Recursos y Referencias

### shadcn/ui Components
- Card: https://ui.shadcn.com/docs/components/card
- Badge: https://ui.shadcn.com/docs/components/badge
- Button: https://ui.shadcn.com/docs/components/button
- Breadcrumb: https://ui.shadcn.com/docs/components/breadcrumb
- Skeleton: https://ui.shadcn.com/docs/components/skeleton
- Alert: https://ui.shadcn.com/docs/components/alert

### Lucide Icons
- https://lucide.dev/icons/

### Unsplash API
- https://unsplash.com/developers
- Búsqueda de ciudades: https://unsplash.com/s/photos/[ciudad]

### Accesibilidad
- WAI-ARIA Authoring Practices: https://www.w3.org/WAI/ARIA/apg/
- WCAG 2.1 Guidelines: https://www.w3.org/WAI/WCAG21/quickref/

---

**Fin del documento**
