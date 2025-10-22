// ABOUTME: Unit tests for useApproveSignupMutation hook
// ABOUTME: Tests approval mutation behavior, cache invalidation, and error handling

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useApproveSignupMutation } from './useApproveSignupMutation'
import { signupApprovalService } from '../../data/services/signup-approval.service'

// Mock the service
vi.mock('../../data/services/signup-approval.service')

describe('useApproveSignupMutation', () => {
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

  it('should successfully approve signup', async () => {
    const mockResponse = {
      success: true,
      message: 'Signup approved successfully'
    }

    vi.mocked(signupApprovalService.approveSignup).mockResolvedValue(mockResponse)

    const { result } = renderHook(() => useApproveSignupMutation(), { wrapper })

    const approveData = {
      token: '550e8400-e29b-41d4-a716-446655440000',
      adminId: '660e8400-e29b-41d4-a716-446655440000'
    }

    result.current.action(approveData)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual(mockResponse)
    expect(result.current.error).toBeNull()
    expect(signupApprovalService.approveSignup).toHaveBeenCalledWith(approveData.token, approveData.adminId)
  })

  it('should handle approval errors (expired token)', async () => {
    const mockError = new Error('Approval token has expired')
    vi.mocked(signupApprovalService.approveSignup).mockRejectedValue(mockError)

    const { result } = renderHook(() => useApproveSignupMutation(), { wrapper })

    result.current.action({ token: 'expired-token' })

    await waitFor(() => expect(result.current.error).toBeTruthy())

    expect(result.current.error).toEqual(mockError)
    expect(result.current.isSuccess).toBe(false)
  })

  it('should invalidate pending queries on success', async () => {
    const mockResponse = {
      success: true,
      message: 'Signup approved successfully'
    }

    vi.mocked(signupApprovalService.approveSignup).mockResolvedValue(mockResponse)

    const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useApproveSignupMutation(), { wrapper })

    result.current.action({ token: '550e8400-e29b-41d4-a716-446655440000' })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ['signupApproval', 'pendingSignups'] })
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ['signupApproval', 'pendingCount'] })
  })

  it('should work without adminId (use system default)', async () => {
    const mockResponse = {
      success: true,
      message: 'Signup approved successfully'
    }

    vi.mocked(signupApprovalService.approveSignup).mockResolvedValue(mockResponse)

    const { result } = renderHook(() => useApproveSignupMutation(), { wrapper })

    result.current.action({ token: '550e8400-e29b-41d4-a716-446655440000' })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(signupApprovalService.approveSignup).toHaveBeenCalledWith(
      '550e8400-e29b-41d4-a716-446655440000',
      undefined
    )
  })
})
