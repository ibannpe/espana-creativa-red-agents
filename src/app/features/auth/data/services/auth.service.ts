// ABOUTME: Authentication service for API communication with backend
// ABOUTME: Pure async functions returning typed promises validated with Zod schemas

import axios from 'axios'
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

const API_BASE_URL = '/api'

export const authService = {
  /**
   * Sign up a new user
   */
  async signUp(data: SignUpRequest): Promise<SignUpResponse> {
    const response = await axios.post(`${API_BASE_URL}/auth/signup`, data)
    return signUpResponseSchema.parse(response.data)
  },

  /**
   * Sign in with email and password
   */
  async signIn(data: SignInRequest): Promise<SignInResponse> {
    const response = await axios.post(`${API_BASE_URL}/auth/signin`, data)
    return signInResponseSchema.parse(response.data)
  },

  /**
   * Sign out current user
   */
  async signOut(): Promise<void> {
    await axios.post(`${API_BASE_URL}/auth/signout`)
  },

  /**
   * Get current authenticated user
   */
  async getCurrentUser(): Promise<CurrentUserResponse> {
    const response = await axios.get(`${API_BASE_URL}/auth/me`)
    return currentUserResponseSchema.parse(response.data)
  }
}
