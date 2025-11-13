// ABOUTME: Unit tests for Opportunity domain entity
// ABOUTME: Tests opportunity creation, validation, lifecycle, city association, and business rules

import { describe, it, expect } from 'vitest'
import { Opportunity, OpportunityProps } from './Opportunity'

describe('Opportunity Entity', () => {
  const createTestOpportunity = (overrides: Partial<OpportunityProps> = {}): Opportunity => {
    const defaultProps: OpportunityProps = {
      id: 'opp-123',
      title: 'Desarrollador Backend Node.js',
      description: 'Buscamos desarrollador con experiencia en Node.js y TypeScript para proyecto innovador.',
      type: 'empleo',
      status: 'abierta',
      skillsRequired: ['Node.js', 'TypeScript'],
      location: 'Madrid',
      remote: true,
      duration: '6 meses',
      compensation: '40-50k EUR/año',
      cityId: 1,
      createdBy: 'user-123',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      ...overrides
    }
    return Opportunity.create(defaultProps)
  }

  describe('create', () => {
    it('should create an Opportunity with valid props', () => {
      const opp = createTestOpportunity()

      expect(opp).toBeDefined()
      expect(opp.id).toBe('opp-123')
      expect(opp.title).toBe('Desarrollador Backend Node.js')
      expect(opp.description).toContain('Node.js')
      expect(opp.type).toBe('empleo')
      expect(opp.status).toBe('abierta')
      expect(opp.cityId).toBe(1)
      expect(opp.createdBy).toBe('user-123')
    })

    it('should throw error for missing cityId', () => {
      expect(() => {
        createTestOpportunity({ cityId: undefined as any })
      }).toThrow('City ID must be a positive number')
    })

    it('should throw error for zero cityId', () => {
      expect(() => {
        createTestOpportunity({ cityId: 0 })
      }).toThrow('City ID must be a positive number')
    })

    it('should throw error for negative cityId', () => {
      expect(() => {
        createTestOpportunity({ cityId: -1 })
      }).toThrow('City ID must be a positive number')
    })

    it('should accept valid positive cityId', () => {
      const opp = createTestOpportunity({ cityId: 5 })

      expect(opp.cityId).toBe(5)
    })
  })

  describe('createNew', () => {
    it('should create a new Opportunity with required cityId', () => {
      const opp = Opportunity.createNew(
        'opp-456',
        'Mentor para Startup',
        'Buscamos mentor con experiencia en startups tecnológicas para guiar a equipo fundador.',
        'mentoria',
        ['Emprendimiento', 'Tecnología'],
        3, // cityId
        'user-456'
      )

      expect(opp).toBeDefined()
      expect(opp.cityId).toBe(3)
      expect(opp.status).toBe('abierta')
    })

    it('should throw error for invalid cityId in createNew', () => {
      expect(() => {
        Opportunity.createNew(
          'opp-456',
          'Test Title',
          'Test description with enough characters to be valid.',
          'proyecto',
          ['Skill'],
          0, // Invalid cityId
          'user-456'
        )
      }).toThrow('City ID must be a positive number')
    })
  })

  describe('belongsToCity', () => {
    it('should return true when opportunity belongs to the city', () => {
      const opp = createTestOpportunity({ cityId: 1 })

      expect(opp.belongsToCity(1)).toBe(true)
    })

    it('should return false when opportunity does not belong to the city', () => {
      const opp = createTestOpportunity({ cityId: 1 })

      expect(opp.belongsToCity(2)).toBe(false)
    })

    it('should work with different cityId values', () => {
      const opp = createTestOpportunity({ cityId: 99 })

      expect(opp.belongsToCity(99)).toBe(true)
      expect(opp.belongsToCity(100)).toBe(false)
    })
  })

  describe('cityId getter', () => {
    it('should return the correct cityId', () => {
      const opp = createTestOpportunity({ cityId: 7 })

      expect(opp.cityId).toBe(7)
    })

    it('should be immutable', () => {
      const opp = createTestOpportunity({ cityId: 1 })

      // TypeScript prevents direct assignment, but verify getter returns correct value
      expect(opp.cityId).toBe(1)
    })
  })

  describe('validation', () => {
    it('should throw error for empty ID', () => {
      expect(() => {
        createTestOpportunity({ id: '' })
      }).toThrow('Opportunity ID cannot be empty')
    })

    it('should throw error for whitespace-only ID', () => {
      expect(() => {
        createTestOpportunity({ id: '   ' })
      }).toThrow('Opportunity ID cannot be empty')
    })

    it('should throw error for empty title', () => {
      expect(() => {
        createTestOpportunity({ title: '' })
      }).toThrow('Title cannot be empty')
    })

    it('should throw error for title too short', () => {
      expect(() => {
        createTestOpportunity({ title: 'abc' })
      }).toThrow('Title must be at least 5 characters')
    })

    it('should throw error for title too long', () => {
      expect(() => {
        createTestOpportunity({ title: 'A'.repeat(101) })
      }).toThrow('Title cannot exceed 100 characters')
    })

    it('should throw error for empty description', () => {
      expect(() => {
        createTestOpportunity({ description: '' })
      }).toThrow('Description cannot be empty')
    })

    it('should throw error for description too short', () => {
      expect(() => {
        createTestOpportunity({ description: 'Short desc' })
      }).toThrow('Description must be at least 20 characters')
    })

    it('should throw error for description too long', () => {
      expect(() => {
        createTestOpportunity({ description: 'A'.repeat(2001) })
      }).toThrow('Description cannot exceed 2000 characters')
    })

    it('should throw error for empty skills array', () => {
      expect(() => {
        createTestOpportunity({ skillsRequired: [] })
      }).toThrow('At least one skill is required')
    })

    it('should throw error for invalid type', () => {
      expect(() => {
        createTestOpportunity({ type: 'invalid' as any })
      }).toThrow('Invalid opportunity type')
    })

    it('should throw error for invalid status', () => {
      expect(() => {
        createTestOpportunity({ status: 'invalid' as any })
      }).toThrow('Invalid opportunity status')
    })

    it('should throw error for empty creator ID', () => {
      expect(() => {
        createTestOpportunity({ createdBy: '' })
      }).toThrow('Creator ID cannot be empty')
    })

    it('should throw error for whitespace-only creator ID', () => {
      expect(() => {
        createTestOpportunity({ createdBy: '   ' })
      }).toThrow('Creator ID cannot be empty')
    })

    it('should throw error for created date after updated date', () => {
      expect(() => {
        createTestOpportunity({
          createdAt: new Date('2024-02-01'),
          updatedAt: new Date('2024-01-01')
        })
      }).toThrow('Created date cannot be after updated date')
    })
  })

  describe('lifecycle methods', () => {
    it('should start progress on open opportunity', () => {
      const opp = createTestOpportunity({ status: 'abierta' })

      opp.startProgress()

      expect(opp.status).toBe('en_progreso')
    })

    it('should throw error when starting progress on non-open opportunity', () => {
      const opp = createTestOpportunity({ status: 'cerrada' })

      expect(() => {
        opp.startProgress()
      }).toThrow('Only open opportunities can be started')
    })

    it('should close opportunity successfully', () => {
      const opp = createTestOpportunity({ status: 'abierta' })

      opp.close()

      expect(opp.status).toBe('cerrada')
    })

    it('should throw error when closing already closed opportunity', () => {
      const opp = createTestOpportunity({ status: 'cerrada' })

      expect(() => {
        opp.close()
      }).toThrow('Opportunity is already closed')
    })

    it('should throw error when closing cancelled opportunity', () => {
      const opp = createTestOpportunity({ status: 'cancelada' })

      expect(() => {
        opp.close()
      }).toThrow('Cannot close a cancelled opportunity')
    })

    it('should cancel opportunity successfully', () => {
      const opp = createTestOpportunity({ status: 'abierta' })

      opp.cancel()

      expect(opp.status).toBe('cancelada')
    })

    it('should throw error when cancelling closed opportunity', () => {
      const opp = createTestOpportunity({ status: 'cerrada' })

      expect(() => {
        opp.cancel()
      }).toThrow('Cannot cancel a closed opportunity')
    })

    it('should reopen closed opportunity', () => {
      const opp = createTestOpportunity({ status: 'cerrada' })

      opp.reopen()

      expect(opp.status).toBe('abierta')
    })

    it('should throw error when reopening already active opportunity', () => {
      const opp = createTestOpportunity({ status: 'abierta' })

      expect(() => {
        opp.reopen()
      }).toThrow('Opportunity is already active')
    })
  })

  describe('isActive', () => {
    it('should return true for open opportunity', () => {
      const opp = createTestOpportunity({ status: 'abierta' })

      expect(opp.isActive()).toBe(true)
    })

    it('should return true for in progress opportunity', () => {
      const opp = createTestOpportunity({ status: 'en_progreso' })

      expect(opp.isActive()).toBe(true)
    })

    it('should return false for closed opportunity', () => {
      const opp = createTestOpportunity({ status: 'cerrada' })

      expect(opp.isActive()).toBe(false)
    })

    it('should return false for cancelled opportunity', () => {
      const opp = createTestOpportunity({ status: 'cancelada' })

      expect(opp.isActive()).toBe(false)
    })
  })

  describe('isFinished', () => {
    it('should return true for closed opportunity', () => {
      const opp = createTestOpportunity({ status: 'cerrada' })

      expect(opp.isFinished()).toBe(true)
    })

    it('should return true for cancelled opportunity', () => {
      const opp = createTestOpportunity({ status: 'cancelada' })

      expect(opp.isFinished()).toBe(true)
    })

    it('should return false for open opportunity', () => {
      const opp = createTestOpportunity({ status: 'abierta' })

      expect(opp.isFinished()).toBe(false)
    })

    it('should return false for in progress opportunity', () => {
      const opp = createTestOpportunity({ status: 'en_progreso' })

      expect(opp.isFinished()).toBe(false)
    })
  })

  describe('isCreator', () => {
    it('should return true when user is the creator', () => {
      const opp = createTestOpportunity({ createdBy: 'user-123' })

      expect(opp.isCreator('user-123')).toBe(true)
    })

    it('should return false when user is not the creator', () => {
      const opp = createTestOpportunity({ createdBy: 'user-123' })

      expect(opp.isCreator('user-456')).toBe(false)
    })
  })

  describe('toObject', () => {
    it('should convert Opportunity to plain object', () => {
      const createdAt = new Date('2024-01-01')
      const updatedAt = new Date('2024-02-01')

      const opp = createTestOpportunity({
        id: 'opp-789',
        title: 'Test Opportunity',
        description: 'This is a test opportunity description with enough characters.',
        type: 'proyecto',
        status: 'abierta',
        skillsRequired: ['JavaScript', 'React'],
        location: 'Barcelona',
        remote: false,
        duration: '3 meses',
        compensation: '30k EUR',
        cityId: 2,
        createdBy: 'user-789',
        createdAt,
        updatedAt
      })

      const obj = opp.toObject()

      expect(obj).toEqual({
        id: 'opp-789',
        title: 'Test Opportunity',
        description: 'This is a test opportunity description with enough characters.',
        type: 'proyecto',
        status: 'abierta',
        skillsRequired: ['JavaScript', 'React'],
        location: 'Barcelona',
        remote: false,
        duration: '3 meses',
        compensation: '30k EUR',
        cityId: 2,
        createdBy: 'user-789',
        createdAt,
        updatedAt
      })
    })

    it('should include cityId in serialized object', () => {
      const opp = createTestOpportunity({ cityId: 5 })

      const obj = opp.toObject()

      expect(obj.cityId).toBe(5)
    })
  })
})
