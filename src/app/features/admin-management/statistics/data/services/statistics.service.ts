// ABOUTME: Service layer for admin statistics API communication
// ABOUTME: Handles HTTP requests to statistics endpoints with proper validation and error handling

import { axiosInstance } from '@/lib/axios'
import { statisticsResponseSchema, type StatisticsResponse } from '../schemas/statistics.schema'

export const statisticsService = {
  /**
   * Get platform statistics overview (admin only)
   */
  async getStatistics(): Promise<StatisticsResponse> {
    const response = await axiosInstance.get('/admin/statistics')
    return statisticsResponseSchema.parse(response.data)
  }
}
