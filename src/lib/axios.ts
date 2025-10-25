// ABOUTME: Custom Axios instance with request/response interceptors
// ABOUTME: Adds Supabase authentication token to all requests and suppresses expected 401 errors

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

// Request interceptor to add authentication token from Supabase
axiosInstance.interceptors.request.use(
  async (config) => {
    // Get current session from Supabase
    const { data: { session } } = await supabase.auth.getSession()

    // If session exists, add Authorization header with Bearer token
    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

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
