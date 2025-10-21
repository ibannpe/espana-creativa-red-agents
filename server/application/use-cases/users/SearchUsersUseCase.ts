// ABOUTME: Use case for searching users with filters (role, location, skills)
// ABOUTME: Delegates to repository while providing clean interface for API layer

import { IUserRepository, SearchFilters } from '../../ports/repositories/IUserRepository'
import { User } from '../../../domain/entities/User'

export interface SearchUsersRequest {
  query: string
  filters?: {
    role?: string
    location?: string
    skills?: string[]
  }
}

export interface SearchUsersResponse {
  users: User[]
  count: number
  error: string | null
}

export class SearchUsersUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(request: SearchUsersRequest): Promise<SearchUsersResponse> {
    try {
      // Delegate to repository with filters
      const users = await this.userRepository.search(
        request.query,
        request.filters
      )

      return {
        users,
        count: users.length,
        error: null
      }
    } catch (error) {
      return {
        users: [],
        count: 0,
        error: 'Failed to search users'
      }
    }
  }
}
