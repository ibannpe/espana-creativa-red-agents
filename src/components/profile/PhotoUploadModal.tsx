import { useState, useRef } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Upload, Camera, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthContext } from '@/app/features/auth/hooks/useAuthContext'
import { updateUserProfile } from '@/lib/api/users'

interface PhotoUploadModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onPhotoUpdated?: (avatarUrl: string) => void
}

export function PhotoUploadModal({ open, onOpenChange, onPhotoUpdated }: PhotoUploadModalProps) {
  const { user } = useAuthContext()
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Por favor selecciona un archivo de imagen válido')
      return
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen debe ser menor a 5MB')
      return
    }

    setError('')
    setSelectedFile(file)
    
    // Create preview URL
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleUpload = async () => {
    if (!selectedFile || !user) return

    setUploading(true)
    setError('')

    try {
      // Create unique filename
      const fileExt = selectedFile.name.split('.').pop()
      const fileName = `${user.id}-${Date.now()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('fotos-perfil')
        .upload(filePath, selectedFile, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        setError('Error al subir la imagen. Inténtalo de nuevo.')
        return
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('fotos-perfil')
        .getPublicUrl(filePath)

      // Update user profile with new avatar URL
      const { error: updateError } = await updateUserProfile(user.id, {
        avatar_url: publicUrl
      })

      if (updateError) {
        setError('Error al actualizar el perfil')
        return
      }

      // Success callback
      onPhotoUpdated?.(publicUrl)
      
      handleClose()

    } catch (error) {
      console.error('Error uploading photo:', error)
      setError('Error al subir la imagen')
    } finally {
      setUploading(false)
    }
  }

  const handleClose = () => {
    setPreviewUrl(null)
    setSelectedFile(null)
    setError('')
    onOpenChange(false)
  }

  const triggerFileSelect = () => {
    fileInputRef.current?.click()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cambiar foto de perfil</DialogTitle>
          <DialogDescription>
            Sube una nueva foto de perfil para personalizar tu cuenta
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current/Preview Photo */}
          <div className="flex justify-center">
            <div className="relative">
              <Avatar className="w-32 h-32">
                <AvatarImage 
                  src={previewUrl || user?.user_metadata?.avatar_url} 
                  alt="Preview"
                />
                <AvatarFallback className="text-3xl bg-gradient-to-br from-primary to-primary/80 text-white">
                  {user?.user_metadata?.name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {previewUrl && (
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="absolute -top-2 -right-2 rounded-full w-8 h-8 p-0"
                  onClick={() => {
                    setPreviewUrl(null)
                    setSelectedFile(null)
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Upload Controls */}
          <div className="space-y-4">
            <Button
              type="button"
              variant="outline"
              onClick={triggerFileSelect}
              className="w-full flex items-center gap-2"
              disabled={uploading}
            >
              <Camera className="h-4 w-4" />
              {selectedFile ? 'Cambiar imagen' : 'Seleccionar imagen'}
            </Button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />

            {selectedFile && (
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-3">
                  Imagen seleccionada: {selectedFile.name}
                </p>
                <Button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="w-full"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {uploading ? 'Subiendo...' : 'Subir foto'}
                </Button>
              </div>
            )}
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-4">
              {error}
            </div>
          )}

          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              Formatos admitidos: JPG, PNG, GIF • Tamaño máximo: 5MB
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}