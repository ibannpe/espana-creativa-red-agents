// ABOUTME: Layout principal de la aplicación con header fijo siempre visible
// ABOUTME: Contiene el branding de España Creativa, redes sociales y navegación de usuario
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/app/features/auth/hooks/useAuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { SocialMediaLinks } from '@/components/layout/SocialMediaLinks';
import { LogOut } from 'lucide-react';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { user, signOut } = useAuthContext();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      {/* Header Fijo - Siempre visible */}
      <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <img
                src="/animacion-3-transparente.gif"
                alt="España Creativa logo animado"
                width="40"
                height="40"
                className="w-10 h-10 object-contain cursor-pointer"
                loading="eager"
                fetchPriority="high"
                decoding="async"
                onClick={() => navigate('/dashboard')}
              />
              <div>
                <h1
                  className="text-xl font-bold text-foreground cursor-pointer hover:text-primary transition-colors"
                  onClick={() => navigate('/dashboard')}
                >
                  ESPAÑA CREATIVA: Red de Destinos del Talento
                </h1>
                <p className="text-sm text-muted-foreground">Red de Ciudades y Territorios Creativos de España</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <SocialMediaLinks />

              <Avatar
                className="h-8 w-8 cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                onClick={() => navigate('/profile')}
              >
                <AvatarImage src={user?.avatar_url} />
                <AvatarFallback>
                  {user?.name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <Button
                variant="ghost"
                size="sm"
                onClick={signOut}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Salir
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      {children}
    </div>
  );
}
