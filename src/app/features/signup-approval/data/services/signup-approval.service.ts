// ABOUTME: Signup approval service for API communication with backend
// ABOUTME: Pure async functions returning typed promises validated with Zod schemas

import axios from 'axios'
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

export const signupApprovalService = {
  /**
   * Submit a new signup request
   */
  async submitRequest(data: SubmitSignupRequest): Promise<SubmitSignupResponse> {
    const response = await axios.post(`${API_BASE_URL}/request`, data)
    return submitSignupResponseSchema.parse(response.data)
  },

  /**
   * Approve a pending signup (admin only)
   */
  async approveSignup(token: string, adminId?: string): Promise<ApproveRejectResponse> {
    const response = await axios.post(`${API_BASE_URL}/approve/${token}`, {
      adminId: adminId || 'system'
    })
    return approveRejectResponseSchema.parse(response.data)
  },

  /**
   * Reject a pending signup (admin only)
   */
  async rejectSignup(token: string, adminId?: string): Promise<ApproveRejectResponse> {
    const response = await axios.post(`${API_BASE_URL}/reject/${token}`, {
      adminId: adminId || 'system'
    })
    return approveRejectResponseSchema.parse(response.data)
  },

  /**
   * Get list of pending signups with pagination (admin only)
   */
  async getPendingSignups(
    status: 'pending' | 'approved' | 'rejected' = 'pending',
    limit: number = 20,
    offset: number = 0
  ): Promise<GetPendingSignupsResponse> {
    const response = await axios.get(`${API_BASE_URL}/pending`, {
      params: { status, limit, offset }
    })
    return getPendingSignupsResponseSchema.parse(response.data)
  },

  /**
   * Get count of pending signups (admin only)
   */
  async getPendingCount(): Promise<GetPendingCountResponse> {
    const response = await axios.get(`${API_BASE_URL}/count`)
    return getPendingCountResponseSchema.parse(response.data)
  }
}
