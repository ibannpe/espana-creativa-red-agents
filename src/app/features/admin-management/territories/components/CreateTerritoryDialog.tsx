// ABOUTME: Dialog for creating or editing a territory with image upload
// ABOUTME: Handles form validation, image upload to Supabase Storage, and API submission

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
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
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Upload, Loader2, X, ImageIcon } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'
import type { CityWithStats } from '@/app/features/cities/data/schemas/city.schema'
import { useCreateCityMutation } from '@/app/features/cities/hooks/mutations/useCreateCityMutation'
import { useUpdateCityMutation } from '@/app/features/cities/hooks/mutations/useUpdateCityMutation'

const territoryFormSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  slug: z.string()
    .min(2, 'El slug debe tener al menos 2 caracteres')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'El slug debe ser lowercase con guiones'),
  description: z.string().optional(),
  active: z.boolean().default(true),
  display_order: z.number().default(0),
})

type TerritoryFormValues = z.infer<typeof territoryFormSchema>

interface CreateTerritoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  territory?: CityWithStats | null
}

export function CreateTerritoryDialog({
  open,
  onOpenChange,
  territory,
}: CreateTerritoryDialogProps) {
  const { toast } = useToast()
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isUploadingImage, setIsUploadingImage] = useState(false)

  const createCityMutation = useCreateCityMutation()
  const updateCityMutation = useUpdateCityMutation()

  const form = useForm<TerritoryFormValues>({
    resolver: zodResolver(territoryFormSchema),
    defaultValues: {
      name: '',
      slug: '',
      description: '',
      active: true,
      display_order: 0,
    },
  })

  // Load territory data when editing
  useEffect(() => {
    if (territory) {
      form.reset({
        name: territory.name,
        slug: territory.slug,
        description: territory.description || '',
        active: territory.active,
        display_order: territory.display_order,
      })
      setImagePreview(territory.image_url)
    } else {
      form.reset({
        name: '',
        slug: '',
        description: '',
        active: true,
        display_order: 0,
      })
      setImagePreview(null)
    }
    setImageFile(null)
  }, [territory, form])

  // Auto-generate slug from name
  const handleNameChange = (name: string) => {
    if (!territory) {
      const slug = name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim()
      form.setValue('slug', slug)
    }
  }

  // Handle image selection
  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Error',
        description: 'Por favor selecciona un archivo de imagen válido',
        variant: 'destructive',
      })
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Error',
        description: 'La imagen no debe superar los 5MB',
        variant: 'destructive',
      })
      return
    }

    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  // Remove selected image
  const handleRemoveImage = () => {
    setImageFile(null)
    setImagePreview(territory?.image_url || null)
  }

  // Upload image to Supabase Storage
  const uploadImage = async (file: File, territorySlug: string): Promise<string> => {
    setIsUploadingImage(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${territorySlug}-${Date.now()}.${fileExt}`
      const filePath = `territories/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('city-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) {
        throw uploadError
      }

      // Get public URL
      const { data } = supabase.storage
        .from('city-images')
        .getPublicUrl(filePath)

      return data.publicUrl
    } catch (error) {
      console.error('Error uploading image:', error)
      throw new Error('No se pudo subir la imagen')
    } finally {
      setIsUploadingImage(false)
    }
  }

  const onSubmit = async (values: TerritoryFormValues) => {
    try {
      let imageUrl = territory?.image_url || ''

      // Upload new image if selected
      if (imageFile) {
        imageUrl = await uploadImage(imageFile, values.slug)
      }

      // Check if we need an image URL
      if (!imageUrl) {
        toast({
          title: 'Error',
          description: 'Debe seleccionar una imagen para el territorio',
          variant: 'destructive',
        })
        return
      }

      if (territory) {
        // Update existing territory
        await updateCityMutation.mutateAsync({
          cityId: territory.id,
          data: {
            name: values.name,
            image_url: imageUrl,
            description: values.description || null,
            active: values.active,
            display_order: values.display_order
          }
        })
      } else {
        // Create new territory
        await createCityMutation.mutateAsync({
          name: values.name,
          slug: values.slug,
          image_url: imageUrl,
          description: values.description,
          active: values.active,
          display_order: values.display_order
        })
      }

      toast({
        title: territory ? 'Territorio actualizado' : 'Territorio creado',
        description: `El territorio "${values.name}" ha sido ${territory ? 'actualizado' : 'creado'} exitosamente`,
      })

      onOpenChange(false)
    } catch (error) {
      console.error('Error saving territory:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'No se pudo guardar el territorio',
        variant: 'destructive',
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {territory ? 'Editar Territorio' : 'Nuevo Territorio'}
          </DialogTitle>
          <DialogDescription>
            {territory
              ? 'Modifica la información del territorio'
              : 'Crea un nuevo territorio en la red'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Image Upload */}
            <div className="space-y-2">
              <FormLabel>Imagen del Territorio</FormLabel>
              <div className="flex flex-col gap-4">
                {imagePreview ? (
                  <div className="relative w-full h-48 rounded-lg overflow-hidden border">
                    <img
                      src={imagePreview}
                      alt="Vista previa"
                      className="w-full h-full object-cover"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={handleRemoveImage}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="w-full h-48 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50">
                    <div className="text-center">
                      <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">
                        No hay imagen seleccionada
                      </p>
                    </div>
                  </div>
                )}

                <div>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                    id="territory-image"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('territory-image')?.click()}
                    className="w-full"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {imageFile ? 'Cambiar imagen' : 'Seleccionar imagen'}
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    Formatos: JPG, PNG, WEBP. Tamaño máximo: 5MB
                  </p>
                </div>
              </div>
            </div>

            {/* Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del Territorio *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Ej: Córdoba"
                      onChange={(e) => {
                        field.onChange(e)
                        handleNameChange(e.target.value)
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Slug */}
            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Slug (URL) *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Ej: cordoba"
                      disabled={!!territory}
                    />
                  </FormControl>
                  <FormDescription>
                    Identificador único para la URL. Solo minúsculas y guiones.
                    {territory && ' No se puede modificar en edición.'}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Breve descripción del territorio..."
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Display Order */}
            <FormField
              control={form.control}
              name="display_order"
              render={({ field}) => (
                <FormItem>
                  <FormLabel>Orden de visualización</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>
                    Número para ordenar los territorios (menor número = primero)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Active */}
            <FormField
              control={form.control}
              name="active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Activo</FormLabel>
                    <FormDescription>
                      Los territorios inactivos no se mostrarán públicamente
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Actions */}
            <div className="flex gap-3 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={createCityMutation.isPending || updateCityMutation.isPending || isUploadingImage}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createCityMutation.isPending || updateCityMutation.isPending || isUploadingImage}
              >
                {(createCityMutation.isPending || updateCityMutation.isPending || isUploadingImage) && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                {isUploadingImage
                  ? 'Subiendo imagen...'
                  : createCityMutation.isPending || updateCityMutation.isPending
                  ? 'Guardando...'
                  : territory
                  ? 'Actualizar'
                  : 'Crear'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
