import { useState } from 'react'
import { AppLayout } from '@/components/layout/AppLayout'
import { Navigation } from '@/components/layout/Navigation'
import { ProfileForm } from '@/components/profile/ProfileForm'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuthContext } from '@/app/features/auth/hooks/useAuthContext'
import { ChangePasswordModal } from '@/app/features/auth/components/ChangePasswordModal'
import { User, Settings, Lock } from 'lucide-react'

export function ProfilePage() {
  const { user } = useAuthContext()
  const [showChangePassword, setShowChangePassword] = useState(false)

  if (!user) {
    return <div>Cargando...</div>
  }

  return (
    <AppLayout>
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-emerald-600 rounded-xl flex items-center justify-center">
              <User className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Mi Perfil</h1>
              <p className="text-muted-foreground">
                Completa tu información para conectar mejor con otros miembros
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Perfil completado */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="h-5 w-5 mr-2" />
                  Completado del perfil
                </CardTitle>
                <CardDescription>
                  Mejora tu visibilidad completando toda tu información
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary mb-2">
                      {user.completed_pct || 30}%
                    </div>
                    <p className="text-sm text-muted-foreground">Completado</p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span>Información básica</span>
                      <span className={user.name ? 'text-green-600' : 'text-yellow-600'}>
                        {user.name ? '✓' : '○'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Foto de perfil</span>
                      <span className={user.avatar_url ? 'text-green-600' : 'text-yellow-600'}>
                        {user.avatar_url ? '✓' : '○'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Biografía</span>
                      <span className={user.bio ? 'text-green-600' : 'text-yellow-600'}>
                        {user.bio ? '✓' : '○'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Habilidades</span>
                      <span className={user.skills?.length ? 'text-green-600' : 'text-yellow-600'}>
                        {user.skills?.length ? '✓' : '○'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Enlaces sociales</span>
                      <span className={user.linkedin_url || user.twitter_url || user.instagram_url || user.website_url ? 'text-green-600' : 'text-yellow-600'}>
                        {user.linkedin_url || user.twitter_url || user.instagram_url || user.website_url ? '✓' : '○'}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Security Settings Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Lock className="h-5 w-5 mr-2" />
                  Seguridad
                </CardTitle>
                <CardDescription>
                  Gestiona la seguridad de tu cuenta
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => setShowChangePassword(true)}
                  variant="outline"
                  className="w-full"
                >
                  <Lock className="h-4 w-4 mr-2" />
                  Cambiar Contraseña
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Formulario de perfil */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Información del perfil</CardTitle>
                <CardDescription>
                  Actualiza tu información personal y profesional
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ProfileForm user={user} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      <ChangePasswordModal
        open={showChangePassword}
        onOpenChange={setShowChangePassword}
      />
    </AppLayout>
  )
}