// ABOUTME: Use case for updating a user's profile information
// ABOUTME: Validates updates and persists changes while maintaining business rules

import { IUserRepository } from '../../ports/repositories/IUserRepository'
import { User } from '../../../domain/entities/User'
import { UserId } from '../../../domain/value-objects/UserId'

export interface UpdateUserProfileRequest {
  userId: string
  name?: string | null
  avatarUrl?: string | null
  bio?: string | null
  location?: string | null
  linkedinUrl?: string | null
  websiteUrl?: string | null
  skills?: string[]
  interests?: string[]
}

export interface UpdateUserProfileResponse {
  user: User | null
  error: string | null
}

export class UpdateUserProfileUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(request: UpdateUserProfileRequest): Promise<UpdateUserProfileResponse> {
    // 1. Validate user ID
    const userId = UserId.create(request.userId)
    if (!userId) {
      return {
        user: null,
        error: 'Invalid user ID format'
      }
    }

    // 2. Fetch existing user
    const existingUser = await this.userRepository.findById(userId)
    if (!existingUser) {
      return {
        user: null,
        error: 'User not found'
      }
    }

    // 3. Validate name if provided
    if (request.name !== undefined && request.name !== null) {
      if (request.name.trim().length < 2) {
        return {
          user: null,
          error: 'Name must be at least 2 characters'
        }
      }
    }

    // 4. Validate URLs if provided
    if (request.linkedinUrl && !this.isValidUrl(request.linkedinUrl)) {
      return {
        user: null,
        error: 'Invalid LinkedIn URL'
      }
    }

    if (request.websiteUrl && !this.isValidUrl(request.websiteUrl)) {
      return {
        user: null,
        error: 'Invalid website URL'
      }
    }

    // 5. Update user using domain method
    const updatedUser = existingUser.updateProfile({
      name: request.name,
      avatarUrl: request.avatarUrl,
      bio: request.bio,
      location: request.location,
      linkedinUrl: request.linkedinUrl,
      websiteUrl: request.websiteUrl,
      skills: request.skills,
      interests: request.interests
    })

    // 6. Persist updated user
    try {
      const savedUser = await this.userRepository.update(updatedUser)
      return {
        user: savedUser,
        error: null
      }
    } catch (error) {
      return {
        user: null,
        error: 'Failed to update user profile'
      }
    }
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }
}
