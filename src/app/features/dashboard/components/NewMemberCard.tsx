// ABOUTME: Compact card component for displaying new members in dashboard
// ABOUTME: Shows user info with connection button and handles connection states

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { UserPlus, UserCheck, Eye } from 'lucide-react'
import { useRequestConnectionMutation } from '@/app/features/network/hooks/mutations/useRequestConnectionMutation'
import { useUpdateConnectionMutation } from '@/app/features/network/hooks/mutations/useUpdateConnectionMutation'
import { useConnectionStatusQuery } from '@/app/features/network/hooks/queries/useConnectionStatusQuery'
import { useAuthContext } from '@/app/features/auth/hooks/useAuthContext'
import { useToast } from '@/hooks/use-toast'
import { useNavigate } from 'react-router-dom'
import type { DashboardUser } from '../data/schemas/dashboard.schema'

interface NewMemberCardProps {
  user: DashboardUser
}

export function NewMemberCard({ user }: NewMemberCardProps) {
  const { user: currentUser } = useAuthContext()
  const { data: connectionStatus } = useConnectionStatusQuery(user.id)
  const { action: requestConnection, isLoading } = useRequestConnectionMutation()
  const { action: updateConnection, isLoading: isUpdating } = useUpdateConnectionMutation()
  const { toast } = useToast()
  const navigate = useNavigate()

  const handleConnect = async () => {
    try {
      await requestConnection({ addressee_id: user.id })
      toast({
        title: 'Solicitud enviada',
        description: `Solicitud de conexión enviada a ${user.name}`,
        duration: 3000
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'No se pudo enviar la solicitud',
        variant: 'destructive',
        duration: 5000
      })
    }
  }

  const handleAccept = async () => {
    const connectionId = connectionStatus?.connection?.id
    if (!connectionId) return

    try {
      await updateConnection({
        connection_id: connectionId,
        status: 'accepted'
      })
      toast({
        title: 'Conexión aceptada',
        description: `Ahora estás conectado con ${user.name}`,
        duration: 3000
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'No se pudo aceptar la solicitud',
        variant: 'destructive',
        duration: 5000
      })
    }
  }

  const handleViewProfile = () => {
    navigate(`/users/${user.id}`)
  }

  // Don't show connection button if it's the current user
  const isCurrentUser = currentUser?.id === user.id

  // Determine connection status
  const status = connectionStatus?.status || 'none'

  // Determine if current user is the requester or addressee
  const isRequester = connectionStatus?.connection?.requester_id === currentUser?.id
  const isAddressee = connectionStatus?.connection?.addressee_id === currentUser?.id

  // Get user role label (default to "Miembro" if no roles)
  const roleLabel = user.role_ids && user.role_ids.length > 0 ? getRoleLabel(user.role_ids[0]) : 'Miembro'

  return (
    <div className="flex items-center gap-3 p-4 rounded-lg hover:bg-muted/50 transition-colors">
      {/* Avatar */}
      <Avatar
        className="h-12 w-12 cursor-pointer hover:ring-2 hover:ring-primary transition-all"
        onClick={handleViewProfile}
      >
        <AvatarImage src={user.avatar_url || undefined} alt={user.name} />
        <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-white text-sm">
          {getInitials(user.name, user.email)}
        </AvatarFallback>
      </Avatar>

      {/* User Info */}
      <div className="flex-1 min-w-0">
        <h3
          className="text-sm font-semibold truncate cursor-pointer hover:text-primary transition-colors"
          onClick={handleViewProfile}
        >
          {user.name}
        </h3>
        <span className="text-xs text-muted-foreground">{roleLabel}</span>
      </div>

      {/* Connection Action */}
      <div className="flex-shrink-0 flex items-center gap-2">
        {/* Don't show any connection button if viewing own profile */}
        {isCurrentUser ? (
          <Badge variant="secondary" className="text-xs">
            Tú
          </Badge>
        ) : (
          <>
            {status === 'none' && (
              <Button
                size="sm"
                onClick={handleConnect}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <UserPlus className="h-4 w-4" />
                {isLoading ? 'Conectando...' : 'Conectar'}
              </Button>
            )}

            {status === 'pending' && isRequester && (
              <Button
                size="sm"
                variant="secondary"
                disabled
                className="cursor-not-allowed"
              >
                Solicitud enviada
              </Button>
            )}

            {status === 'pending' && isAddressee && (
              <Button
                size="sm"
                onClick={handleAccept}
                disabled={isUpdating}
                className="flex items-center gap-2"
              >
                <UserCheck className="h-4 w-4" />
                {isUpdating ? 'Aceptando...' : 'Aceptar'}
              </Button>
            )}

            {status === 'accepted' && (
              <Badge variant="default" className="flex items-center gap-1">
                <UserCheck className="h-3 w-3" />
                Conectado
              </Badge>
            )}
          </>
        )}

        {/* Ver Perfil button - always visible except for current user */}
        {!isCurrentUser && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleViewProfile}
            className="flex items-center gap-2"
          >
            <Eye className="h-4 w-4" />
            Ver Perfil
          </Button>
        )}
      </div>
    </div>
  )
}

// Helper function to get user initials
function getInitials(name: string, email: string): string {
  if (name && name.trim().length > 0) {
    const parts = name.trim().split(' ')
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    }
    return name[0].toUpperCase()
  }
  return email[0].toUpperCase()
}

// Helper function to get role label from role ID
function getRoleLabel(roleId: number): string {
  const roleMap: Record<number, string> = {
    1: 'Admin',
    2: 'Mentor',
    3: 'Emprendedor'
  }
  return roleMap[roleId] || 'Miembro'
}
