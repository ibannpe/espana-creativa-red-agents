// ABOUTME: Unit tests for CheckUserIsCityManagerUseCase
// ABOUTME: Tests permission checking for city managers and admins

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CheckUserIsCityManagerUseCase } from './CheckUserIsCityManagerUseCase'
import { CityManagerRepository } from '../../ports/CityManagerRepository'
import { IUserRepository } from '../../ports/repositories/IUserRepository'
import { UserBuilder } from '../../../test/builders/UserBuilder'
import { UserId } from '../../../domain/value-objects/UserId'

describe('CheckUserIsCityManagerUseCase', () => {
  let useCase: CheckUserIsCityManagerUseCase
  let mockCityManagerRepository: CityManagerRepository
  let mockUserRepository: IUserRepository

  beforeEach(() => {
    mockCityManagerRepository = {
      isManagerOfCity: vi.fn(),
      getCitiesByManager: vi.fn(),
      assignManager: vi.fn(),
      removeManager: vi.fn(),
      getManagersByCity: vi.fn()
    } as unknown as CityManagerRepository

    mockUserRepository = {
      findByEmail: vi.fn(),
      findById: vi.fn(),
      save: vi.fn(),
      update: vi.fn(),
      search: vi.fn()
    } as unknown as IUserRepository

    useCase = new CheckUserIsCityManagerUseCase(mockCityManagerRepository, mockUserRepository)
  })

  describe('execute - invalid user ID', () => {
    it('should return false for invalid user ID format', async () => {
      const result = await useCase.execute({ userId: 'invalid-uuid' })

      expect(result.isManager).toBe(false)
      expect(result.managedCityIds).toEqual([])
      expect(mockUserRepository.findById).not.toHaveBeenCalled()
    })

    it('should return false for empty user ID', async () => {
      const result = await useCase.execute({ userId: '' })

      expect(result.isManager).toBe(false)
      expect(result.managedCityIds).toEqual([])
      expect(mockUserRepository.findById).not.toHaveBeenCalled()
    })
  })

  describe('execute - user not found', () => {
    it('should return false when user does not exist', async () => {
      const userId = '550e8400-e29b-41d4-a716-446655440000'
      vi.mocked(mockUserRepository.findById).mockResolvedValue(null)

      const result = await useCase.execute({ userId })

      expect(result.isManager).toBe(false)
      expect(result.managedCityIds).toEqual([])
    })
  })

  describe('execute - admin user (all cities)', () => {
    it('should return true for admin user with empty managedCityIds (means ALL)', async () => {
      const adminUser = new UserBuilder().asAdmin().build()
      const userId = '550e8400-e29b-41d4-a716-446655440000'

      vi.mocked(mockUserRepository.findById).mockResolvedValue(adminUser)

      const result = await useCase.execute({ userId })

      expect(result.isManager).toBe(true)
      expect(result.managedCityIds).toEqual([]) // Empty means ALL cities for admins
      expect(mockCityManagerRepository.isManagerOfCity).not.toHaveBeenCalled()
      expect(mockCityManagerRepository.getCitiesByManager).not.toHaveBeenCalled()
    })

    it('should return true for admin when checking specific city', async () => {
      const adminUser = new UserBuilder().asAdmin().build()
      const userId = '550e8400-e29b-41d4-a716-446655440000'

      vi.mocked(mockUserRepository.findById).mockResolvedValue(adminUser)

      const result = await useCase.execute({ userId, cityId: 1 })

      expect(result.isManager).toBe(true)
      expect(result.managedCityIds).toEqual([]) // Empty means ALL cities for admins
      expect(mockCityManagerRepository.isManagerOfCity).not.toHaveBeenCalled()
    })

    it('should skip repository check for admin users', async () => {
      const adminUser = new UserBuilder().asAdmin().build()
      const userId = '550e8400-e29b-41d4-a716-446655440000'

      vi.mocked(mockUserRepository.findById).mockResolvedValue(adminUser)

      await useCase.execute({ userId })

      expect(mockCityManagerRepository.getCitiesByManager).not.toHaveBeenCalled()
    })
  })

  describe('execute - specific city check', () => {
    it('should return true when user is manager of the specific city', async () => {
      const user = new UserBuilder().asEmprendedor().build()
      const userId = '550e8400-e29b-41d4-a716-446655440000'
      const cityId = 1

      vi.mocked(mockUserRepository.findById).mockResolvedValue(user)
      vi.mocked(mockCityManagerRepository.isManagerOfCity).mockResolvedValue(true)

      const result = await useCase.execute({ userId, cityId })

      expect(mockCityManagerRepository.isManagerOfCity).toHaveBeenCalledWith(
        expect.objectContaining({ getValue: expect.any(Function) }),
        cityId
      )
      expect(result.isManager).toBe(true)
      expect(result.managedCityIds).toEqual([cityId])
    })

    it('should return false when user is not manager of the specific city', async () => {
      const user = new UserBuilder().asEmprendedor().build()
      const userId = '550e8400-e29b-41d4-a716-446655440000'
      const cityId = 1

      vi.mocked(mockUserRepository.findById).mockResolvedValue(user)
      vi.mocked(mockCityManagerRepository.isManagerOfCity).mockResolvedValue(false)

      const result = await useCase.execute({ userId, cityId })

      expect(result.isManager).toBe(false)
      expect(result.managedCityIds).toEqual([])
    })

    it('should check different cities independently', async () => {
      const user = new UserBuilder().asEmprendedor().build()
      const userId = '550e8400-e29b-41d4-a716-446655440000'

      vi.mocked(mockUserRepository.findById).mockResolvedValue(user)
      vi.mocked(mockCityManagerRepository.isManagerOfCity)
        .mockResolvedValueOnce(true)   // cityId: 1
        .mockResolvedValueOnce(false)  // cityId: 2

      const result1 = await useCase.execute({ userId, cityId: 1 })
      const result2 = await useCase.execute({ userId, cityId: 2 })

      expect(result1.isManager).toBe(true)
      expect(result1.managedCityIds).toEqual([1])
      expect(result2.isManager).toBe(false)
      expect(result2.managedCityIds).toEqual([])
    })
  })

  describe('execute - all cities check (no cityId provided)', () => {
    it('should return true when user manages at least one city', async () => {
      const user = new UserBuilder().asEmprendedor().build()
      const userId = '550e8400-e29b-41d4-a716-446655440000'

      vi.mocked(mockUserRepository.findById).mockResolvedValue(user)
      vi.mocked(mockCityManagerRepository.getCitiesByManager).mockResolvedValue([1, 3, 5])

      const result = await useCase.execute({ userId })

      expect(mockCityManagerRepository.getCitiesByManager).toHaveBeenCalledWith(
        expect.objectContaining({ getValue: expect.any(Function) })
      )
      expect(result.isManager).toBe(true)
      expect(result.managedCityIds).toEqual([1, 3, 5])
    })

    it('should return false when user manages no cities', async () => {
      const user = new UserBuilder().asEmprendedor().build()
      const userId = '550e8400-e29b-41d4-a716-446655440000'

      vi.mocked(mockUserRepository.findById).mockResolvedValue(user)
      vi.mocked(mockCityManagerRepository.getCitiesByManager).mockResolvedValue([])

      const result = await useCase.execute({ userId })

      expect(result.isManager).toBe(false)
      expect(result.managedCityIds).toEqual([])
    })

    it('should return all managed city IDs', async () => {
      const user = new UserBuilder().asEmprendedor().build()
      const userId = '550e8400-e29b-41d4-a716-446655440000'

      vi.mocked(mockUserRepository.findById).mockResolvedValue(user)
      vi.mocked(mockCityManagerRepository.getCitiesByManager).mockResolvedValue([1, 2, 3, 4, 5])

      const result = await useCase.execute({ userId })

      expect(result.isManager).toBe(true)
      expect(result.managedCityIds).toEqual([1, 2, 3, 4, 5])
    })

    it('should handle user managing single city', async () => {
      const user = new UserBuilder().asEmprendedor().build()
      const userId = '550e8400-e29b-41d4-a716-446655440000'

      vi.mocked(mockUserRepository.findById).mockResolvedValue(user)
      vi.mocked(mockCityManagerRepository.getCitiesByManager).mockResolvedValue([7])

      const result = await useCase.execute({ userId })

      expect(result.isManager).toBe(true)
      expect(result.managedCityIds).toEqual([7])
    })
  })

  describe('execute - different user roles', () => {
    it('should work for mentor user who is city manager', async () => {
      const mentorUser = new UserBuilder().asMentor().build()
      const userId = '550e8400-e29b-41d4-a716-446655440000'

      vi.mocked(mockUserRepository.findById).mockResolvedValue(mentorUser)
      vi.mocked(mockCityManagerRepository.getCitiesByManager).mockResolvedValue([1, 2])

      const result = await useCase.execute({ userId })

      expect(result.isManager).toBe(true)
      expect(result.managedCityIds).toEqual([1, 2])
    })

    it('should work for emprendedor user who is city manager', async () => {
      const emprendedorUser = new UserBuilder().asEmprendedor().build()
      const userId = '550e8400-e29b-41d4-a716-446655440000'

      vi.mocked(mockUserRepository.findById).mockResolvedValue(emprendedorUser)
      vi.mocked(mockCityManagerRepository.getCitiesByManager).mockResolvedValue([3])

      const result = await useCase.execute({ userId })

      expect(result.isManager).toBe(true)
      expect(result.managedCityIds).toEqual([3])
    })

    it('should work for user with multiple roles', async () => {
      const multiRoleUser = new UserBuilder().withRoleIds([2, 3]).build() // Mentor and Emprendedor
      const userId = '550e8400-e29b-41d4-a716-446655440000'

      vi.mocked(mockUserRepository.findById).mockResolvedValue(multiRoleUser)
      vi.mocked(mockCityManagerRepository.getCitiesByManager).mockResolvedValue([1])

      const result = await useCase.execute({ userId })

      expect(result.isManager).toBe(true)
      expect(result.managedCityIds).toEqual([1])
    })
  })

  describe('execute - edge cases', () => {
    it('should handle cityId of 0 (invalid but testing edge case)', async () => {
      const user = new UserBuilder().asEmprendedor().build()
      const userId = '550e8400-e29b-41d4-a716-446655440000'

      vi.mocked(mockUserRepository.findById).mockResolvedValue(user)
      vi.mocked(mockCityManagerRepository.isManagerOfCity).mockResolvedValue(false)

      const result = await useCase.execute({ userId, cityId: 0 })

      expect(mockCityManagerRepository.isManagerOfCity).toHaveBeenCalledWith(
        expect.anything(),
        0
      )
      expect(result.isManager).toBe(false)
    })

    it('should handle large cityId values', async () => {
      const user = new UserBuilder().asEmprendedor().build()
      const userId = '550e8400-e29b-41d4-a716-446655440000'

      vi.mocked(mockUserRepository.findById).mockResolvedValue(user)
      vi.mocked(mockCityManagerRepository.isManagerOfCity).mockResolvedValue(true)

      const result = await useCase.execute({ userId, cityId: 999999 })

      expect(result.isManager).toBe(true)
      expect(result.managedCityIds).toEqual([999999])
    })

    it('should properly create UserId from string', async () => {
      const user = new UserBuilder().asEmprendedor().build()
      const userId = '550e8400-e29b-41d4-a716-446655440000'

      vi.mocked(mockUserRepository.findById).mockResolvedValue(user)
      vi.mocked(mockCityManagerRepository.getCitiesByManager).mockResolvedValue([])

      await useCase.execute({ userId })

      expect(mockUserRepository.findById).toHaveBeenCalledWith(
        expect.objectContaining({
          getValue: expect.any(Function)
        })
      )

      const calledUserId = vi.mocked(mockUserRepository.findById).mock.calls[0][0] as UserId
      expect(calledUserId.getValue()).toBe(userId)
    })
  })
})
