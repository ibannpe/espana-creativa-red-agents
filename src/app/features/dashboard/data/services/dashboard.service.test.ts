// ABOUTME: Unit tests for dashboard service with mocked axios
// ABOUTME: Tests API communication and response validation with Zod schemas

import { describe, it, expect, vi, beforeEach } from 'vitest'
import axios from 'axios'
import { dashboardService } from './dashboard.service'

// Mock axios
vi.mock('axios')
const mockedAxios = vi.mocked(axios)

describe('Dashboard Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getRecentUsers', () => {
    it('should call GET /api/users/recent with default params', async () => {
      const mockResponse = {
        data: {
          users: [
            {
              id: '550e8400-e29b-41d4-a716-446655440000',
              email: 'user1@example.com',
              name: 'User 1',
              avatar_url: null,
              bio: null,
              location: null,
              linkedin_url: null,
              website_url: null,
              skills: [],
              interests: [],
              role_ids: [3],
              completed_pct: 30,
              created_at: '2025-01-01T00:00:00Z',
              updated_at: '2025-01-01T00:00:00Z'
            }
          ],
          count: 1,
          days_filter: 30
        }
      }

      mockedAxios.get.mockResolvedValue(mockResponse)

      const result = await dashboardService.getRecentUsers()

      expect(mockedAxios.get).toHaveBeenCalledWith('http://localhost:3001/api/users/recent', {
        params: {
          days: undefined,
          limit: undefined
        }
      })
      expect(result.users).toHaveLength(1)
      expect(result.count).toBe(1)
      expect(result.days_filter).toBe(30)
    })

    it('should call GET /api/users/recent with custom params', async () => {
      const mockResponse = {
        data: {
          users: [],
          count: 0,
          days_filter: 7
        }
      }

      mockedAxios.get.mockResolvedValue(mockResponse)

      const result = await dashboardService.getRecentUsers({ days: 7, limit: 10 })

      expect(mockedAxios.get).toHaveBeenCalledWith('http://localhost:3001/api/users/recent', {
        params: {
          days: 7,
          limit: 10
        }
      })
      expect(result.days_filter).toBe(7)
    })

    it('should return multiple users ordered correctly', async () => {
      const mockResponse = {
        data: {
          users: [
            {
              id: '550e8400-e29b-41d4-a716-446655440001',
              email: 'user1@example.com',
              name: 'User 1',
              avatar_url: null,
              bio: null,
              location: null,
              linkedin_url: null,
              website_url: null,
              skills: [],
              interests: [],
              role_ids: [3],
              completed_pct: 30,
              created_at: '2025-01-03T00:00:00Z',
              updated_at: '2025-01-03T00:00:00Z'
            },
            {
              id: '550e8400-e29b-41d4-a716-446655440002',
              email: 'user2@example.com',
              name: 'User 2',
              avatar_url: null,
              bio: null,
              location: null,
              linkedin_url: null,
              website_url: null,
              skills: [],
              interests: [],
              role_ids: [2],
              completed_pct: 60,
              created_at: '2025-01-02T00:00:00Z',
              updated_at: '2025-01-02T00:00:00Z'
            }
          ],
          count: 2,
          days_filter: 30
        }
      }

      mockedAxios.get.mockResolvedValue(mockResponse)

      const result = await dashboardService.getRecentUsers()

      expect(result.users).toHaveLength(2)
      expect(result.count).toBe(2)
      expect(result.users[0].name).toBe('User 1')
      expect(result.users[1].name).toBe('User 2')
    })

    it('should throw error on invalid response schema', async () => {
      const invalidResponse = {
        data: {
          users: [
            {
              id: 'invalid-uuid', // Invalid UUID format
              name: 'Test'
            }
          ],
          count: 1
        }
      }

      mockedAxios.get.mockResolvedValue(invalidResponse)

      await expect(dashboardService.getRecentUsers()).rejects.toThrow()
    })

    it('should handle empty users array', async () => {
      const mockResponse = {
        data: {
          users: [],
          count: 0,
          days_filter: 30
        }
      }

      mockedAxios.get.mockResolvedValue(mockResponse)

      const result = await dashboardService.getRecentUsers()

      expect(result.users).toHaveLength(0)
      expect(result.count).toBe(0)
    })

    it('should handle network errors', async () => {
      const networkError = new Error('Network Error')
      mockedAxios.get.mockRejectedValue(networkError)

      await expect(dashboardService.getRecentUsers()).rejects.toThrow('Network Error')
    })
  })
})
