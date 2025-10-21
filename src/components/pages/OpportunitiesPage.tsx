import { useState } from 'react'
import { Navigation } from '@/components/layout/Navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
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
  Users,
  Star
} from 'lucide-react'

export function OpportunitiesPage() {
  const [filter, setFilter] = useState('all')

  // Mock data para oportunidades
  const opportunities = [
    {
      id: 1,
      title: 'Desarrollador Frontend React',
      company: 'StartupTech',
      location: 'Madrid',
      type: 'Colaboración',
      description: 'Buscamos desarrollador frontend con experiencia en React para startup fintech. Proyecto innovador con gran potencial de crecimiento.',
      skills: ['React', 'TypeScript', 'Tailwind'],
      postedBy: 'María García',
      postedTime: '2 días',
      applicants: 12,
      featured: true
    },
    {
      id: 2,
      title: 'Mentor para Ecommerce',
      company: 'España Creativa',
      location: 'Remoto',
      type: 'Mentoría',
      description: 'Emprendedor busca mentor con experiencia en ecommerce y marketing digital para guiar el lanzamiento de su plataforma.',
      skills: ['Ecommerce', 'Marketing', 'SEO'],
      postedBy: 'Carlos López',
      postedTime: '1 semana',
      applicants: 5,
      featured: false
    },
    {
      id: 3,
      title: 'Co-fundador Tecnológico',
      company: 'EcoSolutions',
      location: 'Barcelona',
      type: 'Sociedad',
      description: 'Startup de sostenibilidad busca co-fundador técnico para liderar el desarrollo de plataforma de gestión ambiental.',
      skills: ['Node.js', 'Python', 'DevOps'],
      postedBy: 'Ana Martín',
      postedTime: '3 días',
      applicants: 8,
      featured: true
    },
    {
      id: 4,
      title: 'Diseñador UX/UI',
      company: 'HealthApp',
      location: 'Valencia',
      type: 'Proyecto',
      description: 'Aplicación de salud digital necesita diseñador UX/UI para mejorar la experiencia de usuario y crear nuevas funcionalidades.',
      skills: ['Figma', 'UX Design', 'Prototyping'],
      postedBy: 'David Ruiz',
      postedTime: '5 días',
      applicants: 15,
      featured: false
    }
  ]

  const filteredOpportunities = opportunities.filter(opp => {
    if (filter === 'all') return true
    return opp.type.toLowerCase() === filter.toLowerCase()
  })

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
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Publicar oportunidad
            </Button>
          </div>
        </div>

        {/* Filtros y búsqueda */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="Buscar oportunidades..." className="pl-10" />
                </div>
              </div>
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="colaboración">Colaboración</SelectItem>
                  <SelectItem value="mentoría">Mentoría</SelectItem>
                  <SelectItem value="sociedad">Sociedad</SelectItem>
                  <SelectItem value="proyecto">Proyecto</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Lista de oportunidades */}
        <div className="space-y-6">
          {filteredOpportunities.map((opportunity) => (
            <Card key={opportunity.id} className={`hover:shadow-lg transition-shadow ${opportunity.featured ? 'ring-2 ring-primary/20' : ''}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-xl">{opportunity.title}</CardTitle>
                      {opportunity.featured && (
                        <Badge variant="default" className="bg-yellow-500 text-white">
                          <Star className="h-3 w-3 mr-1" />
                          Destacada
                        </Badge>
                      )}
                    </div>
                    <CardDescription className="text-base">
                      {opportunity.company}
                    </CardDescription>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        {opportunity.location}
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        Hace {opportunity.postedTime}
                      </div>
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-1" />
                        {opportunity.applicants} interesados
                      </div>
                    </div>
                  </div>
                  <Badge variant="secondary">{opportunity.type}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">{opportunity.description}</p>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  {opportunity.skills.map((skill) => (
                    <Badge key={skill} variant="outline" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs">
                        {opportunity.postedBy.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-muted-foreground">
                      Por {opportunity.postedBy}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      Ver detalles
                    </Button>
                    <Button size="sm">
                      Me interesa
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Mostrar más */}
        <div className="text-center mt-8">
          <Button variant="outline" size="lg">
            Cargar más oportunidades
          </Button>
        </div>
      </div>
    </div>
  )
}