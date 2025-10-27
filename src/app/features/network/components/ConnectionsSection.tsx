// ABOUTME: ConnectionsSection component for managing user connections
// ABOUTME: Displays received requests, sent requests, and active connections in tabs

import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthContext } from '@/app/features/auth/hooks/useAuthContext'
import { useConnectionsQuery } from '../hooks/queries/useConnectionsQuery'
import { useUpdateConnectionMutation } from '../hooks/mutations/useUpdateConnectionMutation'
import { useDeleteConnectionMutation } from '../hooks/mutations/useDeleteConnectionMutation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from '@/hooks/use-toast'
import {
  Check,
  X,
  Clock,
  Trash2,
  UserCheck,
  Inbox,
  Send,
  Users,
  MapPin,
  Loader2,
  Eye,
  MessageSquare
} from 'lucide-react'
import type { ConnectionWithUser } from '../data/schemas/network.schema'

export function ConnectionsSection() {
  // Auth context para obtener el usuario actual
  const { user } = useAuthContext()
  const navigate = useNavigate()

  // Queries para obtener conexiones
  const { data: pendingConnections, isLoading: isLoadingPending } =
    useConnectionsQuery({ status: 'pending' })

  const { data: acceptedConnections, isLoading: isLoadingAccepted } =
    useConnectionsQuery({ status: 'accepted' })

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
  const connectionsCount = acceptedConnections?.length || 0

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

  // Eliminar conexión activa
  const handleRemove = (connectionId: string) => {
    deleteConnection(connectionId, {
      onSuccess: () => {
        toast({
          title: 'Conexión eliminada',
          description: 'La conexión ha sido eliminada correctamente'
        })
      },
      onError: (error) => {
        toast({
          title: 'Error',
          description: error.message || 'No se pudo eliminar la conexión',
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
    type: 'received' | 'sent' | 'connected'
  }) {
    const { connection, user: otherUser } = connectionWithUser
    const isLoading = isUpdating || isDeleting

    const handleNavigateToProfile = () => {
      navigate(`/users/${otherUser.id}`)
    }

    return (
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
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

                {type === 'connected' && (
                  <>
                    <Badge variant="default" className="flex items-center gap-1">
                      <UserCheck className="h-3 w-3" />
                      Conectado
                    </Badge>
                    <Button
                      size="sm"
                      onClick={() => navigate(`/messages/${otherUser.id}`)}
                      className="flex items-center gap-2"
                    >
                      <MessageSquare className="h-4 w-4" />
                      Enviar mensaje
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRemove(connection.id)}
                      disabled={isLoading}
                      className="flex items-center gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      Eliminar
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

  // Componente EmptyState (Interno)
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
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl">Mis Conexiones</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="received">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="received">
              Solicitudes recibidas ({receivedCount})
            </TabsTrigger>
            <TabsTrigger value="sent">
              Solicitudes enviadas ({sentCount})
            </TabsTrigger>
            <TabsTrigger value="connections">
              Mis conexiones ({connectionsCount})
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

          {/* Tab: Mis Conexiones */}
          <TabsContent value="connections" className="space-y-4 mt-6">
            {isLoadingAccepted ? (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
              </div>
            ) : connectionsCount === 0 ? (
              <EmptyState
                icon={Users}
                title="Aún no tienes conexiones"
                description="Comienza a conectar con otros miembros de España Creativa"
              />
            ) : (
              acceptedConnections?.map((item) => (
                <ConnectionItem
                  key={item.connection.id}
                  connectionWithUser={item}
                  type="connected"
                />
              ))
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
