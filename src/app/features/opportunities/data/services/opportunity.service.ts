// ABOUTME: Opportunity service for managing opportunities with Axios and Zod validation
// ABOUTME: Handles CRUD operations and filtering for opportunities

import axios from 'axios'
import {
  type CreateOpportunityRequest,
  type UpdateOpportunityRequest,
  type FilterOpportunitiesRequest,
  type GetOpportunityResponse,
  type GetOpportunitiesResponse,
  type CreateOpportunityResponse,
  type UpdateOpportunityResponse,
  getOpportunityResponseSchema,
  getOpportunitiesResponseSchema,
  createOpportunityResponseSchema,
  updateOpportunityResponseSchema
} from '../schemas/opportunity.schema'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export const opportunityService = {
  /**
   * Get all opportunities with optional filters
   */
  async getOpportunities(filters?: FilterOpportunitiesRequest): Promise<GetOpportunitiesResponse> {
    const response = await axios.get(`${API_BASE_URL}/api/opportunities`, {
      params: {
        type: filters?.type,
        status: filters?.status,
        skills: filters?.skills?.join(','),
        remote: filters?.remote,
        search: filters?.search
      }
    })
    return getOpportunitiesResponseSchema.parse(response.data)
  },

  /**
   * Get a single opportunity by ID
   */
  async getOpportunity(id: string): Promise<GetOpportunityResponse> {
    const response = await axios.get(`${API_BASE_URL}/api/opportunities/${id}`)
    return getOpportunityResponseSchema.parse(response.data)
  },

  /**
   * Get opportunities created by current user
   */
  async getMyOpportunities(): Promise<GetOpportunitiesResponse> {
    const response = await axios.get(`${API_BASE_URL}/api/opportunities/my`)
    return getOpportunitiesResponseSchema.parse(response.data)
  },

  /**
   * Create a new opportunity
   */
  async createOpportunity(data: CreateOpportunityRequest): Promise<CreateOpportunityResponse> {
    const response = await axios.post(`${API_BASE_URL}/api/opportunities`, data)
    return createOpportunityResponseSchema.parse(response.data)
  },

  /**
   * Update an existing opportunity
   */
  async updateOpportunity(id: string, data: UpdateOpportunityRequest): Promise<UpdateOpportunityResponse> {
    const response = await axios.put(`${API_BASE_URL}/api/opportunities/${id}`, data)
    return updateOpportunityResponseSchema.parse(response.data)
  },

  /**
   * Delete an opportunity
   */
  async deleteOpportunity(id: string): Promise<void> {
    await axios.delete(`${API_BASE_URL}/api/opportunities/${id}`)
  }
}
