// ABOUTME: Network service for managing user connections with Axios and Zod validation
// ABOUTME: Handles connection requests, acceptances, rejections, and mutual connections

import axiosInstance from '@/lib/axios'
import axios from 'axios'
import {
  type RequestConnection,
  type UpdateConnectionStatus,
  type GetConnectionsRequest,
  type GetConnectionsResponse,
  type GetNetworkStatsResponse,
  type RequestConnectionResponse,
  type UpdateConnectionResponse,
  type GetMutualConnectionsResponse,
  getConnectionsResponseSchema,
  getNetworkStatsResponseSchema,
  requestConnectionResponseSchema,
  updateConnectionResponseSchema,
  getMutualConnectionsResponseSchema
} from '../schemas/network.schema'

const API_BASE_URL = ''

export const networkService = {
  /**
   * Get all connections for current user (optionally filtered by status)
   */
  async getConnections(params?: GetConnectionsRequest): Promise<GetConnectionsResponse> {
    const response = await axiosInstance.get(`${API_BASE_URL}/connections`, {
      params: {
        status: params?.status
      }
    })
    return getConnectionsResponseSchema.parse(response.data)
  },

  /**
   * Get network statistics for current user
   */
  async getNetworkStats(): Promise<GetNetworkStatsResponse> {
    const response = await axiosInstance.get(`${API_BASE_URL}/connections/stats`)
    return getNetworkStatsResponseSchema.parse(response.data)
  },

  /**
   * Send a connection request to another user
   */
  async requestConnection(data: RequestConnection): Promise<RequestConnectionResponse> {
    const response = await axiosInstance.post(`${API_BASE_URL}/connections`, data)
    return requestConnectionResponseSchema.parse(response.data)
  },

  /**
   * Accept or reject a connection request
   */
  async updateConnectionStatus(data: UpdateConnectionStatus): Promise<UpdateConnectionResponse> {
    const response = await axiosInstance.put(
      `${API_BASE_URL}/connections/${data.connection_id}`,
      { status: data.status }
    )
    return updateConnectionResponseSchema.parse(response.data)
  },

  /**
   * Delete a connection
   */
  async deleteConnection(connectionId: string): Promise<void> {
    await axiosInstance.delete(`${API_BASE_URL}/connections/${connectionId}`)
  },

  /**
   * Get mutual connections between current user and another user
   */
  async getMutualConnections(userId: string): Promise<GetMutualConnectionsResponse> {
    const response = await axiosInstance.get(`${API_BASE_URL}/connections/mutual/${userId}`)
    return getMutualConnectionsResponseSchema.parse(response.data)
  },

  /**
   * Check if current user has a connection with another user
   */
  async getConnectionStatus(userId: string): Promise<{ status: string | null }> {
    try {
      const response = await axiosInstance.get(`${API_BASE_URL}/connections/status/${userId}`)
      return response.data
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return { status: null }
      }
      throw error
    }
  }
}
