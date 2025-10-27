// ABOUTME: Profile form component for editing user profile information
// ABOUTME: Handles profile updates with React Hook Form, Zod validation, and automatic completion percentage recalculation

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Plus, X } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import axiosInstance from '@/lib/axios'
import type { User } from '@/types/database'

// Validation schema
const profileFormSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(100, 'El nombre es demasiado largo'),
  bio: z.string().max(500, 'La biografía es demasiado larga').optional().nullable(),
  location: z.string().max(100, 'La ubicación es demasiado larga').optional().nullable(),
  linkedin_url: z.string().url('URL inválida').or(z.literal('')).optional().nullable(),
  website_url: z.string().url('URL inválida').or(z.literal('')).optional().nullable(),
})

type ProfileFormData = z.infer<typeof profileFormSchema>

interface ProfileFormProps {
  user: User
}

export function ProfileForm({ user }: ProfileFormProps) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [skills, setSkills] = useState<string[]>(user.skills || [])
  const [newSkill, setNewSkill] = useState('')
  const [interests, setInterests] = useState<string[]>(user.interests || [])
  const [newInterest, setNewInterest] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty }
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: user.name || '',
      bio: user.bio || '',
      location: user.location || '',
      linkedin_url: user.linkedin_url || '',
      website_url: user.website_url || '',
    }
  })

  const handleAddSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()])
      setNewSkill('')
    }
  }

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter(skill => skill !== skillToRemove))
  }

  const handleAddInterest = () => {
    if (newInterest.trim() && !interests.includes(newInterest.trim())) {
      setInterests([...interests, newInterest.trim()])
      setNewInterest('')
    }
  }

  const handleRemoveInterest = (interestToRemove: string) => {
    setInterests(interests.filter(interest => interest !== interestToRemove))
  }

  const onSubmit = async (data: ProfileFormData) => {
    setIsSubmitting(true)

    try {
      // Use backend API endpoint with axios (includes auth token automatically)
      await axiosInstance.put(`/users/${user.id}`, {
        name: data.name,
        bio: data.bio || null,
        location: data.location || null,
        linkedin_url: data.linkedin_url || null,
        website_url: data.website_url || null,
        skills,
        interests,
      })

      // Invalidate React Query cache to trigger refetch and recalculation
      await queryClient.invalidateQueries({ queryKey: ['auth', 'currentUser'] })

      toast({
        title: 'Perfil actualizado',
        description: 'Tu perfil se ha actualizado correctamente',
      })
    } catch (error) {
      console.error('Error updating profile:', error)
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el perfil. Por favor, inténtalo de nuevo.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Name field */}
      <div className="space-y-2">
        <Label htmlFor="name">Nombre *</Label>
        <Input
          id="name"
          {...register('name')}
          placeholder="Tu nombre completo"
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      {/* Email field (read-only) */}
      <div className="space-y-2">
        <Label htmlFor="email">Correo electrónico</Label>
        <Input
          id="email"
          value={user.email || ''}
          disabled
          className="bg-muted cursor-not-allowed"
        />
        <p className="text-xs text-muted-foreground">
          Para modificar tu correo, contacta al administrador
        </p>
      </div>

      {/* Bio field */}
      <div className="space-y-2">
        <Label htmlFor="bio">Biografía</Label>
        <Textarea
          id="bio"
          {...register('bio')}
          placeholder="Cuéntanos sobre ti..."
          rows={4}
        />
        {errors.bio && (
          <p className="text-sm text-destructive">{errors.bio.message}</p>
        )}
      </div>

      {/* Location field */}
      <div className="space-y-2">
        <Label htmlFor="location">Ubicación</Label>
        <Input
          id="location"
          {...register('location')}
          placeholder="Ciudad, País"
        />
        {errors.location && (
          <p className="text-sm text-destructive">{errors.location.message}</p>
        )}
      </div>

      {/* LinkedIn URL field */}
      <div className="space-y-2">
        <Label htmlFor="linkedin_url">LinkedIn</Label>
        <Input
          id="linkedin_url"
          {...register('linkedin_url')}
          placeholder="https://linkedin.com/in/tu-perfil"
          type="url"
        />
        {errors.linkedin_url && (
          <p className="text-sm text-destructive">{errors.linkedin_url.message}</p>
        )}
      </div>

      {/* Website URL field */}
      <div className="space-y-2">
        <Label htmlFor="website_url">Sitio web</Label>
        <Input
          id="website_url"
          {...register('website_url')}
          placeholder="https://tu-sitio.com"
          type="url"
        />
        {errors.website_url && (
          <p className="text-sm text-destructive">{errors.website_url.message}</p>
        )}
      </div>

      {/* Skills field */}
      <div className="space-y-2">
        <Label>Habilidades</Label>
        <div className="flex gap-2">
          <Input
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            placeholder="Añade una habilidad"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleAddSkill()
              }
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleAddSkill}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {skills.map((skill) => (
            <Badge key={skill} variant="secondary" className="gap-1">
              {skill}
              <button
                type="button"
                onClick={() => handleRemoveSkill(skill)}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      </div>

      {/* Interests field */}
      <div className="space-y-2">
        <Label>Intereses</Label>
        <div className="flex gap-2">
          <Input
            value={newInterest}
            onChange={(e) => setNewInterest(e.target.value)}
            placeholder="Añade un interés"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleAddInterest()
              }
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleAddInterest}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {interests.map((interest) => (
            <Badge key={interest} variant="secondary" className="gap-1">
              {interest}
              <button
                type="button"
                onClick={() => handleRemoveInterest(interest)}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      </div>

      {/* Submit button */}
      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={isSubmitting || (!isDirty && skills.length === (user.skills?.length || 0) && interests.length === (user.interests?.length || 0))}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Guardando...
            </>
          ) : (
            'Guardar cambios'
          )}
        </Button>
      </div>
    </form>
  )
}
