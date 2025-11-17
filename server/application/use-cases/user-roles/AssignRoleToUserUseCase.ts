// ABOUTME: Use case for assigning a role to a user
// ABOUTME: Only admins can assign roles, automatically logged in audit trail

import { IUserRepository } from '../../ports/repositories/IUserRepository'
import { RoleRepository } from '../../ports/RoleRepository'
import { UserRoleRepository } from '../../ports/UserRoleRepository'
import { UserId } from '../../../domain/value-objects/UserId'

export interface AssignRoleToUserDTO {
  userId: string
  roleId: number
  performedBy: string // Admin user ID
}

export interface AssignRoleToUserResponse {
  success: boolean
  error: string | null
}

/**
 * AssignRoleToUserUseCase
 *
 * Assigns a role to a user.
 * Only admins can perform this action.
 * The change is automatically logged in role_audit_log via database trigger.
 */
export class AssignRoleToUserUseCase {
  constructor(
    private userRepository: IUserRepository,
    private roleRepository: RoleRepository,
    private userRoleRepository: UserRoleRepository
  ) {}

  async execute(dto: AssignRoleToUserDTO): Promise<AssignRoleToUserResponse> {
    // 1. Validate admin user
    const adminId = UserId.create(dto.performedBy)
    if (!adminId) {
      return { success: false, error: 'Invalid admin user ID' }
    }

    const admin = await this.userRepository.findById(adminId)
    if (!admin) {
      return { success: false, error: 'Admin user not found' }
    }

    if (!admin.isAdmin()) {
      return { success: false, error: 'Only admins can assign roles' }
    }

    // 2. Validate target user
    const userId = UserId.create(dto.userId)
    if (!userId) {
      return { success: false, error: 'Invalid user ID' }
    }

    const user = await this.userRepository.findById(userId)
    if (!user) {
      return { success: false, error: 'User not found' }
    }

    // 3. Validate role exists
    const role = await this.roleRepository.findById(dto.roleId)
    if (!role) {
      return { success: false, error: 'Role not found' }
    }

    // 4. Check if user already has this role
    const hasRole = await this.userRoleRepository.hasRole(userId, dto.roleId)
    if (hasRole) {
      return { success: false, error: 'User already has this role' }
    }

    // 5. Assign role to user
    // Note: The audit log entry will be created automatically by the database trigger
    try {
      await this.userRoleRepository.assignRole(userId, dto.roleId)
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to assign role'
      }
    }

    return { success: true, error: null }
  }
}
