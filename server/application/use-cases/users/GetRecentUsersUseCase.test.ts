// ABOUTME: Unit tests for GetRecentUsersUseCase
// ABOUTME: Tests retrieving recent users with validation of days and limit parameters

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GetRecentUsersUseCase, GetRecentUsersRequest } from './GetRecentUsersUseCase'
import { IUserRepository } from '../../ports/repositories/IUserRepository'
import { User } from '../../../domain/entities/User'
import { UserBuilder } from '../../../test/builders/UserBuilder'

describe('GetRecentUsersUseCase', () => {
  let useCase: GetRecentUsersUseCase
  let mockUserRepository: IUserRepository

  beforeEach(() => {
    mockUserRepository = {
      findById: vi.fn(),
      findByEmail: vi.fn(),
      search: vi.fn(),
      findAll: vi.fn(),
      save: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findRecentUsers: vi.fn()
    } as unknown as IUserRepository

    useCase = new GetRecentUsersUseCase(mockUserRepository)
  })

  describe('execute - successful retrieval', () => {
    it('should return recent users with default parameters (30 days, 5 limit)', async () => {
      const mockUsers: User[] = [
        new UserBuilder().withName('User 1').build(),
        new UserBuilder().withName('User 2').build(),
        new UserBuilder().withName('User 3').build()
      ]

      vi.mocked(mockUserRepository.findRecentUsers).mockResolvedValue(mockUsers)

      const request: GetRecentUsersRequest = {}
      const response = await useCase.execute(request)

      expect(response.error).toBeNull()
      expect(response.users).toHaveLength(3)
      expect(response.count).toBe(3)
      expect(response.daysFilter).toBe(30)
      expect(mockUserRepository.findRecentUsers).toHaveBeenCalledWith(30, 5)
    })

    it('should return recent users with custom days parameter', async () => {
      const mockUsers: User[] = [
        new UserBuilder().withName('User 1').build()
      ]

      vi.mocked(mockUserRepository.findRecentUsers).mockResolvedValue(mockUsers)

      const request: GetRecentUsersRequest = { days: 7 }
      const response = await useCase.execute(request)

      expect(response.error).toBeNull()
      expect(response.users).toHaveLength(1)
      expect(response.daysFilter).toBe(7)
      expect(mockUserRepository.findRecentUsers).toHaveBeenCalledWith(7, 5)
    })

    it('should return recent users with custom limit parameter', async () => {
      const mockUsers: User[] = [
        new UserBuilder().withName('User 1').build(),
        new UserBuilder().withName('User 2').build(),
        new UserBuilder().withName('User 3').build(),
        new UserBuilder().withName('User 4').build(),
        new UserBuilder().withName('User 5').build(),
        new UserBuilder().withName('User 6').build(),
        new UserBuilder().withName('User 7').build(),
        new UserBuilder().withName('User 8').build(),
        new UserBuilder().withName('User 9').build(),
        new UserBuilder().withName('User 10').build()
      ]

      vi.mocked(mockUserRepository.findRecentUsers).mockResolvedValue(mockUsers)

      const request: GetRecentUsersRequest = { limit: 10 }
      const response = await useCase.execute(request)

      expect(response.error).toBeNull()
      expect(response.users).toHaveLength(10)
      expect(response.count).toBe(10)
      expect(mockUserRepository.findRecentUsers).toHaveBeenCalledWith(30, 10)
    })

    it('should return empty array when no recent users found', async () => {
      vi.mocked(mockUserRepository.findRecentUsers).mockResolvedValue([])

      const request: GetRecentUsersRequest = {}
      const response = await useCase.execute(request)

      expect(response.error).toBeNull()
      expect(response.users).toHaveLength(0)
      expect(response.count).toBe(0)
      expect(response.daysFilter).toBe(30)
    })
  })

  describe('execute - parameter validation', () => {
    it('should clamp days to minimum value (1)', async () => {
      vi.mocked(mockUserRepository.findRecentUsers).mockResolvedValue([])

      const request: GetRecentUsersRequest = { days: 0 }
      const response = await useCase.execute(request)

      expect(response.error).toBeNull()
      expect(response.daysFilter).toBe(1)
      expect(mockUserRepository.findRecentUsers).toHaveBeenCalledWith(1, 5)
    })

    it('should clamp days to maximum value (365)', async () => {
      vi.mocked(mockUserRepository.findRecentUsers).mockResolvedValue([])

      const request: GetRecentUsersRequest = { days: 500 }
      const response = await useCase.execute(request)

      expect(response.error).toBeNull()
      expect(response.daysFilter).toBe(365)
      expect(mockUserRepository.findRecentUsers).toHaveBeenCalledWith(365, 5)
    })

    it('should clamp limit to minimum value (1)', async () => {
      vi.mocked(mockUserRepository.findRecentUsers).mockResolvedValue([])

      const request: GetRecentUsersRequest = { limit: 0 }
      const response = await useCase.execute(request)

      expect(response.error).toBeNull()
      expect(mockUserRepository.findRecentUsers).toHaveBeenCalledWith(30, 1)
    })

    it('should clamp limit to maximum value (50)', async () => {
      vi.mocked(mockUserRepository.findRecentUsers).mockResolvedValue([])

      const request: GetRecentUsersRequest = { limit: 100 }
      const response = await useCase.execute(request)

      expect(response.error).toBeNull()
      expect(mockUserRepository.findRecentUsers).toHaveBeenCalledWith(30, 50)
    })

    it('should handle negative days value', async () => {
      vi.mocked(mockUserRepository.findRecentUsers).mockResolvedValue([])

      const request: GetRecentUsersRequest = { days: -10 }
      const response = await useCase.execute(request)

      expect(response.error).toBeNull()
      expect(response.daysFilter).toBe(1)
      expect(mockUserRepository.findRecentUsers).toHaveBeenCalledWith(1, 5)
    })

    it('should handle negative limit value', async () => {
      vi.mocked(mockUserRepository.findRecentUsers).mockResolvedValue([])

      const request: GetRecentUsersRequest = { limit: -5 }
      const response = await useCase.execute(request)

      expect(response.error).toBeNull()
      expect(mockUserRepository.findRecentUsers).toHaveBeenCalledWith(30, 1)
    })

    it('should handle NaN days value by using default', async () => {
      vi.mocked(mockUserRepository.findRecentUsers).mockResolvedValue([])

      const request: GetRecentUsersRequest = { days: NaN }
      const response = await useCase.execute(request)

      expect(response.error).toBeNull()
      expect(response.daysFilter).toBe(30)
      expect(mockUserRepository.findRecentUsers).toHaveBeenCalledWith(30, 5)
    })

    it('should handle NaN limit value by using default', async () => {
      vi.mocked(mockUserRepository.findRecentUsers).mockResolvedValue([])

      const request: GetRecentUsersRequest = { limit: NaN }
      const response = await useCase.execute(request)

      expect(response.error).toBeNull()
      expect(mockUserRepository.findRecentUsers).toHaveBeenCalledWith(30, 5)
    })
  })

  describe('execute - error handling', () => {
    it('should handle repository errors gracefully', async () => {
      const error = new Error('Database connection failed')
      vi.mocked(mockUserRepository.findRecentUsers).mockRejectedValue(error)

      const request: GetRecentUsersRequest = {}
      const response = await useCase.execute(request)

      expect(response.error).toBe('Failed to retrieve recent users: Database connection failed')
      expect(response.users).toHaveLength(0)
      expect(response.count).toBe(0)
    })

    it('should handle unexpected errors', async () => {
      vi.mocked(mockUserRepository.findRecentUsers).mockRejectedValue('Unexpected error')

      const request: GetRecentUsersRequest = {}
      const response = await useCase.execute(request)

      expect(response.error).toBe('Failed to retrieve recent users: Unknown error')
      expect(response.users).toHaveLength(0)
      expect(response.count).toBe(0)
    })
  })
})
