import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { User } from '@/types'
import { MapPin, Globe, Linkedin, MessageCircle, UserPlus, UserCheck, Clock, Eye } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useConnectionStatusQuery } from '@/app/features/network/hooks/queries/useConnectionStatusQuery'
import { useRequestConnectionMutation } from '@/app/features/network/hooks/mutations/useRequestConnectionMutation'
import { useAuthContext } from '@/app/features/auth/hooks/useAuthContext'
import { useToast } from '@/hooks/use-toast'

interface ProfileCardProps {
  user: User
  showActions?: boolean
  onStartChat?: () => void
  showConnectButton?: boolean
}

export function ProfileCard({ user, showActions = true, onStartChat, showConnectButton = true }: ProfileCardProps) {
  const { user: currentUser } = useAuthContext()
  const navigate = useNavigate()
  const { data: connectionStatus } = useConnectionStatusQuery(user.id, {
    enabled: showConnectButton && currentUser?.id !== user.id
  })
  const { action: requestConnection, isLoading } = useRequestConnectionMutation()
  const { toast } = useToast()

  const getInitials = (name: string | null) => {
    if (!name) return 'U'
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  const getRoleColors = (roleName: string) => {
    switch (roleName) {
      case 'admin':
        return 'bg-red-100 text-red-800'
      case 'mentor':
        return 'bg-blue-100 text-blue-800'
      case 'emprendedor':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const handleConnect = async () => {
    try {
      await requestConnection({ addressee_id: user.id })
      toast({
        title: 'Solicitud enviada',
        description: `Solicitud de conexión enviada a ${user.name || 'el usuario'}`,
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

  const handleViewProfile = () => {
    navigate(`/users/${user.id}`)
  }

  const isCurrentUser = currentUser?.id === user.id
  const status = connectionStatus?.status || 'none'

  return (
    <Card className="w-full">
      <CardHeader className="text-center">
        <Avatar
          className="h-20 w-20 mx-auto mb-4 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={handleViewProfile}
        >
          <AvatarImage src={user.avatar_url || ''} />
          <AvatarFallback className="text-lg">
            {getInitials(user.name)}
          </AvatarFallback>
        </Avatar>
        <h3
          className="text-xl font-semibold cursor-pointer hover:text-primary transition-colors"
          onClick={handleViewProfile}
        >
          {user.name || 'Usuario'}
        </h3>
        <div className="flex justify-center gap-2 mt-2">
          {user.roles?.map((role) => (
            <Badge key={role.id} className={getRoleColors(role.name)}>
              {role.name}
            </Badge>
          ))}
        </div>
        {user.location && (
          <div className="flex items-center justify-center text-sm text-muted-foreground mt-2">
            <MapPin className="h-4 w-4 mr-1" />
            {user.location}
          </div>
        )}
      </CardHeader>
      
      <CardContent className="space-y-4">
        {user.bio && (
          <p className="text-sm text-muted-foreground">{user.bio}</p>
        )}
        
        {user.skills && user.skills.length > 0 && (
          <div>
            <h4 className="font-medium text-sm mb-2">Habilidades</h4>
            <div className="flex flex-wrap gap-1">
              {user.skills.slice(0, 6).map((skill, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {skill}
                </Badge>
              ))}
              {user.skills.length > 6 && (
                <Badge variant="secondary" className="text-xs">
                  +{user.skills.length - 6} más
                </Badge>
              )}
            </div>
          </div>
        )}
        
        {user.interests && user.interests.length > 0 && (
          <div>
            <h4 className="font-medium text-sm mb-2">Intereses</h4>
            <div className="flex flex-wrap gap-1">
              {user.interests.slice(0, 4).map((interest, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {interest}
                </Badge>
              ))}
              {user.interests.length > 4 && (
                <Badge variant="outline" className="text-xs">
                  +{user.interests.length - 4} más
                </Badge>
              )}
            </div>
          </div>
        )}
        
        <div className="flex gap-2 pt-2">
          {user.linkedin_url && (
            <Link href={user.linkedin_url} target="_blank">
              <Button variant="outline" size="sm">
                <Linkedin className="h-4 w-4" />
              </Button>
            </Link>
          )}
          {user.website_url && (
            <Link href={user.website_url} target="_blank">
              <Button variant="outline" size="sm">
                <Globe className="h-4 w-4" />
              </Button>
            </Link>
          )}
        </div>

        {/* Connection Button */}
        {showConnectButton && !isCurrentUser && (
          <div className="mt-4">
            {status === 'none' && (
              <Button
                onClick={handleConnect}
                disabled={isLoading}
                className="w-full"
                variant="default"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                {isLoading ? 'Conectando...' : 'Conectar'}
              </Button>
            )}

            {status === 'pending' && (
              <Button
                variant="secondary"
                disabled
                className="w-full cursor-not-allowed"
              >
                <Clock className="h-4 w-4 mr-2" />
                Solicitud enviada
              </Button>
            )}

            {status === 'accepted' && (
              <Button
                variant="outline"
                disabled
                className="w-full"
              >
                <UserCheck className="h-4 w-4 mr-2" />
                Conectados
              </Button>
            )}
          </div>
        )}

        {showActions && onStartChat && (
          <Button
            onClick={onStartChat}
            className="w-full mt-4"
            variant="outline"
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            Iniciar Chat
          </Button>
        )}

        {/* Ver Perfil button - always visible */}
        <Button
          onClick={handleViewProfile}
          className="w-full mt-2"
          variant="outline"
        >
          <Eye className="h-4 w-4 mr-2" />
          Ver Perfil
        </Button>

        <div className="pt-2 border-t">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Perfil completado</span>
            <span>{user.completed_pct}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${user.completed_pct}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}