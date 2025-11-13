// ABOUTME: Unit tests for useOpportunitiesByCityQuery hook
// ABOUTME: Tests city-filtered opportunities fetching

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useOpportunitiesByCityQuery } from './useOpportunitiesByCityQuery'
import { opportunityService } from '../../data/services/opportunity.service'

// Mock the service
vi.mock('../../data/services/opportunity.service')

describe('useOpportunitiesByCityQuery', () => {
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

  it('should fetch opportunities by city successfully', async () => {
    const mockResponse = {
      opportunities: [
        {
          id: '550e8400-e29b-41d4-a716-446655440000',
          title: 'Madrid Opportunity',
          description: 'Description here',
          type: 'proyecto' as const,
          status: 'abierta' as const,
          skills_required: ['JavaScript'],
          created_by: '550e8400-e29b-41d4-a716-446655440001',
          city_id: 1,
          location: null,
          remote: false,
          duration: null,
          compensation: null,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          creator: {
            id: '550e8400-e29b-41d4-a716-446655440001',
            name: 'John Doe',
            avatar_url: null
          }
        }
      ],
      total: 1
    }

    vi.mocked(opportunityService.getOpportunitiesByCity).mockResolvedValue(mockResponse)

    const { result } = renderHook(() => useOpportunitiesByCityQuery(1), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data?.opportunities).toHaveLength(1)
    expect(result.current.data?.total).toBe(1)
    expect(result.current.data?.opportunities[0].title).toBe('Madrid Opportunity')
    expect(opportunityService.getOpportunitiesByCity).toHaveBeenCalledWith(1, undefined)
  })

  it('should fetch with additional filters', async () => {
    const filters = {
      type: 'proyecto' as const,
      status: 'abierta' as const
    }

    const mockResponse = {
      opportunities: [],
      total: 0
    }

    vi.mocked(opportunityService.getOpportunitiesByCity).mockResolvedValue(mockResponse)

    const { result } = renderHook(() => useOpportunitiesByCityQuery(1, filters), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(opportunityService.getOpportunitiesByCity).toHaveBeenCalledWith(1, filters)
  })

  it('should handle empty opportunities list', async () => {
    const mockResponse = {
      opportunities: [],
      total: 0
    }

    vi.mocked(opportunityService.getOpportunitiesByCity).mockResolvedValue(mockResponse)

    const { result } = renderHook(() => useOpportunitiesByCityQuery(1), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data?.opportunities).toHaveLength(0)
    expect(result.current.data?.total).toBe(0)
  })

  it('should handle errors', async () => {
    const mockError = new Error('City not found')
    vi.mocked(opportunityService.getOpportunitiesByCity).mockRejectedValue(mockError)

    const { result } = renderHook(() => useOpportunitiesByCityQuery(999), { wrapper })

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(result.current.error).toEqual(mockError)
    expect(result.current.data).toBeUndefined()
  })

  it('should not fetch when enabled is false', async () => {
    const { result } = renderHook(
      () => useOpportunitiesByCityQuery(1, undefined, { enabled: false }),
      { wrapper }
    )

    // Wait a bit to ensure no call is made
    await new Promise(resolve => setTimeout(resolve, 100))

    expect(result.current.isLoading).toBe(false)
    expect(result.current.data).toBeUndefined()
    expect(opportunityService.getOpportunitiesByCity).not.toHaveBeenCalled()
  })

  it('should track loading state correctly', async () => {
    const mockResponse = {
      opportunities: [],
      total: 0
    }

    vi.mocked(opportunityService.getOpportunitiesByCity).mockResolvedValue(mockResponse)

    const { result } = renderHook(() => useOpportunitiesByCityQuery(1), { wrapper })

    expect(result.current.isLoading).toBe(true)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.isLoading).toBe(false)
  })
})
