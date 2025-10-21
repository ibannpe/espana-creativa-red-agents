'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { updateUserProfile } from '@/lib/api/users'
import { User } from '@/types'
import { X, Upload, Camera } from 'lucide-react'
import { supabase } from '@/lib/supabase'
// import { useLogger } from '@/lib/logger'

interface ProfileFormProps {
  user: User
  onUpdate?: (user: User) => void
}

export function ProfileForm({ user, onUpdate }: ProfileFormProps) {
  // const logger = useLogger('ProfileForm');
  
  const [formData, setFormData] = useState({
    name: user.name || '',
    bio: user.bio || '',
    location: user.location || '',
    linkedin_url: user.linkedin_url || '',
    website_url: user.website_url || '',
    skills: user.skills || [],
    interests: user.interests || [],
    avatar_url: user.avatar_url || ''
  })
  
  const [skillInput, setSkillInput] = useState('')
  const [interestInput, setInterestInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // logger.userAction('profile-form-submit', { userId: user.id, fields: Object.keys(formData).filter(key => formData[key as keyof typeof formData]) });
    
    setLoading(true)
    setError('')
    setSuccess(false)

    const { data, error } = await updateUserProfile(user.id, formData)

    if (error) {
      // logger.error('Profile update failed', { userId: user.id, error: error.message });
      setError(error.message)
    } else {
      // logger.info('Profile updated successfully', { userId: user.id, updatedFields: Object.keys(formData) });
      setSuccess(true)
      // User data will be refreshed automatically through useAuth hook
      if (onUpdate && data) {
        onUpdate({ ...user, ...data })
      }
    }

    setLoading(false)
  }

  const addSkill = () => {
    if (skillInput.trim() && !formData.skills.includes(skillInput.trim())) {
      const skill = skillInput.trim();
      // logger.userAction('skill-added', { userId: user.id, skill });
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, skill]
      }))
      setSkillInput('')
    }
  }

  const removeSkill = (skill: string) => {
    // logger.userAction('skill-removed', { userId: user.id, skill });
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skill)
    }))
  }

  const addInterest = () => {
    if (interestInput.trim() && !formData.interests.includes(interestInput.trim())) {
      const interest = interestInput.trim();
      // logger.userAction('interest-added', { userId: user.id, interest });
      setFormData(prev => ({
        ...prev,
        interests: [...prev.interests, interest]
      }))
      setInterestInput('')
    }
  }

  const removeInterest = (interest: string) => {
    // logger.userAction('interest-removed', { userId: user.id, interest });
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.filter(i => i !== interest)
    }))
  }


  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // logger.userAction('photo-upload-started', { userId: user.id, fileName: file.name, fileSize: file.size });

    // Validate file type
    if (!file.type.startsWith('image/')) {
      // logger.warn('Invalid file type selected', { userId: user.id, fileType: file.type });
      setError('Por favor selecciona un archivo de imagen válido')
      return
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      // logger.warn('File size too large', { userId: user.id, fileSize: file.size });
      setError('La imagen debe ser menor a 5MB')
      return
    }

    setUploadingPhoto(true)
    setError('')

    try {
      // Create unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}-${Date.now()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      // logger.debug('Uploading photo to Supabase', { userId: user.id, filePath });

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('fotos-perfil')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        // logger.error('Photo upload failed', { userId: user.id, error: uploadError });
        setError('Error al subir la imagen. Inténtalo de nuevo.')
        return
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('fotos-perfil')
        .getPublicUrl(filePath)

      // logger.info('Photo uploaded successfully', { userId: user.id, publicUrl });

      // Update form data with new avatar URL
      setFormData(prev => ({ ...prev, avatar_url: publicUrl }))
      setSuccess(true)

    } catch (error) {
      // logger.error('Photo upload error', { userId: user.id, error });
      setError('Error al subir la imagen')
    } finally {
      setUploadingPhoto(false)
    }
  }

  const triggerPhotoUpload = () => {
    // logger.userAction('photo-upload-triggered', { userId: user.id });
    fileInputRef.current?.click()
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
                <AvatarImage src={formData.avatar_url} alt="Foto de perfil" />
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
                  disabled={uploadingPhoto}
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
                disabled={uploadingPhoto}
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                {uploadingPhoto ? 'Subiendo...' : 'Cambiar foto de perfil'}
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
            />
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

          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
              {error}
            </div>
          )}

          {success && (
            <div className="text-sm text-green-600 bg-green-50 p-3 rounded">
              Perfil actualizado correctamente
            </div>
          )}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}