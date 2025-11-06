// ABOUTME: Opportunities listing page with search and filters
// ABOUTME: Displays opportunities from API with real-time search and type filtering

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Navigation } from '@/components/layout/Navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Briefcase,
  Search,
  Plus,
  MapPin,
  Clock,
  Calendar,
  DollarSign,
  Loader2,
  Edit
} from 'lucide-react'
import { useOpportunitiesQuery } from '@/app/features/opportunities/hooks/queries/useOpportunitiesQuery'
import { useMyOpportunitiesQuery } from '@/app/features/opportunities/hooks/queries/useMyOpportunitiesQuery'
import { CreateOpportunityDialog } from '@/app/features/opportunities/components/CreateOpportunityDialog'
import type { OpportunityType, OpportunityWithCreator, OpportunityStatus } from '@/app/features/opportunities/data/schemas/opportunity.schema'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { useToast } from '@/hooks/use-toast'
import { useAuthContext } from '@/app/features/auth/hooks/useAuthContext'

const opportunityTypeLabels: Record<OpportunityType, string> = {
  proyecto: 'Proyecto',
  colaboracion: 'Colaboración',
  empleo: 'Empleo',
  mentoria: 'Mentoría',
  evento: 'Evento',
  otro: 'Otro'
}

export function OpportunitiesPage() {
  const navigate = useNavigate()
  const { toast} = useToast()
  const { user } = useAuthContext()
  const [activeTab, setActiveTab] = useState<'all' | 'my'>('all')
  const [filter, setFilter] = useState<OpportunityType | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<OpportunityStatus | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingOpportunity, setEditingOpportunity] = useState<OpportunityWithCreator | null>(null)
  const [interestedOpportunities, setInterestedOpportunities] = useState<Set<string>>(new Set())

  // Build filter object for API
  const filters = {
    ...(filter !== 'all' && { type: filter }),
    ...(searchQuery && { search: searchQuery })
  }

  // Fetch all opportunities
  const { data: allData, isLoading: isLoadingAll, error: errorAll } = useOpportunitiesQuery(filters, {
    enabled: activeTab === 'all'
  })

  // Fetch user's opportunities
  const { data: myData, isLoading: isLoadingMy, error: errorMy } = useMyOpportunitiesQuery({
    enabled: activeTab === 'my'
  })

  // Determine which data to use based on active tab
  const opportunities = activeTab === 'all'
    ? (allData?.opportunities || [])
    : (myData?.opportunities || [])

  const isLoading = activeTab === 'all' ? isLoadingAll : isLoadingMy
  const error = activeTab === 'all' ? errorAll : errorMy

  // Apply client-side filtering
  const filteredOpportunities = opportunities.filter(opp => {
    // Type filter
    const matchesType = filter === 'all' || opp.type === filter

    // Search filter
    const matchesSearch = !searchQuery ||
      opp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      opp.description.toLowerCase().includes(searchQuery.toLowerCase())

    // Status filter - by default exclude 'cerrada' unless explicitly filtered
    const matchesStatus = statusFilter !== 'all'
      ? opp.status === statusFilter
      : opp.status !== 'cerrada'

    return matchesType && matchesSearch && matchesStatus
  })

  const handleViewDetails = (opportunityId: string) => {
    navigate(`/opportunities/${opportunityId}`)
  }

  const handleExpressInterest = async (opportunityId: string, creatorName: string) => {
    try {
      // TODO: Implementar endpoint API para registrar interés
      await new Promise(resolve => setTimeout(resolve, 300))

      setInterestedOpportunities(prev => new Set(prev).add(opportunityId))
      toast({
        title: '¡Interés registrado!',
        description: `Hemos notificado a ${creatorName} sobre tu interés.`
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo registrar tu interés. Inténtalo de nuevo.',
        variant: 'destructive'
      })
    }
  }

  const handleEditOpportunity = (opportunity: OpportunityWithCreator) => {
    setEditingOpportunity(opportunity)
    setIsCreateDialogOpen(true)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-emerald-600 rounded-xl flex items-center justify-center">
                <Briefcase className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Oportunidades</h1>
                <p className="text-muted-foreground">
                  Encuentra colaboraciones, proyectos y oportunidades de negocio
                </p>
              </div>
            </div>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Publicar oportunidad
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'all' | 'my')} className="mb-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="all">Todas las oportunidades</TabsTrigger>
            <TabsTrigger value="my">Mis oportunidades</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Filtros y búsqueda */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar oportunidades..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <Select value={filter} onValueChange={(value) => setFilter(value as OpportunityType | 'all')}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="proyecto">Proyecto</SelectItem>
                  <SelectItem value="colaboracion">Colaboración</SelectItem>
                  <SelectItem value="empleo">Empleo</SelectItem>
                  <SelectItem value="mentoria">Mentoría</SelectItem>
                  <SelectItem value="evento">Evento</SelectItem>
                  <SelectItem value="otro">Otro</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as OpportunityStatus | 'all')}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Activas</SelectItem>
                  <SelectItem value="abierta">Abiertas</SelectItem>
                  <SelectItem value="en_progreso">En Progreso</SelectItem>
                  <SelectItem value="cerrada">Cerradas</SelectItem>
                  <SelectItem value="cancelada">Canceladas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {/* Error state */}
        {error && (
          <Card className="p-8 text-center">
            <p className="text-destructive">Error al cargar las oportunidades</p>
            <p className="text-muted-foreground text-sm mt-2">{error.message}</p>
          </Card>
        )}

        {/* Empty state */}
        {!isLoading && !error && filteredOpportunities.length === 0 && (
          <Card className="p-12 text-center">
            <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {activeTab === 'my' ? 'No has publicado oportunidades' : 'No hay oportunidades'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {activeTab === 'my'
                ? searchQuery || filter !== 'all'
                  ? 'No se encontraron oportunidades tuyas con los filtros aplicados'
                  : 'Publica tu primera oportunidad para empezar a colaborar'
                : searchQuery || filter !== 'all'
                ? 'No se encontraron oportunidades con los filtros aplicados'
                : 'Sé el primero en publicar una oportunidad'}
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Publicar oportunidad
            </Button>
          </Card>
        )}

        {/* Lista de oportunidades */}
        {!isLoading && !error && filteredOpportunities.length > 0 && (
          <div className="space-y-6">
            {filteredOpportunities.map((opportunity) => {
              const createdAt = new Date(opportunity.created_at)
              const timeAgo = formatDistanceToNow(createdAt, {
                addSuffix: true,
                locale: es
              })

              return (
                <Card key={opportunity.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <CardTitle className="text-xl">{opportunity.title}</CardTitle>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          {opportunity.location && (
                            <div className="flex items-center">
                              <MapPin className="h-4 w-4 mr-1" />
                              {opportunity.location}
                            </div>
                          )}
                          {opportunity.remote && (
                            <Badge variant="secondary" className="text-xs">
                              Remoto
                            </Badge>
                          )}
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            {timeAgo}
                          </div>
                        </div>
                      </div>
                      <Badge variant="secondary">
                        {opportunityTypeLabels[opportunity.type]}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">{opportunity.description}</p>

                    {/* Skills */}
                    {opportunity.skills_required && opportunity.skills_required.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {opportunity.skills_required.map((skill) => (
                          <Badge key={skill} variant="outline" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Additional info */}
                    <div className="flex flex-wrap gap-4 mb-4 text-sm text-muted-foreground">
                      {opportunity.duration && (
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          Duración: {opportunity.duration}
                        </div>
                      )}
                      {opportunity.compensation && (
                        <div className="flex items-center">
                          <DollarSign className="h-4 w-4 mr-1" />
                          {opportunity.compensation}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Avatar className="h-6 w-6">
                          {opportunity.creator.avatar_url && (
                            <AvatarImage src={opportunity.creator.avatar_url} />
                          )}
                          <AvatarFallback className="text-xs">
                            {opportunity.creator.name
                              .split(' ')
                              .map(n => n[0])
                              .join('')
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-muted-foreground">
                          Por {opportunity.creator.name}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(opportunity.id)}
                        >
                          Ver detalles
                        </Button>
                        {/* Solo mostrar botón Editar si el usuario es el creador */}
                        {user?.id === opportunity.created_by && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditOpportunity(opportunity)}
                            className="flex items-center gap-2"
                          >
                            <Edit className="h-4 w-4" />
                            Editar
                          </Button>
                        )}
                        {/* Solo mostrar botón Me Interesa si el usuario NO es el creador */}
                        {user?.id !== opportunity.created_by && (
                          <Button
                            size="sm"
                            onClick={() => handleExpressInterest(opportunity.id, opportunity.creator.name)}
                            disabled={interestedOpportunities.has(opportunity.id)}
                          >
                            {interestedOpportunities.has(opportunity.id) ? '¡Te interesa!' : 'Me interesa'}
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Create/Edit opportunity dialog */}
      <CreateOpportunityDialog
        open={isCreateDialogOpen}
        onOpenChange={(open) => {
          setIsCreateDialogOpen(open)
          if (!open) {
            setEditingOpportunity(null)
          }
        }}
        opportunity={editingOpportunity}
      />
    </div>
  )
}
