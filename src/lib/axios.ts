// ABOUTME: Custom Axios instance with request/response interceptors
// ABOUTME: Adds Supabase authentication token to all requests with automatic token refresh

import axios from 'axios'
import { supabase } from './supabase'

// Create custom axios instance with dynamic baseURL
// En desarrollo: '/api' usa el proxy de Vite
// En producción: usa VITE_API_URL (URL del backend en Railway)
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL}/api`
    : '/api'
})

// Token refresh lock to prevent multiple simultaneous refresh attempts
let isRefreshing = false
let refreshPromise: Promise<string | null> | null = null

async function getValidToken(): Promise<string | null> {
  // If already refreshing, wait for that refresh to complete
  if (isRefreshing && refreshPromise) {
    return refreshPromise
  }

  const { data: { session }, error } = await supabase.auth.getSession()

  // If there's an error or no session, try to refresh
  if (error || !session) {
    if (!isRefreshing) {
      isRefreshing = true
      refreshPromise = supabase.auth.refreshSession()
        .then(({ data: { session: refreshedSession }, error: refreshError }) => {
          isRefreshing = false
          refreshPromise = null

          if (refreshError || !refreshedSession) {
            // Don't log error if it's just "refresh_token_not_found" (user not logged in)
            if (refreshError && refreshError.message !== 'Auth session missing!') {
              console.error('❌ Failed to refresh session:', refreshError.message)
            }
            return null
          }

          return refreshedSession.access_token
        })
        .catch(() => {
          isRefreshing = false
          refreshPromise = null
          return null
        })

      return refreshPromise
    }
    // If already refreshing, return null (no session available)
    return null
  }

  // Check if token is expired or about to expire (within 60 seconds)
  if (session) {
    const expiresAt = session.expires_at ? session.expires_at * 1000 : 0
    const now = Date.now()
    const timeUntilExpiry = expiresAt - now

    // If token expires in less than 60 seconds, refresh it proactively
    if (timeUntilExpiry < 60000) {
      if (!isRefreshing) {
        isRefreshing = true
        console.log('🔄 Token expiring soon, refreshing...')

        refreshPromise = supabase.auth.refreshSession()
          .then(({ data: { session: refreshedSession }, error: refreshError }) => {
            isRefreshing = false
            refreshPromise = null

            if (refreshError || !refreshedSession) {
              console.error('❌ Failed to refresh session:', refreshError?.message)
              return session.access_token // Fallback to current token
            }

            return refreshedSession.access_token
          })
          .catch(() => {
            isRefreshing = false
            refreshPromise = null
            return session.access_token // Fallback to current token
          })

        return refreshPromise
      } else if (refreshPromise) {
        return refreshPromise
      }
    }

    return session.access_token
  }

  return null
}

// Request interceptor to add authentication token from Supabase
axiosInstance.interceptors.request.use(
  async (config) => {
    const token = await getValidToken()

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle errors and token expiration
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Suppress 401 errors for auth/me endpoint (expected when not authenticated)
    if (error.config?.url?.includes('/auth/me') && error.response?.status === 401) {
      // Create a custom error that doesn't log to console
      const silentError = new Error('Not authenticated')
      ;(silentError as Error & { response?: unknown; config?: unknown }).response = error.response
      ;(silentError as Error & { response?: unknown; config?: unknown }).config = error.config
      return Promise.reject(silentError)
    }

    // Handle 401 errors on protected endpoints (token expired or invalid)
    if (error.response?.status === 401 && !error.config?.url?.includes('/auth/') && !error.config._retry) {
      console.warn('🔐 Token inválido o expirado. Intentando refrescar sesión...')

      // Mark this request as a retry to prevent infinite loops
      error.config._retry = true

      // Reset refresh state to force a new refresh attempt
      isRefreshing = false
      refreshPromise = null

      // Try to get a valid token (will refresh if needed)
      const token = await getValidToken()

      if (!token) {
        console.error('❌ No se pudo refrescar la sesión. Redirigiendo al login...')

        // Sign out and redirect to login
        await supabase.auth.signOut()
        window.location.href = '/auth'

        return Promise.reject(error)
      }

      // Retry the original request with the new token
      console.log('✅ Sesión refrescada. Reintentando petición...')
      error.config.headers.Authorization = `Bearer ${token}`
      return axiosInstance.request(error.config)
    }

    // For all other errors, pass through normally
    return Promise.reject(error)
  }
)

export default axiosInstance
export { axiosInstance }
