// ABOUTME: Repository port (interface) for user data persistence operations
// ABOUTME: Defines contract for user CRUD operations independent of storage implementation

import { User } from '../../../domain/entities/User'
import { UserId } from '../../../domain/value-objects/UserId'
import { Email } from '../../../domain/value-objects/Email'

export interface SearchFilters {
  role?: string
  location?: string
  skills?: string[]
}

export interface IUserRepository {
  /**
   * Find a user by their unique identifier
   */
  findById(id: UserId): Promise<User | null>

  /**
   * Find a user by their email address
   */
  findByEmail(email: Email): Promise<User | null>

  /**
   * Search users with optional filters
   */
  search(query: string, filters?: SearchFilters): Promise<User[]>

  /**
   * Get all users (with pagination in future)
   */
  findAll(): Promise<User[]>

  /**
   * Save a new user
   */
  save(user: User): Promise<User>

  /**
   * Update an existing user
   */
  update(user: User): Promise<User>

  /**
   * Delete a user by ID
   */
  delete(id: UserId): Promise<void>

  /**
   * Find recent users registered within the last N days
   * @param days Number of days to look back (1-365)
   * @param limit Maximum number of users to return (1-50)
   * @returns Array of User entities ordered by created_at DESC
   */
  findRecentUsers(days: number, limit: number): Promise<User[]>
}
