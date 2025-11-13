// ABOUTME: Unit tests for City domain entity
// ABOUTME: Tests city creation, validation, business rules, activation/deactivation, and updates

import { describe, it, expect } from 'vitest'
import { City, CityProps } from './City'
import { CitySlug } from '../value-objects/CitySlug'

describe('City Entity', () => {
  const createTestCity = (overrides: Partial<CityProps> = {}): City => {
    const defaultProps: CityProps = {
      id: 1,
      name: 'Madrid',
      slug: CitySlug.create('madrid')!,
      imageUrl: 'https://example.com/madrid.jpg',
      description: 'La capital de España',
      active: true,
      displayOrder: 0,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      ...overrides
    }
    return City.create(defaultProps)
  }

  describe('create', () => {
    it('should create a City with valid props', () => {
      const city = createTestCity()

      expect(city).toBeDefined()
      expect(city.id).toBe(1)
      expect(city.name).toBe('Madrid')
      expect(city.slug.getValue()).toBe('madrid')
      expect(city.imageUrl).toBe('https://example.com/madrid.jpg')
      expect(city.description).toBe('La capital de España')
      expect(city.active).toBe(true)
      expect(city.displayOrder).toBe(0)
    })

    it('should create a City with null description', () => {
      const city = createTestCity({ description: null })

      expect(city).toBeDefined()
      expect(city.description).toBeNull()
    })

    it('should create an inactive city', () => {
      const city = createTestCity({ active: false })

      expect(city).toBeDefined()
      expect(city.active).toBe(false)
    })

    it('should throw error for invalid ID (zero)', () => {
      expect(() => {
        createTestCity({ id: 0 })
      }).toThrow('City ID must be a positive number')
    })

    it('should throw error for invalid ID (negative)', () => {
      expect(() => {
        createTestCity({ id: -1 })
      }).toThrow('City ID must be a positive number')
    })

    it('should throw error for empty name', () => {
      expect(() => {
        createTestCity({ name: '' })
      }).toThrow('City name cannot be empty')
    })

    it('should throw error for whitespace-only name', () => {
      expect(() => {
        createTestCity({ name: '   ' })
      }).toThrow('City name cannot be empty')
    })

    it('should throw error for name too short', () => {
      expect(() => {
        createTestCity({ name: 'A' })
      }).toThrow('City name must be at least 2 characters')
    })

    it('should throw error for name too long', () => {
      expect(() => {
        createTestCity({ name: 'A'.repeat(101) })
      }).toThrow('City name cannot exceed 100 characters')
    })

    it('should throw error for empty image URL', () => {
      expect(() => {
        createTestCity({ imageUrl: '' })
      }).toThrow('City image URL cannot be empty')
    })

    it('should throw error for whitespace-only image URL', () => {
      expect(() => {
        createTestCity({ imageUrl: '   ' })
      }).toThrow('City image URL cannot be empty')
    })

    it('should throw error for invalid image URL format', () => {
      expect(() => {
        createTestCity({ imageUrl: 'not-a-url' })
      }).toThrow('City image URL must be a valid URL')
    })

    it('should throw error for description too long', () => {
      expect(() => {
        createTestCity({ description: 'A'.repeat(501) })
      }).toThrow('City description cannot exceed 500 characters')
    })

    it('should throw error for negative display order', () => {
      expect(() => {
        createTestCity({ displayOrder: -1 })
      }).toThrow('Display order cannot be negative')
    })

    it('should throw error for created date after updated date', () => {
      expect(() => {
        createTestCity({
          createdAt: new Date('2024-02-01'),
          updatedAt: new Date('2024-01-01')
        })
      }).toThrow('Created date cannot be after updated date')
    })
  })

  describe('createNew', () => {
    it('should create a new City with minimal props', () => {
      const city = City.createNew(
        1,
        'Madrid',
        'madrid',
        'https://example.com/madrid.jpg'
      )

      expect(city).toBeDefined()
      expect(city.id).toBe(1)
      expect(city.name).toBe('Madrid')
      expect(city.slug.getValue()).toBe('madrid')
      expect(city.imageUrl).toBe('https://example.com/madrid.jpg')
      expect(city.description).toBeNull()
      expect(city.active).toBe(true)
      expect(city.displayOrder).toBe(0)
    })

    it('should create a new City with optional props', () => {
      const city = City.createNew(
        2,
        'Barcelona',
        'barcelona',
        'https://example.com/barcelona.jpg',
        {
          description: 'La ciudad condal',
          active: false,
          displayOrder: 5
        }
      )

      expect(city).toBeDefined()
      expect(city.description).toBe('La ciudad condal')
      expect(city.active).toBe(false)
      expect(city.displayOrder).toBe(5)
    })

    it('should throw error for invalid slug format', () => {
      expect(() => {
        City.createNew(
          1,
          'Madrid',
          'invalid slug!',
          'https://example.com/madrid.jpg'
        )
      }).toThrow('Invalid city slug format')
    })

    it('should set createdAt and updatedAt to current time', () => {
      const before = new Date()
      const city = City.createNew(
        1,
        'Madrid',
        'madrid',
        'https://example.com/madrid.jpg'
      )
      const after = new Date()

      expect(city.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime())
      expect(city.createdAt.getTime()).toBeLessThanOrEqual(after.getTime())
      expect(city.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime())
      expect(city.updatedAt.getTime()).toBeLessThanOrEqual(after.getTime())
    })
  })

  describe('getters', () => {
    it('should return all properties correctly', () => {
      const slug = CitySlug.create('sevilla')!
      const createdAt = new Date('2024-01-01')
      const updatedAt = new Date('2024-02-01')

      const city = createTestCity({
        id: 5,
        name: 'Sevilla',
        slug,
        imageUrl: 'https://example.com/sevilla.jpg',
        description: 'Ciudad del sur',
        active: false,
        displayOrder: 10,
        createdAt,
        updatedAt
      })

      expect(city.id).toBe(5)
      expect(city.name).toBe('Sevilla')
      expect(city.slug).toBe(slug)
      expect(city.imageUrl).toBe('https://example.com/sevilla.jpg')
      expect(city.description).toBe('Ciudad del sur')
      expect(city.active).toBe(false)
      expect(city.displayOrder).toBe(10)
      expect(city.createdAt).toBe(createdAt)
      expect(city.updatedAt).toBe(updatedAt)
    })
  })

  describe('update', () => {
    it('should update city name', () => {
      const city = createTestCity({ name: 'Original' })

      city.update({ name: 'Updated' })

      expect(city.name).toBe('Updated')
    })

    it('should update city slug', () => {
      const city = createTestCity()

      city.update({ slug: 'new-slug' })

      expect(city.slug.getValue()).toBe('new-slug')
    })

    it('should update city image URL', () => {
      const city = createTestCity()

      city.update({ imageUrl: 'https://example.com/new.jpg' })

      expect(city.imageUrl).toBe('https://example.com/new.jpg')
    })

    it('should update city description', () => {
      const city = createTestCity()

      city.update({ description: 'New description' })

      expect(city.description).toBe('New description')
    })

    it('should update city active status', () => {
      const city = createTestCity({ active: true })

      city.update({ active: false })

      expect(city.active).toBe(false)
    })

    it('should update city display order', () => {
      const city = createTestCity({ displayOrder: 0 })

      city.update({ displayOrder: 10 })

      expect(city.displayOrder).toBe(10)
    })

    it('should update multiple fields at once', () => {
      const city = createTestCity()

      city.update({
        name: 'New Name',
        description: 'New Description',
        active: false,
        displayOrder: 5
      })

      expect(city.name).toBe('New Name')
      expect(city.description).toBe('New Description')
      expect(city.active).toBe(false)
      expect(city.displayOrder).toBe(5)
    })

    it('should update updatedAt timestamp', () => {
      const city = createTestCity()
      const originalUpdatedAt = city.updatedAt

      city.update({ name: 'New Name' })

      expect(city.updatedAt.getTime()).toBeGreaterThanOrEqual(originalUpdatedAt.getTime())
    })

    it('should throw error for invalid slug in update', () => {
      const city = createTestCity()

      expect(() => {
        city.update({ slug: 'invalid slug!' })
      }).toThrow('Invalid city slug format')
    })

    it('should validate after update', () => {
      const city = createTestCity()

      expect(() => {
        city.update({ name: 'A' })
      }).toThrow('City name must be at least 2 characters')
    })
  })

  describe('activate', () => {
    it('should activate an inactive city', () => {
      const city = createTestCity({ active: false })

      city.activate()

      expect(city.active).toBe(true)
    })

    it('should update updatedAt timestamp', () => {
      const city = createTestCity({ active: false })
      const originalUpdatedAt = city.updatedAt

      city.activate()

      expect(city.updatedAt.getTime()).toBeGreaterThanOrEqual(originalUpdatedAt.getTime())
    })

    it('should work on already active city', () => {
      const city = createTestCity({ active: true })

      city.activate()

      expect(city.active).toBe(true)
    })
  })

  describe('deactivate', () => {
    it('should deactivate an active city', () => {
      const city = createTestCity({ active: true })

      city.deactivate()

      expect(city.active).toBe(false)
    })

    it('should update updatedAt timestamp', () => {
      const city = createTestCity({ active: true })
      const originalUpdatedAt = city.updatedAt

      city.deactivate()

      expect(city.updatedAt.getTime()).toBeGreaterThanOrEqual(originalUpdatedAt.getTime())
    })

    it('should work on already inactive city', () => {
      const city = createTestCity({ active: false })

      city.deactivate()

      expect(city.active).toBe(false)
    })
  })

  describe('isAcceptingOpportunities', () => {
    it('should return true for active city', () => {
      const city = createTestCity({ active: true })

      expect(city.isAcceptingOpportunities()).toBe(true)
    })

    it('should return false for inactive city', () => {
      const city = createTestCity({ active: false })

      expect(city.isAcceptingOpportunities()).toBe(false)
    })
  })

  describe('toObject', () => {
    it('should convert City to plain object', () => {
      const slug = CitySlug.create('valencia')!
      const createdAt = new Date('2024-01-01')
      const updatedAt = new Date('2024-02-01')

      const city = createTestCity({
        id: 3,
        name: 'Valencia',
        slug,
        imageUrl: 'https://example.com/valencia.jpg',
        description: 'Ciudad mediterránea',
        active: true,
        displayOrder: 2,
        createdAt,
        updatedAt
      })

      const obj = city.toObject()

      expect(obj).toEqual({
        id: 3,
        name: 'Valencia',
        slug,
        imageUrl: 'https://example.com/valencia.jpg',
        description: 'Ciudad mediterránea',
        active: true,
        displayOrder: 2,
        createdAt,
        updatedAt
      })
    })

    it('should handle null description', () => {
      const city = createTestCity({ description: null })

      const obj = city.toObject()

      expect(obj.description).toBeNull()
    })
  })

  describe('business rules validation', () => {
    it('should accept minimum valid name length (2 chars)', () => {
      const city = createTestCity({ name: 'AB' })

      expect(city.name).toBe('AB')
    })

    it('should accept maximum valid name length (100 chars)', () => {
      const longName = 'A'.repeat(100)
      const city = createTestCity({ name: longName })

      expect(city.name.length).toBe(100)
    })

    it('should accept maximum valid description length (500 chars)', () => {
      const longDescription = 'A'.repeat(500)
      const city = createTestCity({ description: longDescription })

      expect(city.description?.length).toBe(500)
    })

    it('should accept valid URL formats', () => {
      const validUrls = [
        'https://example.com/image.jpg',
        'http://example.com/image.png',
        'https://cdn.example.com/path/to/image.webp',
        'https://example.com/image.jpg?param=value'
      ]

      validUrls.forEach(url => {
        const city = createTestCity({ imageUrl: url })
        expect(city.imageUrl).toBe(url)
      })
    })

    it('should accept zero as display order', () => {
      const city = createTestCity({ displayOrder: 0 })

      expect(city.displayOrder).toBe(0)
    })

    it('should accept large positive display order', () => {
      const city = createTestCity({ displayOrder: 9999 })

      expect(city.displayOrder).toBe(9999)
    })
  })
})
