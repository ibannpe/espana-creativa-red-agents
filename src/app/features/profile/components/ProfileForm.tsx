// ABOUTME: Profile editing form component using new profile feature architecture
// ABOUTME: Uses useUpdateProfileMutation and useUploadAvatarMutation for data operations

'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { X, Upload, Camera } from 'lucide-react'
import { useUpdateProfileMutation } from '../hooks/mutations/useUpdateProfileMutation'
import { useUploadAvatarMutation } from '../hooks/mutations/useUploadAvatarMutation'
import { useAuthContext } from '@/app/features/auth/hooks/useAuthContext'
import type { UpdateProfileRequest } from '../data/schemas/profile.schema'

export function ProfileForm() {
  const { user } = useAuthContext()
  const userId = user?.id

  // Mutations
  const {
    action: updateProfile,
    isLoading: isUpdating,
    error: updateError,
    isSuccess: updateSuccess
  } = useUpdateProfileMutation(userId || '')

  const {
    action: uploadAvatar,
    isLoading: isUploadingAvatar,
    error: uploadError,
    isSuccess: uploadSuccess
  } = useUploadAvatarMutation(userId || '')

  const [formData, setFormData] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
    location: user?.location || '',
    linkedin_url: user?.linkedin_url || '',
    website_url: user?.website_url || '',
    skills: user?.skills || [],
    interests: user?.interests || []
  })

  const [avatarPreview, setAvatarPreview] = useState(user?.avatar_url || '')
  const [skillInput, setSkillInput] = useState('')
  const [interestInput, setInterestInput] = useState('')
  const [validationError, setValidationError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Update form data when user data changes
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        bio: user.bio || '',
        location: user.location || '',
        linkedin_url: user.linkedin_url || '',
        website_url: user.website_url || '',
        skills: user.skills || [],
        interests: user.interests || []
      })
      setAvatarPreview(user.avatar_url || '')
    }
  }, [user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setValidationError('')

    // Client-side validation
    if (!formData.name || formData.name.length < 2) {
      setValidationError('El nombre debe tener al menos 2 caracteres')
      return
    }

    if (formData.bio && formData.bio.length > 500) {
      setValidationError('La biografía no puede superar 500 caracteres')
      return
    }

    // Prepare update request (only send changed fields)
    const updateRequest: UpdateProfileRequest = {}

    if (formData.name !== user?.name) updateRequest.name = formData.name
    if (formData.bio !== user?.bio) updateRequest.bio = formData.bio || null
    if (formData.location !== user?.location) updateRequest.location = formData.location || null
    if (formData.linkedin_url !== user?.linkedin_url) updateRequest.linkedin_url = formData.linkedin_url || null
    if (formData.website_url !== user?.website_url) updateRequest.website_url = formData.website_url || null
    if (JSON.stringify(formData.skills) !== JSON.stringify(user?.skills)) updateRequest.skills = formData.skills
    if (JSON.stringify(formData.interests) !== JSON.stringify(user?.interests)) updateRequest.interests = formData.interests

    // Only update if there are changes
    if (Object.keys(updateRequest).length > 0) {
      updateProfile(updateRequest)
    }
  }

  const addSkill = () => {
    if (skillInput.trim() && !formData.skills.includes(skillInput.trim())) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, skillInput.trim()]
      }))
      setSkillInput('')
    }
  }

  const removeSkill = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skill)
    }))
  }

  const addInterest = () => {
    if (interestInput.trim() && !formData.interests.includes(interestInput.trim())) {
      setFormData(prev => ({
        ...prev,
        interests: [...prev.interests, interestInput.trim()]
      }))
      setInterestInput('')
    }
  }

  const removeInterest = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.filter(i => i !== interest)
    }))
  }

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setValidationError('')

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setValidationError('Por favor selecciona un archivo de imagen válido')
      return
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setValidationError('La imagen debe ser menor a 5MB')
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    // Upload using mutation
    uploadAvatar(file)
  }

  const triggerPhotoUpload = () => {
    fileInputRef.current?.click()
  }

  // Combined error message
  const errorMessage = validationError || updateError?.message || uploadError?.message

  if (!user) {
    return (
      <Card>
        <CardContent className="p-6">
          <p>Debes iniciar sesión para editar tu perfil</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Editar Perfil</CardTitle>
        <CardDescription>
          Completa tu perfil para mejorar tu visibilidad en la red
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profile Photo Section */}
          <div className="flex flex-col items-center space-y-4 pb-6 border-b">
            <div className="relative">
              <Avatar className="w-24 h-24">
                <AvatarImage src={avatarPreview} alt="Foto de perfil" />
                <AvatarFallback className="text-2xl bg-gradient-to-br from-primary to-primary/80 text-white">
                  {formData.name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-2 -right-2">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="rounded-full w-8 h-8 p-0"
                  onClick={triggerPhotoUpload}
                  disabled={isUploadingAvatar}
                >
                  <Camera className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="text-center">
              <Button
                type="button"
                variant="outline"
                onClick={triggerPhotoUpload}
                disabled={isUploadingAvatar}
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                {isUploadingAvatar ? 'Subiendo...' : 'Cambiar foto de perfil'}
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                JPG, PNG o GIF. Máximo 5MB.
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Nombre completo *
              </label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Ubicación
              </label>
              <Input
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                placeholder="Madrid, España"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Biografía
            </label>
            <Textarea
              value={formData.bio}
              onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
              placeholder="Cuéntanos sobre ti, tu experiencia y qué te apasiona..."
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {formData.bio.length}/500 caracteres
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                LinkedIn URL
              </label>
              <Input
                type="url"
                value={formData.linkedin_url}
                onChange={(e) => setFormData(prev => ({ ...prev, linkedin_url: e.target.value }))}
                placeholder="https://linkedin.com/in/tu-perfil"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Sitio web
              </label>
              <Input
                type="url"
                value={formData.website_url}
                onChange={(e) => setFormData(prev => ({ ...prev, website_url: e.target.value }))}
                placeholder="https://tu-sitio-web.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Habilidades
            </label>
            <div className="flex gap-2 mb-2">
              <Input
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                placeholder="Agregar habilidad..."
              />
              <Button type="button" onClick={addSkill}>
                Agregar
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.skills.map((skill, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                  {skill}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => removeSkill(skill)}
                  />
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Intereses
            </label>
            <div className="flex gap-2 mb-2">
              <Input
                value={interestInput}
                onChange={(e) => setInterestInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addInterest())}
                placeholder="Agregar interés..."
              />
              <Button type="button" onClick={addInterest}>
                Agregar
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.interests.map((interest, index) => (
                <Badge key={index} variant="outline" className="flex items-center gap-1">
                  {interest}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => removeInterest(interest)}
                  />
                </Badge>
              ))}
            </div>
          </div>

          {errorMessage && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded">
              {errorMessage}
            </div>
          )}

          {(updateSuccess || uploadSuccess) && (
            <div className="text-sm text-green-600 bg-green-50 p-3 rounded">
              {uploadSuccess && 'Foto actualizada correctamente'}
              {uploadSuccess && updateSuccess && ' • '}
              {updateSuccess && 'Perfil actualizado correctamente'}
            </div>
          )}

          <Button type="submit" disabled={isUpdating} className="w-full">
            {isUpdating ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
