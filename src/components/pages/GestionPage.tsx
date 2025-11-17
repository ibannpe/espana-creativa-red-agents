// ABOUTME: Página de gestión administrativa accesible solo para usuarios con rol admin
// ABOUTME: Proporciona herramientas de administración y gestión del sistema

import { useNavigate } from 'react-router-dom'
import { useUserRoles } from '@/app/features/auth/hooks/useUserRoles'
import { useEffect } from 'react'
import { Shield, Users, FileText, Settings, BarChart3, AlertCircle, ArrowLeft, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function GestionPage() {
  const { isAdmin, isLoading } = useUserRoles()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      navigate('/')
    }
  }, [isAdmin, isLoading, navigate])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Botón Volver */}
      <Button
        variant="ghost"
        onClick={() => navigate('/dashboard')}
        className="mb-6 hover:bg-gray-100"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Volver al Dashboard
      </Button>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Panel de Gestión</h1>
        </div>
        <p className="text-muted-foreground">
          Herramientas de administración y gestión del sistema
        </p>
      </div>

      {/* Alert de acceso admin */}
      <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 mb-8 flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
        <div>
          <p className="font-medium text-primary">Acceso de Administrador</p>
          <p className="text-sm text-muted-foreground mt-1">
            Estás visualizando esta página con permisos de administrador. Ten cuidado con las acciones que realices.
          </p>
        </div>
      </div>

      {/* Grid de módulos de gestión */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Gestión de Usuarios */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold">Usuarios y Roles</h2>
          </div>
          <p className="text-muted-foreground text-sm mb-4">
            Administra usuarios, roles territoriales y permisos del sistema
          </p>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => navigate('/gestion/usuarios')}
              className="text-primary hover:underline text-sm font-medium text-left"
            >
              Ver usuarios →
            </button>
            <button
              onClick={() => navigate('/gestion/roles')}
              className="text-primary hover:underline text-sm font-medium text-left"
            >
              Gestionar roles →
            </button>
          </div>
        </div>

        {/* Aprobaciones */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <FileText className="h-6 w-6 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold">Aprobaciones</h2>
          </div>
          <p className="text-muted-foreground text-sm mb-4">
            Gestiona solicitudes de registro pendientes
          </p>
          <button
            onClick={() => navigate('/signup-approval')}
            className="text-primary hover:underline text-sm font-medium"
          >
            Ver solicitudes →
          </button>
        </div>

        {/* Territorios */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-emerald-100 rounded-lg">
              <MapPin className="h-6 w-6 text-emerald-600" />
            </div>
            <h2 className="text-xl font-semibold">Territorios</h2>
          </div>
          <p className="text-muted-foreground text-sm mb-4">
            Gestiona ciudades y territorios de la red
          </p>
          <button
            onClick={() => navigate('/gestion/territorios')}
            className="text-primary hover:underline text-sm font-medium"
          >
            Gestionar territorios →
          </button>
        </div>

        {/* Estadísticas */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <BarChart3 className="h-6 w-6 text-purple-600" />
            </div>
            <h2 className="text-xl font-semibold">Estadísticas</h2>
          </div>
          <p className="text-muted-foreground text-sm mb-4">
            Métricas y análisis de uso de la plataforma
          </p>
          <button
            onClick={() => navigate('/gestion/estadisticas')}
            className="text-primary hover:underline text-sm font-medium"
          >
            Ver estadísticas →
          </button>
        </div>

        {/* Configuración */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-orange-100 rounded-lg">
              <Settings className="h-6 w-6 text-orange-600" />
            </div>
            <h2 className="text-xl font-semibold">Configuración</h2>
          </div>
          <p className="text-muted-foreground text-sm mb-4">
            Ajustes generales del sistema y plataforma
          </p>
          <button
            onClick={() => navigate('/gestion/configuracion')}
            className="text-primary hover:underline text-sm font-medium"
          >
            Configurar →
          </button>
        </div>

        {/* Contenido */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-indigo-100 rounded-lg">
              <FileText className="h-6 w-6 text-indigo-600" />
            </div>
            <h2 className="text-xl font-semibold">Contenido</h2>
          </div>
          <p className="text-muted-foreground text-sm mb-4">
            Gestiona oportunidades, proyectos y recursos
          </p>
          <button className="text-primary hover:underline text-sm font-medium">
            Gestionar contenido →
          </button>
        </div>

        {/* Reportes */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-red-100 rounded-lg">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold">Reportes</h2>
          </div>
          <p className="text-muted-foreground text-sm mb-4">
            Revisa reportes y contenido denunciado
          </p>
          <button className="text-primary hover:underline text-sm font-medium">
            Ver reportes →
          </button>
        </div>
      </div>

      {/* Sección de información rápida */}
      <div className="mt-8 bg-gray-50 rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4">Información del Sistema</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Versión</p>
            <p className="font-medium">1.0.0</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Entorno</p>
            <p className="font-medium">{import.meta.env.MODE}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Base de Datos</p>
            <p className="font-medium">Supabase PostgreSQL</p>
          </div>
        </div>
      </div>
    </div>
  )
}
