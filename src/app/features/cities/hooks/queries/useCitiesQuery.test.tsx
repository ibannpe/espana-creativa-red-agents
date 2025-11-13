// ABOUTME: Unit tests for useCitiesQuery hook
// ABOUTME: Tests query behavior, caching, and error handling

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useCitiesQuery } from './useCitiesQuery'
import { cityService } from '../../data/services/city.service'

// Mock the service
vi.mock('../../data/services/city.service')

describe('useCitiesQuery', () => {
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

  it('should fetch cities successfully', async () => {
    const mockResponse = {
      cities: [
        {
          id: 1,
          name: 'Madrid',
          slug: 'madrid',
          image_url: 'https://example.com/madrid.jpg',
          description: 'Capital de España',
          active: true,
          display_order: 0,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          opportunities_count: 10,
          active_opportunities_count: 5
        },
        {
          id: 2,
          name: 'Barcelona',
          slug: 'barcelona',
          image_url: 'https://example.com/barcelona.jpg',
          description: null,
          active: true,
          display_order: 1,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          opportunities_count: 3,
          active_opportunities_count: 2
        }
      ]
    }

    vi.mocked(cityService.getCities).mockResolvedValue(mockResponse)

    const { result } = renderHook(() => useCitiesQuery(), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toHaveLength(2)
    expect(result.current.data?.[0].name).toBe('Madrid')
    expect(result.current.data?.[1].name).toBe('Barcelona')
    expect(cityService.getCities).toHaveBeenCalledTimes(1)
  })

  it('should handle errors', async () => {
    const mockError = new Error('Network error')
    vi.mocked(cityService.getCities).mockRejectedValue(mockError)

    const { result } = renderHook(() => useCitiesQuery(), { wrapper })

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(result.current.error).toEqual(mockError)
    expect(result.current.data).toBeUndefined()
  })

  it('should handle empty cities array', async () => {
    const mockResponse = {
      cities: []
    }

    vi.mocked(cityService.getCities).mockResolvedValue(mockResponse)

    const { result } = renderHook(() => useCitiesQuery(), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toHaveLength(0)
  })

  it('should track loading state correctly', async () => {
    const mockResponse = {
      cities: []
    }

    vi.mocked(cityService.getCities).mockResolvedValue(mockResponse)

    const { result } = renderHook(() => useCitiesQuery(), { wrapper })

    expect(result.current.isLoading).toBe(true)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.isLoading).toBe(false)
  })
})
