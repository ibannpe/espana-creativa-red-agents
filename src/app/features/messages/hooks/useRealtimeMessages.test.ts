// ABOUTME: Unit tests for useRealtimeMessages hook
// ABOUTME: Tests Supabase Realtime subscription setup and cleanup

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useRealtimeMessages } from './useRealtimeMessages'
import type { ReactNode } from 'react'

// Mock Supabase client
const mockChannel = {
  on: vi.fn().mockReturnThis(),
  subscribe: vi.fn()
}

const mockSupabase = {
  channel: vi.fn().mockReturnValue(mockChannel),
  removeChannel: vi.fn()
}

vi.mock('@/lib/supabase', () => ({
  supabase: mockSupabase
}))

// Mock auth context
vi.mock('@/app/features/auth/hooks/useAuthContext', () => ({
  useAuthContext: () => ({
    user: {
      id: 'user-1',
      name: 'Test User',
      email: 'test@example.com'
    }
  })
}))

describe('useRealtimeMessages', () => {
  let queryClient: QueryClient

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

  beforeEach(() => {
    queryClient = new QueryClient()
    vi.clearAllMocks()
  })

  it('should setup Realtime subscription when userId is provided', () => {
    renderHook(() => useRealtimeMessages('user-2'), { wrapper })

    expect(mockSupabase.channel).toHaveBeenCalledWith('messages-user-2')
    expect(mockChannel.on).toHaveBeenCalled()
    expect(mockChannel.subscribe).toHaveBeenCalled()
  })

  it('should not setup subscription when userId is undefined', () => {
    renderHook(() => useRealtimeMessages(undefined), { wrapper })

    expect(mockSupabase.channel).not.toHaveBeenCalled()
  })

  it('should cleanup subscription on unmount', () => {
    const { unmount } = renderHook(() => useRealtimeMessages('user-2'), { wrapper })

    unmount()

    expect(mockSupabase.removeChannel).toHaveBeenCalledWith(mockChannel)
  })

  it('should listen to INSERT events for recipient messages', () => {
    renderHook(() => useRealtimeMessages('user-2'), { wrapper })

    const insertCallForRecipient = mockChannel.on.mock.calls.find(
      (call) =>
        call[0] === 'postgres_changes' &&
        call[1].event === 'INSERT' &&
        call[1].table === 'messages' &&
        call[1].filter?.includes('recipient_id=eq.user-1')
    )

    expect(insertCallForRecipient).toBeDefined()
  })

  it('should listen to INSERT events for sender messages', () => {
    renderHook(() => useRealtimeMessages('user-2'), { wrapper })

    const insertCallForSender = mockChannel.on.mock.calls.find(
      (call) =>
        call[0] === 'postgres_changes' &&
        call[1].event === 'INSERT' &&
        call[1].table === 'messages' &&
        call[1].filter?.includes('sender_id=eq.user-1')
    )

    expect(insertCallForSender).toBeDefined()
  })

  it('should listen to UPDATE events for read status', () => {
    renderHook(() => useRealtimeMessages('user-2'), { wrapper })

    const updateCall = mockChannel.on.mock.calls.find(
      (call) =>
        call[0] === 'postgres_changes' &&
        call[1].event === 'UPDATE' &&
        call[1].table === 'messages'
    )

    expect(updateCall).toBeDefined()
  })
})
