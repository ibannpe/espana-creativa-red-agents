// ABOUTME: Use case for retrieving a user's complete profile by ID
// ABOUTME: Fetches user data and calculates current profile completion

import { IUserRepository } from '../../ports/repositories/IUserRepository'
import { User } from '../../../domain/entities/User'
import { UserId } from '../../../domain/value-objects/UserId'

export interface GetUserProfileRequest {
  userId: string
}

export interface GetUserProfileResponse {
  user: User | null
  completionPercentage: number
  error: string | null
}

export class GetUserProfileUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(request: GetUserProfileRequest): Promise<GetUserProfileResponse> {
    // 1. Validate user ID
    const userId = UserId.create(request.userId)
    if (!userId) {
      return {
        user: null,
        completionPercentage: 0,
        error: 'Invalid user ID format'
      }
    }

    // 2. Fetch user from repository
    const user = await this.userRepository.findById(userId)
    if (!user) {
      return {
        user: null,
        completionPercentage: 0,
        error: 'User not found'
      }
    }

    // 3. Calculate completion percentage using domain logic
    const completionPercentage = user.calculateCompletionPercentage().getValue()

    return {
      user,
      completionPercentage,
      error: null
    }
  }
}
