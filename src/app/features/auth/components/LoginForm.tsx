// ABOUTME: Login form component for user authentication with email/password and Google OAuth
// ABOUTME: Uses useAuthContext hook for sign-in operations with React Query state management

import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthContext } from '../hooks/useAuthContext'
import { ForgotPasswordModal } from './ForgotPasswordModal'
import { signUpRequestSchema } from '../data/schemas/auth.schema'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [localError, setLocalError] = useState('')
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const navigate = useNavigate()
  const { signIn, isSigningIn, signInError } = useAuthContext()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError('')

    // Client-side validation
    if (!email || !password) {
      setLocalError('Por favor completa todos los campos')
      return
    }

    signIn(
      { email, password },
      {
        onSuccess: () => {
          navigate('/dashboard')
        }
      }
    )
  }

  const error = localError || signInError?.message || ''

  return (
    <div className="gap-8 flex flex-col">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-3">Iniciar Sesión</h2>
        <p className="text-gray-600 text-lg">
          Accede a tu cuenta de España Creativa Red
        </p>
      </div>

      <form onSubmit={handleSubmit} className="gap-6 flex flex-col">
        <div className="gap-4 flex flex-col">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Email
            </label>
            <input
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="modern-input"
              required
              disabled={isSigningIn}
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-900">
                Contraseña
              </label>
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-sm text-primary hover:text-primary/80 font-medium"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>
            <input
              type="password"
              placeholder="Tu contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="modern-input"
              required
              disabled={isSigningIn}
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
          disabled={isSigningIn}
        >
          {isSigningIn ? 'Iniciando sesión...' : 'Iniciar Sesión'}
        </button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-white px-6 text-gray-600 font-medium">
            O continúa con
          </span>
        </div>
      </div>

      <button
        type="button"
        className="modern-button modern-button-outline w-full h-12 flex items-center justify-center"
        disabled={isSigningIn}
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
          ¿No tienes cuenta?{' '}
          <Link to="/auth" className="text-green-600 font-semibold hover:text-green-700 transition-colors">
            Regístrate aquí
          </Link>
        </p>
      </div>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        open={showForgotPassword}
        onOpenChange={setShowForgotPassword}
      />
    </div>
  )
}
