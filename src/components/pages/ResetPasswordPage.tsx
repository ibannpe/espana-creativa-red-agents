// ABOUTME: Reset password page accessed via email link
// ABOUTME: Allows users to set a new password after requesting password reset

import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Lock, Eye, EyeOff } from 'lucide-react'
import { useResetPasswordMutation } from '@/app/features/auth/hooks/mutations/useResetPasswordMutation'
import { resetPasswordRequestSchema } from '@/app/features/auth/data/schemas/auth.schema'
import { z } from 'zod'

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { action: resetPassword, isLoading, error, isSuccess } = useResetPasswordMutation()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  // Get token from URL
  const token = searchParams.get('access_token') || searchParams.get('token') || ''

  useEffect(() => {
    if (!token) {
      // Redirect to login if no token
      navigate('/auth')
    }
  }, [token, navigate])

  // Redirect to login after successful reset
  useEffect(() => {
    if (isSuccess) {
      setTimeout(() => {
        navigate('/auth/login')
      }, 3000)
    }
  }, [isSuccess, navigate])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setValidationErrors({})

    // Check passwords match
    if (password !== confirmPassword) {
      setValidationErrors({ confirmPassword: 'Las contraseñas no coinciden' })
      return
    }

    try {
      // Validate password requirements
      const validatedData = resetPasswordRequestSchema.parse({ token, password })

      // Call mutation
      resetPassword(validatedData)
    } catch (err) {
      if (err instanceof z.ZodError) {
        const errors: Record<string, string> = {}
        err.errors.forEach((error) => {
          if (error.path[0]) {
            errors[error.path[0] as string] = error.message
          }
        })
        setValidationErrors(errors)
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-emerald-600 rounded-xl flex items-center justify-center mx-auto">
              <Lock className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Restablecer Contraseña</h1>
            <p className="text-muted-foreground">
              Introduce tu nueva contraseña
            </p>
          </div>

          {isSuccess ? (
            <div className="text-center space-y-4">
              <div className="text-sm text-green-600 bg-green-50 border border-green-200 rounded-xl p-4">
                <p className="font-medium mb-1">¡Contraseña actualizada!</p>
                <p>Tu contraseña ha sido restablecida exitosamente. Redirigiendo al login...</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password">Nueva Contraseña</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      if (validationErrors.password) {
                        const newErrors = { ...validationErrors }
                        delete newErrors.password
                        setValidationErrors(newErrors)
                      }
                    }}
                    disabled={isLoading}
                    className={validationErrors.password ? 'border-red-500' : ''}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {validationErrors.password && (
                  <p className="text-sm text-red-600">{validationErrors.password}</p>
                )}
                <div className="text-xs text-muted-foreground space-y-1">
                  <p className="font-medium">La contraseña debe contener:</p>
                  <ul className="list-disc list-inside space-y-0.5 ml-2">
                    <li>Mínimo 8 caracteres</li>
                    <li>Al menos una letra mayúscula</li>
                    <li>Al menos una letra minúscula</li>
                    <li>Al menos un número</li>
                  </ul>
                </div>
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Nueva Contraseña</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value)
                      if (validationErrors.confirmPassword) {
                        const newErrors = { ...validationErrors }
                        delete newErrors.confirmPassword
                        setValidationErrors(newErrors)
                      }
                    }}
                    disabled={isLoading}
                    className={validationErrors.confirmPassword ? 'border-red-500' : ''}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {validationErrors.confirmPassword && (
                  <p className="text-sm text-red-600">{validationErrors.confirmPassword}</p>
                )}
              </div>

              {/* Error Message */}
              {error && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-4">
                  {error instanceof Error ? error.message : 'Error al restablecer la contraseña'}
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? 'Restableciendo...' : 'Restablecer Contraseña'}
              </Button>
            </form>
          )}

          {/* Back to Login */}
          {!isSuccess && (
            <div className="text-center">
              <button
                onClick={() => navigate('/auth/login')}
                className="text-sm text-primary hover:text-primary/80 font-medium"
              >
                Volver al inicio de sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
