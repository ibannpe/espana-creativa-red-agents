// ABOUTME: Use case for retrieving users registered within the last N days
// ABOUTME: Validates days and limit parameters, delegates to repository for data fetching

import { IUserRepository } from '../../ports/repositories/IUserRepository'
import { User } from '../../../domain/entities/User'

export interface GetRecentUsersRequest {
  days?: number // Optional, default: 30
  limit?: number // Optional, default: 5
}

export interface GetRecentUsersResponse {
  users: User[]
  count: number
  daysFilter: number
  error: string | null
}

export class GetRecentUsersUseCase {
  private static readonly DEFAULT_DAYS = 30
  private static readonly MIN_DAYS = 1
  private static readonly MAX_DAYS = 365
  private static readonly DEFAULT_LIMIT = 5
  private static readonly MIN_LIMIT = 1
  private static readonly MAX_LIMIT = 50

  constructor(private readonly userRepository: IUserRepository) {}

  async execute(request: GetRecentUsersRequest): Promise<GetRecentUsersResponse> {
    try {
      // 1. Validate and sanitize days parameter
      const days = this.sanitizeDays(request.days)

      // 2. Validate and sanitize limit parameter
      const limit = this.sanitizeLimit(request.limit)

      // 3. Fetch recent users from repository
      const users = await this.userRepository.findRecentUsers(days, limit)

      // 4. Return structured response
      return {
        users,
        count: users.length,
        daysFilter: days,
        error: null
      }
    } catch (error) {
      // Handle repository errors gracefully
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      return {
        users: [],
        count: 0,
        daysFilter: request.days || GetRecentUsersUseCase.DEFAULT_DAYS,
        error: `Failed to retrieve recent users: ${errorMessage}`
      }
    }
  }

  private sanitizeDays(days?: number): number {
    // Handle undefined, NaN, or invalid values
    if (days === undefined || days === null || isNaN(days)) {
      return GetRecentUsersUseCase.DEFAULT_DAYS
    }

    // Clamp to valid range
    if (days < GetRecentUsersUseCase.MIN_DAYS) {
      return GetRecentUsersUseCase.MIN_DAYS
    }

    if (days > GetRecentUsersUseCase.MAX_DAYS) {
      return GetRecentUsersUseCase.MAX_DAYS
    }

    return Math.floor(days)
  }

  private sanitizeLimit(limit?: number): number {
    // Handle undefined, NaN, or invalid values
    if (limit === undefined || limit === null || isNaN(limit)) {
      return GetRecentUsersUseCase.DEFAULT_LIMIT
    }

    // Clamp to valid range
    if (limit < GetRecentUsersUseCase.MIN_LIMIT) {
      return GetRecentUsersUseCase.MIN_LIMIT
    }

    if (limit > GetRecentUsersUseCase.MAX_LIMIT) {
      return GetRecentUsersUseCase.MAX_LIMIT
    }

    return Math.floor(limit)
  }
}
