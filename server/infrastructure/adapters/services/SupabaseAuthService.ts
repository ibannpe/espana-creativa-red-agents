// ABOUTME: Supabase implementation of IAuthService port
// ABOUTME: Handles authentication operations using Supabase Auth SDK

import { SupabaseClient } from '@supabase/supabase-js'
import {
  IAuthService,
  AuthUser,
  SignUpResult,
  SignInResult
} from '../../../application/ports/services/IAuthService'
import { Email } from '../../../domain/value-objects/Email'
import { UserId } from '../../../domain/value-objects/UserId'

export class SupabaseAuthService implements IAuthService {
  constructor(private readonly supabase: SupabaseClient) {}

  async signUp(
    email: Email,
    password: string,
    metadata?: Record<string, any>
  ): Promise<SignUpResult> {
    const { data, error } = await this.supabase.auth.signUp({
      email: email.getValue(),
      password,
      options: {
        data: metadata || {}
      }
    })

    if (error) {
      return { user: null, error }
    }

    if (!data.user) {
      return { user: null, error: new Error('No user returned from signup') }
    }

    return {
      user: {
        id: data.user.id,
        email: data.user.email!,
        metadata: data.user.user_metadata
      },
      error: null
    }
  }

  async signIn(email: Email, password: string): Promise<SignInResult> {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email: email.getValue(),
      password
    })

    if (error) {
      return { user: null, session: null, error }
    }

    if (!data.user) {
      return { user: null, session: null, error: new Error('No user returned from signin') }
    }

    return {
      user: {
        id: data.user.id,
        email: data.user.email!,
        metadata: data.user.user_metadata
      },
      session: data.session,
      error: null
    }
  }

  async signInWithOAuth(provider: 'google'): Promise<{ url: string | null; error: Error | null }> {
    const { data, error } = await this.supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${process.env.APP_URL || 'http://localhost:8080'}/auth/callback`
      }
    })

    if (error) {
      return { url: null, error }
    }

    return { url: data.url, error: null }
  }

  async signOut(): Promise<{ error: Error | null }> {
    const { error } = await this.supabase.auth.signOut()
    return { error: error || null }
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    const { data, error } = await this.supabase.auth.getUser()

    if (error || !data.user) {
      return null
    }

    return {
      id: data.user.id,
      email: data.user.email!,
      metadata: data.user.user_metadata
    }
  }

  async deleteUser(id: UserId): Promise<{ error: Error | null }> {
    // Note: This requires admin/service role access
    const { error } = await this.supabase.auth.admin.deleteUser(id.getValue())
    return { error: error || null }
  }

  async generateMagicLink(email: string): Promise<{ action_link: string } | null> {
    try {
      const { data, error } = await this.supabase.auth.admin.generateLink({
        type: 'magiclink',
        email
      })

      if (error || !data) {
        throw error
      }

      return { action_link: data.properties?.action_link || '' }
    } catch (error) {
      console.error('Failed to generate magic link:', error)
      return null
    }
  }

  async checkEmailExists(email: string): Promise<boolean> {
    try {
      const { data } = await this.supabase.auth.admin.listUsers()
      return data.users.some(user => user.email === email)
    } catch (error) {
      return false
    }
  }

  async changePassword(email: string, currentPassword: string, newPassword: string, token: string): Promise<{ error: Error | null }> {
    try {
      // IMPORTANTE: Verificamos la contraseña actual usando un cliente temporal
      // para evitar invalidar la sesión principal del usuario
      const { createClient } = await import('@supabase/supabase-js')
      const tempClient = createClient(
        process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL!,
        process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY!
      )

      // Verify current password with temporary client (no session pollution)
      const { data: verifyData, error: signInError } = await tempClient.auth.signInWithPassword({
        email,
        password: currentPassword
      })

      // Immediately sign out from temporary client to clean up
      await tempClient.auth.signOut()

      if (signInError || !verifyData.user) {
        return { error: new Error('Contraseña actual incorrecta') }
      }

      // Use admin client with service role key to update the password
      // This approach doesn't require establishing a session and works reliably
      const adminClient = createClient(
        process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )

      // Update password using admin privileges
      // NOTA: Este updateUserById invalida TODOS los tokens de sesión existentes,
      // por lo que el cliente debe hacer logout inmediatamente después de recibir la respuesta
      const { error: updateError } = await adminClient.auth.admin.updateUserById(
        verifyData.user.id,
        { password: newPassword }
      )

      if (updateError) {
        console.error('[SupabaseAuthService] Error updating password:', updateError)
        return { error: updateError }
      }

      return { error: null }
    } catch (error) {
      console.error('[SupabaseAuthService] Exception in changePassword:', error)
      return { error: error as Error }
    }
  }

  async sendPasswordResetEmail(email: string): Promise<{ error: Error | null }> {
    try {
      // Determine the correct app URL based on environment
      // Priority: APP_URL env var > FRONTEND_URL env var > localhost fallback
      const appUrl = process.env.APP_URL || process.env.FRONTEND_URL || 'http://localhost:8080'
      const redirectUrl = `${appUrl}/auth/reset-password`

      console.log('[SupabaseAuthService] Sending password reset email with redirectTo:', redirectUrl)

      const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl
      })

      if (error) {
        console.error('[SupabaseAuthService] Error sending password reset email:', error)
        return { error }
      }

      console.log('[SupabaseAuthService] Password reset email sent successfully')
      return { error: null }
    } catch (error) {
      console.error('[SupabaseAuthService] Exception sending password reset email:', error)
      return { error: error as Error }
    }
  }

  async resetPassword(newPassword: string): Promise<{ error: Error | null }> {
    try {
      const { error } = await this.supabase.auth.updateUser({
        password: newPassword
      })

      if (error) {
        return { error }
      }

      return { error: null }
    } catch (error) {
      return { error: error as Error }
    }
  }
}
