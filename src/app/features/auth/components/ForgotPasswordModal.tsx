// ABOUTME: Modal component for requesting password reset email
// ABOUTME: Uses useForgotPasswordMutation hook and provides form validation feedback

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Mail } from 'lucide-react'
import { useForgotPasswordMutation } from '../hooks/mutations/useForgotPasswordMutation'
import { forgotPasswordRequestSchema } from '../data/schemas/auth.schema'
import { z } from 'zod'

interface ForgotPasswordModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ForgotPasswordModal({ open, onOpenChange }: ForgotPasswordModalProps) {
  const { action: forgotPassword, isLoading, error, isSuccess } = useForgotPasswordMutation()
  const [email, setEmail] = useState('')
  const [validationError, setValidationError] = useState('')

  // Reset form when dialog closes or opens
  useEffect(() => {
    if (!open) {
      setEmail('')
      setValidationError('')
    }
  }, [open])

  // Close modal after success message is shown
  useEffect(() => {
    if (isSuccess) {
      setTimeout(() => {
        onOpenChange(false)
      }, 3000)
    }
  }, [isSuccess, onOpenChange])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setValidationError('')

    try {
      // Validate email
      const validatedData = forgotPasswordRequestSchema.parse({ email })

      // Call mutation
      forgotPassword(validatedData)
    } catch (err) {
      if (err instanceof z.ZodError) {
        setValidationError(err.errors[0].message)
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            Recuperar Contraseña
          </DialogTitle>
          <DialogDescription>
            Introduce tu email y te enviaremos un enlace para restablecer tu contraseña
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Field */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                setValidationError('')
              }}
              disabled={isLoading || isSuccess}
              className={validationError ? 'border-red-500' : ''}
            />
            {validationError && (
              <p className="text-sm text-red-600">{validationError}</p>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-4">
              {error instanceof Error ? error.message : 'Error al enviar el email'}
            </div>
          )}

          {/* Success Message */}
          {isSuccess && (
            <div className="text-sm text-green-600 bg-green-50 border border-green-200 rounded-xl p-4">
              <p className="font-medium mb-1">¡Email enviado!</p>
              <p>Revisa tu bandeja de entrada y sigue las instrucciones para restablecer tu contraseña.</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading || isSuccess}
              className="flex-1"
            >
              {isLoading ? 'Enviando...' : 'Enviar Email'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
