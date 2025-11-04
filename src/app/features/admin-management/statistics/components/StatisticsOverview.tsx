// ABOUTME: Admin component for displaying platform statistics overview
// ABOUTME: Shows key metrics in visually appealing cards with icons

import { useStatisticsQuery } from '../hooks/queries/useStatisticsQuery'
import { Users, Briefcase, Link2, UserCheck, Clock } from 'lucide-react'

export function StatisticsOverview() {
  const { data, isLoading, error } = useStatisticsQuery()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando estadísticas...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-xl">
        <p className="text-red-800">Error al cargar estadísticas: {error.message}</p>
      </div>
    )
  }

  const stats = data?.statistics

  if (!stats) {
    return null
  }

  // Get role names and counts
  const roleEntries = Object.entries(stats.usersByRole)

  // Helper to get role badge color
  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return 'bg-red-100 text-red-800'
      case 'mentor':
        return 'bg-blue-100 text-blue-800'
      case 'emprendedor':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-8">
      {/* Main Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Users */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <span className="text-3xl font-bold text-gray-900">{stats.totalUsers}</span>
          </div>
          <h3 className="text-sm font-medium text-gray-600">Total Usuarios</h3>
        </div>

        {/* Total Opportunities */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Briefcase className="h-6 w-6 text-purple-600" />
            </div>
            <span className="text-3xl font-bold text-gray-900">{stats.totalOpportunities}</span>
          </div>
          <h3 className="text-sm font-medium text-gray-600">Oportunidades</h3>
        </div>

        {/* Active Connections */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <Link2 className="h-6 w-6 text-green-600" />
            </div>
            <span className="text-3xl font-bold text-gray-900">{stats.activeConnections}</span>
          </div>
          <h3 className="text-sm font-medium text-gray-600">Conexiones Activas</h3>
        </div>

        {/* Pending Signups */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <span className="text-3xl font-bold text-gray-900">{stats.pendingSignups}</span>
          </div>
          <h3 className="text-sm font-medium text-gray-600">Solicitudes Pendientes</h3>
        </div>
      </div>

      {/* Users by Role */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <UserCheck className="h-6 w-6 text-primary" />
          <h3 className="text-lg font-semibold text-gray-900">Usuarios por Rol</h3>
        </div>

        {roleEntries.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No hay roles asignados</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {roleEntries.map(([role, count]) => (
              <div
                key={role}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getRoleColor(role)}`}>
                    {role}
                  </span>
                </div>
                <span className="text-2xl font-bold text-gray-900">{count}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
