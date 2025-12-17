// ABOUTME: Opportunity detail page displaying full opportunity information
// ABOUTME: Shows opportunity details with interest action and creator contact

import { useParams, useNavigate } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { Navigation } from '@/components/layout/Navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import {
  Briefcase,
  MapPin,
  Clock,
  Calendar,
  DollarSign,
  ArrowLeft,
  MessageCircle,
  Loader2,
  Heart,
  Edit
} from 'lucide-react'
import { useOpportunityQuery } from '@/app/features/opportunities/hooks/queries/useOpportunityQuery'
import { useAuthContext } from '@/app/features/auth/hooks/useAuthContext'
import { CreateOpportunityDialog } from '@/app/features/opportunities/components/CreateOpportunityDialog'
import { useExpressInterestMutation } from '@/app/features/opportunities/hooks/mutations/useExpressInterestMutation'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { useState } from 'react'
import { useToast } from '@/hooks/use-toast'
import type { OpportunityType, OpportunityStatus } from '@/app/features/opportunities/data/schemas/opportunity.schema'

const typeLabels: Record<OpportunityType, string> = {
  proyecto: 'Proyecto',
  colaboracion: 'Colaboración',
  empleo: 'Empleo',
  mentoria: 'Mentoría',
  evento: 'Evento',
  otro: 'Otro'
}

const statusLabels: Record<OpportunityStatus, string> = {
  abierta: 'Abierta',
  en_progreso: 'En Progreso',
  cerrada: 'Cerrada',
  cancelada: 'Cancelada'
}

const statusVariants: Record<OpportunityStatus, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  abierta: 'default',
  en_progreso: 'secondary',
  cerrada: 'outline',
  cancelada: 'destructive'
}

export function OpportunityDetailPage() {
  const { opportunityId } = useParams<{ opportunityId: string }>()
  const navigate = useNavigate()
  const { user } = useAuthContext()
  const { toast } = useToast()
  const [isInterested, setIsInterested] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  const { data: opportunity, isLoading, error } = useOpportunityQuery(opportunityId)
  const expressInterest = useExpressInterestMutation()

  const handleBack = () => {
    navigate('/opportunities')
  }

  const handleContactCreator = () => {
    if (opportunity?.creator.id) {
      navigate(`/messages/${opportunity.creator.id}`)
    }
  }

  const handleExpressInterest = async () => {
    if (!opportunity || !opportunityId) return

    try {
      await expressInterest.action({
        opportunityId: opportunityId
      })

      setIsInterested(true)
      toast({
        title: '¡Interés registrado!',
        description: `Hemos notificado a ${opportunity.creator.name} sobre tu interés. Pronto te contactará.`
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.message || 'No se pudo registrar tu interés. Inténtalo de nuevo.',
        variant: 'destructive'
      })
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !opportunity) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <Card className="p-8 text-center">
            <p className="text-destructive">No se pudo cargar la oportunidad</p>
            <p className="text-muted-foreground text-sm mt-2">
              {error?.message || 'Oportunidad no encontrada'}
            </p>
            <Button onClick={handleBack} className="mt-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a oportunidades
            </Button>
          </Card>
        </div>
      </div>
    )
  }

  const createdAt = new Date(opportunity.created_at)
  const timeAgo = formatDistanceToNow(createdAt, {
    addSuffix: true,
    locale: es
  })

  const isOwner = user?.id === opportunity.created_by

  return (
    <AppLayout>
      <Navigation />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Back button */}
        <Button
          variant="ghost"
          onClick={handleBack}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a oportunidades
        </Button>

        {/* Main card */}
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex flex-col gap-4">
              {/* Status and type badges */}
              <div className="flex items-center gap-2">
                <Badge variant={statusVariants[opportunity.status]}>
                  {statusLabels[opportunity.status]}
                </Badge>
                <Badge variant="outline">
                  <Briefcase className="h-3 w-3 mr-1" />
                  {typeLabels[opportunity.type]}
                </Badge>
              </div>

              {/* Title */}
              <CardTitle className="text-3xl">{opportunity.title}</CardTitle>

              {/* Creator info */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage
                      src={opportunity.creator.avatar_url || undefined}
                      alt={opportunity.creator.name}
                    />
                    <AvatarFallback>
                      {opportunity.creator.name?.charAt(0)?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{opportunity.creator.name}</p>
                    {opportunity.creator.professional_title && (
                      <p className="text-sm text-muted-foreground">
                        {opportunity.creator.professional_title}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Clock className="h-4 w-4 mr-1" />
                  {timeAgo}
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Description */}
            <div>
              <h3 className="font-semibold mb-2">Descripción</h3>
              <p className="text-muted-foreground whitespace-pre-wrap">
                {opportunity.description}
              </p>
            </div>

            <Separator />

            {/* Skills required */}
            {opportunity.skills_required.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3">Habilidades requeridas</h3>
                <div className="flex flex-wrap gap-2">
                  {opportunity.skills_required.map((skill) => (
                    <Badge key={skill} variant="secondary">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <Separator />

            {/* Additional details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {opportunity.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Ubicación</p>
                    <p className="text-sm text-muted-foreground">{opportunity.location}</p>
                  </div>
                </div>
              )}

              {opportunity.duration && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Duración</p>
                    <p className="text-sm text-muted-foreground">{opportunity.duration}</p>
                  </div>
                </div>
              )}

              {opportunity.remote && (
                <div className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Modalidad</p>
                    <Badge variant="secondary">Remoto</Badge>
                  </div>
                </div>
              )}

              {opportunity.compensation && (
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Compensación</p>
                    <p className="text-sm text-muted-foreground">{opportunity.compensation}</p>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Actions */}
            {!isOwner && (
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleExpressInterest}
                  disabled={expressInterest.isLoading || isInterested}
                  className="flex-1"
                  size="lg"
                >
                  <Heart className={`h-5 w-5 mr-2 ${isInterested ? 'fill-current' : ''}`} />
                  {expressInterest.isLoading
                    ? 'Enviando...'
                    : isInterested
                      ? '¡Te interesa!'
                      : 'Me interesa'}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleContactCreator}
                  className="flex-1"
                  size="lg"
                >
                  <MessageCircle className="h-5 w-5 mr-2" />
                  Contactar
                </Button>
              </div>
            )}

            {isOwner && (
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={() => setIsEditDialogOpen(true)}
                  className="flex-1"
                  size="lg"
                >
                  <Edit className="h-5 w-5 mr-2" />
                  Editar oportunidad
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit opportunity dialog */}
      <CreateOpportunityDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        opportunity={opportunity}
      />
    </AppLayout>
  )
}
