// ABOUTME: Unit tests for useIsCityManagerQuery hook
// ABOUTME: Tests manager status check and permission handling

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useIsCityManagerQuery } from './useIsCityManagerQuery'
import { cityService } from '../../data/services/city.service'

// Mock dependencies
vi.mock('../../data/services/city.service')
vi.mock('@/app/features/auth/hooks/useAuthContext', () => ({
  useAuthContext: () => ({
    isAuthenticated: true,
    user: { id: '550e8400-e29b-41d4-a716-446655440000', name: 'Test User' }
  })
}))

describe('useIsCityManagerQuery', () => {
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

  it('should fetch city manager status successfully', async () => {
    const mockResponse = {
      isCityManager: true,
      managedCities: [
        {
          id: 1,
          name: 'Madrid',
          slug: 'madrid'
        },
        {
          id: 2,
          name: 'Barcelona',
          slug: 'barcelona'
        }
      ]
    }

    vi.mocked(cityService.getIsCityManager).mockResolvedValue(mockResponse)

    const { result } = renderHook(() => useIsCityManagerQuery(), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data?.isCityManager).toBe(true)
    expect(result.current.data?.managedCities).toHaveLength(2)
    expect(result.current.data?.managedCities[0].name).toBe('Madrid')
    expect(cityService.getIsCityManager).toHaveBeenCalledTimes(1)
  })

  it('should return false for non-manager users', async () => {
    const mockResponse = {
      isCityManager: false,
      managedCities: []
    }

    vi.mocked(cityService.getIsCityManager).mockResolvedValue(mockResponse)

    const { result } = renderHook(() => useIsCityManagerQuery(), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data?.isCityManager).toBe(false)
    expect(result.current.data?.managedCities).toHaveLength(0)
  })

  it('should handle errors', async () => {
    const mockError = new Error('Unauthorized')
    vi.mocked(cityService.getIsCityManager).mockRejectedValue(mockError)

    const { result } = renderHook(() => useIsCityManagerQuery(), { wrapper })

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(result.current.error).toEqual(mockError)
    expect(result.current.data).toBeUndefined()
  })

  it('should track loading state correctly', async () => {
    const mockResponse = {
      isCityManager: false,
      managedCities: []
    }

    vi.mocked(cityService.getIsCityManager).mockResolvedValue(mockResponse)

    const { result } = renderHook(() => useIsCityManagerQuery(), { wrapper })

    expect(result.current.isLoading).toBe(true)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.isLoading).toBe(false)
  })
})
