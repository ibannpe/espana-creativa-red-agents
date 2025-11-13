// ABOUTME: Unit tests for AssignCityManagerUseCase
// ABOUTME: Tests assignment of city managers with admin permission validation

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AssignCityManagerUseCase } from './AssignCityManagerUseCase'
import { CityManagerRepository } from '../../ports/CityManagerRepository'
import { CityRepository } from '../../ports/CityRepository'
import { IUserRepository } from '../../ports/repositories/IUserRepository'
import { UserBuilder } from '../../../test/builders/UserBuilder'
import { CityBuilder } from '../../../__tests__/builders/CityBuilder'

describe('AssignCityManagerUseCase', () => {
  let useCase: AssignCityManagerUseCase
  let mockCityManagerRepository: CityManagerRepository
  let mockCityRepository: CityRepository
  let mockUserRepository: IUserRepository

  beforeEach(() => {
    mockCityManagerRepository = {
      isManagerOfCity: vi.fn(),
      getCitiesByManager: vi.fn(),
      assignManager: vi.fn(),
      removeManager: vi.fn(),
      getManagersByCity: vi.fn()
    } as unknown as CityManagerRepository

    mockCityRepository = {
      findById: vi.fn(),
      findBySlug: vi.fn(),
      findAll: vi.fn(),
      findAllWithOpportunityCount: vi.fn(),
      save: vi.fn(),
      update: vi.fn(),
      exists: vi.fn()
    } as unknown as CityRepository

    mockUserRepository = {
      findByEmail: vi.fn(),
      findById: vi.fn(),
      save: vi.fn(),
      update: vi.fn(),
      search: vi.fn()
    } as unknown as IUserRepository

    useCase = new AssignCityManagerUseCase(
      mockCityManagerRepository,
      mockCityRepository,
      mockUserRepository
    )
  })

  describe('execute - successful assignment', () => {
    it('should assign city manager when all validations pass', async () => {
      const adminUser = new UserBuilder().asAdmin().build()
      const targetUser = new UserBuilder().asEmprendedor().build()
      const city = new CityBuilder().build()

      const adminUserId = '550e8400-e29b-41d4-a716-446655440000'
      const targetUserId = '550e8400-e29b-41d4-a716-446655440001'

      vi.mocked(mockUserRepository.findById)
        .mockResolvedValueOnce(adminUser)    // Admin user lookup
        .mockResolvedValueOnce(targetUser)   // Target user lookup

      vi.mocked(mockCityRepository.findById).mockResolvedValue(city)
      vi.mocked(mockCityManagerRepository.isManagerOfCity).mockResolvedValue(false)
      vi.mocked(mockCityManagerRepository.assignManager).mockResolvedValue(undefined)

      const result = await useCase.execute({
        adminUserId,
        targetUserId,
        cityId: 1
      })

      expect(result.success).toBe(true)
      expect(result.error).toBeNull()
      expect(mockCityManagerRepository.assignManager).toHaveBeenCalledWith(
        expect.objectContaining({ getValue: expect.any(Function) }),
        1
      )
    })

    it('should work with different city IDs', async () => {
      const adminUser = new UserBuilder().asAdmin().build()
      const targetUser = new UserBuilder().asEmprendedor().build()
      const barcelona = CityBuilder.barcelona().build()

      const adminUserId = '550e8400-e29b-41d4-a716-446655440000'
      const targetUserId = '550e8400-e29b-41d4-a716-446655440001'

      vi.mocked(mockUserRepository.findById)
        .mockResolvedValueOnce(adminUser)
        .mockResolvedValueOnce(targetUser)

      vi.mocked(mockCityRepository.findById).mockResolvedValue(barcelona)
      vi.mocked(mockCityManagerRepository.isManagerOfCity).mockResolvedValue(false)
      vi.mocked(mockCityManagerRepository.assignManager).mockResolvedValue(undefined)

      const result = await useCase.execute({
        adminUserId,
        targetUserId,
        cityId: 2
      })

      expect(result.success).toBe(true)
      expect(mockCityManagerRepository.assignManager).toHaveBeenCalledWith(
        expect.anything(),
        2
      )
    })
  })

  describe('execute - admin validation errors', () => {
    it('should reject invalid admin user ID format', async () => {
      const result = await useCase.execute({
        adminUserId: 'invalid-uuid',
        targetUserId: '550e8400-e29b-41d4-a716-446655440001',
        cityId: 1
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid admin user ID')
      expect(mockUserRepository.findById).not.toHaveBeenCalled()
    })

    it('should reject when admin user does not exist', async () => {
      const adminUserId = '550e8400-e29b-41d4-a716-446655440000'

      vi.mocked(mockUserRepository.findById).mockResolvedValue(null)

      const result = await useCase.execute({
        adminUserId,
        targetUserId: '550e8400-e29b-41d4-a716-446655440001',
        cityId: 1
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Only admins can assign city managers')
    })

    it('should reject when user is not admin', async () => {
      const nonAdminUser = new UserBuilder().asEmprendedor().build()
      const adminUserId = '550e8400-e29b-41d4-a716-446655440000'

      vi.mocked(mockUserRepository.findById).mockResolvedValue(nonAdminUser)

      const result = await useCase.execute({
        adminUserId,
        targetUserId: '550e8400-e29b-41d4-a716-446655440001',
        cityId: 1
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Only admins can assign city managers')
    })

    it('should reject mentor trying to assign city manager', async () => {
      const mentorUser = new UserBuilder().asMentor().build()
      const adminUserId = '550e8400-e29b-41d4-a716-446655440000'

      vi.mocked(mockUserRepository.findById).mockResolvedValue(mentorUser)

      const result = await useCase.execute({
        adminUserId,
        targetUserId: '550e8400-e29b-41d4-a716-446655440001',
        cityId: 1
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Only admins can assign city managers')
    })
  })

  describe('execute - target user validation errors', () => {
    it('should reject invalid target user ID format', async () => {
      const adminUser = new UserBuilder().asAdmin().build()
      const adminUserId = '550e8400-e29b-41d4-a716-446655440000'

      vi.mocked(mockUserRepository.findById).mockResolvedValue(adminUser)

      const result = await useCase.execute({
        adminUserId,
        targetUserId: 'invalid-uuid',
        cityId: 1
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid target user ID')
    })

    it('should reject when target user does not exist', async () => {
      const adminUser = new UserBuilder().asAdmin().build()
      const adminUserId = '550e8400-e29b-41d4-a716-446655440000'
      const targetUserId = '550e8400-e29b-41d4-a716-446655440001'

      vi.mocked(mockUserRepository.findById)
        .mockResolvedValueOnce(adminUser)    // Admin lookup succeeds
        .mockResolvedValueOnce(null)         // Target lookup fails

      const result = await useCase.execute({
        adminUserId,
        targetUserId,
        cityId: 1
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Target user not found')
    })

    it('should allow assigning any user role as city manager', async () => {
      const adminUser = new UserBuilder().asAdmin().build()
      const emprendedorUser = new UserBuilder().asEmprendedor().build()
      const city = new CityBuilder().build()

      const adminUserId = '550e8400-e29b-41d4-a716-446655440000'
      const targetUserId = '550e8400-e29b-41d4-a716-446655440001'

      vi.mocked(mockUserRepository.findById)
        .mockResolvedValueOnce(adminUser)
        .mockResolvedValueOnce(emprendedorUser)

      vi.mocked(mockCityRepository.findById).mockResolvedValue(city)
      vi.mocked(mockCityManagerRepository.isManagerOfCity).mockResolvedValue(false)
      vi.mocked(mockCityManagerRepository.assignManager).mockResolvedValue(undefined)

      const result = await useCase.execute({
        adminUserId,
        targetUserId,
        cityId: 1
      })

      expect(result.success).toBe(true)
    })
  })

  describe('execute - city validation errors', () => {
    it('should reject when city does not exist', async () => {
      const adminUser = new UserBuilder().asAdmin().build()
      const targetUser = new UserBuilder().asEmprendedor().build()

      const adminUserId = '550e8400-e29b-41d4-a716-446655440000'
      const targetUserId = '550e8400-e29b-41d4-a716-446655440001'

      vi.mocked(mockUserRepository.findById)
        .mockResolvedValueOnce(adminUser)
        .mockResolvedValueOnce(targetUser)

      vi.mocked(mockCityRepository.findById).mockResolvedValue(null)

      const result = await useCase.execute({
        adminUserId,
        targetUserId,
        cityId: 999
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('City not found')
    })

    it('should verify city exists before assigning manager', async () => {
      const adminUser = new UserBuilder().asAdmin().build()
      const targetUser = new UserBuilder().asEmprendedor().build()

      const adminUserId = '550e8400-e29b-41d4-a716-446655440000'
      const targetUserId = '550e8400-e29b-41d4-a716-446655440001'

      vi.mocked(mockUserRepository.findById)
        .mockResolvedValueOnce(adminUser)
        .mockResolvedValueOnce(targetUser)

      vi.mocked(mockCityRepository.findById).mockResolvedValue(null)

      await useCase.execute({
        adminUserId,
        targetUserId,
        cityId: 1
      })

      expect(mockCityManagerRepository.assignManager).not.toHaveBeenCalled()
    })
  })

  describe('execute - duplicate assignment prevention', () => {
    it('should reject when user is already manager of the city', async () => {
      const adminUser = new UserBuilder().asAdmin().build()
      const targetUser = new UserBuilder().asEmprendedor().build()
      const city = new CityBuilder().build()

      const adminUserId = '550e8400-e29b-41d4-a716-446655440000'
      const targetUserId = '550e8400-e29b-41d4-a716-446655440001'

      vi.mocked(mockUserRepository.findById)
        .mockResolvedValueOnce(adminUser)
        .mockResolvedValueOnce(targetUser)

      vi.mocked(mockCityRepository.findById).mockResolvedValue(city)
      vi.mocked(mockCityManagerRepository.isManagerOfCity).mockResolvedValue(true) // Already manager

      const result = await useCase.execute({
        adminUserId,
        targetUserId,
        cityId: 1
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('User is already a manager of this city')
      expect(mockCityManagerRepository.assignManager).not.toHaveBeenCalled()
    })

    it('should check existing assignment before attempting to assign', async () => {
      const adminUser = new UserBuilder().asAdmin().build()
      const targetUser = new UserBuilder().asEmprendedor().build()
      const city = new CityBuilder().build()

      const adminUserId = '550e8400-e29b-41d4-a716-446655440000'
      const targetUserId = '550e8400-e29b-41d4-a716-446655440001'

      vi.mocked(mockUserRepository.findById)
        .mockResolvedValueOnce(adminUser)
        .mockResolvedValueOnce(targetUser)

      vi.mocked(mockCityRepository.findById).mockResolvedValue(city)
      vi.mocked(mockCityManagerRepository.isManagerOfCity).mockResolvedValue(true)

      await useCase.execute({
        adminUserId,
        targetUserId,
        cityId: 1
      })

      expect(mockCityManagerRepository.isManagerOfCity).toHaveBeenCalledWith(
        expect.objectContaining({ getValue: expect.any(Function) }),
        1
      )
    })
  })

  describe('execute - edge cases', () => {
    it('should handle admin assigning themselves as city manager', async () => {
      const adminUser = new UserBuilder().asAdmin().build()
      const city = new CityBuilder().build()

      const userId = '550e8400-e29b-41d4-a716-446655440000'

      vi.mocked(mockUserRepository.findById)
        .mockResolvedValueOnce(adminUser)  // Admin lookup
        .mockResolvedValueOnce(adminUser)  // Target lookup (same user)

      vi.mocked(mockCityRepository.findById).mockResolvedValue(city)
      vi.mocked(mockCityManagerRepository.isManagerOfCity).mockResolvedValue(false)
      vi.mocked(mockCityManagerRepository.assignManager).mockResolvedValue(undefined)

      const result = await useCase.execute({
        adminUserId: userId,
        targetUserId: userId,
        cityId: 1
      })

      expect(result.success).toBe(true)
      expect(result.error).toBeNull()
    })

    it('should handle assignment to inactive city', async () => {
      const adminUser = new UserBuilder().asAdmin().build()
      const targetUser = new UserBuilder().asEmprendedor().build()
      const inactiveCity = CityBuilder.inactive().build()

      const adminUserId = '550e8400-e29b-41d4-a716-446655440000'
      const targetUserId = '550e8400-e29b-41d4-a716-446655440001'

      vi.mocked(mockUserRepository.findById)
        .mockResolvedValueOnce(adminUser)
        .mockResolvedValueOnce(targetUser)

      vi.mocked(mockCityRepository.findById).mockResolvedValue(inactiveCity)
      vi.mocked(mockCityManagerRepository.isManagerOfCity).mockResolvedValue(false)
      vi.mocked(mockCityManagerRepository.assignManager).mockResolvedValue(undefined)

      const result = await useCase.execute({
        adminUserId,
        targetUserId,
        cityId: 99
      })

      // Should succeed - inactive cities can have managers
      expect(result.success).toBe(true)
    })

    it('should handle multiple different cities', async () => {
      const adminUser = new UserBuilder().asAdmin().build()
      const targetUser = new UserBuilder().asEmprendedor().build()
      const madrid = new CityBuilder().build()
      const barcelona = CityBuilder.barcelona().build()

      const adminUserId = '550e8400-e29b-41d4-a716-446655440000'
      const targetUserId = '550e8400-e29b-41d4-a716-446655440001'

      // Reset mocks and setup for multiple calls
      vi.mocked(mockUserRepository.findById).mockReset()
      vi.mocked(mockCityRepository.findById).mockReset()
      vi.mocked(mockCityManagerRepository.isManagerOfCity).mockReset()
      vi.mocked(mockCityManagerRepository.assignManager).mockReset()

      // Setup for first execute call
      vi.mocked(mockUserRepository.findById)
        .mockResolvedValueOnce(adminUser)
        .mockResolvedValueOnce(targetUser)
        .mockResolvedValueOnce(adminUser)  // Second call admin
        .mockResolvedValueOnce(targetUser) // Second call target

      vi.mocked(mockCityRepository.findById)
        .mockResolvedValueOnce(madrid)
        .mockResolvedValueOnce(barcelona)

      vi.mocked(mockCityManagerRepository.isManagerOfCity).mockResolvedValue(false)
      vi.mocked(mockCityManagerRepository.assignManager).mockResolvedValue(undefined)

      const result1 = await useCase.execute({
        adminUserId,
        targetUserId,
        cityId: 1
      })

      const result2 = await useCase.execute({
        adminUserId,
        targetUserId,
        cityId: 2
      })

      expect(result1.success).toBe(true)
      expect(result2.success).toBe(true)
    })
  })
})
