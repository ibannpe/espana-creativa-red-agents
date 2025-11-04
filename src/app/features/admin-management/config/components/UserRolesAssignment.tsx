// ABOUTME: Component for assigning and removing roles from users
// ABOUTME: Allows admins to manage user role assignments with validation

import { useState } from 'react'
import { UserPlus, X, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useAdminUsersQuery } from '../../users/hooks/queries/useAdminUsersQuery'
import { useRolesQuery } from '../hooks/queries/useRolesQuery'
import { useAssignRoleMutation } from '../hooks/mutations/useAssignRoleMutation'
import { useRemoveRoleMutation } from '../hooks/mutations/useRemoveRoleMutation'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

export const UserRolesAssignment = () => {
  const { data: usersData, isLoading: usersLoading } = useAdminUsersQuery()
  const { data: roles, isLoading: rolesLoading } = useRolesQuery()
  const assignMutation = useAssignRoleMutation()
  const removeMutation = useRemoveRoleMutation()

  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false)
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedUserId, setSelectedUserId] = useState('')
  const [selectedRoleId, setSelectedRoleId] = useState('')
  const [removeData, setRemoveData] = useState<{ userId: string; roleId: string; roleName: string; userName: string } | null>(null)

  const users = usersData?.users || []

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleAssign = () => {
    setSelectedUserId('')
    setSelectedRoleId('')
    setIsAssignDialogOpen(true)
  }

  const handleSubmitAssign = async () => {
    if (!selectedUserId || !selectedRoleId) return
    await assignMutation.mutateAsync({ userId: selectedUserId, roleId: selectedRoleId })
    setIsAssignDialogOpen(false)
    setSelectedUserId('')
    setSelectedRoleId('')
  }

  const handleRemoveRole = (userId: string, roleId: string, roleName: string, userName: string) => {
    setRemoveData({ userId, roleId, roleName, userName })
    setIsRemoveDialogOpen(true)
  }

  const handleConfirmRemove = async () => {
    if (!removeData) return
    await removeMutation.mutateAsync({ userId: removeData.userId, roleId: removeData.roleId })
    setIsRemoveDialogOpen(false)
    setRemoveData(null)
  }

  const getRoleBadgeColor = (roleName: string) => {
    switch (roleName.toLowerCase()) {
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

  if (usersLoading || rolesLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-muted-foreground">Cargando datos...</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Asignación de Roles</h3>
          <p className="text-sm text-muted-foreground">
            Asigna o remueve roles de los usuarios
          </p>
        </div>
        <Button onClick={handleAssign}>
          <UserPlus className="mr-2 h-4 w-4" />
          Asignar Rol
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar usuarios por nombre o email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="border rounded-xl divide-y">
        {filteredUsers.map((user) => (
          <div key={user.id} className="p-4 hover:bg-muted/50 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{user.name}</div>
                <div className="text-sm text-muted-foreground truncate">{user.email}</div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {user.roles && user.roles.length > 0 ? (
                    user.roles.map((roleName) => {
                      const role = roles?.find(r => r.name === roleName)
                      return (
                        <Badge
                          key={roleName}
                          variant="secondary"
                          className={`${getRoleBadgeColor(roleName)} flex items-center gap-1`}
                        >
                          {roleName}
                          <button
                            onClick={() => handleRemoveRole(
                              user.id,
                              role?.id || '',
                              roleName,
                              user.name
                            )}
                            className="ml-1 hover:bg-black/10 rounded-full p-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      )
                    })
                  ) : (
                    <span className="text-sm text-muted-foreground italic">Sin roles asignados</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        {filteredUsers.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            No se encontraron usuarios
          </div>
        )}
      </div>

      {/* Assign Role Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Asignar Rol a Usuario</DialogTitle>
            <DialogDescription>
              Selecciona un usuario y el rol que deseas asignarle
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="user-select">Usuario *</Label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger id="user-select">
                  <SelectValue placeholder="Selecciona un usuario" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="role-select">Rol *</Label>
              <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
                <SelectTrigger id="role-select">
                  <SelectValue placeholder="Selecciona un rol" />
                </SelectTrigger>
                <SelectContent>
                  {roles?.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                      {role.description && (
                        <span className="text-muted-foreground"> - {role.description}</span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAssignDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmitAssign}
              disabled={!selectedUserId || !selectedRoleId || assignMutation.isPending}
            >
              {assignMutation.isPending ? 'Asignando...' : 'Asignar Rol'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Role Confirmation Dialog */}
      <AlertDialog open={isRemoveDialogOpen} onOpenChange={setIsRemoveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Remover rol de usuario?</AlertDialogTitle>
            <AlertDialogDescription>
              Estás a punto de remover el rol "{removeData?.roleName}" del usuario "{removeData?.userName}".
              Esta acción puede ser revertida asignando el rol nuevamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmRemove}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {removeMutation.isPending ? 'Removiendo...' : 'Remover Rol'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
