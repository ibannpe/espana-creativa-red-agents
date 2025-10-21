// ABOUTME: Profile service using Axios for API calls with Zod validation
// ABOUTME: Handles user profile operations (get, update, search, upload avatar)

import axios from 'axios'
import {
  type UpdateProfileRequest,
  type SearchUsersRequest,
  type GetProfileResponse,
  type UpdateProfileResponse,
  type SearchUsersResponse,
  type UploadAvatarResponse,
  getProfileResponseSchema,
  updateProfileResponseSchema,
  searchUsersResponseSchema,
  uploadAvatarResponseSchema
} from '../schemas/profile.schema'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export const profileService = {
  /**
   * Get user profile by ID
   */
  async getProfile(userId: string): Promise<GetProfileResponse> {
    const response = await axios.get(`${API_BASE_URL}/api/users/${userId}`)
    return getProfileResponseSchema.parse(response.data)
  },

  /**
   * Update current user profile
   */
  async updateProfile(userId: string, data: UpdateProfileRequest): Promise<UpdateProfileResponse> {
    const response = await axios.put(`${API_BASE_URL}/api/users/${userId}`, data)
    return updateProfileResponseSchema.parse(response.data)
  },

  /**
   * Search users with filters
   */
  async searchUsers(params: SearchUsersRequest): Promise<SearchUsersResponse> {
    const response = await axios.get(`${API_BASE_URL}/api/users/search`, {
      params: {
        q: params.query,
        location: params.location,
        skills: params.skills?.join(','),
        role: params.role
      }
    })
    return searchUsersResponseSchema.parse(response.data)
  },

  /**
   * Get all users (for network page)
   */
  async getAllUsers(): Promise<SearchUsersResponse> {
    const response = await axios.get(`${API_BASE_URL}/api/users`)
    return searchUsersResponseSchema.parse(response.data)
  },

  /**
   * Upload avatar image
   */
  async uploadAvatar(userId: string, file: File): Promise<UploadAvatarResponse> {
    const formData = new FormData()
    formData.append('avatar', file)

    const response = await axios.post(
      `${API_BASE_URL}/api/users/${userId}/avatar`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    )

    return uploadAvatarResponseSchema.parse(response.data)
  }
}
