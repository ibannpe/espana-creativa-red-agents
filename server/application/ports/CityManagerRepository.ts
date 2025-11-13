// ABOUTME: CityManagerRepository port interface for city manager assignments
// ABOUTME: Handles many-to-many relationship between users and cities

import { UserId } from '../../domain/value-objects/UserId'

export interface CityManagerAssignment {
  userId: string
  cityId: number
  assignedAt: Date
}

/**
 * CityManagerRepository Port
 *
 * Defines the contract for city manager data persistence.
 * Manages the many-to-many relationship between users and cities.
 */
export interface CityManagerRepository {
  /**
   * Assign a user as manager of a city (admin only)
   */
  assignManager(userId: UserId, cityId: number): Promise<void>

  /**
   * Remove a user as manager of a city (admin only)
   */
  removeManager(userId: UserId, cityId: number): Promise<void>

  /**
   * Get all cities managed by a user
   */
  getCitiesByManager(userId: UserId): Promise<number[]>

  /**
   * Get all managers of a city
   */
  getManagersByCity(cityId: number): Promise<string[]>

  /**
   * Check if user is manager of a specific city
   */
  isManagerOfCity(userId: UserId, cityId: number): Promise<boolean>

  /**
   * Check if user is manager of ANY city
   */
  isManager(userId: UserId): Promise<boolean>

  /**
   * Get all assignments for a user (with details)
   */
  getAssignmentsByUser(userId: UserId): Promise<CityManagerAssignment[]>
}
