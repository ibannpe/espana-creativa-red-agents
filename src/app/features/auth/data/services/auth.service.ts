// ABOUTME: Authentication service for API communication with backend
// ABOUTME: Pure async functions returning typed promises validated with Zod schemas

import axiosInstance from '@/lib/axios'
import {
  SignUpRequest,
  SignUpResponse,
  SignInRequest,
  SignInResponse,
  CurrentUserResponse,
  signUpResponseSchema,
  signInResponseSchema,
  currentUserResponseSchema
} from '../schemas/auth.schema'

const API_BASE_URL = ''

export const authService = {
  /**
   * Sign up a new user
   */
  async signUp(data: SignUpRequest): Promise<SignUpResponse> {
    const response = await axiosInstance.post(`${API_BASE_URL}/auth/signup`, data)
    return signUpResponseSchema.parse(response.data)
  },

  /**
   * Sign in with email and password
   */
  async signIn(data: SignInRequest): Promise<SignInResponse> {
    const response = await axiosInstance.post(`${API_BASE_URL}/auth/signin`, data)
    return signInResponseSchema.parse(response.data)
  },

  /**
   * Sign out current user
   */
  async signOut(): Promise<void> {
    await axiosInstance.post(`${API_BASE_URL}/auth/signout`)
  },

  /**
   * Get current authenticated user
   * Note: Uses fetch instead of axios to handle 401 responses more gracefully
   * 401 responses are expected when user is not authenticated
   */
  async getCurrentUser(): Promise<CurrentUserResponse> {
    try {
      const response = await fetch(`/api/auth/me`, {
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
        }
      })

      if (response.status === 401) {
        const error = new Error('Not authenticated')
        ;(error as any).response = { status: 401 }
        throw error
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return currentUserResponseSchema.parse(data)
    } catch (error) {
      // Re-throw to be handled by the caller
      throw error
    }
  }
}
