// ABOUTME: Request access form component for admin-approval signup workflow
// ABOUTME: Users submit email and name, admin receives notification, user gets magic link on approval

import { useState } from 'react'
import { useSubmitSignupRequestMutation } from '../hooks/mutations/useSubmitSignupRequestMutation'
import { submitSignupRequestSchema } from '../data/schemas/signup-approval.schema'

export function RequestAccessForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [surname, setSurname] = useState('')
  const [localError, setLocalError] = useState('')
  const { action: submitRequest, isLoading, error: submitError, isSuccess, data } = useSubmitSignupRequestMutation()

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
      <div className="text-center space-y-6 p-8 bg-green-50 border border-green-200 rounded-xl">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-green-900 mb-2">¡Solicitud Enviada!</h2>
          <p className="text-green-800">
            {data?.message || 'Tu solicitud de registro ha sido enviada exitosamente.'}
          </p>
        </div>
        <div className="bg-green-100 border border-green-300 rounded-lg p-4">
          <p className="text-sm text-green-900">
            <strong>¿Qué sigue?</strong><br />
            El equipo de administración revisará tu solicitud en las próximas 24-48 horas.
            Recibirás un correo electrónico cuando tu cuenta sea aprobada.
          </p>
        </div>
        <button
          onClick={() => window.location.href = '/'}
          className="modern-button modern-button-outline"
        >
          Volver al Inicio
        </button>
      </div>
    )
  }

  const error = submitError?.message || localError

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-3">Solicitar Acceso</h2>
        <p className="text-gray-600 text-lg">
          Únete a la comunidad de España Creativa Red
        </p>
        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-900">
            El registro requiere aprobación del administrador. Recibirás un email con un enlace para
            completar tu perfil una vez tu solicitud sea aprobada.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-5">
          <div>
            <label htmlFor="name-input" className="block text-sm font-medium text-gray-700 mb-3">
              Nombre <span className="text-red-500">*</span>
            </label>
            <input
              id="name-input"
              type="text"
              placeholder="Tu nombre"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="modern-input h-12 text-base"
              required
              disabled={isLoading}
            />
          </div>
          <div>
            <label htmlFor="surname-input" className="block text-sm font-medium text-gray-700 mb-3">
              Apellidos
            </label>
            <input
              id="surname-input"
              type="text"
              placeholder="Tus apellidos (opcional)"
              value={surname}
              onChange={(e) => setSurname(e.target.value)}
              className="modern-input h-12 text-base"
              disabled={isLoading}
            />
          </div>
          <div>
            <label htmlFor="email-input" className="block text-sm font-medium text-gray-700 mb-3">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              id="email-input"
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="modern-input h-12 text-base"
              required
              disabled={isLoading}
            />
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <button
          type="submit"
          className="modern-button modern-button-primary w-full h-12"
          disabled={isLoading}
        >
          {isLoading ? 'Enviando solicitud...' : 'Enviar Solicitud'}
        </button>
      </form>

      <div className="text-center">
        <p className="text-gray-600 text-base">
          ¿Ya tienes cuenta?{' '}
          <a href="/auth/login" className="text-primary font-semibold hover:text-primary/80 transition-colors text-base">
            Inicia sesión aquí
          </a>
        </p>
      </div>
    </div>
  )
}
