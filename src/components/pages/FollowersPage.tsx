// ABOUTME: Page displaying followers and following (pending connections)
// ABOUTME: Shows received and sent connection requests in tabs

import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { Navigation } from '@/components/layout/Navigation'
import { useAuthContext } from '@/app/features/auth/hooks/useAuthContext'
import { useConnectionsQuery } from '@/app/features/network/hooks/queries/useConnectionsQuery'
import { useUpdateConnectionMutation } from '@/app/features/network/hooks/mutations/useUpdateConnectionMutation'
import { useDeleteConnectionMutation } from '@/app/features/network/hooks/mutations/useDeleteConnectionMutation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from '@/hooks/use-toast'
import {
  Check,
  X,
  Clock,
  UserPlus,
  Inbox,
  Send,
  MapPin,
  Loader2,
  Eye,
  ArrowLeft
} from 'lucide-react'
import type { ConnectionWithUser } from '@/app/features/network/data/schemas/network.schema'

export function FollowersPage() {
  const navigate = useNavigate()
  const { user } = useAuthContext()

  // Query para obtener conexiones pendientes
  const { data: pendingConnections, isLoading: isLoadingPending } =
    useConnectionsQuery({ status: 'pending' })

  // Mutations para acciones
  const { action: updateConnection, isLoading: isUpdating } =
    useUpdateConnectionMutation()

  const { action: deleteConnection, isLoading: isDeleting } =
    useDeleteConnectionMutation()

  // Separar solicitudes pendientes entre recibidas y enviadas
  const receivedRequests = useMemo(() =>
    pendingConnections?.filter(
      ({ connection }) => connection.addressee_id === user?.id
    ) || [],
    [pendingConnections, user?.id]
  )

  const sentRequests = useMemo(() =>
    pendingConnections?.filter(
      ({ connection }) => connection.requester_id === user?.id
    ) || [],
    [pendingConnections, user?.id]
  )

  // Contadores
  const receivedCount = receivedRequests.length
  const sentCount = sentRequests.length

  // Aceptar solicitud recibida
  const handleAccept = (connectionId: string) => {
    updateConnection(
      { connection_id: connectionId, status: 'accepted' },
      {
        onSuccess: () => {
          toast({
            title: 'Solicitud aceptada',
            description: 'Has aceptado la solicitud de conexión'
          })
        },
        onError: (error) => {
          toast({
            title: 'Error',
            description: error.message || 'No se pudo aceptar la solicitud',
            variant: 'destructive'
          })
        }
      }
    )
  }

  // Rechazar solicitud recibida
  const handleReject = (connectionId: string) => {
    updateConnection(
      { connection_id: connectionId, status: 'rejected' },
      {
        onSuccess: () => {
          toast({
            title: 'Solicitud rechazada',
            description: 'Has rechazado la solicitud de conexión'
          })
        },
        onError: (error) => {
          toast({
            title: 'Error',
            description: error.message || 'No se pudo rechazar la solicitud',
            variant: 'destructive'
          })
        }
      }
    )
  }

  // Cancelar solicitud enviada
  const handleCancel = (connectionId: string) => {
    deleteConnection(connectionId, {
      onSuccess: () => {
        toast({
          title: 'Solicitud cancelada',
          description: 'Tu solicitud de conexión ha sido cancelada'
        })
      },
      onError: (error) => {
        toast({
          title: 'Error',
          description: error.message || 'No se pudo cancelar la solicitud',
          variant: 'destructive'
        })
      }
    })
  }

  // Componente interno para renderizar cada conexión
  function ConnectionItem({
    connectionWithUser,
    type
  }: {
    connectionWithUser: ConnectionWithUser
    type: 'received' | 'sent'
  }) {
    const { connection, user: otherUser } = connectionWithUser
    const isLoading = isUpdating || isDeleting

    const handleNavigateToProfile = () => {
      navigate(`/users/${otherUser.id}`)
    }

    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <Avatar
              className="h-14 w-14 cursor-pointer"
              onClick={handleNavigateToProfile}
            >
              <AvatarImage src={otherUser.avatar_url || undefined} alt={otherUser.name || ''} />
              <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-white text-lg">
                {otherUser.name?.charAt(0)?.toUpperCase() || otherUser.email?.charAt(0)?.toUpperCase()}
              </AvatarFallback>
            </Avatar>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h3
                className="font-semibold text-base truncate cursor-pointer hover:text-primary transition-colors"
                onClick={handleNavigateToProfile}
              >
                {otherUser.name}
              </h3>
              <p className="text-sm text-muted-foreground truncate">{otherUser.email}</p>

              {otherUser.bio && (
                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                  {otherUser.bio}
                </p>
              )}

              <div className="flex flex-wrap gap-2 mt-2">
                {otherUser.location && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    <span>{otherUser.location}</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2 mt-4">
                {type === 'received' && (
                  <>
                    <Button
                      size="sm"
                      onClick={() => handleAccept(connection.id)}
                      disabled={isLoading}
                      className="flex items-center gap-2"
                    >
                      {isUpdating ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                      {isUpdating ? 'Aceptando...' : 'Aceptar'}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleReject(connection.id)}
                      disabled={isLoading}
                      className="flex items-center gap-2"
                    >
                      <X className="h-4 w-4" />
                      Rechazar
                    </Button>
                  </>
                )}

                {type === 'sent' && (
                  <>
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Pendiente
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCancel(connection.id)}
                      disabled={isLoading}
                      className="flex items-center gap-2"
                    >
                      <X className="h-4 w-4" />
                      Cancelar
                    </Button>
                  </>
                )}

                {/* Ver Perfil button - always visible */}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleNavigateToProfile}
                  className="flex items-center gap-2"
                >
                  <Eye className="h-4 w-4" />
                  Ver Perfil
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Componente EmptyState
  function EmptyState({
    icon: Icon,
    title,
    description
  }: {
    icon: React.ElementType
    title: string
    description: string
  }) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
          <Icon className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="font-semibold text-lg mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    )
  }

  return (
    <AppLayout>
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/network')}
            className="mb-4 flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a Red
          </Button>

          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-emerald-600 rounded-xl flex items-center justify-center">
              <UserPlus className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Siguiendo y Seguidores</h1>
              <p className="text-muted-foreground">
                Gestiona tus solicitudes de conexión pendientes
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-2xl">Solicitudes de Conexión</CardTitle>
            <CardDescription>
              Revisa las solicitudes recibidas y las que has enviado
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="received">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="received">
                  Recibidas ({receivedCount})
                </TabsTrigger>
                <TabsTrigger value="sent">
                  Enviadas ({sentCount})
                </TabsTrigger>
              </TabsList>

              {/* Tab: Solicitudes Recibidas */}
              <TabsContent value="received" className="space-y-4 mt-6">
                {isLoadingPending ? (
                  <div className="text-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                  </div>
                ) : receivedRequests.length === 0 ? (
                  <EmptyState
                    icon={Inbox}
                    title="No tienes solicitudes recibidas"
                    description="Las solicitudes de conexión que recibas aparecerán aquí"
                  />
                ) : (
                  receivedRequests.map((item) => (
                    <ConnectionItem
                      key={item.connection.id}
                      connectionWithUser={item}
                      type="received"
                    />
                  ))
                )}
              </TabsContent>

              {/* Tab: Solicitudes Enviadas */}
              <TabsContent value="sent" className="space-y-4 mt-6">
                {isLoadingPending ? (
                  <div className="text-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                  </div>
                ) : sentRequests.length === 0 ? (
                  <EmptyState
                    icon={Send}
                    title="No has enviado solicitudes"
                    description="Busca usuarios y envíales una solicitud de conexión"
                  />
                ) : (
                  sentRequests.map((item) => (
                    <ConnectionItem
                      key={item.connection.id}
                      connectionWithUser={item}
                      type="sent"
                    />
                  ))
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
