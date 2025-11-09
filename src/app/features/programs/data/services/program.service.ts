// ABOUTME: Program service for managing programs with Axios and Zod validation
// ABOUTME: Handles CRUD operations and filtering for programs

import { axiosInstance } from '@/lib/axios'
import {
  type CreateProgramRequest,
  type UpdateProgramRequest,
  type FilterProgramsRequest,
  type GetProgramResponse,
  type GetProgramsResponse,
  type CreateProgramResponse,
  type UpdateProgramResponse,
  getProgramResponseSchema,
  getProgramsResponseSchema,
  createProgramResponseSchema,
  updateProgramResponseSchema
} from '../schemas/program.schema'

export const programService = {
  /**
   * Get all programs with optional filters
   */
  async getPrograms(filters?: FilterProgramsRequest): Promise<GetProgramsResponse> {
    const response = await axiosInstance.get('/programs', {
      params: {
        type: filters?.type,
        status: filters?.status,
        skills: filters?.skills?.join(','),
        featured: filters?.featured,
        search: filters?.search
      }
    })
    return getProgramsResponseSchema.parse(response.data)
  },

  /**
   * Get a single program by ID
   */
  async getProgram(id: string): Promise<GetProgramResponse> {
    const response = await axiosInstance.get(`/programs/${id}`)
    return getProgramResponseSchema.parse(response.data)
  },

  /**
   * Get programs created by current user
   */
  async getMyPrograms(): Promise<GetProgramsResponse> {
    const response = await axiosInstance.get('/programs/my')
    return getProgramsResponseSchema.parse(response.data)
  },

  /**
   * Create a new program
   */
  async createProgram(data: CreateProgramRequest): Promise<CreateProgramResponse> {
    const response = await axiosInstance.post('/programs', data)
    return createProgramResponseSchema.parse(response.data)
  },

  /**
   * Update an existing program
   */
  async updateProgram(id: string, data: UpdateProgramRequest): Promise<UpdateProgramResponse> {
    const response = await axiosInstance.put(`/programs/${id}`, data)
    return updateProgramResponseSchema.parse(response.data)
  },

  /**
   * Delete a program
   */
  async deleteProgram(id: string): Promise<void> {
    await axiosInstance.delete(`/programs/${id}`)
  },

  /**
   * Enroll in a program
   */
  async enrollInProgram(programId: string): Promise<void> {
    await axiosInstance.post(`/programs/${programId}/enroll`)
  },

  /**
   * Get user's enrollments with program details
   */
  async getMyEnrollments(): Promise<any> {
    const response = await axiosInstance.get('/programs/my/enrollments')
    return response.data
  },

  /**
   * Cancel enrollment in a program
   */
  async cancelEnrollment(enrollmentId: string): Promise<void> {
    await axiosInstance.delete(`/programs/enrollments/${enrollmentId}`)
  }
}

