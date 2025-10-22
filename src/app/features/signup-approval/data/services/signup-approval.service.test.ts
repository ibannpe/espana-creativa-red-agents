// ABOUTME: Unit tests for signup approval service with mocked axios
// ABOUTME: Tests API communication and response validation with Zod schemas

import { describe, it, expect, vi, beforeEach } from 'vitest'
import axios from 'axios'
import { signupApprovalService } from './signup-approval.service'

// Mock axios
vi.mock('axios')
const mockedAxios = vi.mocked(axios)

describe('Signup Approval Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('submitRequest', () => {
    it('should call POST /api/signup-approval/request and return success response', async () => {
      const requestData = {
        email: 'test@example.com',
        name: 'Test User',
        surname: 'Surname'
      }

      const mockResponse = {
        data: {
          success: true,
          pendingSignupId: '550e8400-e29b-41d4-a716-446655440000',
          message: 'Signup request submitted successfully'
        }
      }

      mockedAxios.post.mockResolvedValue(mockResponse)

      const result = await signupApprovalService.submitRequest(requestData)

      expect(mockedAxios.post).toHaveBeenCalledWith('/api/signup-approval/request', requestData)
      expect(result.success).toBe(true)
      expect(result.pendingSignupId).toBe('550e8400-e29b-41d4-a716-446655440000')
      expect(result.message).toBe('Signup request submitted successfully')
    })

    it('should handle API errors', async () => {
      const requestData = {
        email: 'duplicate@example.com',
        name: 'Test User'
      }

      mockedAxios.post.mockRejectedValue(new Error('Email already exists'))

      await expect(signupApprovalService.submitRequest(requestData)).rejects.toThrow('Email already exists')
    })

    it('should throw error on invalid response schema', async () => {
      const requestData = {
        email: 'test@example.com',
        name: 'Test User'
      }

      const invalidResponse = {
        data: {
          success: true,
          pendingSignupId: 'invalid-uuid', // Invalid UUID
          message: 'Success'
        }
      }

      mockedAxios.post.mockResolvedValue(invalidResponse)

      await expect(signupApprovalService.submitRequest(requestData)).rejects.toThrow()
    })
  })

  describe('approveSignup', () => {
    it('should call POST /api/signup-approval/approve/:token with adminId', async () => {
      const token = '550e8400-e29b-41d4-a716-446655440000'
      const adminId = '660e8400-e29b-41d4-a716-446655440000'

      const mockResponse = {
        data: {
          success: true,
          message: 'Signup approved successfully. User will receive magic link via email.'
        }
      }

      mockedAxios.post.mockResolvedValue(mockResponse)

      const result = await signupApprovalService.approveSignup(token, adminId)

      expect(mockedAxios.post).toHaveBeenCalledWith(
        `/api/signup-approval/approve/${token}`,
        { adminId }
      )
      expect(result.success).toBe(true)
      expect(result.message).toContain('approved successfully')
    })

    it('should use default adminId when not provided', async () => {
      const token = '550e8400-e29b-41d4-a716-446655440000'

      const mockResponse = {
        data: {
          success: true,
          message: 'Signup approved successfully'
        }
      }

      mockedAxios.post.mockResolvedValue(mockResponse)

      await signupApprovalService.approveSignup(token)

      expect(mockedAxios.post).toHaveBeenCalledWith(
        `/api/signup-approval/approve/${token}`,
        { adminId: 'system' }
      )
    })

    it('should handle approval errors (expired token)', async () => {
      const token = 'expired-token'

      mockedAxios.post.mockRejectedValue(new Error('Approval token has expired'))

      await expect(signupApprovalService.approveSignup(token)).rejects.toThrow('Approval token has expired')
    })
  })

  describe('rejectSignup', () => {
    it('should call POST /api/signup-approval/reject/:token with adminId', async () => {
      const token = '550e8400-e29b-41d4-a716-446655440000'
      const adminId = '660e8400-e29b-41d4-a716-446655440000'

      const mockResponse = {
        data: {
          success: true,
          message: 'Signup rejected successfully.'
        }
      }

      mockedAxios.post.mockResolvedValue(mockResponse)

      const result = await signupApprovalService.rejectSignup(token, adminId)

      expect(mockedAxios.post).toHaveBeenCalledWith(
        `/api/signup-approval/reject/${token}`,
        { adminId }
      )
      expect(result.success).toBe(true)
      expect(result.message).toContain('rejected successfully')
    })

    it('should use default adminId when not provided', async () => {
      const token = '550e8400-e29b-41d4-a716-446655440000'

      const mockResponse = {
        data: {
          success: true,
          message: 'Signup rejected successfully'
        }
      }

      mockedAxios.post.mockResolvedValue(mockResponse)

      await signupApprovalService.rejectSignup(token)

      expect(mockedAxios.post).toHaveBeenCalledWith(
        `/api/signup-approval/reject/${token}`,
        { adminId: 'system' }
      )
    })
  })

  describe('getPendingSignups', () => {
    it('should call GET /api/signup-approval/pending with default params', async () => {
      const mockResponse = {
        data: {
          success: true,
          signups: [
            {
              id: '550e8400-e29b-41d4-a716-446655440000',
              email: 'test@example.com',
              name: 'Test User',
              surname: null,
              status: 'pending' as const,
              createdAt: '2024-01-01T00:00:00Z',
              approvedAt: null,
              approvedBy: null,
              rejectedAt: null,
              rejectedBy: null,
              ipAddress: '192.168.1.1',
              userAgent: 'Mozilla/5.0'
            }
          ],
          total: 1,
          limit: 20,
          offset: 0
        }
      }

      mockedAxios.get.mockResolvedValue(mockResponse)

      const result = await signupApprovalService.getPendingSignups()

      expect(mockedAxios.get).toHaveBeenCalledWith('/api/signup-approval/pending', {
        params: { status: 'pending', limit: 20, offset: 0 }
      })
      expect(result.success).toBe(true)
      expect(result.signups).toHaveLength(1)
      expect(result.total).toBe(1)
    })

    it('should call GET /api/signup-approval/pending with custom params', async () => {
      const mockResponse = {
        data: {
          success: true,
          signups: [],
          total: 0,
          limit: 10,
          offset: 5
        }
      }

      mockedAxios.get.mockResolvedValue(mockResponse)

      const result = await signupApprovalService.getPendingSignups('approved', 10, 5)

      expect(mockedAxios.get).toHaveBeenCalledWith('/api/signup-approval/pending', {
        params: { status: 'approved', limit: 10, offset: 5 }
      })
      expect(result.signups).toHaveLength(0)
    })

    it('should handle empty list', async () => {
      const mockResponse = {
        data: {
          success: true,
          signups: [],
          total: 0,
          limit: 20,
          offset: 0
        }
      }

      mockedAxios.get.mockResolvedValue(mockResponse)

      const result = await signupApprovalService.getPendingSignups()

      expect(result.signups).toEqual([])
      expect(result.total).toBe(0)
    })

    it('should handle multiple signups', async () => {
      const mockResponse = {
        data: {
          success: true,
          signups: [
            {
              id: '550e8400-e29b-41d4-a716-446655440000',
              email: 'test1@example.com',
              name: 'User 1',
              surname: null,
              status: 'pending' as const,
              createdAt: '2024-01-01T00:00:00Z',
              approvedAt: null,
              approvedBy: null,
              rejectedAt: null,
              rejectedBy: null,
              ipAddress: null,
              userAgent: null
            },
            {
              id: '660e8400-e29b-41d4-a716-446655440000',
              email: 'test2@example.com',
              name: 'User 2',
              surname: 'Surname',
              status: 'pending' as const,
              createdAt: '2024-01-02T00:00:00Z',
              approvedAt: null,
              approvedBy: null,
              rejectedAt: null,
              rejectedBy: null,
              ipAddress: null,
              userAgent: null
            }
          ],
          total: 2,
          limit: 20,
          offset: 0
        }
      }

      mockedAxios.get.mockResolvedValue(mockResponse)

      const result = await signupApprovalService.getPendingSignups()

      expect(result.signups).toHaveLength(2)
      expect(result.total).toBe(2)
    })
  })

  describe('getPendingCount', () => {
    it('should call GET /api/signup-approval/count and return count', async () => {
      const mockResponse = {
        data: {
          success: true,
          count: 5
        }
      }

      mockedAxios.get.mockResolvedValue(mockResponse)

      const result = await signupApprovalService.getPendingCount()

      expect(mockedAxios.get).toHaveBeenCalledWith('/api/signup-approval/count')
      expect(result.success).toBe(true)
      expect(result.count).toBe(5)
    })

    it('should handle zero count', async () => {
      const mockResponse = {
        data: {
          success: true,
          count: 0
        }
      }

      mockedAxios.get.mockResolvedValue(mockResponse)

      const result = await signupApprovalService.getPendingCount()

      expect(result.count).toBe(0)
    })

    it('should throw error on invalid response schema', async () => {
      const invalidResponse = {
        data: {
          success: true,
          count: '5' // String instead of number
        }
      }

      mockedAxios.get.mockResolvedValue(invalidResponse)

      await expect(signupApprovalService.getPendingCount()).rejects.toThrow()
    })
  })
})
