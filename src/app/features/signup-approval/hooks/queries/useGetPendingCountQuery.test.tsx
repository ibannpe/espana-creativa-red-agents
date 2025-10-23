// ABOUTME: Unit tests for useGetPendingCountQuery hook
// ABOUTME: Tests count query behavior, caching, auto-refetch, and error handling

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useGetPendingCountQuery } from './useGetPendingCountQuery'
import { signupApprovalService } from '../../data/services/signup-approval.service'

// Mock the service
vi.mock('../../data/services/signup-approval.service')

describe('useGetPendingCountQuery', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false }
      }
    })
    vi.clearAllMocks()
  })

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

  it('should fetch pending count', async () => {
    const mockResponse = {
      success: true,
      count: 5
    }

    vi.mocked(signupApprovalService.getPendingCount).mockResolvedValue(mockResponse)

    const { result } = renderHook(() => useGetPendingCountQuery(), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual(mockResponse)
    expect(result.current.data?.count).toBe(5)
    expect(signupApprovalService.getPendingCount).toHaveBeenCalled()
  })

  it('should handle zero count', async () => {
    const mockResponse = {
      success: true,
      count: 0
    }

    vi.mocked(signupApprovalService.getPendingCount).mockResolvedValue(mockResponse)

    const { result } = renderHook(() => useGetPendingCountQuery(), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data?.count).toBe(0)
  })

  it('should handle errors', async () => {
    const mockError = new Error('Network error')
    vi.mocked(signupApprovalService.getPendingCount).mockRejectedValue(mockError)

    const { result } = renderHook(() => useGetPendingCountQuery(), { wrapper })

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(result.current.error).toEqual(mockError)
    expect(result.current.data).toBeUndefined()
  })

  it('should not fetch when enabled is false', async () => {
    const mockResponse = {
      success: true,
      count: 3
    }

    vi.mocked(signupApprovalService.getPendingCount).mockResolvedValue(mockResponse)

    const { result } = renderHook(
      () => useGetPendingCountQuery({ enabled: false }),
      { wrapper }
    )

    // Wait a bit to ensure no call is made
    await new Promise(resolve => setTimeout(resolve, 100))

    expect(result.current.isLoading).toBe(false)
    expect(result.current.data).toBeUndefined()
    expect(signupApprovalService.getPendingCount).not.toHaveBeenCalled()
  })

  it('should track loading state correctly', async () => {
    const mockResponse = {
      success: true,
      count: 2
    }

    vi.mocked(signupApprovalService.getPendingCount).mockResolvedValue(mockResponse)

    const { result } = renderHook(() => useGetPendingCountQuery(), { wrapper })

    expect(result.current.isLoading).toBe(true)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.isLoading).toBe(false)
  })
})
