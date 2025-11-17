// ABOUTME: Admin page for managing territories (cities)
// ABOUTME: Allows admins to create, edit, delete territories and upload images

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCitiesQuery } from '@/app/features/cities/hooks/queries/useCitiesQuery'
import { useUserRoles } from '@/app/features/auth/hooks/useUserRoles'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Plus, MapPin, Edit, Trash2, Loader2 } from 'lucide-react'
import { CreateTerritoryDialog } from '../components/CreateTerritoryDialog'
import type { CityWithStats } from '@/app/features/cities/data/schemas/city.schema'

export function AdminTerritoriesPage() {
  const navigate = useNavigate()
  const { isAdmin, isLoading: isLoadingRoles } = useUserRoles()
  const { data: cities, isLoading, isError, error } = useCitiesQuery()
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingTerritory, setEditingTerritory] = useState<CityWithStats | null>(null)

  // Redirect if not admin
  if (!isLoadingRoles && !isAdmin) {
    navigate('/')
    return null
  }

  const handleEdit = (territory: CityWithStats) => {
    setEditingTerritory(territory)
    setIsCreateDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsCreateDialogOpen(false)
    setEditingTerritory(null)
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => navigate('/gestion')}
        className="mb-6 hover:bg-gray-100"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Volver a Gestión
      </Button>

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <MapPin className="h-8 w-8 text-emerald-600" />
            <h1 className="text-3xl font-bold">Gestión de Territorios</h1>
          </div>
          <p className="text-muted-foreground">
            Administra las ciudades y territorios de la red
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Territorio
        </Button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {/* Error State */}
      {isError && (
        <Card className="p-8 text-center">
          <p className="text-destructive">Error al cargar territorios</p>
          <p className="text-muted-foreground text-sm mt-2">{error?.message}</p>
        </Card>
      )}

      {/* Territories Grid */}
      {!isLoading && !isError && cities && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cities.map((territory) => (
            <Card key={territory.id} className="overflow-hidden">
              {/* Territory Image */}
              <div className="relative h-48 bg-gradient-to-br from-gray-200 to-gray-300">
                {territory.image_url && (
                  <img
                    src={territory.image_url}
                    alt={territory.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-4 left-4 text-white">
                  <h3 className="text-xl font-bold">{territory.name}</h3>
                  <p className="text-sm opacity-90">{territory.slug}</p>
                </div>
              </div>

              {/* Territory Info */}
              <CardHeader>
                <CardDescription className="line-clamp-2">
                  {territory.description || 'Sin descripción'}
                </CardDescription>
              </CardHeader>

              <CardContent>
                <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                  <span>Oportunidades: {territory.active_opportunities_count}</span>
                  <span className={territory.active ? 'text-green-600' : 'text-gray-400'}>
                    {territory.active ? 'Activo' : 'Inactivo'}
                  </span>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleEdit(territory)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:bg-destructive hover:text-white"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <CreateTerritoryDialog
        open={isCreateDialogOpen}
        onOpenChange={handleCloseDialog}
        territory={editingTerritory}
      />
    </div>
  )
}
