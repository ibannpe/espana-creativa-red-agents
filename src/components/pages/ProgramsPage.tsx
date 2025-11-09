// ABOUTME: Programs page showing all available programs with filtering
// ABOUTME: Displays programs in cards with real-time data from backend

import { useState } from 'react'
import { Navigation } from '@/components/layout/Navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar } from 'lucide-react'
import { useProgramsQuery } from '@/app/features/programs/hooks/queries/useProgramsQuery'
import { ProgramCard } from '@/app/features/programs/components/ProgramCard'
import { CreateProgramDialog } from '@/app/features/programs/components/CreateProgramDialog'
import { ProgramDetailsDialog } from '@/app/features/programs/components/ProgramDetailsDialog'
import type { ProgramStatus, ProgramWithCreator } from '@/app/features/programs/data/schemas/program.schema'

export function ProgramsPage() {
  const [selectedTab, setSelectedTab] = useState<ProgramStatus | 'all'>('upcoming')
  const [selectedProgram, setSelectedProgram] = useState<ProgramWithCreator | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)

  // Fetch programs with optional status filter
  const filters = selectedTab === 'all' ? {} : { status: selectedTab as ProgramStatus }
  const { data, isLoading, isError } = useProgramsQuery(filters)

  const programs = data?.programs || []
  const total = data?.total || 0

  const handleViewDetails = (program: ProgramWithCreator) => {
    setSelectedProgram(program)
    setDetailsOpen(true)
  }

  // Calculate stats (you could also get these from separate API calls)
  const stats = {
    active: programs.filter(p => p.status === 'active').length,
    participants: programs.reduce((sum, p) => sum + p.participants, 0),
    completionRate: 85, // This could come from backend
    averageRating: 4.8 // This could come from backend
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-emerald-600 rounded-xl flex items-center justify-center">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Programas</h1>
                <p className="text-muted-foreground">
                  Descubre cursos, talleres y programas de aceleración
                </p>
              </div>
            </div>
            <CreateProgramDialog />
          </div>

          {/* Tabs */}
          <div className="flex space-x-1 bg-muted p-1 rounded-lg w-fit">
            <Button
              variant={selectedTab === 'upcoming' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSelectedTab('upcoming')}
            >
              Próximos
            </Button>
            <Button
              variant={selectedTab === 'active' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSelectedTab('active')}
            >
              En curso
            </Button>
            <Button
              variant={selectedTab === 'completed' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSelectedTab('completed')}
            >
              Completados
            </Button>
            <Button
              variant={selectedTab === 'all' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSelectedTab('all')}
            >
              Todos
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-primary mb-2">{stats.active}</div>
              <p className="text-sm text-muted-foreground">Programas activos</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-primary mb-2">{stats.participants}+</div>
              <p className="text-sm text-muted-foreground">Participantes</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-primary mb-2">{stats.completionRate}%</div>
              <p className="text-sm text-muted-foreground">Tasa de finalización</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-primary mb-2">{stats.averageRating}</div>
              <p className="text-sm text-muted-foreground">Puntuación media</p>
            </CardContent>
          </Card>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Cargando programas...</p>
          </div>
        )}

        {/* Error State */}
        {isError && (
          <Card className="text-center py-12">
            <CardContent>
              <p className="text-destructive">Error al cargar los programas. Por favor, intenta de nuevo.</p>
            </CardContent>
          </Card>
        )}

        {/* Programs List */}
        {!isLoading && !isError && (
          <>
            {programs.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {programs.map((program) => (
                  <ProgramCard
                    key={program.id}
                    program={program}
                    onViewDetails={handleViewDetails}
                  />
                ))}
              </div>
            ) : (
              <Card className="text-center py-12">
                <CardContent>
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    No hay programas disponibles en esta categoría
                  </p>
                  {selectedTab !== 'all' && (
                    <Button
                      variant="link"
                      onClick={() => setSelectedTab('all')}
                      className="mt-2"
                    >
                      Ver todos los programas
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Total count */}
            {programs.length > 0 && (
              <div className="text-center mt-8 text-sm text-muted-foreground">
                Mostrando {programs.length} de {total} programas
              </div>
            )}
          </>
        )}
      </div>

      {/* Program Details Dialog */}
      <ProgramDetailsDialog
        program={selectedProgram}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
      />
    </div>
  )
}
