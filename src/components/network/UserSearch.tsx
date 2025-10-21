'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Search, Filter, X, Users } from 'lucide-react'
import { searchUsers } from '@/lib/api/users'
import { User } from '@/types'
import { ProfileCard } from '@/components/profile/ProfileCard'
// import { useLogger } from '@/lib/logger'

interface UserSearchProps {
  onUserSelect?: (user: User) => void
}

export function UserSearch({ onUserSelect }: UserSearchProps) {
  // const logger = useLogger('UserSearch')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState({
    role: '',
    location: '',
    skills: [] as string[]
  })
  const [skillInput, setSkillInput] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  // Simplificar para evitar bucles infinitos
  useEffect(() => {
    // logger.debug('Search effect triggered', { 
    //   query, 
    //   role: filters.role, 
    //   location: filters.location, 
    //   skills: filters.skills 
    // })

    const delayedSearch = setTimeout(async () => {
      if (query.length > 0 || filters.role || filters.location || filters.skills.length > 0) {
        // logger.info('Starting user search', { 
        //   query, 
        //   filters: { role: filters.role, location: filters.location, skills: filters.skills }
        // })
        
        setLoading(true)
        setError(null)
        try {
          const searchParams = {
            role: filters.role,
            location: filters.location,
            skills: filters.skills
          }
          
          const { data, error: searchError } = await searchUsers(query, searchParams)
          
          if (searchError) {
            // logger.error('Search API error', searchError)
            setError('Error al buscar usuarios. Por favor, intenta de nuevo.')
            setResults([])
          } else {
            // logger.info('Search successful', { resultCount: data.length })
            setResults(data)
          }
        } catch (error) {
          // logger.error('Search exception', error)
          setError('Error al buscar usuarios. Por favor, intenta de nuevo.')
          setResults([])
        } finally {
          setLoading(false)
        }
      } else {
        // logger.debug('Clearing search results')
        setResults([])
        setError(null)
        setLoading(false)
      }
    }, 500)

    return () => clearTimeout(delayedSearch)
  }, [query, filters.role, filters.location, JSON.stringify(filters.skills)])

  const addSkillFilter = () => {
    if (skillInput.trim() && !filters.skills.includes(skillInput.trim())) {
      // logger.userAction('add-skill-filter', { skill: skillInput.trim() })
      setFilters(prev => ({
        ...prev,
        skills: [...prev.skills, skillInput.trim()]
      }))
      setSkillInput('')
    }
  }

  const removeSkillFilter = (skill: string) => {
    // logger.userAction('remove-skill-filter', { skill })
    setFilters(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skill)
    }))
  }

  const clearFilters = () => {
    // logger.userAction('clear-filters')
    setFilters({
      role: '',
      location: '',
      skills: []
    })
    setQuery('')
    setError(null)
    setResults([])
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addSkillFilter()
    }
  }

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Search className="h-5 w-5 mr-2" />
            Buscar en la Red
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder="Buscar por nombre, biografía o habilidades..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtros
            </Button>
            {(query || filters.role || filters.location || filters.skills.length > 0) && (
              <Button variant="outline" onClick={clearFilters}>
                <X className="h-4 w-4 mr-2" />
                Limpiar
              </Button>
            )}
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <label className="block text-sm font-medium mb-2">Rol</label>
                <Select 
                  value={filters.role} 
                  onValueChange={(value) => setFilters(prev => ({ ...prev, role: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar rol" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos los roles</SelectItem>
                    <SelectItem value="emprendedor">Emprendedor</SelectItem>
                    <SelectItem value="mentor">Mentor</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Ubicación</label>
                <Input
                  placeholder="Ciudad o región"
                  value={filters.location}
                  onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Habilidades</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Agregar habilidad"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                  />
                  <Button type="button" size="sm" onClick={addSkillFilter}>
                    +
                  </Button>
                </div>
                {filters.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {filters.skills.map((skill, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1">
                        {skill}
                        <X
                          className="h-3 w-3 cursor-pointer"
                          onClick={() => removeSkillFilter(skill)}
                        />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-gray-600 mt-2">Buscando...</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-red-600 text-center">{error}</p>
        </div>
      )}

      {!loading && !error && results.length === 0 && (query || filters.role || filters.location || filters.skills.length > 0) && (
        <div className="text-center py-12 text-gray-500">
          <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No se encontraron usuarios con esos criterios</p>
          <p className="text-sm mt-2">Intenta con otros filtros o términos de búsqueda</p>
        </div>
      )}

      {!loading && !error && results.length === 0 && !query && !filters.role && !filters.location && filters.skills.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Usa la barra de búsqueda para encontrar miembros de la red</p>
          <p className="text-sm mt-2">Busca por nombre, habilidades o usa los filtros avanzados</p>
        </div>
      )}

      {/* Results Grid */}
      {!loading && results.length > 0 && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-gray-600">
              {results.length} {results.length === 1 ? 'resultado encontrado' : 'resultados encontrados'}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {results.map((user) => (
              <ProfileCard
                key={user.id}
                user={user}
                onStartChat={onUserSelect ? () => onUserSelect(user) : undefined}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}