import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireRole?: string[]
}

export function ProtectedRoute({ children, requireRole }: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth')
      return
    }

    if (user && requireRole && requireRole.length > 0) {
      const userRoles = user.roles?.map(r => r.name) || []
      const hasRequiredRole = requireRole.some(role => userRoles.includes(role))
      
      if (!hasRequiredRole) {
        navigate('/dashboard')
        return
      }
    }
  }, [user, loading, navigate, requireRole])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return <>{children}</>
}