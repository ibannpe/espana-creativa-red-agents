// ABOUTME: City service for API communication with Axios and Zod validation
// ABOUTME: Handles fetching cities, CRUD operations, and checking city manager permissions

import { axiosInstance } from '@/lib/axios'
import {
  type GetCitiesResponse,
  type GetCityResponse,
  type GetIsCityManagerResponse,
  type CreateCityRequest,
  type CreateCityResponse,
  type UpdateCityRequest,
  type UpdateCityResponse,
  type DeleteCityResponse,
  getCitiesResponseSchema,
  getCityResponseSchema,
  getIsCityManagerResponseSchema,
  createCityResponseSchema,
  updateCityResponseSchema,
  deleteCityResponseSchema
} from '../schemas/city.schema'

export const cityService = {
  /**
   * Get all active cities ordered by display_order
   */
  async getCities(): Promise<GetCitiesResponse> {
    const response = await axiosInstance.get('/cities')
    return getCitiesResponseSchema.parse(response.data)
  },

  /**
   * Get a single city by slug
   */
  async getCityBySlug(slug: string): Promise<GetCityResponse> {
    const response = await axiosInstance.get(`/cities/${slug}`)
    return getCityResponseSchema.parse(response.data)
  },

  /**
   * Check if current user is a city manager and get their managed cities
   */
  async getIsCityManager(): Promise<GetIsCityManagerResponse> {
    const response = await axiosInstance.get('/cities/my-managed')
    return getIsCityManagerResponseSchema.parse(response.data)
  },

  /**
   * Check if current user can manage a specific city
   */
  async canManageCity(cityId: number): Promise<boolean> {
    const response = await axiosInstance.get(`/cities/${cityId}/can-manage`)
    return response.data.canManage
  },

  /**
   * Create a new city (admin only)
   */
  async createCity(data: CreateCityRequest): Promise<CreateCityResponse> {
    const response = await axiosInstance.post('/cities', data)
    return createCityResponseSchema.parse(response.data)
  },

  /**
   * Update an existing city (admin only)
   */
  async updateCity(cityId: number, data: UpdateCityRequest): Promise<UpdateCityResponse> {
    const response = await axiosInstance.put(`/cities/${cityId}`, data)
    return updateCityResponseSchema.parse(response.data)
  },

  /**
   * Delete a city (admin only)
   */
  async deleteCity(cityId: number): Promise<DeleteCityResponse> {
    const response = await axiosInstance.delete(`/cities/${cityId}`)
    return deleteCityResponseSchema.parse(response.data)
  }
}
