// ABOUTME: Main page for user role management in admin panel
// ABOUTME: Combines UserRoleManagement and RoleAuditLog components with tabs

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUserRoles } from '@/app/features/auth/hooks/useUserRoles'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { UserRoleManagement } from '../components/UserRoleManagement'
import { RoleAuditLog } from '../components/RoleAuditLog'
import { ArrowLeft, Users, FileText } from 'lucide-react'

export function UserRolesPage() {
  const { isAdmin, isLoading } = useUserRoles()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('management')

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!isAdmin) {
    navigate('/')
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/gestion')}
          className="mb-4 hover:bg-gray-100"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a Gestión
        </Button>

        <div className="flex items-center gap-3 mb-2">
          <Users className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Gestión de Roles de Usuario</h1>
        </div>
        <p className="text-muted-foreground">
          Asigna y remueve roles territoriales a usuarios. Los cambios quedan registrados en el log de auditoría.
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="management" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>Gestión de Roles</span>
          </TabsTrigger>
          <TabsTrigger value="audit" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span>Log de Auditoría</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="management">
          <UserRoleManagement />
        </TabsContent>

        <TabsContent value="audit">
          <RoleAuditLog />
        </TabsContent>
      </Tabs>
    </div>
  )
}
