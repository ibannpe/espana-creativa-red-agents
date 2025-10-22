// ABOUTME: Admin component for viewing and managing pending signup requests
// ABOUTME: Displays table with approve/reject actions, filters, and pagination

import { useState } from 'react'
import { useGetPendingSignupsQuery } from '../hooks/queries/useGetPendingSignupsQuery'
import { useGetPendingCountQuery } from '../hooks/queries/useGetPendingCountQuery'
import { useApproveSignupMutation } from '../hooks/mutations/useApproveSignupMutation'
import { useRejectSignupMutation } from '../hooks/mutations/useRejectSignupMutation'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

type StatusFilter = 'pending' | 'approved' | 'rejected'

export function AdminPendingList() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending')
  const [page, setPage] = useState(0)
  const limit = 20

  const { data, isLoading, error, refetch } = useGetPendingSignupsQuery({
    status: statusFilter,
    limit,
    offset: page * limit
  })

  const { data: countData } = useGetPendingCountQuery()
  const { action: approveSignup, isLoading: isApproving } = useApproveSignupMutation()
  const { action: rejectSignup, isLoading: isRejecting } = useRejectSignupMutation()

  const handleApprove = (token: string) => {
    if (confirm('¿Aprobar esta solicitud? El usuario recibirá un magic link por email.')) {
      approveSignup(
        { token },
        {
          onSuccess: () => {
            refetch()
          }
        }
      )
    }
  }

  const handleReject = (token: string) => {
    if (confirm('¿Rechazar esta solicitud? El usuario será notificado por email.')) {
      rejectSignup(
        { token },
        {
          onSuccess: () => {
            refetch()
          }
        }
      )
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando solicitudes...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-xl">
        <p className="text-red-800">Error al cargar solicitudes: {error.message}</p>
      </div>
    )
  }

  const signups = data?.signups || []
  const total = data?.total || 0
  const totalPages = Math.ceil(total / limit)
  const pendingCount = countData?.count || 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestión de Solicitudes</h2>
          <p className="text-gray-600 mt-1">
            {pendingCount > 0 && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 mr-2">
                {pendingCount} pendientes
              </span>
            )}
            Total: {total} solicitudes
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <button
          onClick={() => {
            setStatusFilter('pending')
            setPage(0)
          }}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            statusFilter === 'pending'
              ? 'bg-yellow-100 text-yellow-900'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Pendientes
        </button>
        <button
          onClick={() => {
            setStatusFilter('approved')
            setPage(0)
          }}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            statusFilter === 'approved'
              ? 'bg-green-100 text-green-900'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Aprobadas
        </button>
        <button
          onClick={() => {
            setStatusFilter('rejected')
            setPage(0)
          }}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            statusFilter === 'rejected'
              ? 'bg-red-100 text-red-900'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Rechazadas
        </button>
      </div>

      {/* Table */}
      {signups.length === 0 ? (
        <div className="text-center p-12 bg-gray-50 rounded-xl">
          <p className="text-gray-600">No hay solicitudes {statusFilter}.</p>
        </div>
      ) : (
        <div className="border rounded-xl bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Estado</TableHead>
                {statusFilter === 'pending' && <TableHead className="text-right">Acciones</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {signups.map((signup) => (
                <TableRow key={signup.id}>
                  <TableCell className="font-medium">
                    {signup.name} {signup.surname || ''}
                  </TableCell>
                  <TableCell>{signup.email}</TableCell>
                  <TableCell>
                    {new Date(signup.createdAt).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        signup.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : signup.status === 'approved'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {signup.status === 'pending' && 'Pendiente'}
                      {signup.status === 'approved' && 'Aprobada'}
                      {signup.status === 'rejected' && 'Rechazada'}
                    </span>
                  </TableCell>
                  {statusFilter === 'pending' && (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleApprove(signup.id)}
                          disabled={isApproving || isRejecting}
                          className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          Aprobar
                        </button>
                        <button
                          onClick={() => handleReject(signup.id)}
                          disabled={isApproving || isRejecting}
                          className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          Rechazar
                        </button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-700">
            Página {page + 1} de {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Anterior
            </button>
            <button
              onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
              disabled={page >= totalPages - 1}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
