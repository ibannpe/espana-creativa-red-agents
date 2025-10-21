// ABOUTME: Authentication service port defining contract for auth operations
// ABOUTME: Abstracts authentication provider (Supabase) from business logic

import { Email } from '../../../domain/value-objects/Email'
import { UserId } from '../../../domain/value-objects/UserId'

export interface AuthUser {
  id: string
  email: string
  metadata?: Record<string, any>
}

export interface SignUpResult {
  user: AuthUser | null
  error: Error | null
}

export interface SignInResult {
  user: AuthUser | null
  session: any | null
  error: Error | null
}

export interface IAuthService {
  /**
   * Sign up a new user with email and password
   */
  signUp(email: Email, password: string, metadata?: Record<string, any>): Promise<SignUpResult>

  /**
   * Sign in with email and password
   */
  signIn(email: Email, password: string): Promise<SignInResult>

  /**
   * Sign in with OAuth provider (Google)
   */
  signInWithOAuth(provider: 'google'): Promise<{ url: string | null; error: Error | null }>

  /**
   * Sign out current user
   */
  signOut(): Promise<{ error: Error | null }>

  /**
   * Get current authenticated user
   */
  getCurrentUser(): Promise<AuthUser | null>

  /**
   * Delete user from auth system
   */
  deleteUser(id: UserId): Promise<{ error: Error | null }>
}
