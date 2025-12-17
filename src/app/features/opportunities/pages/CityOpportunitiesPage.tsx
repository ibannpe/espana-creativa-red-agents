// ABOUTME: Page displaying opportunities filtered by city
// ABOUTME: Shows city header and filterable list of opportunities for that city

import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { Navigation } from '@/components/layout/Navigation'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, AlertCircle, Plus, ChevronLeft } from 'lucide-react'
import { useCityBySlugQuery } from '@/app/features/cities/hooks/queries/useCityBySlugQuery'
import { useOpportunitiesByCityQuery } from '../hooks/queries/useOpportunitiesByCityQuery'
import { useTerritorialPermissions } from '../hooks/useTerritorialPermissions'
import { CityHeader } from '@/app/features/cities/components/CityHeader'
import { OpportunityCard } from '../components/OpportunityCard'
import { CreateOpportunityDialog } from '../components/CreateOpportunityDialog'
import type {
  OpportunityType,
  OpportunityWithCreator,
} from '../data/schemas/opportunity.schema'

const opportunityTypeLabels: Record<OpportunityType, string> = {
  proyecto: 'Proyecto',
  colaboracion: 'Colaboración',
  empleo: 'Empleo',
  mentoria: 'Mentoría',
  evento: 'Evento',
  otro: 'Otro',
}

export function CityOpportunitiesPage() {
  const { citySlug } = useParams<{ citySlug: string }>()
  const navigate = useNavigate()
  const [typeFilter, setTypeFilter] = useState<OpportunityType | 'all'>('all')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingOpportunity, setEditingOpportunity] =
    useState<OpportunityWithCreator | null>(null)

  // Fetch city data
  const {
    data: city,
    isLoading: isLoadingCity,
    isError: isErrorCity,
    error: cityError,
  } = useCityBySlugQuery(citySlug || '', {
    enabled: !!citySlug,
  })

  // Check permissions using territorial roles (only when we have city data)
  const { canCreateInCity, isLoading: isLoadingPermissions } = useTerritorialPermissions()
  const canManageCity = city?.id ? canCreateInCity(city.id) : false

  // Fetch opportunities filtered by city
  const filters = typeFilter !== 'all' ? { type: typeFilter } : undefined
  const {
    data: opportunitiesData,
    isLoading: isLoadingOpportunities,
    isError: isErrorOpportunities,
    error: opportunitiesError,
  } = useOpportunitiesByCityQuery(city?.id || 0, filters, {
    enabled: !!city?.id,
  })

  const opportunities = opportunitiesData?.opportunities || []

  const handleCreateClick = () => {
    setEditingOpportunity(null)
    setIsCreateDialogOpen(true)
  }

  const handleEditOpportunity = (opportunity: OpportunityWithCreator) => {
    setEditingOpportunity(opportunity)
    setIsCreateDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsCreateDialogOpen(false)
    setEditingOpportunity(null)
  }

  // Loading state
  if (isLoadingCity) {
    return (
      <AppLayout>
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </AppLayout>
    )
  }

  // City not found error
  if (isErrorCity) {
    return (
      <AppLayout>
        <Navigation />
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Button
            variant="ghost"
            onClick={() => navigate('/opportunities')}
            className="mb-4"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Volver a ciudades
          </Button>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {cityError instanceof Error
                ? cityError.message
                : 'No se pudo cargar la ciudad'}
            </AlertDescription>
          </Alert>
        </div>
      </AppLayout>
    )
  }

  // No city data
  if (!city) {
    return (
      <AppLayout>
        <Navigation />
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Button
            variant="ghost"
            onClick={() => navigate('/opportunities')}
            className="mb-4"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Volver a ciudades
          </Button>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Ciudad no encontrada</AlertDescription>
          </Alert>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <Navigation />
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* City Header */}
        <CityHeader city={city} />

        {/* Filters and Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center mt-8 mb-6">
          {/* Type Filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Tipo:</span>
            <Select
              value={typeFilter}
              onValueChange={(value) =>
                setTypeFilter(value as OpportunityType | 'all')
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {Object.entries(opportunityTypeLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Create Button - Only for city managers */}
          {!isLoadingPermissions && canManageCity && (
            <Button onClick={handleCreateClick}>
              <Plus className="h-4 w-4 mr-2" />
              Crear oportunidad
            </Button>
          )}
        </div>

        {/* Opportunities Error State */}
        {isErrorOpportunities && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Error al cargar las oportunidades:{' '}
              {opportunitiesError instanceof Error
                ? opportunitiesError.message
                : 'Error desconocido'}
            </AlertDescription>
          </Alert>
        )}

        {/* Loading Opportunities */}
        {isLoadingOpportunities && (
          <div className="flex items-center justify-center min-h-[300px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {/* Empty State */}
        {!isLoadingOpportunities &&
          !isErrorOpportunities &&
          opportunities.length === 0 && (
            <div className="flex flex-col items-center justify-center min-h-[300px] text-center">
              <div className="bg-muted rounded-full p-6 mb-4">
                <AlertCircle className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                No hay oportunidades disponibles
              </h3>
              <p className="text-muted-foreground max-w-md">
                {typeFilter !== 'all'
                  ? `No se encontraron oportunidades de tipo "${opportunityTypeLabels[typeFilter]}" en ${city.name}.`
                  : `Aún no hay oportunidades publicadas en ${city.name}.`}
              </p>
              {canManageCity && (
                <Button onClick={handleCreateClick} className="mt-6">
                  <Plus className="h-4 w-4 mr-2" />
                  Crear primera oportunidad
                </Button>
              )}
            </div>
          )}

        {/* Opportunities Grid */}
        {!isLoadingOpportunities &&
          !isErrorOpportunities &&
          opportunities.length > 0 && (
            <div>
              {/* Results count */}
              <div className="mb-4">
                <Badge variant="secondary">
                  {opportunities.length}{' '}
                  {opportunities.length === 1 ? 'oportunidad' : 'oportunidades'}
                </Badge>
              </div>

              {/* Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {opportunities.map((opportunity) => {
                  const isOwner = canManageCity // City managers can edit all opportunities in their city
                  return (
                    <OpportunityCard
                      key={opportunity.id}
                      opportunity={opportunity}
                      onEdit={isOwner ? handleEditOpportunity : undefined}
                      showActions={isOwner}
                      isOwner={isOwner}
                    />
                  )
                })}
              </div>
            </div>
          )}

        {/* Create/Edit Dialog */}
        <CreateOpportunityDialog
          open={isCreateDialogOpen}
          onOpenChange={handleCloseDialog}
          opportunity={editingOpportunity}
          cityId={city.id}
        />
      </div>
    </AppLayout>
  )
}
