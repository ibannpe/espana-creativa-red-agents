import { useState } from 'react';
import { useAuthContext } from '@/app/features/auth/hooks/useAuthContext';
import { useNavigate } from 'react-router-dom';
// import { useLogger } from '@/lib/logger';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { PhotoUploadModal } from '@/components/profile/PhotoUploadModal';
import { NewMembersSection } from '@/app/features/dashboard/components/NewMembersSection';
import {
  MessageSquare,
  Briefcase,
  Calendar,
  LogOut,
  Settings,
  User,
  Network
} from 'lucide-react';

const Dashboard = () => {
  const { user, signOut } = useAuthContext();
  const navigate = useNavigate();
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  // const logger = useLogger('Dashboard');

  const handlePhotoUpdated = (_newAvatarUrl: string) => {
    // logger.userAction('photo-updated', { userId: user?.id });
    // The auth store will be refreshed automatically
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      {/* Header */}
      <header className="border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <img
                src="/animacion-3-transparente.gif"
                alt="España Creativa logo animado"
                width="40"
                height="40"
                className="w-10 h-10 object-contain"
                loading="eager"
                fetchpriority="high"
                decoding="async"
              />
              <div>
                <h1 className="text-xl font-bold text-foreground">España Creativa</h1>
                <p className="text-sm text-muted-foreground">Red de emprendedores</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.avatar_url} />
                <AvatarFallback>
                  {user?.name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <Button variant="ghost" size="sm" onClick={() => {
                // logger.userAction('signout-clicked', { userId: user?.id });
                signOut();
              }}>
                <LogOut className="h-4 w-4 mr-2" />
                Salir
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">
            ¡Bienvenido, {user?.name || user?.email}!
          </h2>
          <p className="text-muted-foreground">
            Conecta con emprendedores y colabora en proyectos en la red de España Creativa
          </p>
        </div>

        {/* Profile Completion Card */}
        <Card className="mb-8 border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Completa tu perfil</CardTitle>
                <CardDescription>
                  Un perfil completo te ayuda a conectar mejor con otros miembros
                </CardDescription>
              </div>
              <Badge variant="secondary">30% completado</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={30} className="w-full" />
            <div className="flex flex-wrap gap-2">
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => {
                  // logger.userAction('photo-modal-opened', { userId: user?.id });
                  setPhotoModalOpen(true);
                }}
              >
                <User className="h-4 w-4 mr-2" />
                Añadir foto de perfil
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => {
                  // logger.userAction('navigate-to-profile', { userId: user?.id });
                  navigate('/profile');
                }}
              >
                <Settings className="h-4 w-4 mr-2" />
                Completar información personal
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="hover:shadow-brand transition-shadow cursor-pointer">
            <CardContent className="p-6 text-center">
              <Network className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Mi Red</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Descubre emprendedores y mentores
              </p>
              <Button 
                size="sm" 
                className="w-full"
                onClick={() => {
                  // logger.userAction('navigate-to-network', { userId: user?.id });
                  navigate('/network');
                }}
              >
                Explorar
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-brand transition-shadow cursor-pointer">
            <CardContent className="p-6 text-center">
              <MessageSquare className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Mensajes</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Chatea con otros miembros
              </p>
              <Button 
                size="sm" 
                variant="outline" 
                className="w-full"
                onClick={() => {
                  // logger.userAction('navigate-to-messages', { userId: user?.id });
                  navigate('/messages');
                }}
              >
                Ver mensajes
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-brand transition-shadow cursor-pointer">
            <CardContent className="p-6 text-center">
              <Briefcase className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Oportunidades</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Colabora en proyectos
              </p>
              <Button 
                size="sm" 
                variant="outline" 
                className="w-full"
                onClick={() => {
                  // logger.userAction('navigate-to-opportunities', { userId: user?.id });
                  navigate('/opportunities');
                }}
              >
                Ver todas
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-brand transition-shadow cursor-pointer">
            <CardContent className="p-6 text-center">
              <Calendar className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Programas</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Próximas iniciativas
              </p>
              <Button 
                size="sm" 
                variant="outline" 
                className="w-full"
                onClick={() => {
                  // logger.userAction('navigate-to-programs', { userId: user?.id });
                  navigate('/programs');
                }}
              >
                Explorar
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <NewMembersSection />

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Briefcase className="h-5 w-5 mr-2" />
                Oportunidades recientes
              </CardTitle>
              <CardDescription>
                Nuevas oportunidades de colaboración disponibles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="space-y-2">
                    <h4 className="text-sm font-medium">Proyecto {i}</h4>
                    <p className="text-xs text-muted-foreground">
                      Buscamos desarrollador frontend para startup fintech...
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex space-x-1">
                        <Badge variant="secondary" className="text-xs">React</Badge>
                        <Badge variant="secondary" className="text-xs">Frontend</Badge>
                      </div>
                      <Button size="sm" variant="outline">
                        Ver más
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Photo Upload Modal */}
        <PhotoUploadModal 
          open={photoModalOpen}
          onOpenChange={setPhotoModalOpen}
          onPhotoUpdated={handlePhotoUpdated}
        />
      </div>
    </div>
  );
};

export default Dashboard;