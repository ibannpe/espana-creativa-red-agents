// ABOUTME: Component for managing user roles (assigning and removing)
// ABOUTME: Displays users table with role badges and action dialogs

import { useState } from 'react'
import { useAdminUsersQuery } from '../hooks/queries/useAdminUsersQuery'
import { useRolesQuery } from '../hooks/queries/useRolesQuery'
import { useAssignRoleMutation } from '../hooks/mutations/useAssignRoleMutation'
import { useRemoveRoleMutation } from '../hooks/mutations/useRemoveRoleMutation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { UserPlus, UserMinus, Loader2 } from 'lucide-react'

export function UserRoleManagement() {
  const { data: usersData, isLoading: isLoadingUsers } = useAdminUsersQuery()
  const { data: roles, isLoading: isLoadingRoles } = useRolesQuery()
  const assignRoleMutation = useAssignRoleMutation()
  const removeRoleMutation = useRemoveRoleMutation()

  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<string | null>(null)
  const [selectedRole, setSelectedRole] = useState<number | null>(null)

  if (isLoadingUsers || isLoadingRoles) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const users = usersData?.users || []
  const allRoles = roles || []

  const handleAssignRole = () => {
    if (!selectedUser || !selectedRole) return

    assignRoleMutation.mutate(
      { userId: selectedUser, roleId: selectedRole },
      {
        onSuccess: () => {
          setAssignDialogOpen(false)
          setSelectedUser(null)
          setSelectedRole(null)
        }
      }
    )
  }

  const handleRemoveRole = () => {
    if (!selectedUser || !selectedRole) return

    removeRoleMutation.mutate(
      { userId: selectedUser, roleId: selectedRole },
      {
        onSuccess: () => {
          setRemoveDialogOpen(false)
          setSelectedUser(null)
          setSelectedRole(null)
        }
      }
    )
  }

  const getRoleId = (roleName: string): number | undefined => {
    return allRoles.find((r) => r.name === roleName)?.id
  }

  const getAvailableRolesToAssign = (userRoles: string[]) => {
    return allRoles.filter((role) => !userRoles.includes(role.name))
  }

  const getUserAssignedRoles = (userRoles: string[]) => {
    return allRoles.filter((role) => userRoles.includes(role.name))
  }

  return (
    <div className="space-y-6">
      {/* Users Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Roles
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        {user.avatar_url ? (
                          <img
                            className="h-10 w-10 rounded-full"
                            src={user.avatar_url}
                            alt={user.name}
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-sm font-medium text-primary">
                              {user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{user.email}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-2">
                      {user.roles.length > 0 ? (
                        user.roles.map((role) => (
                          <Badge key={role} variant="secondary">
                            {role}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-sm text-gray-400">Sin roles</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      {/* Assign Role Dialog */}
                      <Dialog open={assignDialogOpen && selectedUser === user.id} onOpenChange={setAssignDialogOpen}>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedUser(user.id)}
                            disabled={getAvailableRolesToAssign(user.roles).length === 0}
                          >
                            <UserPlus className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Asignar Rol</DialogTitle>
                            <DialogDescription>
                              Asignar un nuevo rol a {user.name}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Seleccionar rol</label>
                              <Select
                                onValueChange={(value) => setSelectedRole(parseInt(value))}
                                value={selectedRole?.toString()}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecciona un rol" />
                                </SelectTrigger>
                                <SelectContent>
                                  {getAvailableRolesToAssign(user.roles).map((role) => (
                                    <SelectItem key={role.id} value={role.id.toString()}>
                                      {role.name}
                                      {role.description && (
                                        <span className="text-xs text-gray-500 ml-2">
                                          - {role.description}
                                        </span>
                                      )}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setAssignDialogOpen(false)
                                  setSelectedUser(null)
                                  setSelectedRole(null)
                                }}
                              >
                                Cancelar
                              </Button>
                              <Button
                                onClick={handleAssignRole}
                                disabled={!selectedRole || assignRoleMutation.isPending}
                              >
                                {assignRoleMutation.isPending ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Asignando...
                                  </>
                                ) : (
                                  'Asignar'
                                )}
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>

                      {/* Remove Role Dialog */}
                      <Dialog open={removeDialogOpen && selectedUser === user.id} onOpenChange={setRemoveDialogOpen}>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedUser(user.id)}
                            disabled={user.roles.length === 0}
                          >
                            <UserMinus className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Remover Rol</DialogTitle>
                            <DialogDescription>
                              Remover un rol de {user.name}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Seleccionar rol a remover</label>
                              <Select
                                onValueChange={(value) => setSelectedRole(parseInt(value))}
                                value={selectedRole?.toString()}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecciona un rol" />
                                </SelectTrigger>
                                <SelectContent>
                                  {getUserAssignedRoles(user.roles).map((role) => (
                                    <SelectItem key={role.id} value={role.id.toString()}>
                                      {role.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setRemoveDialogOpen(false)
                                  setSelectedUser(null)
                                  setSelectedRole(null)
                                }}
                              >
                                Cancelar
                              </Button>
                              <Button
                                variant="destructive"
                                onClick={handleRemoveRole}
                                disabled={!selectedRole || removeRoleMutation.isPending}
                              >
                                {removeRoleMutation.isPending ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Removiendo...
                                  </>
                                ) : (
                                  'Remover'
                                )}
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {users.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No hay usuarios registrados</p>
        </div>
      )}
    </div>
  )
}
