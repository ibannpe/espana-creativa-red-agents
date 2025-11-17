// ABOUTME: Component for displaying role change audit log
// ABOUTME: Shows who assigned/removed roles, when, and to whom

import { useState } from 'react'
import { useAuditLogQuery } from '../hooks/queries/useAuditLogQuery'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Loader2, Filter, ChevronLeft, ChevronRight } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export function RoleAuditLog() {
  const [filters, setFilters] = useState<{
    action?: 'assigned' | 'removed'
    limit: number
    offset: number
  }>({
    limit: 20,
    offset: 0
  })

  const { data, isLoading, refetch } = useAuditLogQuery(filters)

  const logs = data?.logs || []
  const total = data?.total || 0
  const currentPage = Math.floor(filters.offset / filters.limit) + 1
  const totalPages = Math.ceil(total / filters.limit)

  const handleNextPage = () => {
    setFilters((prev) => ({
      ...prev,
      offset: prev.offset + prev.limit
    }))
  }

  const handlePrevPage = () => {
    setFilters((prev) => ({
      ...prev,
      offset: Math.max(0, prev.offset - prev.limit)
    }))
  }

  const handleFilterChange = (action?: 'assigned' | 'removed') => {
    setFilters({
      ...filters,
      action,
      offset: 0 // Reset to first page when filtering
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium">Filtrar por acción:</span>
        </div>
        <Select
          value={filters.action || 'all'}
          onValueChange={(value) =>
            handleFilterChange(value === 'all' ? undefined : (value as 'assigned' | 'removed'))
          }
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="assigned">Asignado</SelectItem>
            <SelectItem value="removed">Removido</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="ghost" size="sm" onClick={() => refetch()}>
          Actualizar
        </Button>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rol
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acción
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Realizado por
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {format(new Date(log.created_at), "d 'de' MMMM, yyyy 'a las' HH:mm", {
                      locale: es
                    })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {log.user_name || 'Usuario sin nombre'}
                      </div>
                      <div className="text-sm text-gray-500">{log.user_email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant="secondary">{log.role_name}</Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={log.action === 'assigned' ? 'default' : 'destructive'}>
                      {log.action === 'assigned' ? 'Asignado' : 'Removido'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {log.performed_by_name || 'Sistema'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {logs.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No hay registros en el log de auditoría</p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 rounded-xl">
          <div className="flex flex-1 justify-between sm:hidden">
            <Button
              onClick={handlePrevPage}
              disabled={filters.offset === 0}
              variant="outline"
              size="sm"
            >
              Anterior
            </Button>
            <Button
              onClick={handleNextPage}
              disabled={filters.offset + filters.limit >= total}
              variant="outline"
              size="sm"
            >
              Siguiente
            </Button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Mostrando <span className="font-medium">{filters.offset + 1}</span> a{' '}
                <span className="font-medium">
                  {Math.min(filters.offset + filters.limit, total)}
                </span>{' '}
                de <span className="font-medium">{total}</span> resultados
              </p>
            </div>
            <div>
              <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                <Button
                  onClick={handlePrevPage}
                  disabled={filters.offset === 0}
                  variant="outline"
                  size="sm"
                  className="rounded-r-none"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="sr-only">Anterior</span>
                </Button>
                <span className="inline-flex items-center border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700">
                  Página {currentPage} de {totalPages}
                </span>
                <Button
                  onClick={handleNextPage}
                  disabled={filters.offset + filters.limit >= total}
                  variant="outline"
                  size="sm"
                  className="rounded-l-none"
                >
                  <ChevronRight className="h-4 w-4" />
                  <span className="sr-only">Siguiente</span>
                </Button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
