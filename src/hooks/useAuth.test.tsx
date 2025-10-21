// ABOUTME: Unit tests for useAuth hook covering logout redirect functionality
// ABOUTME: Tests authentication state management and navigation on SIGNED_OUT event

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { BrowserRouter, useNavigate } from 'react-router-dom'
import { useAuth } from './useAuth'
import { supabase } from '@/lib/supabase'
import * as authLib from '@/lib/auth'
import { User } from '@/types'

// Mock dependencies
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      signOut: vi.fn(),
      onAuthStateChange: vi.fn(),
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      signInWithOAuth: vi.fn()
    }
  }
}))

vi.mock('@/lib/auth', () => ({
  getCurrentUser: vi.fn()
}))

vi.mock('@/lib/email-client', () => ({
  sendWelcomeEmailClient: vi.fn().mockResolvedValue({ success: true })
}))

// Mock useNavigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate
  }
})

// Mock toast
vi.mock('@/hooks/use-toast', () => ({
  toast: vi.fn()
}))

describe('useAuth Hook', () => {
  let mockAuthStateChangeCallback: ((event: string, session: any) => void) | null = null

  const mockUser: User = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    email: 'test@example.com',
    name: 'Test User',
    avatar_url: null,
    bio: null,
    location: null,
    linkedin_url: null,
    website_url: null,
    skills: [],
    interests: [],
    completed_pct: 50,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }

  const mockSession = {
    user: {
      id: '550e8400-e29b-41d4-a716-446655440000',
      email: 'test@example.com'
    },
    access_token: 'fake-token'
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockNavigate.mockClear()
    mockAuthStateChangeCallback = null

    // Setup default mocks
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null
    })

    vi.mocked(supabase.auth.onAuthStateChange).mockImplementation((callback: any) => {
      mockAuthStateChangeCallback = callback
      return {
        data: {
          subscription: {
            unsubscribe: vi.fn()
          }
        }
      }
    })

    vi.mocked(authLib.getCurrentUser).mockResolvedValue(mockUser)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <BrowserRouter>{children}</BrowserRouter>
  )

  describe('Logout Redirect Functionality', () => {
    it('should call navigate with /auth and replace: true when SIGNED_OUT event is triggered', async () => {
      // Arrange: Setup authenticated session
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: mockSession as any },
        error: null
      })

      // Act: Render hook
      const { result } = renderHook(() => useAuth(), { wrapper })

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Assert: User is initially authenticated
      expect(result.current.user).toEqual(mockUser)

      // Act: Trigger SIGNED_OUT event
      if (mockAuthStateChangeCallback) {
        await mockAuthStateChangeCallback('SIGNED_OUT', null)
      }

      // Assert: Navigation should be called with correct parameters
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/auth', { replace: true })
      })

      // Assert: User state should be cleared
      await waitFor(() => {
        expect(result.current.user).toBeNull()
      })
    })

    it('should clear user state when SIGNED_OUT event is triggered', async () => {
      // Arrange: Setup authenticated session
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: mockSession as any },
        error: null
      })

      // Act: Render hook
      const { result } = renderHook(() => useAuth(), { wrapper })

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser)
      })

      // Act: Trigger SIGNED_OUT event
      if (mockAuthStateChangeCallback) {
        await mockAuthStateChangeCallback('SIGNED_OUT', null)
      }

      // Assert: User should be cleared
      await waitFor(() => {
        expect(result.current.user).toBeNull()
        expect(result.current.session).toBeNull()
      })
    })

    it('should navigate to /auth when signOut is called and SIGNED_OUT event fires', async () => {
      // Arrange: Setup authenticated session
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: mockSession as any },
        error: null
      })

      vi.mocked(supabase.auth.signOut).mockResolvedValue({
        error: null
      })

      // Act: Render hook
      const { result } = renderHook(() => useAuth(), { wrapper })

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser)
      })

      // Act: Call signOut
      await result.current.signOut()

      // Simulate the SIGNED_OUT event that Supabase would trigger
      if (mockAuthStateChangeCallback) {
        await mockAuthStateChangeCallback('SIGNED_OUT', null)
      }

      // Assert: Navigation should be called
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/auth', { replace: true })
      })
    })

    it('should use replace: true to prevent back button returning to dashboard', async () => {
      // Arrange: Setup authenticated session
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: mockSession as any },
        error: null
      })

      // Act: Render hook
      const { result } = renderHook(() => useAuth(), { wrapper })

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Act: Trigger SIGNED_OUT event
      if (mockAuthStateChangeCallback) {
        await mockAuthStateChangeCallback('SIGNED_OUT', null)
      }

      // Assert: Verify replace option is true
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith(
          '/auth',
          expect.objectContaining({ replace: true })
        )
      })
    })

    it('should handle SIGNED_OUT event when token expires automatically', async () => {
      // Arrange: Setup authenticated session
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: mockSession as any },
        error: null
      })

      // Act: Render hook
      const { result } = renderHook(() => useAuth(), { wrapper })

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser)
      })

      // Act: Simulate automatic token expiration (Supabase triggers SIGNED_OUT)
      if (mockAuthStateChangeCallback) {
        await mockAuthStateChangeCallback('SIGNED_OUT', null)
      }

      // Assert: Should navigate even without explicit signOut call
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/auth', { replace: true })
        expect(result.current.user).toBeNull()
      })
    })

    it('should not navigate when other auth events are triggered', async () => {
      // Arrange: Setup authenticated session
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: mockSession as any },
        error: null
      })

      // Act: Render hook
      const { result } = renderHook(() => useAuth(), { wrapper })

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Clear any navigate calls from setup
      mockNavigate.mockClear()

      // Act: Trigger TOKEN_REFRESHED event
      if (mockAuthStateChangeCallback) {
        await mockAuthStateChangeCallback('TOKEN_REFRESHED', mockSession)
      }

      // Assert: Navigation should NOT be called for TOKEN_REFRESHED
      await waitFor(() => {
        expect(mockNavigate).not.toHaveBeenCalled()
      })
    })
  })

  describe('Edge Cases', () => {
    it('should handle SIGNED_OUT when already logged out', async () => {
      // Arrange: No session
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: null
      })

      // Act: Render hook
      const { result } = renderHook(() => useAuth(), { wrapper })

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.user).toBeNull()

      // Clear navigate calls from setup
      mockNavigate.mockClear()

      // Act: Trigger SIGNED_OUT event
      if (mockAuthStateChangeCallback) {
        await mockAuthStateChangeCallback('SIGNED_OUT', null)
      }

      // Assert: Should still navigate even when already logged out
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/auth', { replace: true })
      })
    })

    it('should cleanup subscription on unmount', async () => {
      // Arrange
      const unsubscribeMock = vi.fn()
      vi.mocked(supabase.auth.onAuthStateChange).mockReturnValue({
        data: {
          subscription: {
            unsubscribe: unsubscribeMock
          }
        }
      } as any)

      // Act: Render and unmount
      const { unmount } = renderHook(() => useAuth(), { wrapper })
      unmount()

      // Assert: Subscription should be cleaned up
      expect(unsubscribeMock).toHaveBeenCalled()
    })
  })
})
