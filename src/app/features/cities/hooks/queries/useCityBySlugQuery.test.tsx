// ABOUTME: Unit tests for useCityBySlugQuery hook
// ABOUTME: Tests query behavior, caching, and error handling for individual city

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useCityBySlugQuery } from './useCityBySlugQuery'
import { cityService } from '../../data/services/city.service'

// Mock the service
vi.mock('../../data/services/city.service')

describe('useCityBySlugQuery', () => {
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

  it('should fetch city by slug successfully', async () => {
    const mockResponse = {
      city: {
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
      }
    }

    vi.mocked(cityService.getCityBySlug).mockResolvedValue(mockResponse)

    const { result } = renderHook(() => useCityBySlugQuery('madrid'), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data?.name).toBe('Madrid')
    expect(result.current.data?.slug).toBe('madrid')
    expect(result.current.data?.opportunities_count).toBe(10)
    expect(cityService.getCityBySlug).toHaveBeenCalledWith('madrid')
  })

  it('should handle not found error', async () => {
    const mockError = new Error('City not found')
    vi.mocked(cityService.getCityBySlug).mockRejectedValue(mockError)

    const { result } = renderHook(() => useCityBySlugQuery('nonexistent'), { wrapper })

    await waitFor(() => expect(result.current.isError).toBe(true), {
      timeout: 3000
    })

    expect(result.current.error).toEqual(mockError)
    expect(result.current.data).toBeUndefined()
  })

  it('should not fetch when slug is empty', async () => {
    const { result } = renderHook(() => useCityBySlugQuery(''), { wrapper })

    // Wait a bit to ensure no call is made
    await new Promise(resolve => setTimeout(resolve, 100))

    expect(result.current.isLoading).toBe(false)
    expect(result.current.data).toBeUndefined()
    expect(cityService.getCityBySlug).not.toHaveBeenCalled()
  })

  it('should track loading state correctly', async () => {
    const mockResponse = {
      city: {
        id: 1,
        name: 'Madrid',
        slug: 'madrid',
        image_url: 'https://example.com/madrid.jpg',
        description: null,
        active: true,
        display_order: 0,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        opportunities_count: 0,
        active_opportunities_count: 0
      }
    }

    vi.mocked(cityService.getCityBySlug).mockResolvedValue(mockResponse)

    const { result } = renderHook(() => useCityBySlugQuery('madrid'), { wrapper })

    expect(result.current.isLoading).toBe(true)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.isLoading).toBe(false)
  })
})
