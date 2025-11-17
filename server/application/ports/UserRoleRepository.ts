// ABOUTME: Port (interface) for UserRole repository in hexagonal architecture
// ABOUTME: Defines contract for user-role assignment operations

import { UserId } from '../../domain/value-objects/UserId'

export interface UserRoleRepository {
  /**
   * Assign a role to a user
   */
  assignRole(userId: UserId, roleId: number): Promise<void>

  /**
   * Remove a role from a user
   */
  removeRole(userId: UserId, roleId: number): Promise<void>

  /**
   * Get all role IDs for a user
   */
  getUserRoleIds(userId: UserId): Promise<number[]>

  /**
   * Check if a user has a specific role
   */
  hasRole(userId: UserId, roleId: number): Promise<boolean>
}
