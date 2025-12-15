// ABOUTME: Projects page showing all available projects with filtering
// ABOUTME: Displays projects in cards with real-time data from backend

import { useState } from 'react'
import { Navigation } from '@/components/layout/Navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar } from 'lucide-react'
import { useProjectsQuery } from '@/app/features/projects/hooks/queries/useProjectsQuery'
import { ProjectCard } from '@/app/features/projects/components/ProjectCard'
import { CreateProjectDialog } from '@/app/features/projects/components/CreateProjectDialog'
import { ProjectDetailsDialog } from '@/app/features/projects/components/ProjectDetailsDialog'
import { useUserRoles } from '@/app/features/auth/hooks/useUserRoles'
import type { ProjectWithCreator } from '@/app/features/projects/data/schemas/project.schema'

type DateFilter = 'upcoming' | 'active' | 'past' | 'all'

export function ProjectsPage() {
  const [selectedTab, setSelectedTab] = useState<DateFilter>('upcoming')
  const [selectedProject, setSelectedProject] = useState<ProjectWithCreator | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)

  // Check if user is admin
  const { isAdmin } = useUserRoles()

  // Fetch all projects (no status filter, we'll filter by date client-side)
  const { data, isLoading, isError } = useProjectsQuery({})

  // Filter projects by date
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const allPrograms = data?.projects || []

  const programs = allPrograms.filter(program => {
    const startDate = new Date(program.start_date)
    const endDate = new Date(program.end_date)
    startDate.setHours(0, 0, 0, 0)
    endDate.setHours(0, 0, 0, 0)

    switch (selectedTab) {
      case 'upcoming':
        return startDate > today
      case 'active':
        return startDate <= today && endDate >= today
      case 'past':
        return endDate < today
      case 'all':
      default:
        return true
    }
  })

  const total = programs.length
  const isLoadingData = isLoading
  const isErrorData = isError

  const handleViewDetails = (program: ProjectWithCreator) => {
    setSelectedProject(program)
    setDetailsOpen(true)
  }

  // Calculate stats based on date filtering
  const activeProjects = allPrograms.filter(p => {
    const startDate = new Date(p.start_date)
    const endDate = new Date(p.end_date)
    startDate.setHours(0, 0, 0, 0)
    endDate.setHours(0, 0, 0, 0)
    return startDate <= today && endDate >= today
  })

  const stats = {
    active: activeProjects.length,
    participants: allPrograms.reduce((sum, p) => sum + p.participants, 0),
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
                <h1 className="text-3xl font-bold text-foreground">Proyectos</h1>
                <p className="text-muted-foreground">
                  Descubre cursos, talleres y proyectos de aceleración
                </p>
              </div>
            </div>
            {isAdmin && <CreateProjectDialog />}
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
              variant={selectedTab === 'past' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSelectedTab('past')}
            >
              Pasados
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
              <p className="text-sm text-muted-foreground">Proyectos activos</p>
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
        {isLoadingData && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Cargando proyectos...</p>
          </div>
        )}

        {/* Error State */}
        {isErrorData && (
          <Card className="text-center py-12">
            <CardContent>
              <p className="text-destructive">Error al cargar los proyectos. Por favor, intenta de nuevo.</p>
            </CardContent>
          </Card>
        )}

        {/* Projects List */}
        {!isLoadingData && !isErrorData && (
          <>
            {programs.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {programs.map((program) => (
                  <ProjectCard
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
                    No hay proyectos disponibles en esta categoría
                  </p>
                  {selectedTab !== 'all' && (
                    <Button
                      variant="link"
                      onClick={() => setSelectedTab('all')}
                      className="mt-2"
                    >
                      Ver todos los proyectos
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Total count */}
            {programs.length > 0 && (
              <div className="text-center mt-8 text-sm text-muted-foreground">
                Mostrando {programs.length} de {total} proyectos
              </div>
            )}
          </>
        )}
      </div>

      {/* Project Details Dialog */}
      <ProjectDetailsDialog
        program={selectedProject}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
      />
    </div>
  )
}
