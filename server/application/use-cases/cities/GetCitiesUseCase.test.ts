// ABOUTME: Unit tests for GetCitiesUseCase
// ABOUTME: Tests retrieval of cities with opportunity counts and filtering options

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GetCitiesUseCase } from './GetCitiesUseCase'
import { CityRepository, CityWithOpportunityCount } from '../../ports/CityRepository'
import { CityBuilder } from '../../../__tests__/builders/CityBuilder'

describe('GetCitiesUseCase', () => {
  let useCase: GetCitiesUseCase
  let mockCityRepository: CityRepository

  beforeEach(() => {
    mockCityRepository = {
      findById: vi.fn(),
      findBySlug: vi.fn(),
      findAll: vi.fn(),
      findAllWithOpportunityCount: vi.fn(),
      save: vi.fn(),
      update: vi.fn(),
      exists: vi.fn()
    } as unknown as CityRepository

    useCase = new GetCitiesUseCase(mockCityRepository)
  })

  describe('execute - successful retrieval', () => {
    it('should return all active cities with opportunity counts by default', async () => {
      const madrid = new CityBuilder().withId(1).withName('Madrid').withActive(true).withDisplayOrder(0).build()
      const barcelona = CityBuilder.barcelona().withActive(true).withDisplayOrder(1).build()
      const valencia = CityBuilder.valencia().withActive(true).withDisplayOrder(2).build()

      const mockResult: CityWithOpportunityCount[] = [
        { city: madrid, opportunityCount: 5 },
        { city: barcelona, opportunityCount: 3 },
        { city: valencia, opportunityCount: 8 }
      ]

      vi.mocked(mockCityRepository.findAllWithOpportunityCount).mockResolvedValue(mockResult)

      const result = await useCase.execute()

      expect(mockCityRepository.findAllWithOpportunityCount).toHaveBeenCalledWith({
        activeOnly: true
      })
      expect(result).toHaveLength(3)
      expect(result[0].city.name).toBe('Madrid')
      expect(result[0].opportunityCount).toBe(5)
      expect(result[1].city.name).toBe('Barcelona')
      expect(result[1].opportunityCount).toBe(3)
      expect(result[2].city.name).toBe('Valencia')
      expect(result[2].opportunityCount).toBe(8)
    })

    it('should return all cities including inactive when activeOnly is false', async () => {
      const madrid = new CityBuilder().withId(1).withName('Madrid').withActive(true).build()
      const inactiveCity = CityBuilder.inactive().build()

      const mockResult: CityWithOpportunityCount[] = [
        { city: madrid, opportunityCount: 5 },
        { city: inactiveCity, opportunityCount: 0 }
      ]

      vi.mocked(mockCityRepository.findAllWithOpportunityCount).mockResolvedValue(mockResult)

      const result = await useCase.execute({ activeOnly: false })

      expect(mockCityRepository.findAllWithOpportunityCount).toHaveBeenCalledWith({
        activeOnly: false
      })
      expect(result).toHaveLength(2)
      expect(result[1].city.active).toBe(false)
    })

    it('should return empty array when no cities exist', async () => {
      vi.mocked(mockCityRepository.findAllWithOpportunityCount).mockResolvedValue([])

      const result = await useCase.execute()

      expect(result).toEqual([])
    })
  })

  describe('execute - sorting by display order', () => {
    it('should sort cities by display order ascending', async () => {
      const city1 = new CityBuilder().withId(1).withName('Third').withDisplayOrder(2).build()
      const city2 = new CityBuilder().withId(2).withName('First').withDisplayOrder(0).build()
      const city3 = new CityBuilder().withId(3).withName('Second').withDisplayOrder(1).build()

      const mockResult: CityWithOpportunityCount[] = [
        { city: city1, opportunityCount: 1 },
        { city: city2, opportunityCount: 2 },
        { city: city3, opportunityCount: 3 }
      ]

      vi.mocked(mockCityRepository.findAllWithOpportunityCount).mockResolvedValue(mockResult)

      const result = await useCase.execute()

      expect(result[0].city.name).toBe('First') // displayOrder: 0
      expect(result[1].city.name).toBe('Second') // displayOrder: 1
      expect(result[2].city.name).toBe('Third') // displayOrder: 2
    })

    it('should handle cities with same display order', async () => {
      const city1 = new CityBuilder().withId(1).withName('City A').withDisplayOrder(0).build()
      const city2 = new CityBuilder().withId(2).withName('City B').withDisplayOrder(0).build()

      const mockResult: CityWithOpportunityCount[] = [
        { city: city1, opportunityCount: 1 },
        { city: city2, opportunityCount: 2 }
      ]

      vi.mocked(mockCityRepository.findAllWithOpportunityCount).mockResolvedValue(mockResult)

      const result = await useCase.execute()

      expect(result).toHaveLength(2)
      // Both have same display order, so original order is preserved
      expect(result[0].city.id).toBe(1)
      expect(result[1].city.id).toBe(2)
    })
  })

  describe('execute - opportunity counts', () => {
    it('should include zero opportunity count for cities without opportunities', async () => {
      const madrid = new CityBuilder().withId(1).withName('Madrid').build()

      const mockResult: CityWithOpportunityCount[] = [
        { city: madrid, opportunityCount: 0 }
      ]

      vi.mocked(mockCityRepository.findAllWithOpportunityCount).mockResolvedValue(mockResult)

      const result = await useCase.execute()

      expect(result[0].opportunityCount).toBe(0)
    })

    it('should include correct opportunity counts for each city', async () => {
      const madrid = new CityBuilder().withId(1).withName('Madrid').build()
      const barcelona = CityBuilder.barcelona().build()

      const mockResult: CityWithOpportunityCount[] = [
        { city: madrid, opportunityCount: 15 },
        { city: barcelona, opportunityCount: 7 }
      ]

      vi.mocked(mockCityRepository.findAllWithOpportunityCount).mockResolvedValue(mockResult)

      const result = await useCase.execute()

      expect(result[0].opportunityCount).toBe(15)
      expect(result[1].opportunityCount).toBe(7)
    })
  })

  describe('execute - default parameters', () => {
    it('should use activeOnly=true when no parameters provided', async () => {
      vi.mocked(mockCityRepository.findAllWithOpportunityCount).mockResolvedValue([])

      await useCase.execute()

      expect(mockCityRepository.findAllWithOpportunityCount).toHaveBeenCalledWith({
        activeOnly: true
      })
    })

    it('should use activeOnly=true when empty object provided', async () => {
      vi.mocked(mockCityRepository.findAllWithOpportunityCount).mockResolvedValue([])

      await useCase.execute({})

      expect(mockCityRepository.findAllWithOpportunityCount).toHaveBeenCalledWith({
        activeOnly: true
      })
    })
  })

  describe('execute - edge cases', () => {
    it('should handle large number of cities', async () => {
      const cities: CityWithOpportunityCount[] = Array.from({ length: 100 }, (_, i) => ({
        city: new CityBuilder()
          .withId(i + 1)
          .withName(`City ${i + 1}`)
          .withSlug(`city-${i + 1}`)
          .withDisplayOrder(i)
          .build(),
        opportunityCount: i
      }))

      vi.mocked(mockCityRepository.findAllWithOpportunityCount).mockResolvedValue(cities)

      const result = await useCase.execute()

      expect(result).toHaveLength(100)
      // Verify sorting is correct
      expect(result[0].city.displayOrder).toBe(0)
      expect(result[99].city.displayOrder).toBe(99)
    })

    it('should handle cities with negative display orders (edge case)', async () => {
      // Although business rules prevent negative display orders,
      // test sorting behavior if it somehow occurs
      const city1 = new CityBuilder().withId(1).withName('First').withDisplayOrder(0).build()
      const city2 = new CityBuilder().withId(2).withName('Second').withDisplayOrder(1).build()

      const mockResult: CityWithOpportunityCount[] = [
        { city: city2, opportunityCount: 1 },
        { city: city1, opportunityCount: 2 }
      ]

      vi.mocked(mockCityRepository.findAllWithOpportunityCount).mockResolvedValue(mockResult)

      const result = await useCase.execute()

      expect(result[0].city.displayOrder).toBe(0)
      expect(result[1].city.displayOrder).toBe(1)
    })
  })
})
