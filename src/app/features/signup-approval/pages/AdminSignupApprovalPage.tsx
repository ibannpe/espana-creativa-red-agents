// ABOUTME: Admin page for managing pending signup requests with navigation
// ABOUTME: Wraps AdminPendingList component with consistent admin page layout

import { useNavigate } from 'react-router-dom'
import { useUserRoles } from '@/app/features/auth/hooks/useUserRoles'
import { useEffect } from 'react'
import { UserCheck, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AdminPendingList } from '../components/AdminPendingList'

export function AdminSignupApprovalPage() {
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
        onClick={() => navigate('/gestion')}
        className="mb-6 hover:bg-gray-100"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Volver a Gestión
      </Button>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <UserCheck className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Aprobación de Registros</h1>
        </div>
        <p className="text-muted-foreground">
          Revisa y gestiona las solicitudes de acceso a la plataforma
        </p>
      </div>

      {/* AdminPendingList Component */}
      <AdminPendingList />
    </div>
  )
}
