// ABOUTME: Signup approval service for API communication with backend
// ABOUTME: Pure async functions returning typed promises validated with Zod schemas

import axios, { AxiosError } from 'axios'
import {
  SubmitSignupRequest,
  SubmitSignupResponse,
  GetPendingSignupsResponse,
  GetPendingCountResponse,
  ApproveRejectResponse,
  submitSignupResponseSchema,
  getPendingSignupsResponseSchema,
  getPendingCountResponseSchema,
  approveRejectResponseSchema
} from '../schemas/signup-approval.schema'

const API_BASE_URL = '/api/signup-approval'

/**
 * Extract error message from axios error response
 * Uses duck typing to detect axios errors (works with mocked errors in tests)
 */
function extractErrorMessage(error: unknown): string {
  // Check if it looks like an axios error with a response
  if (
    error &&
    typeof error === 'object' &&
    'response' in error &&
    error.response &&
    typeof error.response === 'object' &&
    'data' in error.response &&
    error.response.data &&
    typeof error.response.data === 'object' &&
    'error' in error.response.data
  ) {
    return String(error.response.data.error)
  }

  // Fallback to regular Error message
  if (error instanceof Error) {
    return error.message
  }

  return 'Error desconocido. Por favor, intenta de nuevo.'
}

export const signupApprovalService = {
  /**
   * Submit a new signup request
   */
  async submitRequest(data: SubmitSignupRequest): Promise<SubmitSignupResponse> {
    try {
      const response = await axios.post(`${API_BASE_URL}/request`, data)
      return submitSignupResponseSchema.parse(response.data)
    } catch (error) {
      throw new Error(extractErrorMessage(error))
    }
  },

  /**
   * Approve a pending signup (admin only)
   */
  async approveSignup(token: string, adminId?: string): Promise<ApproveRejectResponse> {
    try {
      const response = await axios.post(`${API_BASE_URL}/approve/${token}`, {
        adminId: adminId || 'system'
      })
      return approveRejectResponseSchema.parse(response.data)
    } catch (error) {
      throw new Error(extractErrorMessage(error))
    }
  },

  /**
   * Reject a pending signup (admin only)
   */
  async rejectSignup(token: string, adminId?: string): Promise<ApproveRejectResponse> {
    try {
      const response = await axios.post(`${API_BASE_URL}/reject/${token}`, {
        adminId: adminId || 'system'
      })
      return approveRejectResponseSchema.parse(response.data)
    } catch (error) {
      throw new Error(extractErrorMessage(error))
    }
  },

  /**
   * Get list of pending signups with pagination (admin only)
   */
  async getPendingSignups(
    status: 'pending' | 'approved' | 'rejected' = 'pending',
    limit: number = 20,
    offset: number = 0
  ): Promise<GetPendingSignupsResponse> {
    try {
      const response = await axios.get(`${API_BASE_URL}/pending`, {
        params: { status, limit, offset }
      })
      return getPendingSignupsResponseSchema.parse(response.data)
    } catch (error) {
      throw new Error(extractErrorMessage(error))
    }
  },

  /**
   * Get count of pending signups (admin only)
   */
  async getPendingCount(): Promise<GetPendingCountResponse> {
    try {
      const response = await axios.get(`${API_BASE_URL}/count`)
      return getPendingCountResponseSchema.parse(response.data)
    } catch (error) {
      throw new Error(extractErrorMessage(error))
    }
  }
}
