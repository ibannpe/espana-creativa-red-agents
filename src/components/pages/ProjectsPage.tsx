// ABOUTME: Projects page showing all available projects with filtering
// ABOUTME: Displays projects in cards with real-time data from backend

import { useState } from 'react'
import { Navigation } from '@/components/layout/Navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, MapPin, BookOpen } from 'lucide-react'
import { useProjectsQuery } from '@/app/features/projects/hooks/queries/useProjectsQuery'
import { useMyProjectsQuery } from '@/app/features/projects/hooks/queries/useMyProjectsQuery'
import { ProjectCard } from '@/app/features/projects/components/ProjectCard'
import { CreateProjectDialog } from '@/app/features/projects/components/CreateProjectDialog'
import { ProjectDetailsDialog } from '@/app/features/projects/components/ProjectDetailsDialog'
import type { ProjectStatus, ProjectWithCreator } from '@/app/features/projects/data/schemas/project.schema'
import type { EnrollmentStatus } from '@/app/features/projects/data/schemas/enrollment.schema'

const enrollmentStatusLabels: Record<EnrollmentStatus, string> = {
  enrolled: 'Inscrito',
  completed: 'Completado',
  dropped: 'Abandonado',
  rejected: 'Rechazado'
}

const enrollmentStatusColors: Record<EnrollmentStatus, string> = {
  enrolled: 'bg-green-500',
  completed: 'bg-blue-500',
  dropped: 'bg-gray-500',
  rejected: 'bg-red-500'
}

const typeLabels: Record<string, string> = {
  aceleracion: 'Aceleración',
  workshop: 'Workshop',
  bootcamp: 'Bootcamp',
  mentoria: 'Mentoría',
  curso: 'Curso',
  otro: 'Otro'
}

export function ProjectsPage() {
  const [selectedTab, setSelectedTab] = useState<ProjectStatus | 'all' | 'my-projects'>('upcoming')
  const [selectedProject, setSelectedProject] = useState<ProjectWithCreator | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)

  // Fetch all projects with optional status filter
  const filters = selectedTab === 'all' || selectedTab === 'my-projects' ? {} : { status: selectedTab as ProjectStatus }
  const { data, isLoading, isError } = useProjectsQuery(filters)

  // Fetch user's enrolled projects
  const { data: myProgramsData, isLoading: isLoadingMy, isError: isErrorMy } = useMyProjectsQuery()

  const programs = selectedTab === 'my-projects'
    ? (myProgramsData?.enrollments || []).map(e => e.project)
    : (data?.projects || [])
  const total = selectedTab === 'my-projects'
    ? (myProgramsData?.enrollments || []).length
    : (data?.total || 0)

  const enrollments = myProgramsData?.enrollments || []
  const isLoadingData = selectedTab === 'my-projects' ? isLoadingMy : isLoading
  const isErrorData = selectedTab === 'my-projects' ? isErrorMy : isError

  const handleViewDetails = (program: ProjectWithCreator) => {
    setSelectedProject(program)
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
                <h1 className="text-3xl font-bold text-foreground">Proyectos</h1>
                <p className="text-muted-foreground">
                  Descubre cursos, talleres y proyectos de aceleración
                </p>
              </div>
            </div>
            <CreateProjectDialog />
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
              variant={selectedTab === 'my-projects' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSelectedTab('my-projects')}
            >
              Mis Proyectos
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
