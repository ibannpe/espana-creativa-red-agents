'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { fetchUser, setUser, setLoading } = useAuthStore()
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    async function initialize() {
      try {
        // Get initial session
        await fetchUser()
        
        // Listen for auth changes
        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, session) => {
          if (session) {
            await fetchUser()
          } else {
            setUser(null)
            setLoading(false)
          }
        })

        setInitialized(true)

        return () => {
          subscription.unsubscribe()
        }
      } catch (error) {
        console.error('AuthProvider: Error durante la inicialización:', error)
        setLoading(false)
        setInitialized(true)
      }
    }

    // Añadir timeout para evitar carga infinita
    const timeout = setTimeout(() => {
      setInitialized(true)
      setLoading(false)
    }, 5000)

    initialize().then(() => {
      clearTimeout(timeout)
    })

    return () => {
      clearTimeout(timeout)
    }
  }, [fetchUser, setUser, setLoading])

  // Si no está inicializado, mostrar un estado de carga temporal
  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return <>{children}</>
}