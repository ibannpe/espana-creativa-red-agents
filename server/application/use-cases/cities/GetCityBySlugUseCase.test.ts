// ABOUTME: Unit tests for GetCityBySlugUseCase
// ABOUTME: Tests city retrieval by slug with validation and error handling

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GetCityBySlugUseCase } from './GetCityBySlugUseCase'
import { CityRepository } from '../../ports/CityRepository'
import { CitySlug } from '../../../domain/value-objects/CitySlug'
import { CityBuilder } from '../../../__tests__/builders/CityBuilder'

describe('GetCityBySlugUseCase', () => {
  let useCase: GetCityBySlugUseCase
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

    useCase = new GetCityBySlugUseCase(mockCityRepository)
  })

  describe('execute - successful retrieval', () => {
    it('should return active city when found by valid slug', async () => {
      const madrid = new CityBuilder()
        .withName('Madrid')
        .withSlug('madrid')
        .withActive(true)
        .build()

      const madridSlug = CitySlug.create('madrid')!

      vi.mocked(mockCityRepository.findBySlug).mockResolvedValue(madrid)

      const result = await useCase.execute({ slug: 'madrid' })

      expect(mockCityRepository.findBySlug).toHaveBeenCalledWith(madridSlug)
      expect(result.error).toBeNull()
      expect(result.city).not.toBeNull()
      expect(result.city?.name).toBe('Madrid')
      expect(result.city?.slug.getValue()).toBe('madrid')
    })

    it('should normalize slug case before searching', async () => {
      const barcelona = CityBuilder.barcelona().withActive(true).build()
      const barcelonaSlug = CitySlug.create('barcelona')!

      vi.mocked(mockCityRepository.findBySlug).mockResolvedValue(barcelona)

      const result = await useCase.execute({ slug: 'BARCELONA' })

      expect(mockCityRepository.findBySlug).toHaveBeenCalledWith(barcelonaSlug)
      expect(result.error).toBeNull()
      expect(result.city?.name).toBe('Barcelona')
    })

    it('should return error for slug with surrounding whitespace', async () => {
      // Validation happens before trim, so whitespace makes slug invalid
      const result = await useCase.execute({ slug: '  valencia  ' })

      expect(result.error).toBe('Invalid city slug format')
      expect(result.city).toBeNull()
      expect(mockCityRepository.findBySlug).not.toHaveBeenCalled()
    })
  })

  describe('execute - validation errors', () => {
    it('should return error for invalid slug format (spaces)', async () => {
      const result = await useCase.execute({ slug: 'invalid slug' })

      expect(result.error).toBe('Invalid city slug format')
      expect(result.city).toBeNull()
      expect(mockCityRepository.findBySlug).not.toHaveBeenCalled()
    })

    it('should return error for invalid slug format (special characters)', async () => {
      const result = await useCase.execute({ slug: 'madrid!' })

      expect(result.error).toBe('Invalid city slug format')
      expect(result.city).toBeNull()
      expect(mockCityRepository.findBySlug).not.toHaveBeenCalled()
    })

    it('should return error for invalid slug format (accents)', async () => {
      const result = await useCase.execute({ slug: 'málaga' })

      expect(result.error).toBe('Invalid city slug format')
      expect(result.city).toBeNull()
      expect(mockCityRepository.findBySlug).not.toHaveBeenCalled()
    })

    it('should return error for empty slug', async () => {
      const result = await useCase.execute({ slug: '' })

      expect(result.error).toBe('Invalid city slug format')
      expect(result.city).toBeNull()
      expect(mockCityRepository.findBySlug).not.toHaveBeenCalled()
    })

    it('should return error for whitespace-only slug', async () => {
      const result = await useCase.execute({ slug: '   ' })

      expect(result.error).toBe('Invalid city slug format')
      expect(result.city).toBeNull()
      expect(mockCityRepository.findBySlug).not.toHaveBeenCalled()
    })

    it('should return error for single character slug', async () => {
      const result = await useCase.execute({ slug: 'a' })

      expect(result.error).toBe('Invalid city slug format')
      expect(result.city).toBeNull()
      expect(mockCityRepository.findBySlug).not.toHaveBeenCalled()
    })

    it('should return error for slug starting with hyphen', async () => {
      const result = await useCase.execute({ slug: '-madrid' })

      expect(result.error).toBe('Invalid city slug format')
      expect(result.city).toBeNull()
      expect(mockCityRepository.findBySlug).not.toHaveBeenCalled()
    })

    it('should return error for slug ending with hyphen', async () => {
      const result = await useCase.execute({ slug: 'madrid-' })

      expect(result.error).toBe('Invalid city slug format')
      expect(result.city).toBeNull()
      expect(mockCityRepository.findBySlug).not.toHaveBeenCalled()
    })
  })

  describe('execute - not found errors', () => {
    it('should return error when city does not exist', async () => {
      vi.mocked(mockCityRepository.findBySlug).mockResolvedValue(null)

      const result = await useCase.execute({ slug: 'nonexistent' })

      expect(result.error).toBe('City not found')
      expect(result.city).toBeNull()
    })
  })

  describe('execute - inactive city errors', () => {
    it('should return error when city is inactive', async () => {
      const inactiveCity = CityBuilder.inactive().build()

      vi.mocked(mockCityRepository.findBySlug).mockResolvedValue(inactiveCity)

      const result = await useCase.execute({ slug: 'inactive-city' })

      expect(result.error).toBe('City is not currently active')
      expect(result.city).toBeNull()
    })

    it('should not return inactive city even if it exists', async () => {
      const madrid = new CityBuilder()
        .withName('Madrid')
        .withSlug('madrid')
        .withActive(false)
        .build()

      vi.mocked(mockCityRepository.findBySlug).mockResolvedValue(madrid)

      const result = await useCase.execute({ slug: 'madrid' })

      expect(result.error).toBe('City is not currently active')
      expect(result.city).toBeNull()
    })
  })

  describe('execute - slug with hyphens', () => {
    it('should handle multi-word slugs with hyphens', async () => {
      const city = new CityBuilder()
        .withName('Santa Cruz')
        .withSlug('santa-cruz')
        .withActive(true)
        .build()

      const slug = CitySlug.create('santa-cruz')!

      vi.mocked(mockCityRepository.findBySlug).mockResolvedValue(city)

      const result = await useCase.execute({ slug: 'santa-cruz' })

      expect(mockCityRepository.findBySlug).toHaveBeenCalledWith(slug)
      expect(result.error).toBeNull()
      expect(result.city?.name).toBe('Santa Cruz')
    })

    it('should handle slugs with numbers', async () => {
      const city = new CityBuilder()
        .withName('Ciudad 2030')
        .withSlug('ciudad2030')
        .withActive(true)
        .build()

      const slug = CitySlug.create('ciudad2030')!

      vi.mocked(mockCityRepository.findBySlug).mockResolvedValue(city)

      const result = await useCase.execute({ slug: 'ciudad2030' })

      expect(mockCityRepository.findBySlug).toHaveBeenCalledWith(slug)
      expect(result.error).toBeNull()
      expect(result.city?.name).toBe('Ciudad 2030')
    })
  })

  describe('execute - edge cases', () => {
    it('should handle minimum valid slug length (2 chars)', async () => {
      const city = new CityBuilder()
        .withName('AB City')
        .withSlug('ab')
        .withActive(true)
        .build()

      const slug = CitySlug.create('ab')!

      vi.mocked(mockCityRepository.findBySlug).mockResolvedValue(city)

      const result = await useCase.execute({ slug: 'ab' })

      expect(mockCityRepository.findBySlug).toHaveBeenCalledWith(slug)
      expect(result.error).toBeNull()
      expect(result.city).not.toBeNull()
    })

    it('should handle repository returning null for valid slug', async () => {
      vi.mocked(mockCityRepository.findBySlug).mockResolvedValue(null)

      const result = await useCase.execute({ slug: 'madrid' })

      expect(result.error).toBe('City not found')
      expect(result.city).toBeNull()
    })
  })
})
