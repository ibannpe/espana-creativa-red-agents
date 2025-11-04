// ABOUTME: Registration form component for creating new user accounts
// ABOUTME: Uses useAuthContext hook with Zod schema validation and React Query mutations

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthContext } from '../hooks/useAuthContext'
import { signUpRequestSchema } from '../data/schemas/auth.schema'

export function RegisterForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [localError, setLocalError] = useState('')
  const [success, setSuccess] = useState(false)
  const navigate = useNavigate()
  const { signUp, isSigningUp, signUpError } = useAuthContext()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError('')

    // Client-side validation
    if (password !== confirmPassword) {
      setLocalError('Las contraseñas no coinciden')
      return
    }

    // Validate with Zod schema
    const validation = signUpRequestSchema.safeParse({ email, password, name })
    if (!validation.success) {
      setLocalError(validation.error.errors[0].message)
      return
    }

    signUp(
      { email, password, name },
      {
        onSuccess: () => {
          setSuccess(true)
        }
      }
    )
  }

  if (success) {
    return (
      <div className="text-center space-y-6 p-8 bg-green-50 border border-green-200 rounded-xl">
        <div>
          <h2 className="text-2xl font-bold text-green-900 mb-2">¡Registro Exitoso!</h2>
          <p className="text-green-800">
            Tu cuenta ha sido creada exitosamente.
          </p>
        </div>
        <button
          onClick={() => navigate('/auth/login')}
          className="modern-button modern-button-primary"
        >
          Ir al Login
        </button>
      </div>
    )
  }

  const error = signUpError?.message || localError

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-3">Crear Cuenta</h2>
        <p className="text-gray-600 text-lg">
          Únete a la comunidad de España Creativa Red
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Nombre completo
            </label>
            <input
              type="text"
              placeholder="Tu nombre completo"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="modern-input h-12 text-base"
              required
              disabled={isSigningUp}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Email
            </label>
            <input
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="modern-input h-12 text-base"
              required
              disabled={isSigningUp}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Contraseña
            </label>
            <input
              type="password"
              placeholder="Mínimo 8 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="modern-input h-12 text-base"
              required
              disabled={isSigningUp}
            />
            <div className="mt-2 text-xs text-gray-600 space-y-1">
              <p className="font-medium">La contraseña debe contener:</p>
              <ul className="list-disc list-inside space-y-0.5 ml-2">
                <li>Mínimo 8 caracteres</li>
                <li>Al menos una letra mayúscula</li>
                <li>Al menos una letra minúscula</li>
                <li>Al menos un número</li>
              </ul>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Confirmar contraseña
            </label>
            <input
              type="password"
              placeholder="Confirma tu contraseña"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="modern-input h-12 text-base"
              required
              disabled={isSigningUp}
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
          disabled={isSigningUp}
        >
          {isSigningUp ? 'Creando cuenta...' : 'Crear Cuenta'}
        </button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-white px-6 text-gray-500 font-medium">
            O continúa con
          </span>
        </div>
      </div>

      <button
        type="button"
        className="modern-button modern-button-outline w-full h-12 flex items-center justify-center"
        disabled={isSigningUp}
      >
        <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Continuar con Google
      </button>

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
