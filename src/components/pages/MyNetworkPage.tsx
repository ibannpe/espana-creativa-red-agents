// ABOUTME: Page displaying all user connections (accepted connections only)
// ABOUTME: Shows connected users with their profile information and actions

import { useNavigate } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { Navigation } from '@/components/layout/Navigation'
import { useConnectionsQuery } from '@/app/features/network/hooks/queries/useConnectionsQuery'
import { useDeleteConnectionMutation } from '@/app/features/network/hooks/mutations/useDeleteConnectionMutation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from '@/hooks/use-toast'
import {
  Users,
  Trash2,
  UserCheck,
  MapPin,
  Loader2,
  Eye,
  ArrowLeft
} from 'lucide-react'
import type { ConnectionWithUser } from '@/app/features/network/data/schemas/network.schema'

export function MyNetworkPage() {
  const navigate = useNavigate()

  // Query para obtener solo conexiones aceptadas
  const { data: acceptedConnections, isLoading: isLoadingAccepted } =
    useConnectionsQuery({ status: 'accepted' })

  // Mutation para eliminar conexión
  const { action: deleteConnection, isLoading: isDeleting } =
    useDeleteConnectionMutation()

  const connectionsCount = acceptedConnections?.length || 0

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
    connectionWithUser
  }: {
    connectionWithUser: ConnectionWithUser
  }) {
    const { connection, user: otherUser } = connectionWithUser

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
                <Badge variant="default" className="flex items-center gap-1">
                  <UserCheck className="h-3 w-3" />
                  Conectado
                </Badge>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleRemove(connection.id)}
                  disabled={isDeleting}
                  className="flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Eliminar
                </Button>

                {/* Ver Perfil button */}
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
  function EmptyState() {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
          <Users className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="font-semibold text-lg mb-2">Aún no tienes conexiones</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Comienza a conectar con otros miembros de España Creativa
        </p>
        <Button onClick={() => navigate('/network')}>
          Buscar miembros
        </Button>
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
              <Users className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Mi Red</h1>
              <p className="text-muted-foreground">
                Todas tus conexiones activas ({connectionsCount})
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-2xl">Mis Conexiones</CardTitle>
            <CardDescription>
              Gestiona tus contactos y mantente en contacto con la comunidad
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingAccepted ? (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
              </div>
            ) : connectionsCount === 0 ? (
              <EmptyState />
            ) : (
              <div className="space-y-4">
                {acceptedConnections?.map((item) => (
                  <ConnectionItem
                    key={item.connection.id}
                    connectionWithUser={item}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
