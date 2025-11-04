// ABOUTME: Main admin configuration page with tabbed interface
// ABOUTME: Provides access to roles, user assignments, and system settings management

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Settings, Users, UserCog, Shield, ArrowLeft } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { RolesManagement } from '../components/RolesManagement'
import { UserRolesAssignment } from '../components/UserRolesAssignment'
import { SystemSettingsPanel } from '../components/SystemSettingsPanel'

export const AdminConfigPage = () => {
  const [activeTab, setActiveTab] = useState('roles')
  const navigate = useNavigate()

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* Botón Volver */}
      <Button
        variant="ghost"
        onClick={() => navigate('/gestion')}
        className="mb-6 hover:bg-gray-100"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Volver a Gestión
      </Button>

      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Settings className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Configuración del Sistema</h1>
            <p className="text-muted-foreground">
              Gestiona roles, asignaciones y configuraciones generales de la plataforma
            </p>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
          <TabsTrigger value="roles" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Roles</span>
          </TabsTrigger>
          <TabsTrigger value="assignments" className="flex items-center gap-2">
            <UserCog className="h-4 w-4" />
            <span className="hidden sm:inline">Asignaciones</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Configuraciones</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="roles" className="space-y-6">
          <RolesManagement />
        </TabsContent>

        <TabsContent value="assignments" className="space-y-6">
          <UserRolesAssignment />
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <SystemSettingsPanel />
        </TabsContent>
      </Tabs>
    </div>
  )
}
