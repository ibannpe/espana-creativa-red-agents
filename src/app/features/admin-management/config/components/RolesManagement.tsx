// ABOUTME: Component for managing system roles (CRUD operations)
// ABOUTME: Allows admins to create, edit, and delete roles with validation

import { useState } from 'react'
import { Plus, Pencil, Trash2, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useRolesQuery } from '../hooks/queries/useRolesQuery'
import { useCreateRoleMutation } from '../hooks/mutations/useCreateRoleMutation'
import { useUpdateRoleMutation } from '../hooks/mutations/useUpdateRoleMutation'
import { useDeleteRoleMutation } from '../hooks/mutations/useDeleteRoleMutation'
import type { Role } from '../data/schemas/config.schema'

export const RolesManagement = () => {
  const { data: roles, isLoading } = useRolesQuery()
  const createMutation = useCreateRoleMutation()
  const updateMutation = useUpdateRoleMutation()
  const deleteMutation = useDeleteRoleMutation()

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [formData, setFormData] = useState({ name: '', description: '' })

  const handleCreate = () => {
    setFormData({ name: '', description: '' })
    setIsCreateDialogOpen(true)
  }

  const handleEdit = (role: Role) => {
    setSelectedRole(role)
    setFormData({ name: role.name, description: role.description || '' })
    setIsEditDialogOpen(true)
  }

  const handleDelete = (role: Role) => {
    setSelectedRole(role)
    setIsDeleteDialogOpen(true)
  }

  const handleSubmitCreate = async () => {
    await createMutation.mutateAsync(formData)
    setIsCreateDialogOpen(false)
    setFormData({ name: '', description: '' })
  }

  const handleSubmitEdit = async () => {
    if (!selectedRole) return
    await updateMutation.mutateAsync({ id: selectedRole.id, data: formData })
    setIsEditDialogOpen(false)
    setSelectedRole(null)
    setFormData({ name: '', description: '' })
  }

  const handleConfirmDelete = async () => {
    if (!selectedRole) return
    await deleteMutation.mutateAsync(selectedRole.id)
    setIsDeleteDialogOpen(false)
    setSelectedRole(null)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-muted-foreground">Cargando roles...</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Gestión de Roles</h3>
          <p className="text-sm text-muted-foreground">
            Crea, edita o elimina roles del sistema
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Crear Rol
        </Button>
      </div>

      <div className="border rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead>Fecha de Creación</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {roles?.map((role) => (
              <TableRow key={role.id}>
                <TableCell className="font-medium">{role.name}</TableCell>
                <TableCell className="text-muted-foreground">
                  {role.description || 'Sin descripción'}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(role.created_at).toLocaleDateString('es-ES')}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(role)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(role)}
                      disabled={role.name === 'admin'}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {(!roles || roles.length === 0) && (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  No hay roles creados
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear Nuevo Rol</DialogTitle>
            <DialogDescription>
              Define un nuevo rol para el sistema
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="ej: mentor, emprendedor"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe el propósito de este rol"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmitCreate}
              disabled={!formData.name || createMutation.isPending}
            >
              {createMutation.isPending ? 'Creando...' : 'Crear Rol'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Rol</DialogTitle>
            <DialogDescription>
              Modifica la información del rol
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nombre *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="ej: mentor, emprendedor"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Descripción</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe el propósito de este rol"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmitEdit}
              disabled={!formData.name || updateMutation.isPending}
            >
              {updateMutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará el rol "{selectedRole?.name}". Solo podrás
              eliminar roles que no estén asignados a ningún usuario.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
