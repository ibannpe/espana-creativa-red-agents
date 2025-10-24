// ABOUTME: Custom Axios instance with request/response interceptors
// ABOUTME: Suppresses expected errors (401 on auth checks) from browser console

import axios from 'axios'

// Create custom axios instance with dynamic baseURL
// En desarrollo: '/api' usa el proxy de Vite
// En producción: usa VITE_API_URL (URL del backend en Railway)
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL}/api`
    : '/api'
})

// Response interceptor to handle errors silently
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Suppress 401 errors for auth/me endpoint (expected when not authenticated)
    if (error.config?.url?.includes('/auth/me') && error.response?.status === 401) {
      // Create a custom error that doesn't log to console
      const silentError = new Error('Not authenticated')
      ;(silentError as any).response = error.response
      ;(silentError as any).config = error.config
      return Promise.reject(silentError)
    }

    // For all other errors, pass through normally
    return Promise.reject(error)
  }
)

export default axiosInstance
