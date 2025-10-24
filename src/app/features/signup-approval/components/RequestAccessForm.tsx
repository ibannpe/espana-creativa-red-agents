// ABOUTME: Request access form component for admin-approval signup workflow
// ABOUTME: Users submit email and name, admin receives notification, user gets magic link on approval

import { useState } from 'react'
import { useSubmitSignupRequestMutation } from '../hooks/mutations/useSubmitSignupRequestMutation'
import { submitSignupRequestSchema } from '../data/schemas/signup-approval.schema'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Mail, User, Loader2 } from 'lucide-react'

export function RequestAccessForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [surname, setSurname] = useState('')
  const [localError, setLocalError] = useState('')
  const { action: submitRequest, isLoading, error: submitError, isSuccess } = useSubmitSignupRequestMutation()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError('')

    // Validate with Zod schema
    const validation = submitSignupRequestSchema.safeParse({ email, name, surname })
    if (!validation.success) {
      setLocalError(validation.error.errors[0].message)
      return
    }

    submitRequest({ email, name, surname })
  }

  if (isSuccess) {
    return (
      <div className="text-center space-y-4 p-6 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex justify-center">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-green-900 mb-1">¡Solicitud Enviada!</h3>
          <p className="text-sm text-green-800">
            Tu solicitud de registro ha sido enviada exitosamente. El administrador la revisará en las próximas 24-48 horas.
          </p>
        </div>
        <div className="bg-green-100 border border-green-300 rounded-md p-3">
          <p className="text-xs text-green-900">
            <strong>¿Qué sigue?</strong><br />
            El equipo de administración revisará tu solicitud en las próximas 24-48 horas.
            Recibirás un correo electrónico cuando tu cuenta sea aprobada.
          </p>
        </div>
        <Button
          onClick={() => window.location.href = '/'}
          variant="outline"
          className="w-full"
        >
          Volver al Inicio
        </Button>
      </div>
    )
  }

  const error = submitError?.message || localError

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-xs text-blue-900">
          El registro requiere aprobación del administrador. Recibirás un email con un enlace para
          completar tu perfil una vez tu solicitud sea aprobada.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name-input">
            Nombre <span className="text-red-500">*</span>
          </Label>
          <div className="relative">
            <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="name-input"
              type="text"
              placeholder="Nombre"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="pl-10"
              required
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="surname-input">Apellidos</Label>
          <div className="relative">
            <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="surname-input"
              type="text"
              placeholder="Apellido1 Apellido2"
              value={surname}
              onChange={(e) => setSurname(e.target.value)}
              className="pl-10"
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email-input">
            Email <span className="text-red-500">*</span>
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="email-input"
              type="email"
              placeholder="correo@mail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10"
              required
              disabled={isLoading}
            />
          </div>
        </div>

        {error && (
          <div className="text-sm text-destructive">
            {error}
          </div>
        )}

        <Button type="submit" className="w-full h-11" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Enviando solicitud...
            </>
          ) : (
            'Enviar Solicitud'
          )}
        </Button>
      </form>
    </div>
  )
}
