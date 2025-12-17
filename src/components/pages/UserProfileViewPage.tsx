// ABOUTME: User profile view page - displays public profile of any user
// ABOUTME: Shows user info with action buttons (Connect, Follow, Chat)

import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { Navigation } from '@/components/layout/Navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { AvatarViewModal } from '@/components/ui/AvatarViewModal'
import {
  MapPin,
  Briefcase,
  Link as LinkIcon,
  Linkedin,
  ArrowLeft,
  UserPlus,
  UserCheck,
  MessageCircle,
  UserX,
  Loader2
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import axiosInstance from '@/lib/axios'
import { useAuthContext } from '@/app/features/auth/hooks/useAuthContext'
import { useConnectionStatusQuery } from '@/app/features/network/hooks/queries/useConnectionStatusQuery'
import { useRequestConnectionMutation } from '@/app/features/network/hooks/mutations/useRequestConnectionMutation'
import { useUpdateConnectionMutation } from '@/app/features/network/hooks/mutations/useUpdateConnectionMutation'
import type { UserProfile } from '@/app/features/profile/data/schemas/profile.schema'

export function UserProfileViewPage() {
  const { userId } = useParams<{ userId: string }>()
  const navigate = useNavigate()
  const { user: currentUser } = useAuthContext()
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false)

  // Fetch user profile
  const { data: user, isLoading } = useQuery<UserProfile>({
    queryKey: ['user-profile', userId],
    queryFn: async () => {
      const response = await axiosInstance.get(`/users/${userId}`)
      return response.data.user
    },
    enabled: !!userId
  })

  // Get connection status
  const { data: connectionStatus } = useConnectionStatusQuery(userId || '')
  const { action: requestConnection, isLoading: isRequesting } = useRequestConnectionMutation()
  const { action: updateConnection, isLoading: isUpdating } = useUpdateConnectionMutation()

  const isOwnProfile = currentUser?.id === userId
  const status = connectionStatus?.status
  const connectionId = connectionStatus?.connection?.id

  // Determine if current user is the requester or addressee
  const isRequester = connectionStatus?.connection?.requester_id === currentUser?.id
  const isAddressee = connectionStatus?.connection?.addressee_id === currentUser?.id

  const handleConnect = () => {
    if (userId) {
      requestConnection({ addressee_id: userId })
    }
  }

  const handleAccept = () => {
    if (connectionId) {
      updateConnection({
        connection_id: connectionId,
        status: 'accepted'
      })
    }
  }

  const handleChat = () => {
    // TODO: Implement chat navigation
    navigate(`/messages?userId=${userId}`)
  }

  if (isLoading) {
    return (
      <AppLayout>
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-8 w-48 mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <Skeleton className="h-96" />
            </div>
            <div className="lg:col-span-2">
              <Skeleton className="h-64" />
            </div>
          </div>
        </div>
      </AppLayout>
    )
  }

  if (!user) {
    return (
      <AppLayout>
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Usuario no encontrado</h1>
            <Button onClick={() => navigate('/network')}>
              Volver a Mi Red
            </Button>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        {/* Back button */}
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Profile Card */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center">
                  {/* Avatar */}
                  <Avatar
                    className="h-32 w-32 mb-4 cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => setIsAvatarModalOpen(true)}
                  >
                    <AvatarImage src={user.avatar_url || undefined} alt={user.name} />
                    <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-white text-3xl">
                      {user.name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  {/* Name */}
                  <h1 className="text-2xl font-bold mb-1">{user.name}</h1>
                  <p className="text-muted-foreground text-sm mb-4">{user.email}</p>

                  {/* Action Buttons */}
                  {!isOwnProfile && (
                    <div className="w-full space-y-2 mb-6">
                      {status === null && (
                        <Button
                          className="w-full"
                          onClick={handleConnect}
                          disabled={isRequesting}
                        >
                          {isRequesting ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Enviando...
                            </>
                          ) : (
                            <>
                              <UserPlus className="h-4 w-4 mr-2" />
                              Conectar
                            </>
                          )}
                        </Button>
                      )}

                      {status === 'pending' && isAddressee && (
                        <Button
                          className="w-full"
                          onClick={handleAccept}
                          disabled={isUpdating}
                        >
                          {isUpdating ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Aceptando...
                            </>
                          ) : (
                            <>
                              <UserCheck className="h-4 w-4 mr-2" />
                              Aceptar solicitud
                            </>
                          )}
                        </Button>
                      )}

                      {status === 'pending' && isRequester && (
                        <Badge variant="secondary" className="w-full py-2 justify-center">
                          <UserPlus className="h-4 w-4 mr-2" />
                          Solicitud enviada
                        </Badge>
                      )}

                      {status === 'accepted' && (
                        <Badge variant="default" className="w-full py-2 justify-center">
                          <UserCheck className="h-4 w-4 mr-2" />
                          Conectado
                        </Badge>
                      )}

                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={handleChat}
                      >
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Enviar mensaje
                      </Button>
                    </div>
                  )}

                  {/* Location */}
                  {user.location && (
                    <div className="flex items-center gap-2 text-muted-foreground mb-4">
                      <MapPin className="h-4 w-4" />
                      <span className="text-sm">{user.location}</span>
                    </div>
                  )}

                  {/* Social Links */}
                  <div className="w-full space-y-2">
                    {user.linkedin_url && (
                      <a
                        href={user.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-primary hover:underline"
                      >
                        <Linkedin className="h-4 w-4" />
                        LinkedIn
                      </a>
                    )}
                    {user.website_url && (
                      <a
                        href={user.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-primary hover:underline"
                      >
                        <LinkIcon className="h-4 w-4" />
                        Sitio web
                      </a>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* About */}
            {user.bio && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-lg font-semibold mb-3">Acerca de</h2>
                  <p className="text-muted-foreground whitespace-pre-wrap">{user.bio}</p>
                </CardContent>
              </Card>
            )}

            {/* Skills */}
            {user.skills && user.skills.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-lg font-semibold mb-3">Habilidades</h2>
                  <div className="flex flex-wrap gap-2">
                    {user.skills.map((skill) => (
                      <Badge key={skill} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Interests */}
            {user.interests && user.interests.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-lg font-semibold mb-3">Intereses</h2>
                  <div className="flex flex-wrap gap-2">
                    {user.interests.map((interest) => (
                      <Badge key={interest} variant="outline">
                        {interest}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Avatar View Modal */}
      <AvatarViewModal
        open={isAvatarModalOpen}
        onClose={() => setIsAvatarModalOpen(false)}
        avatarUrl={user.avatar_url}
        userName={user.name}
      />
    </AppLayout>
  )
}
