// ABOUTME: Unit tests for useGetPendingSignupsQuery hook
// ABOUTME: Tests query behavior, pagination, caching, and error handling

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useGetPendingSignupsQuery } from './useGetPendingSignupsQuery'
import { signupApprovalService } from '../../data/services/signup-approval.service'

// Mock the service
vi.mock('../../data/services/signup-approval.service')

describe('useGetPendingSignupsQuery', () => {
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

  it('should fetch pending signups with default parameters', async () => {
    const mockResponse = {
      success: true,
      signups: [
        {
          id: '550e8400-e29b-41d4-a716-446655440000',
          email: 'test@example.com',
          name: 'Test User',
          surname: null,
          status: 'pending' as const,
          createdAt: '2024-01-01T00:00:00Z',
          approvedAt: null,
          approvedBy: null,
          rejectedAt: null,
          rejectedBy: null,
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0'
        }
      ],
      total: 1,
      limit: 20,
      offset: 0
    }

    vi.mocked(signupApprovalService.getPendingSignups).mockResolvedValue(mockResponse)

    const { result } = renderHook(() => useGetPendingSignupsQuery(), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual(mockResponse)
    expect(signupApprovalService.getPendingSignups).toHaveBeenCalledWith('pending', 20, 0)
  })

  it('should fetch signups with custom parameters', async () => {
    const mockResponse = {
      success: true,
      signups: [],
      total: 0,
      limit: 10,
      offset: 5
    }

    vi.mocked(signupApprovalService.getPendingSignups).mockResolvedValue(mockResponse)

    const { result } = renderHook(
      () => useGetPendingSignupsQuery({ status: 'approved', limit: 10, offset: 5 }),
      { wrapper }
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual(mockResponse)
    expect(signupApprovalService.getPendingSignups).toHaveBeenCalledWith('approved', 10, 5)
  })

  it('should handle errors', async () => {
    const mockError = new Error('Unauthorized')
    vi.mocked(signupApprovalService.getPendingSignups).mockRejectedValue(mockError)

    const { result } = renderHook(() => useGetPendingSignupsQuery(), { wrapper })

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(result.current.error).toEqual(mockError)
    expect(result.current.data).toBeUndefined()
  })

  it('should not fetch when enabled is false', async () => {
    const mockResponse = {
      success: true,
      signups: [],
      total: 0,
      limit: 20,
      offset: 0
    }

    vi.mocked(signupApprovalService.getPendingSignups).mockResolvedValue(mockResponse)

    const { result } = renderHook(
      () => useGetPendingSignupsQuery({ enabled: false }),
      { wrapper }
    )

    // Wait a bit to ensure no call is made
    await new Promise(resolve => setTimeout(resolve, 100))

    expect(result.current.isLoading).toBe(false)
    expect(result.current.data).toBeUndefined()
    expect(signupApprovalService.getPendingSignups).not.toHaveBeenCalled()
  })

  it('should handle empty signups list', async () => {
    const mockResponse = {
      success: true,
      signups: [],
      total: 0,
      limit: 20,
      offset: 0
    }

    vi.mocked(signupApprovalService.getPendingSignups).mockResolvedValue(mockResponse)

    const { result } = renderHook(() => useGetPendingSignupsQuery(), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data?.signups).toHaveLength(0)
    expect(result.current.data?.total).toBe(0)
  })

  it('should handle multiple signups', async () => {
    const mockResponse = {
      success: true,
      signups: [
        {
          id: '550e8400-e29b-41d4-a716-446655440000',
          email: 'test1@example.com',
          name: 'User 1',
          surname: null,
          status: 'pending' as const,
          createdAt: '2024-01-01T00:00:00Z',
          approvedAt: null,
          approvedBy: null,
          rejectedAt: null,
          rejectedBy: null,
          ipAddress: null,
          userAgent: null
        },
        {
          id: '660e8400-e29b-41d4-a716-446655440000',
          email: 'test2@example.com',
          name: 'User 2',
          surname: 'Surname',
          status: 'pending' as const,
          createdAt: '2024-01-02T00:00:00Z',
          approvedAt: null,
          approvedBy: null,
          rejectedAt: null,
          rejectedBy: null,
          ipAddress: null,
          userAgent: null
        }
      ],
      total: 2,
      limit: 20,
      offset: 0
    }

    vi.mocked(signupApprovalService.getPendingSignups).mockResolvedValue(mockResponse)

    const { result } = renderHook(() => useGetPendingSignupsQuery(), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data?.signups).toHaveLength(2)
    expect(result.current.data?.total).toBe(2)
  })

  it('should track loading state correctly', async () => {
    const mockResponse = {
      success: true,
      signups: [],
      total: 0,
      limit: 20,
      offset: 0
    }

    vi.mocked(signupApprovalService.getPendingSignups).mockResolvedValue(mockResponse)

    const { result } = renderHook(() => useGetPendingSignupsQuery(), { wrapper })

    expect(result.current.isLoading).toBe(true)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.isLoading).toBe(false)
  })
})
