import { useState } from 'react';
import { useAuthContext } from '@/app/features/auth/hooks/useAuthContext';
import { useNavigate } from 'react-router-dom';
import { useOpportunitiesQuery } from '@/app/features/opportunities/hooks/queries/useOpportunitiesQuery';
import { useProjectsQuery } from '@/app/features/projects/hooks/queries/useProjectsQuery';
import { ProjectDetailsDialog } from '@/app/features/projects/components/ProjectDetailsDialog';
import type { ProjectWithCreator } from '@/app/features/projects/data/schemas/project.schema';
// import { useLogger } from '@/lib/logger';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { PhotoUploadModal } from '@/components/profile/PhotoUploadModal';
import { NewMembersSection } from '@/app/features/dashboard/components/NewMembersSection';
import { SocialMediaLinks } from '@/components/layout/SocialMediaLinks';
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
  const [selectedProject, setSelectedProject] = useState<ProjectWithCreator | null>(null);
  const [projectDetailsOpen, setProjectDetailsOpen] = useState(false);
  // const logger = useLogger('Dashboard');

  // Fetch recent opportunities (limit to 3, only open opportunities)
  const { data: opportunitiesData, isLoading: opportunitiesLoading } = useOpportunitiesQuery({
    status: 'abierta',
    limit: 3
  });

  // Fetch recent projects (limit to 3)
  const { data: projectsData, isLoading: projectsLoading } = useProjectsQuery();

  const handlePhotoUpdated = (_newAvatarUrl: string) => {
    // logger.userAction('photo-updated', { userId: user?.id });
    // The auth store will be refreshed automatically
  };

  const handleViewProjectDetails = (project: ProjectWithCreator) => {
    setSelectedProject(project);
    setProjectDetailsOpen(true);
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
                <h1 className="text-xl font-bold text-foreground">ESPAÑA CREATIVA: Red de Destinos del Talento</h1>
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
            ¡Bienvenid@, {user?.name || user?.email}!
          </h2>
          <p className="text-muted-foreground">
            Conecta con emprendedores y destinos del talento de España Creativa
          </p>
        </div>

        {/* Profile Completion Card */}
        {user?.completed_pct !== 100 && (
          <Card className="mb-8 border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Completa tu perfil</CardTitle>
                  <CardDescription>
                    Un perfil completo te ayuda a conectar mejor con otros miembros
                  </CardDescription>
                </div>
                <Badge variant="secondary">{user?.completed_pct || 0}% completado</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Progress value={user?.completed_pct || 0} className="w-full" />
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
        )}

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="hover:shadow-brand transition-shadow cursor-pointer">
            <CardContent className="p-6 text-center">
              <Network className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Mi Red</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Descubre emprendedores
              </p>
              <Button
                size="sm"
                variant="outline"
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
                Oportunidades Red
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
              <h3 className="font-semibold mb-2">Proyectos</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Proyectos España Creativa
              </p>
              <Button
                size="sm"
                variant="outline"
                className="w-full"
                onClick={() => {
                  // logger.userAction('navigate-to-programs', { userId: user?.id });
                  navigate('/proyectos');
                }}
              >
                Explorar
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
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
                {opportunitiesLoading ? (
                  <div className="text-center py-4 text-sm text-muted-foreground">
                    Cargando oportunidades...
                  </div>
                ) : opportunitiesData?.opportunities && opportunitiesData.opportunities.length > 0 ? (
                  <>
                    {opportunitiesData.opportunities.slice(0, 3).map((opportunity) => (
                      <div
                        key={opportunity.id}
                        className="p-4 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                        onClick={() => navigate(`/opportunity/${opportunity.id}`)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h4 className="text-sm font-semibold mb-1">{opportunity.title}</h4>
                            <Badge variant="default" className="text-xs bg-primary/10 text-primary hover:bg-primary/20">
                              📍 {opportunity.city.name}
                            </Badge>
                          </div>
                          <Badge variant="secondary" className="text-xs ml-2">
                            {opportunity.type}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                          {opportunity.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex flex-wrap gap-1">
                            {opportunity.skills_required?.slice(0, 2).map((skill) => (
                              <Badge key={skill} variant="outline" className="text-xs">
                                {skill}
                              </Badge>
                            ))}
                            {opportunity.skills_required && opportunity.skills_required.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{opportunity.skills_required.length - 2}
                              </Badge>
                            )}
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/opportunity/${opportunity.id}`);
                            }}
                          >
                            Ver más →
                          </Button>
                        </div>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      className="w-full mt-2"
                      onClick={() => navigate('/opportunities')}
                    >
                      Ver todas las oportunidades
                    </Button>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <Briefcase className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground mb-4">
                      No hay oportunidades disponibles aún
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate('/opportunities')}
                    >
                      Explorar oportunidades
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Projects Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Proyectos recientes
            </CardTitle>
            <CardDescription>
              Próximos programas e iniciativas de España Creativa
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projectsLoading ? (
                <div className="col-span-full text-center py-8 text-sm text-muted-foreground">
                  Cargando proyectos...
                </div>
              ) : projectsData?.projects && projectsData.projects.length > 0 ? (
                <>
                  {projectsData.projects.slice(0, 3).map((project) => (
                    <div
                      key={project.id}
                      className="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => handleViewProjectDetails(project)}
                    >
                      {project.image_url && (
                        <img
                          src={project.image_url}
                          alt={project.title}
                          className="w-full h-32 object-cover rounded-md mb-3"
                        />
                      )}
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="text-sm font-semibold line-clamp-1">{project.title}</h4>
                        <Badge variant="secondary" className="text-xs ml-2 shrink-0">
                          {project.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                        {project.description}
                      </p>
                      <div className="space-y-2">
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3 mr-1" />
                          <span>{new Date(project.start_date).toLocaleDateString('es-ES')}</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {project.skills?.slice(0, 2).map((skill) => (
                            <Badge key={skill} variant="outline" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                          {project.skills && project.skills.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{project.skills.length - 2}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full mt-3"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewProjectDetails(project);
                        }}
                      >
                        Ver detalles
                      </Button>
                    </div>
                  ))}
                  {projectsData.projects.length > 3 && (
                    <div className="col-span-full">
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => navigate('/proyectos')}
                      >
                        Ver todos los proyectos
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <div className="col-span-full text-center py-8">
                  <Calendar className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground mb-4">
                    No hay proyectos disponibles aún
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/proyectos')}
                  >
                    Explorar proyectos
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Photo Upload Modal */}
        <PhotoUploadModal
          open={photoModalOpen}
          onOpenChange={setPhotoModalOpen}
          onPhotoUpdated={handlePhotoUpdated}
        />

        {/* Project Details Dialog */}
        <ProjectDetailsDialog
          program={selectedProject}
          open={projectDetailsOpen}
          onOpenChange={setProjectDetailsOpen}
        />
      </div>
    </div>
  );
};

export default Dashboard;