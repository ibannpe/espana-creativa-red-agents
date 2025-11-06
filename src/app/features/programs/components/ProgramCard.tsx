// ABOUTME: Program card component displaying program details with action buttons
// ABOUTME: Shows title, description, skills, dates, instructor, and enrollment status

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Calendar, Clock, Users, MapPin } from 'lucide-react'
import { useEnrollInProgramMutation } from '../hooks/mutations/useEnrollInProgramMutation'
import { useAuthContext } from '@/app/features/auth/hooks/useAuthContext'
import type { ProgramWithCreator } from '../data/schemas/program.schema'
import { useState } from 'react'

interface ProgramCardProps {
  program: ProgramWithCreator
  onViewDetails?: (program: ProgramWithCreator) => void
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

export function ProgramCard({ program, onViewDetails }: ProgramCardProps) {
  const { user } = useAuthContext()
  const { action: enroll, isLoading: isEnrolling, isSuccess } = useEnrollInProgramMutation()
  const [enrolled, setEnrolled] = useState(false)

  const handleEnroll = () => {
    enroll(program.id, {
      onSuccess: () => {
        setEnrolled(true)
      }
    })
  }

  const handleViewDetails = () => {
    if (onViewDetails) {
      onViewDetails(program)
    }
  }

  const isFull = program.max_participants && program.participants >= program.max_participants
  const canEnroll = program.status === 'upcoming' && !isFull && !enrolled && !isSuccess

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

          <div className="text-right">
            <div className="text-lg font-bold text-primary">{program.price || 'Gratuito'}</div>
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
            {canEnroll && (
              <Button
                size="sm"
                onClick={handleEnroll}
                disabled={isEnrolling}
              >
                {isEnrolling ? 'Inscribiendo...' : 'Inscribirse'}
              </Button>
            )}
            {(enrolled || isSuccess) && (
              <Badge variant="default" className="bg-green-500">
                Inscrito ✓
              </Badge>
            )}
            {isFull && program.status === 'upcoming' && (
              <Badge variant="secondary">
                Completo
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
