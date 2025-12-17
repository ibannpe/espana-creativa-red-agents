// ABOUTME: Main page displaying grid of all available cities
// ABOUTME: Entry point for city-based opportunity browsing

import { AppLayout } from '@/components/layout/AppLayout'
import { Navigation } from '@/components/layout/Navigation'
import { useCitiesQuery } from '../hooks/queries/useCitiesQuery'
import { CityCard } from '../components/CityCard'
import { CitiesGridSkeleton } from '../components/CitiesGridSkeleton'
import { EmptyCitiesState } from '../components/EmptyCitiesState'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'

export function CitiesGridPage() {
  const { data: cities, isLoading, isError, error } = useCitiesQuery()

  return (
    <AppLayout>
      <Navigation />
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Oportunidades Red</h1>
          <p className="text-muted-foreground">
            Explora las oportunidades disponibles en la Red de Ciudades y Territorios Creativos de España (RECITCREA)
          </p>
        </div>

        {/* Loading State */}
        {isLoading && <CitiesGridSkeleton count={6} />}

        {/* Error State */}
        {isError && (
          <Alert variant="destructive" className="max-w-2xl">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Error al cargar las ciudades:{' '}
              {error instanceof Error ? error.message : 'Error desconocido'}
            </AlertDescription>
          </Alert>
        )}

        {/* Empty State */}
        {!isLoading && !isError && cities && cities.length === 0 && (
          <EmptyCitiesState />
        )}

        {/* Cities Grid */}
        {!isLoading && !isError && cities && cities.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {cities.map((city) => (
              <CityCard key={city.id} city={city} />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
