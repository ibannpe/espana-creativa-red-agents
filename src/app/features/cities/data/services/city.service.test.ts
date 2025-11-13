// ABOUTME: Unit tests for city service with mocked axios
// ABOUTME: Tests API communication and response validation with Zod schemas

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { cityService } from './city.service'

// Mock axios instance from @/lib/axios
vi.mock('@/lib/axios', () => ({
  axiosInstance: {
    get: vi.fn()
  }
}))

import { axiosInstance } from '@/lib/axios'
const mockedAxios = vi.mocked(axiosInstance)

describe('City Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getCities', () => {
    it('should call GET /cities and return validated cities', async () => {
      const mockResponse = {
        data: {
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
      }

      mockedAxios.get.mockResolvedValue(mockResponse)

      const result = await cityService.getCities()

      expect(mockedAxios.get).toHaveBeenCalledWith('/cities')
      expect(result.cities).toHaveLength(2)
      expect(result.cities[0].name).toBe('Madrid')
      expect(result.cities[0].opportunities_count).toBe(10)
      expect(result.cities[1].name).toBe('Barcelona')
    })

    it('should throw error on invalid response schema', async () => {
      const invalidResponse = {
        data: {
          cities: [
            {
              id: 1,
              name: 'Madrid',
              slug: 'madrid with spaces', // Invalid slug
              image_url: 'not-a-url', // Invalid URL
              description: null,
              active: true,
              display_order: 0,
              created_at: '2024-01-01T00:00:00Z',
              updated_at: '2024-01-01T00:00:00Z'
            }
          ]
        }
      }

      mockedAxios.get.mockResolvedValue(invalidResponse)

      await expect(cityService.getCities()).rejects.toThrow()
    })

    it('should handle empty cities array', async () => {
      const mockResponse = {
        data: {
          cities: []
        }
      }

      mockedAxios.get.mockResolvedValue(mockResponse)

      const result = await cityService.getCities()

      expect(result.cities).toHaveLength(0)
    })

    it('should handle API errors', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Network error'))

      await expect(cityService.getCities()).rejects.toThrow('Network error')
    })
  })

  describe('getCityBySlug', () => {
    it('should call GET /cities/:slug and return validated city', async () => {
      const mockResponse = {
        data: {
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
      }

      mockedAxios.get.mockResolvedValue(mockResponse)

      const result = await cityService.getCityBySlug('madrid')

      expect(mockedAxios.get).toHaveBeenCalledWith('/cities/madrid')
      expect(result.city.name).toBe('Madrid')
      expect(result.city.slug).toBe('madrid')
      expect(result.city.opportunities_count).toBe(10)
      expect(result.city.active_opportunities_count).toBe(5)
    })

    it('should handle not found error', async () => {
      mockedAxios.get.mockRejectedValue(new Error('City not found'))

      await expect(cityService.getCityBySlug('nonexistent')).rejects.toThrow('City not found')
    })

    it('should throw error on invalid city response', async () => {
      const invalidResponse = {
        data: {
          city: {
            id: 1,
            name: 'M', // Too short
            slug: 'madrid',
            image_url: 'https://example.com/madrid.jpg',
            description: null,
            active: true,
            display_order: 0,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z'
          }
        }
      }

      mockedAxios.get.mockResolvedValue(invalidResponse)

      await expect(cityService.getCityBySlug('madrid')).rejects.toThrow()
    })
  })

  describe('getIsCityManager', () => {
    it('should call GET /cities/my-managed and return manager status', async () => {
      const mockResponse = {
        data: {
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
      }

      mockedAxios.get.mockResolvedValue(mockResponse)

      const result = await cityService.getIsCityManager()

      expect(mockedAxios.get).toHaveBeenCalledWith('/cities/my-managed')
      expect(result.isCityManager).toBe(true)
      expect(result.managedCities).toHaveLength(2)
      expect(result.managedCities[0].name).toBe('Madrid')
      expect(result.managedCities[1].name).toBe('Barcelona')
    })

    it('should return false for non-manager users', async () => {
      const mockResponse = {
        data: {
          isCityManager: false,
          managedCities: []
        }
      }

      mockedAxios.get.mockResolvedValue(mockResponse)

      const result = await cityService.getIsCityManager()

      expect(result.isCityManager).toBe(false)
      expect(result.managedCities).toHaveLength(0)
    })

    it('should handle unauthorized error', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Unauthorized'))

      await expect(cityService.getIsCityManager()).rejects.toThrow('Unauthorized')
    })

    it('should throw error on invalid managed cities structure', async () => {
      const invalidResponse = {
        data: {
          isCityManager: true,
          managedCities: [
            {
              id: 1,
              // Missing name and slug
            }
          ]
        }
      }

      mockedAxios.get.mockResolvedValue(invalidResponse)

      await expect(cityService.getIsCityManager()).rejects.toThrow()
    })
  })

  describe('canManageCity', () => {
    it('should call GET /cities/:id/can-manage and return true', async () => {
      const mockResponse = {
        data: {
          canManage: true
        }
      }

      mockedAxios.get.mockResolvedValue(mockResponse)

      const result = await cityService.canManageCity(1)

      expect(mockedAxios.get).toHaveBeenCalledWith('/cities/1/can-manage')
      expect(result).toBe(true)
    })

    it('should return false when user cannot manage city', async () => {
      const mockResponse = {
        data: {
          canManage: false
        }
      }

      mockedAxios.get.mockResolvedValue(mockResponse)

      const result = await cityService.canManageCity(1)

      expect(result).toBe(false)
    })

    it('should handle unauthorized error', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Unauthorized'))

      await expect(cityService.canManageCity(1)).rejects.toThrow('Unauthorized')
    })

    it('should handle city not found error', async () => {
      mockedAxios.get.mockRejectedValue(new Error('City not found'))

      await expect(cityService.canManageCity(999)).rejects.toThrow('City not found')
    })
  })
})
