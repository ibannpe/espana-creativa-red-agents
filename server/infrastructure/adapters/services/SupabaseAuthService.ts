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
}
