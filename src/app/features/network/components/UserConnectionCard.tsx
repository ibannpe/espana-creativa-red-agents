// ABOUTME: User connection card component showing user profile with connection actions
// ABOUTME: Uses network mutations for connect/accept/reject actions

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MapPin, Briefcase, UserPlus, UserCheck, UserX, Trash2, Eye } from 'lucide-react'
import { useRequestConnectionMutation } from '../hooks/mutations/useRequestConnectionMutation'
import { useUpdateConnectionMutation } from '../hooks/mutations/useUpdateConnectionMutation'
import { useDeleteConnectionMutation } from '../hooks/mutations/useDeleteConnectionMutation'
import { useConnectionStatusQuery } from '../hooks/queries/useConnectionStatusQuery'
import { useNavigate } from 'react-router-dom'
import type { UserProfile } from '@/app/features/profile/data/schemas/profile.schema'

interface UserConnectionCardProps {
  user: UserProfile
  connectionId?: string // If already connected
  showActions?: boolean
  compact?: boolean
}

export function UserConnectionCard({
  user,
  connectionId,
  showActions = true,
  compact = false
}: UserConnectionCardProps) {
  const navigate = useNavigate()
  const { data: connectionStatus } = useConnectionStatusQuery(user.id)
  const { action: requestConnection, isLoading: isRequesting } = useRequestConnectionMutation()
  const { action: updateConnection, isLoading: isUpdating } = useUpdateConnectionMutation()
  const { action: deleteConnection, isLoading: isDeleting } = useDeleteConnectionMutation()

  const handleConnect = () => {
    requestConnection({ addressee_id: user.id })
  }

  const handleAccept = () => {
    if (connectionId) {
      updateConnection({
        connection_id: connectionId,
        status: 'accepted'
      })
    }
  }

  const handleReject = () => {
    if (connectionId) {
      updateConnection({
        connection_id: connectionId,
        status: 'rejected'
      })
    }
  }

  const handleRemove = () => {
    if (connectionId) {
      deleteConnection(connectionId)
    }
  }

  const handleCardClick = () => {
    navigate(`/users/${user.id}`)
  }

  const status = connectionStatus?.status
  const isLoading = isRequesting || isUpdating || isDeleting

  return (
    <Card className={compact ? 'hover:shadow-md transition-shadow cursor-pointer' : 'cursor-pointer hover:shadow-md transition-shadow'}>
      <CardContent className={compact ? 'p-4' : 'p-6'}>
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <Avatar
            className={`${compact ? 'h-12 w-12' : 'h-16 w-16'} cursor-pointer`}
            onClick={handleCardClick}
          >
            <AvatarImage src={user.avatar_url || undefined} alt={user.name} />
            <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-white">
              {user.name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase()}
            </AvatarFallback>
          </Avatar>

          {/* User Info */}
          <div className="flex-1 min-w-0">
            <h3
              className={`font-semibold ${compact ? 'text-sm' : 'text-base'} truncate cursor-pointer hover:text-primary transition-colors`}
              onClick={handleCardClick}
            >
              {user.name}
            </h3>

            {user.bio && !compact && (
              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{user.bio}</p>
            )}

            <div className="flex flex-wrap gap-2 mt-2">
              {user.location && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  <span>{user.location}</span>
                </div>
              )}

              {!compact && user.skills?.slice(0, 3).map((skill) => (
                <Badge key={skill} variant="secondary" className="text-xs">
                  {skill}
                </Badge>
              ))}
            </div>

            {/* Connection Actions */}
            {showActions && (
              <div className="flex flex-wrap gap-2 mt-3">
                {status === null && (
                  <Button
                    size="sm"
                    onClick={handleConnect}
                    disabled={isLoading}
                    className="flex items-center gap-2"
                  >
                    <UserPlus className="h-4 w-4" />
                    {isRequesting ? 'Enviando...' : 'Conectar'}
                  </Button>
                )}

                {status === 'pending' && (
                  <>
                    <Button
                      size="sm"
                      onClick={handleAccept}
                      disabled={isLoading}
                      className="flex items-center gap-2"
                    >
                      <UserCheck className="h-4 w-4" />
                      {isUpdating ? 'Aceptando...' : 'Aceptar'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleReject}
                      disabled={isLoading}
                      className="flex items-center gap-2"
                    >
                      <UserX className="h-4 w-4" />
                      Rechazar
                    </Button>
                  </>
                )}

                {status === 'accepted' && (
                  <>
                    <Badge variant="default" className="flex items-center gap-1">
                      <UserCheck className="h-3 w-3" />
                      Conectado
                    </Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleRemove}
                      disabled={isLoading}
                      className="flex items-center gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      Eliminar
                    </Button>
                  </>
                )}

                {status === 'rejected' && (
                  <Badge variant="secondary">Solicitud rechazada</Badge>
                )}

                {/* Ver Perfil button - always visible */}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCardClick}
                  className="flex items-center gap-2"
                >
                  <Eye className="h-4 w-4" />
                  Ver Perfil
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
