// ABOUTME: Dialog component to show full program details with enrollment option
// ABOUTME: Displays comprehensive information including description, schedule, instructor details

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Calendar, Clock, Users, MapPin, DollarSign, Award } from 'lucide-react'
import { useEnrollInProjectMutation } from '../hooks/mutations/useEnrollInProjectMutation'
import { useCancelEnrollmentMutation } from '../hooks/mutations/useCancelEnrollmentMutation'
import { useMyProjectsQuery } from '../hooks/queries/useMyProjectsQuery'
import { useAuthContext } from '@/app/features/auth/hooks/useAuthContext'
import type { ProjectWithCreator } from '../data/schemas/program.schema'
import { useMemo } from 'react'

interface ProjectDetailsDialogProps {
  program: ProjectWithCreator | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const typeLabels = {
  aceleracion: 'Aceleración',
  workshop: 'Workshop',
  bootcamp: 'Bootcamp',
  mentoria: 'Mentoría',
  curso: 'Curso',
  otro: 'Otro'
}

const statusLabels = {
  upcoming: 'Próximo',
  active: 'En curso',
  completed: 'Completado',
  cancelled: 'Cancelado'
}

const statusColors = {
  upcoming: 'bg-blue-500',
  active: 'bg-green-500',
  completed: 'bg-gray-500',
  cancelled: 'bg-red-500'
}

export function ProjectDetailsDialog({ program, open, onOpenChange }: ProjectDetailsDialogProps) {
  const { user } = useAuthContext()
  const { enroll, isLoading: isEnrolling } = useEnrollInProjectMutation()
  const { cancel, isLoading: isCancelling } = useCancelEnrollmentMutation()
  const { data: myProjectsData } = useMyProjectsQuery({ enabled: !!user })

  // Find if user is enrolled in this program
  const userEnrollment = useMemo(() => {
    if (!myProjectsData?.enrollments || !program) return null
    // Use string comparison to ensure type consistency
    return myProjectsData.enrollments.find(e => {
      // Safety check: ensure e.project exists before accessing its id
      if (!e.project) return false
      return String(e.project.id) === String(program.id)
    })
  }, [myProjectsData, program])

  if (!program) return null

  const isEnrolled = !!userEnrollment
  const enrollmentId = userEnrollment?.id

  const handleEnroll = () => {
    if (!user) {
      alert('Debes iniciar sesión para inscribirte')
      return
    }

    enroll(String(program.id))
  }

  const handleCancel = () => {
    if (enrollmentId) {
      cancel(String(enrollmentId))
    }
  }

  const isFull = program.max_participants && program.participants >= program.max_participants
  const canEnroll = program.status === 'upcoming' && !isFull && !isEnrolled
  const canCancel = isEnrolled && program.status === 'upcoming'

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="outline" className="text-xs">
                  {typeLabels[program.type]}
                </Badge>
                <Badge variant="default" className={statusColors[program.status]}>
                  {statusLabels[program.status]}
                </Badge>
                {program.featured && (
                  <Badge variant="default" className="bg-yellow-500 text-white text-xs">
                    ⭐ Destacado
                  </Badge>
                )}
              </div>
              <DialogTitle className="text-2xl mb-2">{program.title}</DialogTitle>
            </div>
            <div className="text-right">
              <div className="flex items-center text-2xl font-bold text-primary">
                <DollarSign className="h-5 w-5" />
                {program.price || 'Gratuito'}
              </div>
            </div>
          </div>
          <DialogDescription className="text-base">
            {program.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Project Details Grid */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-primary mt-1" />
              <div>
                <p className="font-medium text-sm">Fecha de inicio</p>
                <p className="text-sm text-muted-foreground">{formatDate(program.start_date)}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-primary mt-1" />
              <div>
                <p className="font-medium text-sm">Fecha de fin</p>
                <p className="text-sm text-muted-foreground">{formatDate(program.end_date)}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-primary mt-1" />
              <div>
                <p className="font-medium text-sm">Duración</p>
                <p className="text-sm text-muted-foreground">{program.duration}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-primary mt-1" />
              <div>
                <p className="font-medium text-sm">Ubicación</p>
                <p className="text-sm text-muted-foreground">{program.location || 'Online'}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 col-span-2">
              <Users className="h-5 w-5 text-primary mt-1" />
              <div>
                <p className="font-medium text-sm">Plazas disponibles</p>
                <p className="text-sm text-muted-foreground">
                  {program.participants} / {program.max_participants || '∞'} inscritos
                  {isFull && <span className="text-destructive ml-2">(Completo)</span>}
                </p>
              </div>
            </div>
          </div>

          {/* Skills/Tags */}
          {program.skills.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Award className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Habilidades que desarrollarás</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {program.skills.map((skill) => (
                  <Badge key={skill} variant="secondary">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Instructor Info */}
          <div className="p-4 bg-muted rounded-lg">
            <h3 className="font-semibold mb-3">Instructor</h3>
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="text-lg font-semibold">
                  {program.instructor.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{program.instructor}</p>
                {program.creator?.professional_title && (
                  <p className="text-sm text-muted-foreground">{program.creator.professional_title}</p>
                )}
              </div>
            </div>
          </div>

          {/* Enrollment Section */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              {isEnrolled && !canCancel ? (
                <span className="text-green-600 font-medium">✓ Ya estás inscrito en este programa</span>
              ) : canEnroll ? (
                user ? (
                  'Inscríbete ahora para reservar tu plaza'
                ) : (
                  'Inicia sesión para inscribirte'
                )
              ) : canCancel ? (
                'Puedes cancelar tu inscripción si ya no deseas participar'
              ) : isFull ? (
                'Este programa está completo'
              ) : program.status === 'active' ? (
                'Este programa ya está en curso'
              ) : program.status === 'completed' ? (
                'Este programa ha finalizado'
              ) : null}
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cerrar
              </Button>
              {canEnroll && user && (
                <Button
                  onClick={handleEnroll}
                  disabled={isEnrolling}
                >
                  {isEnrolling ? 'Inscribiendo...' : 'Inscribirse ahora'}
                </Button>
              )}
              {canCancel && (
                <Button
                  variant="destructive"
                  onClick={handleCancel}
                  disabled={isCancelling}
                >
                  {isCancelling ? 'Cancelando...' : 'Cancelar inscripción'}
                </Button>
              )}
              {isEnrolled && !canCancel && (
                <Badge variant="default" className="bg-green-500 text-white px-4 py-2">
                  Inscrito ✓
                </Badge>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
