// ABOUTME: Unit tests for auth service with mocked axios
// ABOUTME: Tests API communication and response validation with Zod schemas

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { authService } from './auth.service'

// Mock axios instance from @/lib/axios
vi.mock('@/lib/axios', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
  }
}))

// Mock Supabase client
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      updateUser: vi.fn()
    }
  }
}))

import axiosInstance from '@/lib/axios'
const mockedAxios = vi.mocked(axiosInstance)

describe('Auth Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('signUp', () => {
    it('should call POST /auth/signup and return validated user', async () => {
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
            role_ids: [2],
            completed_pct: 20,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z'
          }
        }
      }

      mockedAxios.post.mockResolvedValue(mockResponse)

      const result = await authService.signUp(signUpData)

      expect(mockedAxios.post).toHaveBeenCalledWith('/auth/signup', signUpData)
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
    it('should call POST /auth/signin and return user with session', async () => {
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
            role_ids: [2],
            completed_pct: 50,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z'
          },
          session: { access_token: 'fake-token' }
        }
      }

      mockedAxios.post.mockResolvedValue(mockResponse)

      const result = await authService.signIn(signInData)

      expect(mockedAxios.post).toHaveBeenCalledWith('/auth/signin', signInData)
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
    it('should call POST /auth/signout', async () => {
      mockedAxios.post.mockResolvedValue({})

      await authService.signOut()

      expect(mockedAxios.post).toHaveBeenCalledWith('/auth/signout')
    })
  })

  describe('getCurrentUser', () => {
    it('should call GET /api/auth/me and return current user', async () => {
      const mockUserData = {
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
          role_ids: [2],
          completed_pct: 80,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z'
        }
      }

      // Mock fetch since getCurrentUser uses fetch instead of axios
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockUserData
      })

      const result = await authService.getCurrentUser()

      expect(global.fetch).toHaveBeenCalledWith('/api/auth/me', expect.objectContaining({
        credentials: 'include'
      }))
      expect(result.user.email).toBe('current@example.com')
      expect(result.user.completed_pct).toBe(80)
    })

    it('should handle unauthorized error', async () => {
      // Mock 401 response
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401
      })

      await expect(authService.getCurrentUser()).rejects.toThrow('Not authenticated')
    })
  })

  describe('changePassword', () => {
    it('should call POST /auth/change-password with current and new passwords', async () => {
      const changePasswordData = {
        currentPassword: 'oldPassword123',
        newPassword: 'newPassword456'
      }

      const mockResponse = {
        data: {
          message: 'Contraseña cambiada exitosamente'
        }
      }

      mockedAxios.post.mockResolvedValue(mockResponse)

      const result = await authService.changePassword(changePasswordData)

      expect(mockedAxios.post).toHaveBeenCalledWith('/auth/change-password', changePasswordData)
      expect(result.message).toBe('Contraseña cambiada exitosamente')
    })

    it('should handle incorrect current password error', async () => {
      const changePasswordData = {
        currentPassword: 'wrongPassword',
        newPassword: 'newPassword456'
      }

      mockedAxios.post.mockRejectedValue(new Error('Contraseña actual incorrecta'))

      await expect(authService.changePassword(changePasswordData)).rejects.toThrow('Contraseña actual incorrecta')
    })

    it('should handle weak new password error', async () => {
      const changePasswordData = {
        currentPassword: 'oldPassword123',
        newPassword: 'weak'
      }

      mockedAxios.post.mockRejectedValue(new Error('La nueva contraseña debe tener al menos 8 caracteres'))

      await expect(authService.changePassword(changePasswordData)).rejects.toThrow('La nueva contraseña debe tener al menos 8 caracteres')
    })
  })
})
