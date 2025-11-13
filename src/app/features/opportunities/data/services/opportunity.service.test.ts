// ABOUTME: Unit tests for opportunity service with mocked axios
// ABOUTME: Tests API communication and response validation with Zod schemas

import { describe, it, expect, vi, beforeEach } from 'vitest'
import axios from 'axios'
import { opportunityService } from './opportunity.service'

// Mock axios
vi.mock('axios')
const mockedAxios = vi.mocked(axios)

describe('Opportunity Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getOpportunities', () => {
    it('should call GET /api/opportunities without filters', async () => {
      const mockResponse = {
        data: {
          opportunities: [
            {
              id: '550e8400-e29b-41d4-a716-446655440000',
              title: 'Full Stack Developer',
              description: 'We are looking for a full stack developer',
              type: 'empleo',
              status: 'abierta',
              skills_required: ['JavaScript', 'React'],
              created_by: '550e8400-e29b-41d4-a716-446655440001',
              location: 'Madrid',
              remote: true,
              duration: '6 months',
              compensation: '50k EUR',
              created_at: '2024-01-01T00:00:00Z',
              updated_at: '2024-01-01T00:00:00Z',
              creator: {
                id: '550e8400-e29b-41d4-a716-446655440001',
                name: 'John Doe',
                avatar_url: null
              }
            }
          ],
          total: 1
        }
      }

      mockedAxios.get.mockResolvedValue(mockResponse)

      const result = await opportunityService.getOpportunities()

      expect(mockedAxios.get).toHaveBeenCalledWith('http://localhost:3001/api/opportunities', {
        params: {
          type: undefined,
          status: undefined,
          skills: undefined,
          remote: undefined,
          search: undefined
        }
      })
      expect(result.opportunities).toHaveLength(1)
      expect(result.total).toBe(1)
    })

    it('should call GET /api/opportunities with filters', async () => {
      const filters = {
        type: 'proyecto' as const,
        status: 'abierta' as const,
        skills: ['JavaScript', 'React'],
        remote: true,
        search: 'developer'
      }

      const mockResponse = {
        data: {
          opportunities: [],
          total: 0
        }
      }

      mockedAxios.get.mockResolvedValue(mockResponse)

      await opportunityService.getOpportunities(filters)

      expect(mockedAxios.get).toHaveBeenCalledWith('http://localhost:3001/api/opportunities', {
        params: {
          type: 'proyecto',
          status: 'abierta',
          skills: 'JavaScript,React',
          remote: true,
          search: 'developer'
        }
      })
    })

    it('should throw error on invalid response schema', async () => {
      const invalidResponse = {
        data: {
          opportunities: [
            {
              id: 'invalid-uuid'
              // Missing required fields
            }
          ]
        }
      }

      mockedAxios.get.mockResolvedValue(invalidResponse)

      await expect(opportunityService.getOpportunities()).rejects.toThrow()
    })
  })

  describe('getOpportunity', () => {
    it('should call GET /api/opportunities/:id and return opportunity', async () => {
      const opportunityId = '550e8400-e29b-41d4-a716-446655440000'
      const mockResponse = {
        data: {
          opportunity: {
            id: opportunityId,
            title: 'Test Opportunity',
            description: 'This is a test opportunity description',
            type: 'proyecto',
            status: 'abierta',
            skills_required: ['JavaScript'],
            created_by: '550e8400-e29b-41d4-a716-446655440001',
            location: null,
            remote: false,
            duration: null,
            compensation: null,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
            creator: {
              id: '550e8400-e29b-41d4-a716-446655440001',
              name: 'Creator',
              avatar_url: null
            }
          }
        }
      }

      mockedAxios.get.mockResolvedValue(mockResponse)

      const result = await opportunityService.getOpportunity(opportunityId)

      expect(mockedAxios.get).toHaveBeenCalledWith(`http://localhost:3001/api/opportunities/${opportunityId}`)
      expect(result.opportunity.id).toBe(opportunityId)
    })

    it('should handle not found error', async () => {
      const opportunityId = '550e8400-e29b-41d4-a716-446655440000'

      mockedAxios.get.mockRejectedValue(new Error('Not found'))

      await expect(opportunityService.getOpportunity(opportunityId)).rejects.toThrow('Not found')
    })
  })

  describe('getMyOpportunities', () => {
    it('should call GET /api/opportunities/my and return user opportunities', async () => {
      const mockResponse = {
        data: {
          opportunities: [
            {
              id: '550e8400-e29b-41d4-a716-446655440000',
              title: 'My Opportunity',
              description: 'Opportunity created by me',
              type: 'proyecto',
              status: 'abierta',
              skills_required: ['TypeScript'],
              created_by: '550e8400-e29b-41d4-a716-446655440001',
              location: null,
              remote: true,
              duration: null,
              compensation: null,
              created_at: '2024-01-01T00:00:00Z',
              updated_at: '2024-01-01T00:00:00Z',
              creator: {
                id: '550e8400-e29b-41d4-a716-446655440001',
                name: 'Me',
                avatar_url: null
              }
            }
          ],
          total: 1
        }
      }

      mockedAxios.get.mockResolvedValue(mockResponse)

      const result = await opportunityService.getMyOpportunities()

      expect(mockedAxios.get).toHaveBeenCalledWith('http://localhost:3001/api/opportunities/my')
      expect(result.opportunities).toHaveLength(1)
    })
  })

  describe('createOpportunity', () => {
    it('should call POST /api/opportunities and return created opportunity', async () => {
      const createData = {
        title: 'New Opportunity',
        description: 'This is a new opportunity description',
        type: 'colaboracion' as const,
        skills_required: ['React', 'Node.js'],
        location: 'Barcelona',
        remote: true,
        duration: '3 months',
        compensation: 'Equity'
      }

      const mockResponse = {
        data: {
          opportunity: {
            id: '550e8400-e29b-41d4-a716-446655440000',
            ...createData,
            status: 'abierta',
            created_by: '550e8400-e29b-41d4-a716-446655440001',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z'
          }
        }
      }

      mockedAxios.post.mockResolvedValue(mockResponse)

      const result = await opportunityService.createOpportunity(createData)

      expect(mockedAxios.post).toHaveBeenCalledWith('http://localhost:3001/api/opportunities', createData)
      expect(result.opportunity.title).toBe(createData.title)
      expect(result.opportunity.type).toBe(createData.type)
    })

    it('should handle validation errors', async () => {
      const createData = {
        title: 'New Opportunity',
        description: 'Description',
        type: 'proyecto' as const,
        skills_required: ['JavaScript']
      }

      mockedAxios.post.mockRejectedValue(new Error('Validation failed'))

      await expect(opportunityService.createOpportunity(createData)).rejects.toThrow('Validation failed')
    })
  })

  describe('updateOpportunity', () => {
    it('should call PUT /api/opportunities/:id and return updated opportunity', async () => {
      const opportunityId = '550e8400-e29b-41d4-a716-446655440000'
      const updateData = {
        title: 'Updated Title',
        status: 'en_progreso' as const
      }

      const mockResponse = {
        data: {
          opportunity: {
            id: opportunityId,
            title: updateData.title,
            description: 'Original description',
            type: 'proyecto',
            status: updateData.status,
            skills_required: ['JavaScript'],
            created_by: '550e8400-e29b-41d4-a716-446655440001',
            location: null,
            remote: false,
            duration: null,
            compensation: null,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-02T00:00:00Z'
          }
        }
      }

      mockedAxios.put.mockResolvedValue(mockResponse)

      const result = await opportunityService.updateOpportunity(opportunityId, updateData)

      expect(mockedAxios.put).toHaveBeenCalledWith(
        `http://localhost:3001/api/opportunities/${opportunityId}`,
        updateData
      )
      expect(result.opportunity.title).toBe(updateData.title)
      expect(result.opportunity.status).toBe(updateData.status)
    })

    it('should handle unauthorized update', async () => {
      const opportunityId = '550e8400-e29b-41d4-a716-446655440000'
      const updateData = { title: 'Updated' }

      mockedAxios.put.mockRejectedValue(new Error('Unauthorized'))

      await expect(opportunityService.updateOpportunity(opportunityId, updateData)).rejects.toThrow('Unauthorized')
    })
  })

  describe('deleteOpportunity', () => {
    it('should call DELETE /api/opportunities/:id', async () => {
      const opportunityId = '550e8400-e29b-41d4-a716-446655440000'

      mockedAxios.delete.mockResolvedValue({})

      await opportunityService.deleteOpportunity(opportunityId)

      expect(mockedAxios.delete).toHaveBeenCalledWith(`http://localhost:3001/api/opportunities/${opportunityId}`)
    })

    it('should handle deletion errors', async () => {
      const opportunityId = '550e8400-e29b-41d4-a716-446655440000'

      mockedAxios.delete.mockRejectedValue(new Error('Not found'))

      await expect(opportunityService.deleteOpportunity(opportunityId)).rejects.toThrow('Not found')
    })
  })

  describe('getOpportunitiesByCity', () => {
    it('should call GET /api/opportunities with city_id filter', async () => {
      const cityId = 1
      const mockResponse = {
        data: {
          opportunities: [
            {
              id: '550e8400-e29b-41d4-a716-446655440000',
              title: 'Opportunity in Madrid',
              description: 'Description of opportunity in Madrid',
              type: 'proyecto',
              status: 'abierta',
              skills_required: ['JavaScript'],
              created_by: '550e8400-e29b-41d4-a716-446655440001',
              city_id: 1,
              location: null,
              remote: false,
              duration: null,
              compensation: null,
              created_at: '2024-01-01T00:00:00Z',
              updated_at: '2024-01-01T00:00:00Z',
              creator: {
                id: '550e8400-e29b-41d4-a716-446655440001',
                name: 'John Doe',
                avatar_url: null
              }
            }
          ],
          total: 1
        }
      }

      mockedAxios.get.mockResolvedValue(mockResponse)

      const result = await opportunityService.getOpportunitiesByCity(cityId)

      expect(mockedAxios.get).toHaveBeenCalledWith('http://localhost:3001/api/opportunities', {
        params: {
          city_id: 1,
          type: undefined,
          status: undefined,
          skills: undefined,
          remote: undefined,
          search: undefined,
          limit: undefined
        }
      })
      expect(result.opportunities).toHaveLength(1)
      expect(result.total).toBe(1)
    })

    it('should call GET /api/opportunities with city_id and additional filters', async () => {
      const cityId = 1
      const filters = {
        type: 'proyecto' as const,
        status: 'abierta' as const,
        skills: ['JavaScript', 'React'],
        remote: true,
        search: 'developer'
      }

      const mockResponse = {
        data: {
          opportunities: [],
          total: 0
        }
      }

      mockedAxios.get.mockResolvedValue(mockResponse)

      await opportunityService.getOpportunitiesByCity(cityId, filters)

      expect(mockedAxios.get).toHaveBeenCalledWith('http://localhost:3001/api/opportunities', {
        params: {
          city_id: 1,
          type: 'proyecto',
          status: 'abierta',
          skills: 'JavaScript,React',
          remote: true,
          search: 'developer',
          limit: undefined
        }
      })
    })

    it('should return validated opportunities for city', async () => {
      const cityId = 2
      const mockResponse = {
        data: {
          opportunities: [
            {
              id: '550e8400-e29b-41d4-a716-446655440000',
              title: 'Barcelona Opportunity',
              description: 'Description here',
              type: 'empleo',
              status: 'abierta',
              skills_required: ['Python'],
              created_by: '550e8400-e29b-41d4-a716-446655440001',
              city_id: 2,
              location: null,
              remote: false,
              duration: null,
              compensation: null,
              created_at: '2024-01-01T00:00:00Z',
              updated_at: '2024-01-01T00:00:00Z',
              creator: {
                id: '550e8400-e29b-41d4-a716-446655440001',
                name: 'Jane Doe',
                avatar_url: null
              }
            },
            {
              id: '660e8400-e29b-41d4-a716-446655440000',
              title: 'Another Barcelona Opportunity',
              description: 'Another description',
              type: 'colaboracion',
              status: 'abierta',
              skills_required: ['TypeScript'],
              created_by: '550e8400-e29b-41d4-a716-446655440001',
              city_id: 2,
              location: null,
              remote: true,
              duration: null,
              compensation: null,
              created_at: '2024-01-02T00:00:00Z',
              updated_at: '2024-01-02T00:00:00Z',
              creator: {
                id: '550e8400-e29b-41d4-a716-446655440001',
                name: 'Jane Doe',
                avatar_url: null
              }
            }
          ],
          total: 2
        }
      }

      mockedAxios.get.mockResolvedValue(mockResponse)

      const result = await opportunityService.getOpportunitiesByCity(cityId)

      expect(result.opportunities).toHaveLength(2)
      expect(result.total).toBe(2)
    })

    it('should handle empty opportunities for city', async () => {
      const cityId = 3
      const mockResponse = {
        data: {
          opportunities: [],
          total: 0
        }
      }

      mockedAxios.get.mockResolvedValue(mockResponse)

      const result = await opportunityService.getOpportunitiesByCity(cityId)

      expect(result.opportunities).toHaveLength(0)
      expect(result.total).toBe(0)
    })

    it('should handle API errors', async () => {
      const cityId = 1

      mockedAxios.get.mockRejectedValue(new Error('City not found'))

      await expect(opportunityService.getOpportunitiesByCity(cityId)).rejects.toThrow('City not found')
    })
  })
})
