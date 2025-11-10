// ABOUTME: Project service for managing projects with Axios and Zod validation
// ABOUTME: Handles CRUD operations and filtering for projects

import { axiosInstance } from '@/lib/axios'
import {
  type CreateProjectRequest,
  type UpdateProjectRequest,
  type FilterProjectsRequest,
  type GetProjectResponse,
  type GetProjectsResponse,
  type CreateProjectResponse,
  type UpdateProjectResponse,
  getProjectResponseSchema,
  getProjectsResponseSchema,
  createProjectResponseSchema,
  updateProjectResponseSchema
} from '../schemas/project.schema'

export const projectService = {
  /**
   * Get all projects with optional filters
   */
  async getProjects(filters?: FilterProjectsRequest): Promise<GetProjectsResponse> {
    const response = await axiosInstance.get('/projects', {
      params: {
        type: filters?.type,
        status: filters?.status,
        skills: filters?.skills?.join(','),
        featured: filters?.featured,
        search: filters?.search
      }
    })
    return getProjectsResponseSchema.parse(response.data)
  },

  /**
   * Get a single project by ID
   */
  async getProject(id: string): Promise<GetProjectResponse> {
    const response = await axiosInstance.get(`/projects/${id}`)
    return getProjectResponseSchema.parse(response.data)
  },

  /**
   * Get projects created by current user
   */
  async getMyProjects(): Promise<GetProjectsResponse> {
    const response = await axiosInstance.get('/projects/my')
    return getProjectsResponseSchema.parse(response.data)
  },

  /**
   * Create a new project
   */
  async createProject(data: CreateProjectRequest): Promise<CreateProjectResponse> {
    const response = await axiosInstance.post('/projects', data)
    return createProjectResponseSchema.parse(response.data)
  },

  /**
   * Update an existing project
   */
  async updateProject(id: string, data: UpdateProjectRequest): Promise<UpdateProjectResponse> {
    const response = await axiosInstance.put(`/projects/${id}`, data)
    return updateProjectResponseSchema.parse(response.data)
  },

  /**
   * Delete a project
   */
  async deleteProject(id: string): Promise<void> {
    await axiosInstance.delete(`/projects/${id}`)
  },

  /**
   * Enroll in a project
   */
  async enrollInProject(programId: string): Promise<any> {
    const response = await axiosInstance.post(`/projects/${programId}/enroll`)
    return response.data
  },

  /**
   * Get user's project enrollments with project details
   */
  async getMyEnrollments(): Promise<any> {
    const response = await axiosInstance.get('/projects/my/enrollments')
    return response.data
  },

  /**
   * Cancel enrollment in a project
   */
  async cancelEnrollment(enrollmentId: string): Promise<any> {
    const response = await axiosInstance.delete(`/projects/enrollments/${enrollmentId}`)
    return response.data
  }
}

