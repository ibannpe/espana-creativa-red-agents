// ABOUTME: Opportunity interest service for expressing and managing interest in opportunities
// ABOUTME: Handles API calls with Axios and Zod validation

import { axiosInstance } from '@/lib/axios'
import {
  type ExpressInterestRequest,
  type ExpressInterestResponse,
  expressInterestResponseSchema
} from '../schemas/opportunity-interest.schema'

export const opportunityInterestService = {
  /**
   * Express interest in an opportunity
   */
  async expressInterest(data: ExpressInterestRequest): Promise<ExpressInterestResponse> {
    console.log('[DEBUG] expressInterest - Sending data:', data)
    const response = await axiosInstance.post('/opportunity-interests', data)
    console.log('[DEBUG] expressInterest - Response:', response.data)
    return expressInterestResponseSchema.parse(response.data)
  }
}
