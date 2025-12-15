// ABOUTME: Project card component displaying program details with action buttons
// ABOUTME: Shows title, description, skills, dates, instructor, and enrollment status

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Calendar, Clock, Users, MapPin, Pencil, Trash2 } from 'lucide-react'
import { useCancelEnrollmentMutation } from '../hooks/mutations/useCancelEnrollmentMutation'
import { useDeleteProjectMutation } from '../hooks/mutations/useDeleteProjectMutation'
import { useMyProjectsQuery } from '../hooks/queries/useMyProjectsQuery'
import { useAuthContext } from '@/app/features/auth/hooks/useAuthContext'
import type { ProjectWithCreator } from '../data/schemas/project.schema'
import { useState, useMemo } from 'react'
import { EditProjectDialog } from './EditProjectDialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface ProjectCardProps {
  program: ProjectWithCreator
  onViewDetails?: (program: ProjectWithCreator) => void
}

const typeLabels = {
  aceleracion: 'Aceleración',
  workshop: 'Workshop',
  bootcamp: 'Bootcamp',
  mentoria: 'Mentoría',
  curso: 'Curso',
  proyecto: 'Proyecto',
  otro: 'Otro'
}

const statusLabels = {
  upcoming: 'Próximo',
  active: 'En curso',
  completed: 'Completado',
  cancelled: 'Cancelado'
}

const statusVariants = {
  upcoming: 'default',
  active: 'default',
  completed: 'secondary',
  cancelled: 'destructive'
} as const

const statusColors = {
  upcoming: 'bg-blue-500',
  active: 'bg-green-500',
  completed: 'bg-gray-500',
  cancelled: 'bg-red-500'
}

export function ProjectCard({ program, onViewDetails }: ProjectCardProps) {
  const { user } = useAuthContext()
  const { cancel, isLoading: isCancelling } = useCancelEnrollmentMutation()
  const { action: deleteProject, isLoading: isDeleting } = useDeleteProjectMutation()
  const { data: myProjectsData } = useMyProjectsQuery({ enabled: !!user })

  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  // Find if user is enrolled in this program
  const userEnrollment = useMemo(() => {
    if (!myProjectsData?.enrollments) {
      return null
    }

    // Use strict comparison and convert to string to ensure type consistency
    const found = myProjectsData.enrollments.find(e => {
      // Safety check: ensure e.project exists before accessing its id
      if (!e.project) {
        return false
      }
      // Compare both as strings to handle type mismatches
      return String(e.project.id) === String(program.id)
    })

    return found
  }, [myProjectsData?.enrollments, program.id])

  const isEnrolled = !!userEnrollment
  const enrollmentId = userEnrollment?.id

  const handleCancel = () => {
    if (enrollmentId) {
      cancel(String(enrollmentId))
    }
  }

  const handleViewDetails = () => {
    if (onViewDetails) {
      onViewDetails(program)
    }
  }

  const handleDelete = () => {
    deleteProject(String(program.id))
    setShowDeleteDialog(false)
  }

  const isFull = program.max_participants && program.participants >= program.max_participants
  const canCancel = isEnrolled && program.status === 'upcoming'
  const isCreator = user && program.created_by === user.id

  return (
    <Card className={`hover:shadow-lg transition-shadow ${program.featured ? 'ring-2 ring-primary/20' : ''}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="text-xs">
                {typeLabels[program.type]}
              </Badge>
              <Badge variant={statusVariants[program.status]} className={statusColors[program.status]}>
                {statusLabels[program.status]}
              </Badge>
              {program.featured && (
                <Badge variant="default" className="bg-yellow-500 text-white text-xs">
                  Destacado
                </Badge>
              )}
            </div>
            <h3 className="text-xl font-semibold mb-2">{program.title}</h3>
          </div>

          <div className="text-right flex items-start gap-2">
            <div className="text-lg font-bold text-primary">{program.price || 'Gratuito'}</div>
            {isCreator && (
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setShowEditDialog(true)}
                  title="Editar programa"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => setShowDeleteDialog(true)}
                  title="Eliminar programa"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Description */}
        <p className="text-sm text-muted-foreground line-clamp-3">
          {program.description}
        </p>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center text-muted-foreground">
            <Clock className="h-4 w-4 mr-2" />
            {program.duration}
          </div>
          <div className="flex items-center text-muted-foreground">
            <MapPin className="h-4 w-4 mr-2" />
            {program.location || 'Online'}
          </div>
          <div className="flex items-center text-muted-foreground">
            <Users className="h-4 w-4 mr-2" />
            {program.participants}/{program.max_participants || '∞'} plazas
          </div>
          <div className="flex items-center text-muted-foreground">
            <Calendar className="h-4 w-4 mr-2" />
            {new Date(program.start_date).toLocaleDateString('es-ES')}
          </div>
        </div>

        {/* Skills */}
        {program.skills.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {program.skills.map((skill) => (
              <Badge key={skill} variant="secondary" className="text-xs">
                {skill}
              </Badge>
            ))}
          </div>
        )}

        {/* Instructor and Actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center space-x-2">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-xs">
                {program.instructor.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm text-muted-foreground">
              {program.instructor}
            </span>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleViewDetails}
            >
              Ver detalles
            </Button>
            {canCancel && (
              <Button
                size="sm"
                variant="destructive"
                onClick={handleCancel}
                disabled={isCancelling}
              >
                {isCancelling ? 'Cancelando...' : 'Cancelar'}
              </Button>
            )}
            {isEnrolled && !canCancel && (
              <Badge variant="default" className="bg-green-500">
                Inscrito ✓
              </Badge>
            )}
            {isFull && program.status === 'upcoming' && !isEnrolled && (
              <Badge variant="secondary">
                Completo
              </Badge>
            )}
          </div>
        </div>
      </CardContent>

      {/* Edit Dialog */}
      {isCreator && (
        <EditProjectDialog
          program={program}
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar programa?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará el programa "{program.title}" permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
