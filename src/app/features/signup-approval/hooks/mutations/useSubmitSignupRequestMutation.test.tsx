// ABOUTME: Unit tests for useSubmitSignupRequestMutation hook
// ABOUTME: Tests mutation behavior, cache invalidation, and error handling

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useSubmitSignupRequestMutation } from './useSubmitSignupRequestMutation'
import { signupApprovalService } from '../../data/services/signup-approval.service'

// Mock the service
vi.mock('../../data/services/signup-approval.service')

describe('useSubmitSignupRequestMutation', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    })
    vi.clearAllMocks()
  })

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

  it('should successfully submit signup request', async () => {
    const mockResponse = {
      success: true,
      pendingSignupId: '550e8400-e29b-41d4-a716-446655440000',
      message: 'Signup request submitted successfully'
    }

    vi.mocked(signupApprovalService.submitRequest).mockResolvedValue(mockResponse)

    const { result } = renderHook(() => useSubmitSignupRequestMutation(), { wrapper })

    const requestData = {
      email: 'test@example.com',
      name: 'Test User',
      surname: 'Surname'
    }

    result.current.action(requestData)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual(mockResponse)
    expect(result.current.error).toBeNull()
    expect(signupApprovalService.submitRequest).toHaveBeenCalledWith(requestData)
  })

  it('should handle submission errors', async () => {
    const mockError = new Error('Email already exists')
    vi.mocked(signupApprovalService.submitRequest).mockRejectedValue(mockError)

    const { result } = renderHook(() => useSubmitSignupRequestMutation(), { wrapper })

    result.current.action({
      email: 'duplicate@example.com',
      name: 'Test User'
    })

    await waitFor(() => expect(result.current.error).toBeTruthy())

    expect(result.current.error).toEqual(mockError)
    expect(result.current.isSuccess).toBe(false)
  })

  it('should invalidate pending queries on success', async () => {
    const mockResponse = {
      success: true,
      pendingSignupId: '550e8400-e29b-41d4-a716-446655440000',
      message: 'Success'
    }

    vi.mocked(signupApprovalService.submitRequest).mockResolvedValue(mockResponse)

    const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useSubmitSignupRequestMutation(), { wrapper })

    result.current.action({
      email: 'test@example.com',
      name: 'Test User'
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ['signupApproval', 'pendingCount'] })
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ['signupApproval', 'pendingSignups'] })
  })

  it('should track loading state correctly', async () => {
    const mockResponse = {
      success: true,
      pendingSignupId: '550e8400-e29b-41d4-a716-446655440000',
      message: 'Success'
    }

    vi.mocked(signupApprovalService.submitRequest).mockResolvedValue(mockResponse)

    const { result } = renderHook(() => useSubmitSignupRequestMutation(), { wrapper })

    expect(result.current.isLoading).toBe(false)

    result.current.action({
      email: 'test@example.com',
      name: 'Test User'
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.isLoading).toBe(false)
  })
})
