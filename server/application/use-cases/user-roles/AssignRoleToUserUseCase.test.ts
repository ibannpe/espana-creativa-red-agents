// ABOUTME: Unit tests for AssignRoleToUserUseCase
// ABOUTME: Tests role assignment with admin permission validation and duplicate prevention

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AssignRoleToUserUseCase } from './AssignRoleToUserUseCase'
import { IUserRepository } from '../../ports/repositories/IUserRepository'
import { RoleRepository } from '../../ports/RoleRepository'
import { UserRoleRepository } from '../../ports/UserRoleRepository'
import { UserBuilder } from '../../../test/builders/UserBuilder'
import { UserId } from '../../../domain/value-objects/UserId'

describe('AssignRoleToUserUseCase', () => {
  let useCase: AssignRoleToUserUseCase
  let mockUserRepository: IUserRepository
  let mockRoleRepository: RoleRepository
  let mockUserRoleRepository: UserRoleRepository

  beforeEach(() => {
    mockUserRepository = {
      findByEmail: vi.fn(),
      findById: vi.fn(),
      save: vi.fn(),
      update: vi.fn(),
      search: vi.fn()
    } as unknown as IUserRepository

    mockRoleRepository = {
      findById: vi.fn(),
      findAll: vi.fn(),
      findByName: vi.fn()
    } as unknown as RoleRepository

    mockUserRoleRepository = {
      assignRole: vi.fn(),
      removeRole: vi.fn(),
      hasRole: vi.fn(),
      getUserRoleIds: vi.fn()
    } as unknown as UserRoleRepository

    useCase = new AssignRoleToUserUseCase(
      mockUserRepository,
      mockRoleRepository,
      mockUserRoleRepository
    )
  })

  describe('execute - successful assignment', () => {
    it('should assign role when all validations pass', async () => {
      const adminUser = new UserBuilder().asAdmin().build()
      const targetUser = new UserBuilder().asEmprendedor().build()

      const adminUserId = '550e8400-e29b-41d4-a716-446655440000'
      const targetUserId = '550e8400-e29b-41d4-a716-446655440001'

      vi.mocked(mockUserRepository.findById)
        .mockResolvedValueOnce(adminUser)    // Admin user lookup
        .mockResolvedValueOnce(targetUser)   // Target user lookup

      vi.mocked(mockRoleRepository.findById).mockResolvedValue({
        id: 2,
        name: 'mentor',
        description: 'Mentor role'
      })

      vi.mocked(mockUserRoleRepository.hasRole).mockResolvedValue(false)
      vi.mocked(mockUserRoleRepository.assignRole).mockResolvedValue(undefined)

      const result = await useCase.execute({
        userId: targetUserId,
        roleId: 2,
        performedBy: adminUserId
      })

      expect(result.success).toBe(true)
      expect(result.error).toBeNull()
      expect(mockUserRoleRepository.assignRole).toHaveBeenCalledWith(
        expect.objectContaining({ getValue: expect.any(Function) }),
        2
      )
    })

    it('should assign emprendedor role to user', async () => {
      const adminUser = new UserBuilder().asAdmin().build()
      const targetUser = new UserBuilder().asMentor().build()

      const adminUserId = '550e8400-e29b-41d4-a716-446655440000'
      const targetUserId = '550e8400-e29b-41d4-a716-446655440001'

      vi.mocked(mockUserRepository.findById)
        .mockResolvedValueOnce(adminUser)
        .mockResolvedValueOnce(targetUser)

      vi.mocked(mockRoleRepository.findById).mockResolvedValue({
        id: 3,
        name: 'emprendedor',
        description: 'Emprendedor role'
      })

      vi.mocked(mockUserRoleRepository.hasRole).mockResolvedValue(false)
      vi.mocked(mockUserRoleRepository.assignRole).mockResolvedValue(undefined)

      const result = await useCase.execute({
        userId: targetUserId,
        roleId: 3,
        performedBy: adminUserId
      })

      expect(result.success).toBe(true)
      expect(mockUserRoleRepository.assignRole).toHaveBeenCalledWith(
        expect.anything(),
        3
      )
    })
  })

  describe('execute - admin validation errors', () => {
    it('should reject invalid admin user ID format', async () => {
      const result = await useCase.execute({
        userId: '550e8400-e29b-41d4-a716-446655440001',
        roleId: 2,
        performedBy: 'invalid-uuid'
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid admin user ID')
      expect(mockUserRepository.findById).not.toHaveBeenCalled()
    })

    it('should reject when admin user does not exist', async () => {
      const adminUserId = '550e8400-e29b-41d4-a716-446655440000'

      vi.mocked(mockUserRepository.findById).mockResolvedValue(null)

      const result = await useCase.execute({
        userId: '550e8400-e29b-41d4-a716-446655440001',
        roleId: 2,
        performedBy: adminUserId
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Admin user not found')
    })

    it('should reject when user is not admin', async () => {
      const nonAdminUser = new UserBuilder().asEmprendedor().build()
      const adminUserId = '550e8400-e29b-41d4-a716-446655440000'

      vi.mocked(mockUserRepository.findById).mockResolvedValue(nonAdminUser)

      const result = await useCase.execute({
        userId: '550e8400-e29b-41d4-a716-446655440001',
        roleId: 2,
        performedBy: adminUserId
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Only admins can assign roles')
    })

    it('should reject mentor trying to assign roles', async () => {
      const mentorUser = new UserBuilder().asMentor().build()
      const adminUserId = '550e8400-e29b-41d4-a716-446655440000'

      vi.mocked(mockUserRepository.findById).mockResolvedValue(mentorUser)

      const result = await useCase.execute({
        userId: '550e8400-e29b-41d4-a716-446655440001',
        roleId: 2,
        performedBy: adminUserId
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Only admins can assign roles')
    })
  })

  describe('execute - target user validation errors', () => {
    it('should reject invalid target user ID format', async () => {
      const adminUser = new UserBuilder().asAdmin().build()
      const adminUserId = '550e8400-e29b-41d4-a716-446655440000'

      vi.mocked(mockUserRepository.findById).mockResolvedValue(adminUser)

      const result = await useCase.execute({
        userId: 'invalid-uuid',
        roleId: 2,
        performedBy: adminUserId
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid user ID')
    })

    it('should reject when target user does not exist', async () => {
      const adminUser = new UserBuilder().asAdmin().build()
      const adminUserId = '550e8400-e29b-41d4-a716-446655440000'
      const targetUserId = '550e8400-e29b-41d4-a716-446655440001'

      vi.mocked(mockUserRepository.findById)
        .mockResolvedValueOnce(adminUser)    // Admin lookup succeeds
        .mockResolvedValueOnce(null)         // Target lookup fails

      const result = await useCase.execute({
        userId: targetUserId,
        roleId: 2,
        performedBy: adminUserId
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('User not found')
    })
  })

  describe('execute - role validation errors', () => {
    it('should reject when role does not exist', async () => {
      const adminUser = new UserBuilder().asAdmin().build()
      const targetUser = new UserBuilder().asEmprendedor().build()

      const adminUserId = '550e8400-e29b-41d4-a716-446655440000'
      const targetUserId = '550e8400-e29b-41d4-a716-446655440001'

      vi.mocked(mockUserRepository.findById)
        .mockResolvedValueOnce(adminUser)
        .mockResolvedValueOnce(targetUser)

      vi.mocked(mockRoleRepository.findById).mockResolvedValue(null)

      const result = await useCase.execute({
        userId: targetUserId,
        roleId: 999,
        performedBy: adminUserId
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Role not found')
    })
  })

  describe('execute - duplicate prevention', () => {
    it('should reject when user already has the role', async () => {
      const adminUser = new UserBuilder().asAdmin().build()
      const targetUser = new UserBuilder().asEmprendedor().build()

      const adminUserId = '550e8400-e29b-41d4-a716-446655440000'
      const targetUserId = '550e8400-e29b-41d4-a716-446655440001'

      vi.mocked(mockUserRepository.findById)
        .mockResolvedValueOnce(adminUser)
        .mockResolvedValueOnce(targetUser)

      vi.mocked(mockRoleRepository.findById).mockResolvedValue({
        id: 3,
        name: 'emprendedor',
        description: 'Emprendedor role'
      })

      vi.mocked(mockUserRoleRepository.hasRole).mockResolvedValue(true) // Already has role

      const result = await useCase.execute({
        userId: targetUserId,
        roleId: 3,
        performedBy: adminUserId
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('User already has this role')
      expect(mockUserRoleRepository.assignRole).not.toHaveBeenCalled()
    })

    it('should check existing role before attempting to assign', async () => {
      const adminUser = new UserBuilder().asAdmin().build()
      const targetUser = new UserBuilder().asEmprendedor().build()

      const adminUserId = '550e8400-e29b-41d4-a716-446655440000'
      const targetUserId = '550e8400-e29b-41d4-a716-446655440001'

      vi.mocked(mockUserRepository.findById)
        .mockResolvedValueOnce(adminUser)
        .mockResolvedValueOnce(targetUser)

      vi.mocked(mockRoleRepository.findById).mockResolvedValue({
        id: 2,
        name: 'mentor',
        description: 'Mentor role'
      })

      vi.mocked(mockUserRoleRepository.hasRole).mockResolvedValue(true)

      await useCase.execute({
        userId: targetUserId,
        roleId: 2,
        performedBy: adminUserId
      })

      expect(mockUserRoleRepository.hasRole).toHaveBeenCalledWith(
        expect.objectContaining({ getValue: expect.any(Function) }),
        2
      )
    })
  })

  describe('execute - edge cases', () => {
    it('should handle admin assigning role to themselves', async () => {
      const adminUser = new UserBuilder().asAdmin().build()

      const userId = '550e8400-e29b-41d4-a716-446655440000'

      vi.mocked(mockUserRepository.findById)
        .mockResolvedValueOnce(adminUser)  // Admin lookup
        .mockResolvedValueOnce(adminUser)  // Target lookup (same user)

      vi.mocked(mockRoleRepository.findById).mockResolvedValue({
        id: 2,
        name: 'mentor',
        description: 'Mentor role'
      })

      vi.mocked(mockUserRoleRepository.hasRole).mockResolvedValue(false)
      vi.mocked(mockUserRoleRepository.assignRole).mockResolvedValue(undefined)

      const result = await useCase.execute({
        userId: userId,
        roleId: 2,
        performedBy: userId
      })

      expect(result.success).toBe(true)
      expect(result.error).toBeNull()
    })

    it('should handle repository errors gracefully', async () => {
      const adminUser = new UserBuilder().asAdmin().build()
      const targetUser = new UserBuilder().asEmprendedor().build()

      const adminUserId = '550e8400-e29b-41d4-a716-446655440000'
      const targetUserId = '550e8400-e29b-41d4-a716-446655440001'

      vi.mocked(mockUserRepository.findById)
        .mockResolvedValueOnce(adminUser)
        .mockResolvedValueOnce(targetUser)

      vi.mocked(mockRoleRepository.findById).mockResolvedValue({
        id: 2,
        name: 'mentor',
        description: 'Mentor role'
      })

      vi.mocked(mockUserRoleRepository.hasRole).mockResolvedValue(false)
      vi.mocked(mockUserRoleRepository.assignRole).mockRejectedValue(
        new Error('Database error')
      )

      const result = await useCase.execute({
        userId: targetUserId,
        roleId: 2,
        performedBy: adminUserId
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Database error')
    })
  })
})
