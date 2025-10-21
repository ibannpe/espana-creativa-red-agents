import { useState } from 'react'
import { Navigation } from '@/components/layout/Navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { 
  Calendar, 
  Clock, 
  Users, 
  MapPin,
  Play,
  BookOpen,
  Target,
  Award
} from 'lucide-react'

export function ProgramsPage() {
  const [selectedTab, setSelectedTab] = useState('upcoming')

  // Mock data para programas
  const programs = [
    {
      id: 1,
      title: 'Programa de Aceleración Fintech',
      description: 'Programa intensivo de 12 semanas para startups fintech con mentores expertos y acceso a inversores.',
      type: 'Aceleración',
      startDate: '2024-03-15',
      endDate: '2024-06-07',
      duration: '12 semanas',
      location: 'Madrid + Online',
      participants: 25,
      maxParticipants: 30,
      instructor: 'María González',
      status: 'upcoming',
      featured: true,
      skills: ['Fintech', 'Business Model', 'Funding'],
      price: 'Gratuito',
      image: ''
    },
    {
      id: 2,
      title: 'Workshop: Design Thinking para Emprendedores',
      description: 'Taller práctico de 2 días para aprender metodologías de design thinking aplicadas al emprendimiento.',
      type: 'Workshop',
      startDate: '2024-02-20',
      endDate: '2024-02-21',
      duration: '2 días',
      location: 'Barcelona',
      participants: 15,
      maxParticipants: 20,
      instructor: 'Carlos Martín',
      status: 'upcoming',
      featured: false,
      skills: ['Design Thinking', 'Innovation', 'UX'],
      price: '150€',
      image: ''
    },
    {
      id: 3,
      title: 'Bootcamp: Marketing Digital Avanzado',
      description: 'Curso intensivo de marketing digital con enfoque en estrategias avanzadas de growth hacking.',
      type: 'Bootcamp',
      startDate: '2024-01-10',
      endDate: '2024-01-31',
      duration: '3 semanas',
      location: 'Online',
      participants: 45,
      maxParticipants: 50,
      instructor: 'Ana López',
      status: 'active',
      featured: true,
      skills: ['Marketing Digital', 'Growth Hacking', 'Analytics'],
      price: '299€',
      image: ''
    },
    {
      id: 4,
      title: 'Mentoring Program: Tech Leadership',
      description: 'Programa de mentoría individual para desarrollar habilidades de liderazgo técnico en startups.',
      type: 'Mentoría',
      startDate: '2023-12-01',
      endDate: '2024-02-29',
      duration: '3 meses',
      location: 'Online',
      participants: 12,
      maxParticipants: 15,
      instructor: 'David Ruiz',
      status: 'completed',
      featured: false,
      skills: ['Leadership', 'Management', 'Tech'],
      price: '500€',
      image: ''
    }
  ]

  const filteredPrograms = programs.filter(program => {
    if (selectedTab === 'all') return true
    return program.status === selectedTab
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'upcoming':
        return <Badge variant="default" className="bg-blue-500">Próximo</Badge>
      case 'active':
        return <Badge variant="default" className="bg-green-500">En curso</Badge>
      case 'completed':
        return <Badge variant="secondary">Completado</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'aceleración':
        return <Target className="h-5 w-5" />
      case 'workshop':
        return <Play className="h-5 w-5" />
      case 'bootcamp':
        return <BookOpen className="h-5 w-5" />
      case 'mentoría':
        return <Award className="h-5 w-5" />
      default:
        return <Calendar className="h-5 w-5" />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-emerald-600 rounded-xl flex items-center justify-center">
              <Calendar className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Programas</h1>
              <p className="text-muted-foreground">
                Descubre cursos, talleres y programas de aceleración
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex space-x-1 bg-muted p-1 rounded-lg w-fit">
            <Button
              variant={selectedTab === 'upcoming' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSelectedTab('upcoming')}
            >
              Próximos
            </Button>
            <Button
              variant={selectedTab === 'active' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSelectedTab('active')}
            >
              En curso
            </Button>
            <Button
              variant={selectedTab === 'completed' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSelectedTab('completed')}
            >
              Completados
            </Button>
            <Button
              variant={selectedTab === 'all' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSelectedTab('all')}
            >
              Todos
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-primary mb-2">24</div>
              <p className="text-sm text-muted-foreground">Programas activos</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-primary mb-2">320+</div>
              <p className="text-sm text-muted-foreground">Participantes</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-primary mb-2">85%</div>
              <p className="text-sm text-muted-foreground">Tasa de finalización</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-primary mb-2">4.8</div>
              <p className="text-sm text-muted-foreground">Puntuación media</p>
            </CardContent>
          </Card>
        </div>

        {/* Lista de programas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredPrograms.map((program) => (
            <Card key={program.id} className={`hover:shadow-lg transition-shadow ${program.featured ? 'ring-2 ring-primary/20' : ''}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                      {getTypeIcon(program.type)}
                    </div>
                    <div>
                      <CardTitle className="text-lg leading-tight">{program.title}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">{program.type}</Badge>
                        {getStatusBadge(program.status)}
                        {program.featured && (
                          <Badge variant="default" className="bg-yellow-500 text-white text-xs">
                            Destacado
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-primary">{program.price}</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">{program.description}</p>

                <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                  <div className="flex items-center text-muted-foreground">
                    <Clock className="h-4 w-4 mr-2" />
                    {program.duration}
                  </div>
                  <div className="flex items-center text-muted-foreground">
                    <MapPin className="h-4 w-4 mr-2" />
                    {program.location}
                  </div>
                  <div className="flex items-center text-muted-foreground">
                    <Users className="h-4 w-4 mr-2" />
                    {program.participants}/{program.maxParticipants} plazas
                  </div>
                  <div className="flex items-center text-muted-foreground">
                    <Calendar className="h-4 w-4 mr-2" />
                    {new Date(program.startDate).toLocaleDateString('es-ES')}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {program.skills.map((skill) => (
                    <Badge key={skill} variant="secondary" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs">
                        {program.instructor.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-muted-foreground">
                      {program.instructor}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      Ver detalles
                    </Button>
                    {program.status === 'upcoming' && (
                      <Button size="sm">
                        Inscribirse
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredPrograms.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No hay programas disponibles en esta categoría</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}