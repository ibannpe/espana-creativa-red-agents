// ABOUTME: Unit tests for GetOpportunitiesByCityUseCase
// ABOUTME: Tests retrieval of opportunities filtered by city with error handling

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GetOpportunitiesByCityUseCase } from './GetOpportunitiesByCityUseCase'
import { OpportunityRepository, OpportunityWithCreator } from '../../ports/OpportunityRepository'
import { CityRepository } from '../../ports/CityRepository'
import { Opportunity } from '../../../domain/entities/Opportunity'
import { UserBuilder } from '../../../test/builders/UserBuilder'

describe('GetOpportunitiesByCityUseCase', () => {
  let useCase: GetOpportunitiesByCityUseCase
  let mockOpportunityRepository: OpportunityRepository
  let mockCityRepository: CityRepository

  beforeEach(() => {
    mockOpportunityRepository = {
      findById: vi.fn(),
      findByCity: vi.fn(),
      findAll: vi.fn(),
      save: vi.fn(),
      update: vi.fn(),
      delete: vi.fn()
    } as unknown as OpportunityRepository

    mockCityRepository = {
      findById: vi.fn(),
      findBySlug: vi.fn(),
      findAll: vi.fn(),
      findAllWithOpportunityCount: vi.fn(),
      save: vi.fn(),
      update: vi.fn(),
      exists: vi.fn()
    } as unknown as CityRepository

    useCase = new GetOpportunitiesByCityUseCase(mockOpportunityRepository, mockCityRepository)
  })

  const createTestOpportunity = (id: string, cityId: number): Opportunity => {
    return Opportunity.create({
      id,
      title: 'Test Opportunity',
      description: 'This is a test opportunity description with enough characters.',
      type: 'proyecto',
      status: 'abierta',
      skillsRequired: ['JavaScript', 'React'],
      location: 'Madrid',
      remote: true,
      duration: '3 meses',
      compensation: '30k EUR',
      cityId,
      createdBy: 'user-123',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01')
    })
  }

  describe('execute - successful retrieval', () => {
    it('should return opportunities for valid city', async () => {
      const creator = new UserBuilder().build()
      const opp1 = createTestOpportunity('opp-1', 1)
      const opp2 = createTestOpportunity('opp-2', 1)

      const mockOpportunities: OpportunityWithCreator[] = [
        { opportunity: opp1, creator },
        { opportunity: opp2, creator }
      ]

      vi.mocked(mockCityRepository.exists).mockResolvedValue(true)
      vi.mocked(mockOpportunityRepository.findByCity).mockResolvedValue(mockOpportunities)

      const result = await useCase.execute({ cityId: 1 })

      expect(mockCityRepository.exists).toHaveBeenCalledWith(1)
      expect(mockOpportunityRepository.findByCity).toHaveBeenCalledWith(1, undefined)
      expect(result.error).toBeNull()
      expect(result.opportunities).toHaveLength(2)
      expect(result.opportunities[0].opportunity.id).toBe('opp-1')
      expect(result.opportunities[1].opportunity.id).toBe('opp-2')
    })

    it('should return empty array when city has no opportunities', async () => {
      vi.mocked(mockCityRepository.exists).mockResolvedValue(true)
      vi.mocked(mockOpportunityRepository.findByCity).mockResolvedValue([])

      const result = await useCase.execute({ cityId: 1 })

      expect(result.error).toBeNull()
      expect(result.opportunities).toEqual([])
    })

    it('should pass filters to repository', async () => {
      vi.mocked(mockCityRepository.exists).mockResolvedValue(true)
      vi.mocked(mockOpportunityRepository.findByCity).mockResolvedValue([])

      const filters = {
        type: 'empleo' as const,
        status: 'abierta' as const,
        skills: ['JavaScript']
      }

      await useCase.execute({
        cityId: 1,
        filters
      })

      expect(mockOpportunityRepository.findByCity).toHaveBeenCalledWith(1, filters)
    })

    it('should work with different city IDs', async () => {
      const creator = new UserBuilder().build()
      const opp = createTestOpportunity('opp-1', 5)

      vi.mocked(mockCityRepository.exists).mockResolvedValue(true)
      vi.mocked(mockOpportunityRepository.findByCity).mockResolvedValue([
        { opportunity: opp, creator }
      ])

      const result = await useCase.execute({ cityId: 5 })

      expect(mockCityRepository.exists).toHaveBeenCalledWith(5)
      expect(result.error).toBeNull()
      expect(result.opportunities[0].opportunity.cityId).toBe(5)
    })
  })

  describe('execute - city validation errors', () => {
    it('should return error when city does not exist', async () => {
      vi.mocked(mockCityRepository.exists).mockResolvedValue(false)

      const result = await useCase.execute({ cityId: 999 })

      expect(result.error).toBe('City not found')
      expect(result.opportunities).toEqual([])
      expect(mockOpportunityRepository.findByCity).not.toHaveBeenCalled()
    })

    it('should check city existence before querying opportunities', async () => {
      vi.mocked(mockCityRepository.exists).mockResolvedValue(false)

      await useCase.execute({ cityId: 1 })

      expect(mockCityRepository.exists).toHaveBeenCalledWith(1)
      expect(mockOpportunityRepository.findByCity).not.toHaveBeenCalled()
    })
  })

  describe('execute - with filters', () => {
    it('should filter by opportunity type', async () => {
      vi.mocked(mockCityRepository.exists).mockResolvedValue(true)
      vi.mocked(mockOpportunityRepository.findByCity).mockResolvedValue([])

      await useCase.execute({
        cityId: 1,
        filters: { type: 'empleo' }
      })

      expect(mockOpportunityRepository.findByCity).toHaveBeenCalledWith(
        1,
        { type: 'empleo' }
      )
    })

    it('should filter by opportunity status', async () => {
      vi.mocked(mockCityRepository.exists).mockResolvedValue(true)
      vi.mocked(mockOpportunityRepository.findByCity).mockResolvedValue([])

      await useCase.execute({
        cityId: 1,
        filters: { status: 'cerrada' }
      })

      expect(mockOpportunityRepository.findByCity).toHaveBeenCalledWith(
        1,
        { status: 'cerrada' }
      )
    })

    it('should filter by skills', async () => {
      vi.mocked(mockCityRepository.exists).mockResolvedValue(true)
      vi.mocked(mockOpportunityRepository.findByCity).mockResolvedValue([])

      await useCase.execute({
        cityId: 1,
        filters: { skills: ['TypeScript', 'React'] }
      })

      expect(mockOpportunityRepository.findByCity).toHaveBeenCalledWith(
        1,
        { skills: ['TypeScript', 'React'] }
      )
    })

    it('should filter by remote status', async () => {
      vi.mocked(mockCityRepository.exists).mockResolvedValue(true)
      vi.mocked(mockOpportunityRepository.findByCity).mockResolvedValue([])

      await useCase.execute({
        cityId: 1,
        filters: { remote: true }
      })

      expect(mockOpportunityRepository.findByCity).toHaveBeenCalledWith(
        1,
        { remote: true }
      )
    })

    it('should apply multiple filters simultaneously', async () => {
      vi.mocked(mockCityRepository.exists).mockResolvedValue(true)
      vi.mocked(mockOpportunityRepository.findByCity).mockResolvedValue([])

      const filters = {
        type: 'proyecto' as const,
        status: 'abierta' as const,
        remote: true,
        skills: ['JavaScript']
      }

      await useCase.execute({
        cityId: 1,
        filters
      })

      expect(mockOpportunityRepository.findByCity).toHaveBeenCalledWith(1, filters)
    })

    it('should work without filters', async () => {
      vi.mocked(mockCityRepository.exists).mockResolvedValue(true)
      vi.mocked(mockOpportunityRepository.findByCity).mockResolvedValue([])

      await useCase.execute({ cityId: 1 })

      expect(mockOpportunityRepository.findByCity).toHaveBeenCalledWith(1, undefined)
    })
  })

  describe('execute - opportunity with creator', () => {
    it('should include creator information for each opportunity', async () => {
      const creator1 = new UserBuilder().withName('Creator 1').build()
      const creator2 = new UserBuilder().withName('Creator 2').build()

      const opp1 = createTestOpportunity('opp-1', 1)
      const opp2 = createTestOpportunity('opp-2', 1)

      vi.mocked(mockCityRepository.exists).mockResolvedValue(true)
      vi.mocked(mockOpportunityRepository.findByCity).mockResolvedValue([
        { opportunity: opp1, creator: creator1 },
        { opportunity: opp2, creator: creator2 }
      ])

      const result = await useCase.execute({ cityId: 1 })

      expect(result.opportunities[0].creator.getName()).toBe('Creator 1')
      expect(result.opportunities[1].creator.getName()).toBe('Creator 2')
    })

    it('should preserve creator-opportunity association', async () => {
      const creatorId = '550e8400-e29b-41d4-a716-446655440000'
      const creator = new UserBuilder().withId(creatorId).build()
      const opp = createTestOpportunity('opp-1', 1)

      vi.mocked(mockCityRepository.exists).mockResolvedValue(true)
      vi.mocked(mockOpportunityRepository.findByCity).mockResolvedValue([
        { opportunity: opp, creator }
      ])

      const result = await useCase.execute({ cityId: 1 })

      expect(result.opportunities[0].creator.getId().getValue()).toBe(creatorId)
    })
  })

  describe('execute - edge cases', () => {
    it('should handle large number of opportunities', async () => {
      const creator = new UserBuilder().build()
      const opportunities: OpportunityWithCreator[] = Array.from({ length: 100 }, (_, i) => ({
        opportunity: createTestOpportunity(`opp-${i}`, 1),
        creator
      }))

      vi.mocked(mockCityRepository.exists).mockResolvedValue(true)
      vi.mocked(mockOpportunityRepository.findByCity).mockResolvedValue(opportunities)

      const result = await useCase.execute({ cityId: 1 })

      expect(result.opportunities).toHaveLength(100)
    })

    it('should handle cityId of 1', async () => {
      vi.mocked(mockCityRepository.exists).mockResolvedValue(true)
      vi.mocked(mockOpportunityRepository.findByCity).mockResolvedValue([])

      const result = await useCase.execute({ cityId: 1 })

      expect(mockCityRepository.exists).toHaveBeenCalledWith(1)
      expect(result.error).toBeNull()
    })

    it('should handle large cityId values', async () => {
      vi.mocked(mockCityRepository.exists).mockResolvedValue(true)
      vi.mocked(mockOpportunityRepository.findByCity).mockResolvedValue([])

      const result = await useCase.execute({ cityId: 999999 })

      expect(mockCityRepository.exists).toHaveBeenCalledWith(999999)
      expect(result.error).toBeNull()
    })

    it('should return error for non-existent city even with filters', async () => {
      vi.mocked(mockCityRepository.exists).mockResolvedValue(false)

      const result = await useCase.execute({
        cityId: 999,
        filters: { type: 'empleo' }
      })

      expect(result.error).toBe('City not found')
      expect(result.opportunities).toEqual([])
    })
  })

  describe('execute - different opportunity types', () => {
    it('should handle proyecto type opportunities', async () => {
      const creator = new UserBuilder().build()
      const opp = Opportunity.create({
        id: 'opp-1',
        title: 'Proyecto de Investigación',
        description: 'Proyecto de investigación sobre inteligencia artificial y aprendizaje.',
        type: 'proyecto',
        status: 'abierta',
        skillsRequired: ['Python', 'ML'],
        cityId: 1,
        createdBy: 'user-123',
        createdAt: new Date(),
        updatedAt: new Date(),
        remote: true
      })

      vi.mocked(mockCityRepository.exists).mockResolvedValue(true)
      vi.mocked(mockOpportunityRepository.findByCity).mockResolvedValue([
        { opportunity: opp, creator }
      ])

      const result = await useCase.execute({ cityId: 1 })

      expect(result.opportunities[0].opportunity.type).toBe('proyecto')
    })

    it('should handle mentoria type opportunities', async () => {
      const creator = new UserBuilder().build()
      const opp = Opportunity.create({
        id: 'opp-1',
        title: 'Mentoría en Startups',
        description: 'Mentoría para emprendedores que están iniciando sus startups tecnológicas.',
        type: 'mentoria',
        status: 'abierta',
        skillsRequired: ['Emprendimiento'],
        cityId: 1,
        createdBy: 'user-123',
        createdAt: new Date(),
        updatedAt: new Date(),
        remote: false
      })

      vi.mocked(mockCityRepository.exists).mockResolvedValue(true)
      vi.mocked(mockOpportunityRepository.findByCity).mockResolvedValue([
        { opportunity: opp, creator }
      ])

      const result = await useCase.execute({ cityId: 1 })

      expect(result.opportunities[0].opportunity.type).toBe('mentoria')
    })
  })
})
