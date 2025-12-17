// ABOUTME: My Programs page showing user's enrolled programs
// ABOUTME: Displays enrolled, completed, and dropped programs with status filtering

import { useState } from 'react'
import { AppLayout } from '@/components/layout/AppLayout'
import { Navigation } from '@/components/layout/Navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BookOpen, Calendar, Clock, MapPin, GraduationCap } from 'lucide-react'
import { useMyProgramsQuery } from '@/app/features/programs/hooks/queries/useMyProgramsQuery'
import { ProgramDetailsDialog } from '@/app/features/programs/components/ProgramDetailsDialog'
import type { ProgramWithCreator, ProgramStatus } from '@/app/features/programs/data/schemas/program.schema'
import type { EnrollmentStatus } from '@/app/features/programs/data/schemas/enrollment.schema'

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

export function MyProgramsPage() {
  const [selectedTab, setSelectedTab] = useState<EnrollmentStatus | 'all'>('enrolled')
  const [selectedProgram, setSelectedProgram] = useState<ProgramWithCreator | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)

  const { data, isLoading, isError } = useMyProgramsQuery()

  const enrollments = data?.enrollments || []

  // Filter by enrollment status
  const filteredEnrollments = selectedTab === 'all'
    ? enrollments
    : enrollments.filter(e => e.status === selectedTab)

  const handleViewDetails = (program: ProgramWithCreator) => {
    setSelectedProgram(program)
    setDetailsOpen(true)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  // Calculate stats
  const stats = {
    enrolled: enrollments.filter(e => e.status === 'enrolled').length,
    completed: enrollments.filter(e => e.status === 'completed').length,
    total: enrollments.length
  }

  return (
    <AppLayout>
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-emerald-600 rounded-xl flex items-center justify-center">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Mis Programas</h1>
              <p className="text-muted-foreground">
                Gestiona tus inscripciones y revisa tu progreso
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex space-x-1 bg-muted p-1 rounded-lg w-fit">
            <Button
              variant={selectedTab === 'enrolled' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSelectedTab('enrolled')}
            >
              Activos
            </Button>
            <Button
              variant={selectedTab === 'completed' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSelectedTab('completed')}
            >
              Completados
            </Button>
            <Button
              variant={selectedTab === 'dropped' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSelectedTab('dropped')}
            >
              Abandonados
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-primary mb-2">{stats.enrolled}</div>
              <p className="text-sm text-muted-foreground">Programas activos</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-primary mb-2">{stats.completed}</div>
              <p className="text-sm text-muted-foreground">Programas completados</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-primary mb-2">{stats.total}</div>
              <p className="text-sm text-muted-foreground">Total de inscripciones</p>
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
            {filteredEnrollments.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredEnrollments.map((enrollment) => {
                  const program = enrollment.program
                  return (
                    <Card key={enrollment.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        {/* Header */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline" className="text-xs">
                                {typeLabels[program.type]}
                              </Badge>
                              <Badge
                                variant="default"
                                className={enrollmentStatusColors[enrollment.status]}
                              >
                                {enrollmentStatusLabels[enrollment.status]}
                              </Badge>
                            </div>
                            <h3 className="font-semibold text-lg mb-1">{program.title}</h3>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {program.description}
                            </p>
                          </div>
                        </div>

                        {/* Details */}
                        <div className="grid grid-cols-2 gap-3 mb-4">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4 text-primary" />
                            <span>{formatDate(program.start_date)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4 text-primary" />
                            <span>{program.duration}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground col-span-2">
                            <MapPin className="h-4 w-4 text-primary" />
                            <span>{program.location || 'Online'}</span>
                          </div>
                        </div>

                        {/* Enrollment Info */}
                        <div className="bg-muted p-3 rounded-lg mb-4">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Inscrito el:</span>
                            <span className="font-medium">{formatDate(enrollment.enrolled_at)}</span>
                          </div>
                          {enrollment.completed_at && (
                            <div className="flex items-center justify-between text-sm mt-1">
                              <span className="text-muted-foreground">Completado el:</span>
                              <span className="font-medium">{formatDate(enrollment.completed_at)}</span>
                            </div>
                          )}
                          {enrollment.rating && (
                            <div className="flex items-center justify-between text-sm mt-1">
                              <span className="text-muted-foreground">Tu valoración:</span>
                              <span className="font-medium">{'⭐'.repeat(enrollment.rating)}</span>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => handleViewDetails(program)}
                          >
                            <BookOpen className="h-4 w-4 mr-2" />
                            Ver detalles
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            ) : (
              <Card className="text-center py-12">
                <CardContent>
                  <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">
                    No tienes programas en esta categoría
                  </p>
                  <Button
                    variant="default"
                    onClick={() => window.location.href = '/programs'}
                  >
                    Explorar programas
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Total count */}
            {filteredEnrollments.length > 0 && (
              <div className="text-center mt-8 text-sm text-muted-foreground">
                Mostrando {filteredEnrollments.length} de {enrollments.length} inscripciones
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
    </AppLayout>
  )
}
