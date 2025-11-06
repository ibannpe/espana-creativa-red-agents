// ABOUTME: Dialog component for creating and editing opportunities
// ABOUTME: Form with validation for opportunity details including title, description, type, skills, location, etc.

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { X, Loader2, MapPin, Calendar, DollarSign, Briefcase } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { useCreateOpportunityMutation } from '../hooks/mutations/useCreateOpportunityMutation'
import { useUpdateOpportunityMutation } from '../hooks/mutations/useUpdateOpportunityMutation'
import { createOpportunityRequestSchema, updateOpportunityRequestSchema, type CreateOpportunityRequest, type OpportunityWithCreator, type OpportunityStatus } from '../data/schemas/opportunity.schema'
import { z } from 'zod'

// Extended schema for edit mode that includes all fields including status
const editOpportunityFormSchema = createOpportunityRequestSchema.extend({
  status: z.enum(['abierta', 'en_progreso', 'cerrada', 'cancelada']).optional()
})

// Extended form type that includes status for edit mode
type OpportunityFormData = z.infer<typeof editOpportunityFormSchema>

interface CreateOpportunityDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  opportunity?: OpportunityWithCreator | null
}

const opportunityTypes = [
  { value: 'proyecto', label: 'Proyecto' },
  { value: 'colaboracion', label: 'Colaboración' },
  { value: 'empleo', label: 'Empleo' },
  { value: 'mentoria', label: 'Mentoría' },
  { value: 'evento', label: 'Evento' },
  { value: 'otro', label: 'Otro' },
]

const opportunityStatuses = [
  { value: 'abierta', label: 'Abierta' },
  { value: 'en_progreso', label: 'En Progreso' },
  { value: 'cerrada', label: 'Cerrada' },
  { value: 'cancelada', label: 'Cancelada' },
]

export function CreateOpportunityDialog({ open, onOpenChange, opportunity }: CreateOpportunityDialogProps) {
  const [skillInput, setSkillInput] = useState('')
  const { action: createOpportunity, isLoading: isCreating } = useCreateOpportunityMutation()
  const { action: updateOpportunity, isLoading: isUpdating } = useUpdateOpportunityMutation()

  const isEditMode = !!opportunity
  const isLoading = isCreating || isUpdating

  const form = useForm<OpportunityFormData>({
    resolver: zodResolver(isEditMode ? editOpportunityFormSchema : createOpportunityRequestSchema),
    defaultValues: {
      title: '',
      description: '',
      type: 'proyecto',
      skills_required: [],
      location: null,
      remote: false,
      duration: null,
      compensation: null,
      status: 'abierta',
    },
  })

  // Update form values when opportunity prop changes
  useEffect(() => {
    if (opportunity) {
      form.reset({
        title: opportunity.title,
        description: opportunity.description,
        type: opportunity.type,
        skills_required: opportunity.skills_required,
        location: opportunity.location || null,
        remote: opportunity.remote,
        duration: opportunity.duration || null,
        compensation: opportunity.compensation || null,
        status: opportunity.status,
      })
    } else {
      form.reset({
        title: '',
        description: '',
        type: 'proyecto',
        skills_required: [],
        location: null,
        remote: false,
        duration: null,
        compensation: null,
        status: 'abierta',
      })
    }
  }, [opportunity, form])

  const skills = form.watch('skills_required')

  const handleAddSkill = () => {
    const trimmedSkill = skillInput.trim()
    if (trimmedSkill && !skills.includes(trimmedSkill)) {
      form.setValue('skills_required', [...skills, trimmedSkill])
      setSkillInput('')
    }
  }

  const handleRemoveSkill = (skillToRemove: string) => {
    form.setValue(
      'skills_required',
      skills.filter((skill) => skill !== skillToRemove)
    )
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddSkill()
    }
  }

  const onSubmit = (data: OpportunityFormData) => {
    if (isEditMode && opportunity) {
      // For update, include status
      updateOpportunity({ id: opportunity.id, data }, {
        onSuccess: () => {
          form.reset()
          onOpenChange(false)
        },
        onError: (error) => {
          console.error('Error al actualizar oportunidad:', error)
        }
      })
    } else {
      // For creation, remove status field (backend sets it to 'abierta' by default)
      const { status, ...createData } = data
      createOpportunity(createData, {
        onSuccess: () => {
          form.reset()
          onOpenChange(false)
        },
        onError: (error) => {
          console.error('Error al crear oportunidad:', error)
        }
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-emerald-600 rounded-xl flex items-center justify-center">
              <Briefcase className="h-5 w-5 text-white" />
            </div>
            {isEditMode ? 'Editar oportunidad' : 'Publicar nueva oportunidad'}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? 'Actualiza los detalles de tu oportunidad'
              : 'Completa los detalles de la oportunidad que quieres compartir con la comunidad'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Título */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ej: Desarrollador Frontend React para Startup Fintech"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Un título claro y descriptivo (5-100 caracteres)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Tipo */}
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de oportunidad *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {opportunityTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Estado - Solo visible en modo edición */}
            {isEditMode && (
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un estado" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {opportunityStatuses.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Las oportunidades cerradas no aparecerán en el listado principal
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Descripción */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe los detalles de la oportunidad, qué buscas, requisitos, etc."
                      className="min-h-[120px] resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Mínimo 20 caracteres, máximo 2000
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Habilidades requeridas */}
            <FormField
              control={form.control}
              name="skills_required"
              render={() => (
                <FormItem>
                  <FormLabel>Habilidades requeridas *</FormLabel>
                  <FormControl>
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Ej: React, TypeScript, Node.js..."
                          value={skillInput}
                          onChange={(e) => setSkillInput(e.target.value)}
                          onKeyDown={handleKeyDown}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleAddSkill}
                        >
                          Añadir
                        </Button>
                      </div>
                      {skills.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {skills.map((skill) => (
                            <Badge
                              key={skill}
                              variant="secondary"
                              className="text-sm pl-3 pr-1 py-1.5"
                            >
                              {skill}
                              <button
                                type="button"
                                onClick={() => handleRemoveSkill(skill)}
                                className="ml-2 hover:bg-muted rounded-full p-0.5"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormDescription>
                    Agrega al menos una habilidad requerida
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Ubicación */}
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    <MapPin className="inline h-4 w-4 mr-1" />
                    Ubicación
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ej: Madrid, Barcelona, Remoto..."
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormDescription>Opcional - Dónde se realizará</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Remoto */}
            <FormField
              control={form.control}
              name="remote"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Trabajo remoto</FormLabel>
                    <FormDescription>
                      Esta oportunidad permite trabajar de forma remota
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            {/* Duración */}
            <FormField
              control={form.control}
              name="duration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    <Calendar className="inline h-4 w-4 mr-1" />
                    Duración estimada
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ej: 3 meses, 6 meses, Indefinido..."
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormDescription>Opcional - Cuánto durará el proyecto</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Compensación */}
            <FormField
              control={form.control}
              name="compensation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    <DollarSign className="inline h-4 w-4 mr-1" />
                    Compensación
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ej: 30.000-40.000€/año, Por proyecto, Voluntario..."
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormDescription>Opcional - Tipo de compensación ofrecida</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Botones de acción */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
              >
                {isLoading && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isEditMode ? 'Guardar cambios' : 'Publicar oportunidad'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
