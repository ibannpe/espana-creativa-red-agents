// ABOUTME: Unit tests for auth service with mocked axios
// ABOUTME: Tests API communication and response validation with Zod schemas

import { describe, it, expect, vi, beforeEach } from 'vitest'
import axios from 'axios'
import { authService } from './auth.service'

// Mock axios
vi.mock('axios')
const mockedAxios = vi.mocked(axios)

describe('Auth Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('signUp', () => {
    it('should call POST /api/auth/signup and return validated user', async () => {
      const signUpData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      }

      const mockResponse = {
        data: {
          user: {
            id: '550e8400-e29b-41d4-a716-446655440000',
            email: 'test@example.com',
            name: 'Test User',
            avatar_url: null,
            bio: null,
            location: null,
            linkedin_url: null,
            website_url: null,
            skills: [],
            interests: [],
            completed_pct: 20,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z'
          }
        }
      }

      mockedAxios.post.mockResolvedValue(mockResponse)

      const result = await authService.signUp(signUpData)

      expect(mockedAxios.post).toHaveBeenCalledWith('/api/auth/signup', signUpData)
      expect(result.user.email).toBe('test@example.com')
      expect(result.user.name).toBe('Test User')
    })

    it('should throw error on invalid response schema', async () => {
      const signUpData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      }

      const invalidResponse = {
        data: {
          user: {
            id: 'invalid-uuid', // Invalid UUID
            email: 'test@example.com'
            // Missing required fields
          }
        }
      }

      mockedAxios.post.mockResolvedValue(invalidResponse)

      await expect(authService.signUp(signUpData)).rejects.toThrow()
    })
  })

  describe('signIn', () => {
    it('should call POST /api/auth/signin and return user with session', async () => {
      const signInData = {
        email: 'test@example.com',
        password: 'password123'
      }

      const mockResponse = {
        data: {
          user: {
            id: '550e8400-e29b-41d4-a716-446655440000',
            email: 'test@example.com',
            name: 'Test User',
            avatar_url: null,
            bio: null,
            location: null,
            linkedin_url: null,
            website_url: null,
            skills: [],
            interests: [],
            completed_pct: 50,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z'
          },
          session: { access_token: 'fake-token' }
        }
      }

      mockedAxios.post.mockResolvedValue(mockResponse)

      const result = await authService.signIn(signInData)

      expect(mockedAxios.post).toHaveBeenCalledWith('/api/auth/signin', signInData)
      expect(result.user.email).toBe('test@example.com')
      expect(result.session).toBeDefined()
    })

    it('should handle API errors', async () => {
      const signInData = {
        email: 'test@example.com',
        password: 'wrong-password'
      }

      mockedAxios.post.mockRejectedValue(new Error('Invalid credentials'))

      await expect(authService.signIn(signInData)).rejects.toThrow('Invalid credentials')
    })
  })

  describe('signOut', () => {
    it('should call POST /api/auth/signout', async () => {
      mockedAxios.post.mockResolvedValue({})

      await authService.signOut()

      expect(mockedAxios.post).toHaveBeenCalledWith('/api/auth/signout')
    })
  })

  describe('getCurrentUser', () => {
    it('should call GET /api/auth/me and return current user', async () => {
      const mockResponse = {
        data: {
          user: {
            id: '550e8400-e29b-41d4-a716-446655440000',
            email: 'current@example.com',
            name: 'Current User',
            avatar_url: 'https://example.com/avatar.jpg',
            bio: 'My bio',
            location: 'Madrid',
            linkedin_url: null,
            website_url: null,
            skills: ['JavaScript'],
            interests: ['Coding'],
            completed_pct: 80,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-02T00:00:00Z'
          }
        }
      }

      mockedAxios.get.mockResolvedValue(mockResponse)

      const result = await authService.getCurrentUser()

      expect(mockedAxios.get).toHaveBeenCalledWith('/api/auth/me')
      expect(result.user.email).toBe('current@example.com')
      expect(result.user.completed_pct).toBe(80)
    })

    it('should handle unauthorized error', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Unauthorized'))

      await expect(authService.getCurrentUser()).rejects.toThrow('Unauthorized')
    })
  })
})
