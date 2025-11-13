// ABOUTME: Unit tests for useMyCitiesQuery hook
// ABOUTME: Tests managed cities fetching wrapper hook

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useMyCitiesQuery } from './useMyCitiesQuery'
import { cityService } from '../../data/services/city.service'

// Mock dependencies
vi.mock('../../data/services/city.service')
vi.mock('@/app/features/auth/hooks/useAuthContext', () => ({
  useAuthContext: () => ({
    isAuthenticated: true,
    user: { id: '550e8400-e29b-41d4-a716-446655440000', name: 'Test User' }
  })
}))

describe('useMyCitiesQuery', () => {
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

  it('should return managed cities for city manager', async () => {
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

    const { result } = renderHook(() => useMyCitiesQuery(), { wrapper })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.data).toHaveLength(2)
    expect(result.current.isCityManager).toBe(true)
    expect(result.current.data[0].name).toBe('Madrid')
    expect(result.current.data[1].name).toBe('Barcelona')
  })

  it('should return empty array for non-manager', async () => {
    const mockResponse = {
      isCityManager: false,
      managedCities: []
    }

    vi.mocked(cityService.getIsCityManager).mockResolvedValue(mockResponse)

    const { result } = renderHook(() => useMyCitiesQuery(), { wrapper })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.data).toHaveLength(0)
    expect(result.current.isCityManager).toBe(false)
  })

  it('should handle errors', async () => {
    const mockError = new Error('Network error')
    vi.mocked(cityService.getIsCityManager).mockRejectedValue(mockError)

    const { result } = renderHook(() => useMyCitiesQuery(), { wrapper })

    // Wait for isLoading to become false (query completed with error)
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    }, {
      timeout: 3000
    })

    // useMyCitiesQuery expone el error del hook subyacente
    expect(result.current.error).toEqual(mockError)
    expect(result.current.data).toHaveLength(0) // Array vacío por defecto
    expect(result.current.isCityManager).toBe(false) // false por defecto
  })

  it('should track loading state correctly', async () => {
    const mockResponse = {
      isCityManager: true,
      managedCities: []
    }

    vi.mocked(cityService.getIsCityManager).mockResolvedValue(mockResponse)

    const { result } = renderHook(() => useMyCitiesQuery(), { wrapper })

    expect(result.current.isLoading).toBe(true)

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.isLoading).toBe(false)
  })
})
