// ABOUTME: Page component for new users to set their password after admin approval
// ABOUTME: Validates activation token, creates account with password, and redirects to dashboard

import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Lock, CheckCircle2, XCircle } from 'lucide-react'
import { useAuthContext } from '@/app/features/auth/hooks/useAuthContext'

interface ActivationData {
  email: string
  name: string
}

export function SetPasswordPage() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const { signIn } = useAuthContext()

  const [loading, setLoading] = useState(true)
  const [activating, setActivating] = useState(false)
  const [activationData, setActivationData] = useState<ActivationData | null>(null)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Validate token on mount
  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setError('Token de activación inválido')
        setLoading(false)
        return
      }

      try {
        const response = await fetch(`/api/auth/validate-activation/${token}`)
        const data = await response.json()

        if (!response.ok || !data.success) {
          setError(data.error || 'Token de activación inválido o expirado')
          setLoading(false)
          return
        }

        setActivationData(data.data)
        setLoading(false)
      } catch (err) {
        setError('Error al validar el token. Por favor, intenta de nuevo.')
        setLoading(false)
      }
    }

    validateToken()
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validations
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres')
      return
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    setActivating(true)

    try {
      // Activate account
      const response = await fetch('/api/auth/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        setError(data.error || 'Error al activar la cuenta')
        setActivating(false)
        return
      }

      // Account activated successfully
      setSuccess(true)

      // Auto sign-in
      setTimeout(async () => {
        try {
          await signIn({
            email: activationData!.email,
            password
          })
          navigate('/dashboard')
        } catch (err) {
          // If auto-login fails, redirect to login page
          navigate('/auth')
        }
      }, 2000)

    } catch (err) {
      setError('Error al activar la cuenta. Por favor, intenta de nuevo.')
      setActivating(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <Loader2 className="w-16 h-16 text-primary animate-spin mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Validando enlace...
          </h1>
          <p className="text-gray-600">
            Por favor, espera un momento.
          </p>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-green-700 mb-2">
            ¡Cuenta activada!
          </h1>
          <p className="text-gray-700 text-lg">
            Tu contraseña ha sido configurada correctamente. Redirigiendo al dashboard...
          </p>
        </div>
      </div>
    )
  }

  if (error && !activationData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <XCircle className="w-20 h-20 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-red-700 mb-2">
            Error
          </h1>
          <p className="text-gray-700 text-lg mb-6">
            {error}
          </p>
          <Button
            onClick={() => navigate('/auth')}
            variant="outline"
          >
            Ir a inicio de sesión
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <Lock className="w-16 h-16 text-primary mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Crea tu contraseña
          </h1>
          <p className="text-gray-600">
            Bienvenido/a, <strong>{activationData?.name}</strong>
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {activationData?.email}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres"
              required
              minLength={8}
              disabled={activating}
            />
            <p className="text-xs text-gray-500 mt-1">
              Mínimo 8 caracteres
            </p>
          </div>

          <div>
            <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repite tu contraseña"
              required
              minLength={8}
              disabled={activating}
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={activating}
          >
            {activating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creando cuenta...
              </>
            ) : (
              'Crear contraseña y acceder'
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}
