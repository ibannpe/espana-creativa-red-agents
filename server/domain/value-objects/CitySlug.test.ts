// ABOUTME: Unit tests for CitySlug value object
// ABOUTME: Tests slug validation, creation, normalization, and edge cases

import { describe, it, expect } from 'vitest'
import { CitySlug } from './CitySlug'

describe('CitySlug Value Object', () => {
  describe('create', () => {
    it('should create CitySlug with valid lowercase slug', () => {
      const slug = CitySlug.create('madrid')

      expect(slug).not.toBeNull()
      expect(slug?.getValue()).toBe('madrid')
    })

    it('should normalize uppercase to lowercase', () => {
      const slug = CitySlug.create('BARCELONA')

      expect(slug).not.toBeNull()
      expect(slug?.getValue()).toBe('barcelona')
    })

    it('should normalize mixed case to lowercase', () => {
      const slug = CitySlug.create('Valencia')

      expect(slug).not.toBeNull()
      expect(slug?.getValue()).toBe('valencia')
    })

    it('should return null for slug with surrounding whitespace', () => {
      // Validation happens before trim, so whitespace around slug makes it invalid
      const slug = CitySlug.create('  sevilla  ')

      expect(slug).toBeNull()
    })

    it('should accept slugs with hyphens', () => {
      const validSlugs = [
        'santa-cruz',
        'las-palmas',
        'palma-de-mallorca',
        'san-sebastian',
        'a-coruna'
      ]

      validSlugs.forEach(slug => {
        const result = CitySlug.create(slug)
        expect(result).not.toBeNull()
        expect(result?.getValue()).toBe(slug)
      })
    })

    it('should accept slugs with numbers', () => {
      const validSlugs = [
        'ciudad2030',
        'barcelona22',
        'test123'
      ]

      validSlugs.forEach(slug => {
        const result = CitySlug.create(slug)
        expect(result).not.toBeNull()
      })
    })

    it('should return null for slugs with spaces', () => {
      const invalidSlugs = [
        'santa cruz',
        'las palmas',
        'san sebastian'
      ]

      invalidSlugs.forEach(invalid => {
        expect(CitySlug.create(invalid)).toBeNull()
      })
    })

    it('should return null for slugs with accents', () => {
      const invalidSlugs = [
        'málaga',
        'córdoba',
        'cádiz',
        'león',
        'castellón'
      ]

      invalidSlugs.forEach(invalid => {
        expect(CitySlug.create(invalid)).toBeNull()
      })
    })

    it('should return null for slugs with special characters', () => {
      const invalidSlugs = [
        'madrid!',
        'barcelona@',
        'valencia#',
        'sevilla$',
        'bilbao%',
        'test_slug',
        'test.slug',
        'test/slug'
      ]

      invalidSlugs.forEach(invalid => {
        expect(CitySlug.create(invalid)).toBeNull()
      })
    })

    it('should return null for slugs starting with hyphen', () => {
      expect(CitySlug.create('-madrid')).toBeNull()
      expect(CitySlug.create('-test')).toBeNull()
    })

    it('should return null for slugs ending with hyphen', () => {
      expect(CitySlug.create('madrid-')).toBeNull()
      expect(CitySlug.create('test-')).toBeNull()
    })

    it('should return null for single character slug', () => {
      expect(CitySlug.create('a')).toBeNull()
      expect(CitySlug.create('m')).toBeNull()
    })

    it('should accept 2 character minimum slug', () => {
      const slug = CitySlug.create('ab')

      expect(slug).not.toBeNull()
      expect(slug?.getValue()).toBe('ab')
    })

    it('should return null for empty string', () => {
      expect(CitySlug.create('')).toBeNull()
    })

    it('should return null for whitespace-only string', () => {
      expect(CitySlug.create('   ')).toBeNull()
    })

    it('should accept slug at maximum length (100 chars)', () => {
      const longSlug = 'a' + 'b'.repeat(98) + 'c' // 100 characters
      const slug = CitySlug.create(longSlug)

      expect(slug).not.toBeNull()
      expect(slug?.getValue().length).toBe(100)
    })

    it('should return null for slug exceeding maximum length', () => {
      const tooLongSlug = 'a'.repeat(101)
      expect(CitySlug.create(tooLongSlug)).toBeNull()
    })

    it('should accept consecutive hyphens', () => {
      const slug = CitySlug.create('test--slug')

      expect(slug).not.toBeNull()
      expect(slug?.getValue()).toBe('test--slug')
    })
  })

  describe('equals', () => {
    it('should return true for equal slugs', () => {
      const slug1 = CitySlug.create('madrid')!
      const slug2 = CitySlug.create('madrid')!

      expect(slug1.equals(slug2)).toBe(true)
    })

    it('should return true for slugs with different casing', () => {
      const slug1 = CitySlug.create('madrid')!
      const slug2 = CitySlug.create('MADRID')!

      expect(slug1.equals(slug2)).toBe(true)
    })

    it('should return false for different slugs', () => {
      const slug1 = CitySlug.create('madrid')!
      const slug2 = CitySlug.create('barcelona')!

      expect(slug1.equals(slug2)).toBe(false)
    })
  })

  describe('toString', () => {
    it('should return slug as string', () => {
      const slug = CitySlug.create('madrid')!

      expect(slug.toString()).toBe('madrid')
    })

    it('should return normalized slug', () => {
      const slug = CitySlug.create('BARCELONA')!

      expect(slug.toString()).toBe('barcelona')
    })
  })

  describe('getValue', () => {
    it('should return the normalized slug value', () => {
      const slug = CitySlug.create('VALENCIA')!

      expect(slug.getValue()).toBe('valencia')
    })
  })
})
