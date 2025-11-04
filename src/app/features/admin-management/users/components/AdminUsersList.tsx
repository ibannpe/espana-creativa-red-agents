// ABOUTME: Admin component for viewing and managing system users with role information
// ABOUTME: Displays table with user details, roles, and completion percentage

import { useState } from 'react'
import { useAdminUsersQuery } from '../hooks/queries/useAdminUsersQuery'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search } from 'lucide-react'
import type { AdminUser } from '../data/schemas/admin-users.schema'

export function AdminUsersList() {
  const { data, isLoading, error } = useAdminUsersQuery()
  const [searchQuery, setSearchQuery] = useState('')

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando usuarios...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-xl">
        <p className="text-red-800">Error al cargar usuarios: {error.message}</p>
      </div>
    )
  }

  const users = data?.users || []

  // Filter users based on search query
  const filteredUsers = users.filter((user: AdminUser) => {
    const query = searchQuery.toLowerCase()
    return (
      user.name.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      user.roles.some(role => role.toLowerCase().includes(query)) ||
      (user.location && user.location.toLowerCase().includes(query))
    )
  })

  // Get role badge color
  const getRoleBadgeColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return 'bg-red-100 text-red-800 hover:bg-red-100'
      case 'mentor':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-100'
      case 'emprendedor':
        return 'bg-green-100 text-green-800 hover:bg-green-100'
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-100'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header with search */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestión de Usuarios</h2>
          <p className="text-gray-600 mt-1">Total: {filteredUsers.length} usuarios</p>
        </div>
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Buscar por nombre, email, rol o ubicación..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Table */}
      {filteredUsers.length === 0 ? (
        <div className="text-center p-12 bg-gray-50 rounded-xl">
          <p className="text-gray-600">
            {searchQuery ? 'No se encontraron usuarios que coincidan con la búsqueda.' : 'No hay usuarios registrados.'}
          </p>
        </div>
      ) : (
        <div className="border rounded-xl bg-white overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Roles</TableHead>
                <TableHead>Ubicación</TableHead>
                <TableHead>Perfil</TableHead>
                <TableHead>Fecha de Registro</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user: AdminUser) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell className="text-gray-600">{user.email}</TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {user.roles.length > 0 ? (
                        user.roles.map((role) => (
                          <Badge
                            key={role}
                            variant="secondary"
                            className={getRoleBadgeColor(role)}
                          >
                            {role}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-gray-400 text-sm">Sin roles</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-600">
                    {user.location || <span className="text-gray-400">-</span>}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-full bg-gray-200 rounded-full h-2 max-w-[80px]">
                        <div
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{ width: `${user.completed_pct}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600 min-w-[40px]">
                        {user.completed_pct}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-600">
                    {new Date(user.created_at).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
