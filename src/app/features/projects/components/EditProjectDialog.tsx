// ABOUTME: Dialog component for editing existing projects
// ABOUTME: Pre-fills form with current program data and validates with Zod

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useUpdateProjectMutation } from '../hooks/mutations/useUpdateProjectMutation'
import { updateProjectRequestSchema, type UpdateProjectRequest, type ProjectWithCreator } from '../data/schemas/project.schema'

interface EditProjectDialogProps {
  program: ProjectWithCreator
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditProjectDialog({ program, open, onOpenChange }: EditProjectDialogProps) {
  const { action: updateProject, isLoading } = useUpdateProjectMutation()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch
  } = useForm<UpdateProjectRequest>({
    resolver: zodResolver(updateProjectRequestSchema),
    defaultValues: {
      title: program.title,
      description: program.description,
      type: program.type,
      start_date: program.start_date.split('T')[0],
      end_date: program.end_date.split('T')[0],
      duration: program.duration,
      instructor: program.instructor,
      location: program.location,
      price: program.price,
      max_participants: program.max_participants,
      skills: program.skills,
      featured: program.featured
    }
  })

  const [skillInput, setSkillInput] = useState('')
  const skills = watch('skills') || []

  // Update form when program changes
  useEffect(() => {
    reset({
      title: program.title,
      description: program.description,
      type: program.type,
      start_date: program.start_date.split('T')[0],
      end_date: program.end_date.split('T')[0],
      duration: program.duration,
      instructor: program.instructor,
      location: program.location,
      price: program.price,
      max_participants: program.max_participants,
      skills: program.skills,
      featured: program.featured
    })
  }, [program, reset])

  const addSkill = () => {
    if (skillInput.trim() && !skills.includes(skillInput.trim())) {
      setValue('skills', [...skills, skillInput.trim()])
      setSkillInput('')
    }
  }

  const removeSkill = (skillToRemove: string) => {
    setValue('skills', skills.filter(s => s !== skillToRemove))
  }

  const onSubmit = async (data: UpdateProjectRequest) => {
    try {
      await updateProject({ id: String(program.id), data })
      onOpenChange(false)
    } catch (error) {
      console.error('Error updating program:', error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Projecta</DialogTitle>
          <DialogDescription>
            Actualiza la información del programa
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              {...register('title')}
              placeholder="Ej: Workshop de Design Thinking"
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Descripción *</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Describe el programa, qué aprenderán los participantes..."
              rows={4}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            )}
          </div>

          {/* Type and Instructor */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Tipo *</Label>
              <Select
                onValueChange={(value) => setValue('type', value as any)}
                defaultValue={program.type}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="aceleracion">Aceleración</SelectItem>
                  <SelectItem value="workshop">Workshop</SelectItem>
                  <SelectItem value="bootcamp">Bootcamp</SelectItem>
                  <SelectItem value="mentoria">Mentoría</SelectItem>
                  <SelectItem value="curso">Curso</SelectItem>
                  <SelectItem value="proyecto">Proyecto</SelectItem>
                  <SelectItem value="otro">Otro</SelectItem>
                </SelectContent>
              </Select>
              {errors.type && (
                <p className="text-sm text-destructive">{errors.type.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="instructor">Instructor *</Label>
              <Input
                id="instructor"
                {...register('instructor')}
                placeholder="Nombre del instructor"
              />
              {errors.instructor && (
                <p className="text-sm text-destructive">{errors.instructor.message}</p>
              )}
            </div>
          </div>

          {/* Dates and Duration */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Fecha inicio *</Label>
              <Input
                id="start_date"
                type="date"
                {...register('start_date')}
              />
              {errors.start_date && (
                <p className="text-sm text-destructive">{errors.start_date.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_date">Fecha fin *</Label>
              <Input
                id="end_date"
                type="date"
                {...register('end_date')}
              />
              {errors.end_date && (
                <p className="text-sm text-destructive">{errors.end_date.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duración *</Label>
              <Input
                id="duration"
                {...register('duration')}
                placeholder="Ej: 2 semanas"
              />
              {errors.duration && (
                <p className="text-sm text-destructive">{errors.duration.message}</p>
              )}
            </div>
          </div>

          {/* Location and Price */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location">Ubicación</Label>
              <Input
                id="location"
                {...register('location')}
                placeholder="Madrid, Online..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Precio</Label>
              <Input
                id="price"
                {...register('price')}
                placeholder="150€, Gratuito..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="max_participants">Plazas máximas</Label>
              <Input
                id="max_participants"
                type="number"
                {...register('max_participants', { valueAsNumber: true })}
                placeholder="30"
              />
            </div>
          </div>

          {/* Skills */}
          <div className="space-y-2">
            <Label>Habilidades *</Label>
            <div className="flex gap-2">
              <Input
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addSkill()
                  }
                }}
                placeholder="Añade una habilidad y presiona Enter"
              />
              <Button type="button" onClick={addSkill} variant="outline">
                Añadir
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {skills.map((skill) => (
                <div
                  key={skill}
                  className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm flex items-center gap-2"
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => removeSkill(skill)}
                    className="hover:text-destructive"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            {errors.skills && (
              <p className="text-sm text-destructive">{errors.skills.message}</p>
            )}
          </div>

          {/* Featured */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="featured"
              {...register('featured')}
              className="rounded"
            />
            <Label htmlFor="featured" className="cursor-pointer">
              Destacar este programa
            </Label>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
