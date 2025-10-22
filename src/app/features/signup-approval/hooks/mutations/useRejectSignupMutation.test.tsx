// ABOUTME: Unit tests for useRejectSignupMutation hook
// ABOUTME: Tests rejection mutation behavior, cache invalidation, and error handling

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useRejectSignupMutation } from './useRejectSignupMutation'
import { signupApprovalService } from '../../data/services/signup-approval.service'

// Mock the service
vi.mock('../../data/services/signup-approval.service')

describe('useRejectSignupMutation', () => {
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

  it('should successfully reject signup', async () => {
    const mockResponse = {
      success: true,
      message: 'Signup rejected successfully'
    }

    vi.mocked(signupApprovalService.rejectSignup).mockResolvedValue(mockResponse)

    const { result } = renderHook(() => useRejectSignupMutation(), { wrapper })

    const rejectData = {
      token: '550e8400-e29b-41d4-a716-446655440000',
      adminId: '660e8400-e29b-41d4-a716-446655440000'
    }

    result.current.action(rejectData)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual(mockResponse)
    expect(result.current.error).toBeNull()
    expect(signupApprovalService.rejectSignup).toHaveBeenCalledWith(rejectData.token, rejectData.adminId)
  })

  it('should handle rejection errors', async () => {
    const mockError = new Error('Signup not found')
    vi.mocked(signupApprovalService.rejectSignup).mockRejectedValue(mockError)

    const { result } = renderHook(() => useRejectSignupMutation(), { wrapper })

    result.current.action({ token: 'invalid-token' })

    await waitFor(() => expect(result.current.error).toBeTruthy())

    expect(result.current.error).toEqual(mockError)
    expect(result.current.isSuccess).toBe(false)
  })

  it('should invalidate pending queries on success', async () => {
    const mockResponse = {
      success: true,
      message: 'Signup rejected successfully'
    }

    vi.mocked(signupApprovalService.rejectSignup).mockResolvedValue(mockResponse)

    const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useRejectSignupMutation(), { wrapper })

    result.current.action({ token: '550e8400-e29b-41d4-a716-446655440000' })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ['signupApproval', 'pendingSignups'] })
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ['signupApproval', 'pendingCount'] })
  })

  it('should work without adminId (use system default)', async () => {
    const mockResponse = {
      success: true,
      message: 'Signup rejected successfully'
    }

    vi.mocked(signupApprovalService.rejectSignup).mockResolvedValue(mockResponse)

    const { result } = renderHook(() => useRejectSignupMutation(), { wrapper })

    result.current.action({ token: '550e8400-e29b-41d4-a716-446655440000' })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(signupApprovalService.rejectSignup).toHaveBeenCalledWith(
      '550e8400-e29b-41d4-a716-446655440000',
      undefined
    )
  })
})
