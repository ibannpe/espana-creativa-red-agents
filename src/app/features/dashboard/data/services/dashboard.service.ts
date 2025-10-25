// ABOUTME: Dashboard service for fetching recent users with Axios and Zod validation
// ABOUTME: Handles communication with backend /api/users/recent endpoint

import axios from 'axios'
import {
  type GetRecentUsersRequest,
  type GetRecentUsersResponse,
  getRecentUsersResponseSchema
} from '../schemas/dashboard.schema'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export const dashboardService = {
  /**
   * Get users registered within the last N days
   * @param params Optional parameters (days, limit)
   * @returns Recent users with metadata
   */
  async getRecentUsers(params?: GetRecentUsersRequest): Promise<GetRecentUsersResponse> {
    const response = await axios.get(`${API_BASE_URL}/api/users/recent`, {
      params: {
        days: params?.days,
        limit: params?.limit
      }
    })
    return getRecentUsersResponseSchema.parse(response.data)
  }
}
