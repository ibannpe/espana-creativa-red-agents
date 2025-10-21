// ABOUTME: Auth feature context providing authentication state and operations
// ABOUTME: Consumes query and mutation hooks to provide unified interface for auth functionality

import { createContext, useContext, ReactNode } from 'react'
import { useCurrentUserQuery } from './queries/useCurrentUserQuery'
import { useSignUpMutation } from './mutations/useSignUpMutation'
import { useSignInMutation } from './mutations/useSignInMutation'
import { useSignOutMutation } from './mutations/useSignOutMutation'
import { UserResponse, SignUpRequest, SignInRequest } from '../data/schemas/auth.schema'

interface AuthContextValue {
  // User state
  user: UserResponse | null | undefined
  isLoading: boolean
  isAuthenticated: boolean

  // Sign up
  signUp: (data: SignUpRequest) => void
  isSigningUp: boolean
  signUpError: Error | null

  // Sign in
  signIn: (data: SignInRequest) => void
  isSigningIn: boolean
  signInError: Error | null

  // Sign out
  signOut: () => void
  isSigningOut: boolean
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  // Queries
  const { data: user, isLoading } = useCurrentUserQuery()

  // Mutations
  const signUpMutation = useSignUpMutation()
  const signInMutation = useSignInMutation()
  const signOutMutation = useSignOutMutation()

  const value: AuthContextValue = {
    // User state
    user,
    isLoading,
    isAuthenticated: !!user,

    // Sign up
    signUp: signUpMutation.action,
    isSigningUp: signUpMutation.isLoading,
    signUpError: signUpMutation.error,

    // Sign in
    signIn: signInMutation.action,
    isSigningIn: signInMutation.isLoading,
    signInError: signInMutation.error,

    // Sign out
    signOut: signOutMutation.action,
    isSigningOut: signOutMutation.isLoading
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuthContext() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuthContext must be used within AuthProvider')
  }
  return context
}
