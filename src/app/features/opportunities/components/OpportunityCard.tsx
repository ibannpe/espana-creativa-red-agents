// ABOUTME: Opportunity card component displaying opportunity details
// ABOUTME: Shows title, description, skills, type, location, and creator info

import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { MapPin, Briefcase, Clock, DollarSign, Trash2, Edit, Navigation, Mail, Phone } from 'lucide-react'
import { useDeleteOpportunityMutation } from '../hooks/mutations/useDeleteOpportunityMutation'
import type { OpportunityWithCreator, OpportunityWithCity } from '../data/schemas/opportunity.schema'

interface OpportunityCardProps {
  opportunity: OpportunityWithCreator | OpportunityWithCity
  onEdit?: (opportunity: OpportunityWithCreator) => void
  showActions?: boolean
  isOwner?: boolean
  showCityBadge?: boolean
}

const typeLabels = {
  proyecto: 'Proyecto',
  colaboracion: 'Colaboración',
  empleo: 'Empleo',
  mentoria: 'Mentoría',
  evento: 'Evento',
  otro: 'Otro'
}

const statusLabels = {
  abierta: 'Abierta',
  en_progreso: 'En Progreso',
  cerrada: 'Cerrada',
  cancelada: 'Cancelada'
}

const statusVariants = {
  abierta: 'default',
  en_progreso: 'secondary',
  cerrada: 'outline',
  cancelada: 'destructive'
} as const

export function OpportunityCard({
  opportunity,
  onEdit,
  showActions = false,
  isOwner = false,
  showCityBadge = false
}: OpportunityCardProps) {
  const { action: deleteOpportunity, isLoading: isDeleting } = useDeleteOpportunityMutation()

  // Type guard to check if opportunity has city data
  const hasCity = 'city' in opportunity && opportunity.city !== undefined

  const handleDelete = () => {
    if (confirm('¿Estás seguro de que quieres eliminar esta oportunidad?')) {
      deleteOpportunity(opportunity.id)
    }
  }

  const handleEdit = () => {
    if (onEdit) {
      onEdit(opportunity as OpportunityWithCreator)
    }
  }

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <Badge variant={statusVariants[opportunity.status]}>
                {statusLabels[opportunity.status]}
              </Badge>
              <Badge variant="outline">
                <Briefcase className="h-3 w-3 mr-1" />
                {typeLabels[opportunity.type]}
              </Badge>
              {/* City Badge - Optional */}
              {showCityBadge && hasCity && (
                <Badge variant="secondary" className="bg-primary/10 text-primary">
                  <Navigation className="h-3 w-3 mr-1" />
                  {opportunity.city.name}
                </Badge>
              )}
            </div>
            <h3 className="text-xl font-semibold mb-2">{opportunity.title}</h3>
          </div>

          {/* Creator Info */}
          <div className="flex items-center gap-2">
            <Avatar className="h-10 w-10">
              <AvatarImage src={opportunity.creator.avatar_url || undefined} alt={opportunity.creator.name} />
              <AvatarFallback>
                {opportunity.creator.name?.charAt(0)?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="text-sm">
              <p className="font-medium">{opportunity.creator.name}</p>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Description */}
        <p className="text-sm text-muted-foreground line-clamp-3">
          {opportunity.description}
        </p>

        {/* Skills Required */}
        {opportunity.skills_required.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Habilidades requeridas:</p>
            <div className="flex flex-wrap gap-2">
              {opportunity.skills_required.map((skill) => (
                <Badge key={skill} variant="secondary" className="text-xs">
                  {skill}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Contact Information */}
        <div className="border-t pt-3 space-y-2">
          <p className="text-xs font-medium text-muted-foreground mb-2">Información de contacto:</p>
          <div className="flex flex-col gap-2 text-sm">
            <a
              href={`mailto:${opportunity.contact_email}`}
              className="flex items-center gap-2 text-primary hover:underline"
            >
              <Mail className="h-4 w-4" />
              <span>{opportunity.contact_email}</span>
            </a>
            <a
              href={`tel:${opportunity.contact_phone}`}
              className="flex items-center gap-2 text-primary hover:underline"
            >
              <Phone className="h-4 w-4" />
              <span>{opportunity.contact_phone}</span>
            </a>
          </div>
        </div>

        {/* Details */}
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          {opportunity.location && (
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              <span>{opportunity.location}</span>
            </div>
          )}

          {opportunity.remote && (
            <Badge variant="outline" className="text-xs">
              Remoto
            </Badge>
          )}

          {opportunity.duration && (
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{opportunity.duration}</span>
            </div>
          )}

          {opportunity.compensation && (
            <div className="flex items-center gap-1">
              <DollarSign className="h-4 w-4" />
              <span>{opportunity.compensation}</span>
            </div>
          )}
        </div>
      </CardContent>

      {showActions && isOwner && (
        <CardFooter className="flex justify-end gap-2 pt-4 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={handleEdit}
            className="flex items-center gap-2"
          >
            <Edit className="h-4 w-4" />
            Editar
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            {isDeleting ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}
