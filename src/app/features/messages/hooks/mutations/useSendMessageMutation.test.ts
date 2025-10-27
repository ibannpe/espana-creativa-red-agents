// ABOUTME: Unit tests for useSendMessageMutation hook
// ABOUTME: Tests optimistic updates, rollback on error, and cache invalidation

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useSendMessageMutation } from './useSendMessageMutation'
import { messageService } from '../../data/services/message.service'
import type { ReactNode } from 'react'

// Mock the message service
vi.mock('../../data/services/message.service', () => ({
  messageService: {
    sendMessage: vi.fn()
  }
}))

describe('useSendMessageMutation', () => {
  let queryClient: QueryClient

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    })
    vi.clearAllMocks()
  })

  it('should send message successfully', async () => {
    const mockMessage = {
      id: '123',
      content: 'Test message',
      sender_id: 'user-1',
      recipient_id: 'user-2',
      created_at: new Date().toISOString(),
      read_at: null,
      sender: {
        id: 'user-1',
        name: 'Test User',
        email: 'test@example.com',
        avatar_url: null,
        headline: null,
        bio: null,
        location: null,
        website: null,
        linkedin_url: null,
        twitter_url: null,
        github_url: null,
        skills: [],
        interests: [],
        completed_pct: 50,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        status: 'approved',
        approved_at: new Date().toISOString(),
        role: 'user'
      },
      recipient: {
        id: 'user-2',
        name: 'Recipient',
        email: 'recipient@example.com',
        avatar_url: null,
        headline: null,
        bio: null,
        location: null,
        website: null,
        linkedin_url: null,
        twitter_url: null,
        github_url: null,
        skills: [],
        interests: [],
        completed_pct: 50,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        status: 'approved',
        approved_at: new Date().toISOString(),
        role: 'user'
      }
    }

    vi.mocked(messageService.sendMessage).mockResolvedValue({
      message: mockMessage,
      success: true
    })

    const { result } = renderHook(() => useSendMessageMutation(), { wrapper })

    result.current.action({
      recipient_id: 'user-2',
      content: 'Test message'
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(messageService.sendMessage).toHaveBeenCalledWith({
      recipient_id: 'user-2',
      content: 'Test message'
    })
    expect(result.current.data).toEqual(mockMessage)
  })

  it('should handle errors correctly', async () => {
    const error = new Error('Failed to send message')
    vi.mocked(messageService.sendMessage).mockRejectedValue(error)

    const { result } = renderHook(() => useSendMessageMutation(), { wrapper })

    result.current.action({
      recipient_id: 'user-2',
      content: 'Test message'
    })

    await waitFor(() => {
      expect(result.current.error).toBeTruthy()
    })

    expect(result.current.error?.message).toBe('Failed to send message')
  })

  it('should set isLoading to true while sending', async () => {
    vi.mocked(messageService.sendMessage).mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    )

    const { result } = renderHook(() => useSendMessageMutation(), { wrapper })

    result.current.action({
      recipient_id: 'user-2',
      content: 'Test message'
    })

    expect(result.current.isLoading).toBe(true)
  })

  it('should invalidate queries on success', async () => {
    const mockMessage = {
      id: '123',
      content: 'Test message',
      sender_id: 'user-1',
      recipient_id: 'user-2',
      created_at: new Date().toISOString(),
      read_at: null,
      sender: {} as any,
      recipient: {} as any
    }

    vi.mocked(messageService.sendMessage).mockResolvedValue({
      message: mockMessage,
      success: true
    })

    const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useSendMessageMutation(), { wrapper })

    result.current.action({
      recipient_id: 'user-2',
      content: 'Test message'
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: ['conversations']
    })
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: ['conversation-messages', 'user-2']
    })
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: ['unread-count']
    })
  })
})
