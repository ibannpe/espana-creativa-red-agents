// ABOUTME: Use case for user sign up with email verification and welcome email
// ABOUTME: Orchestrates user creation, role assignment, and welcome email sending

import { IAuthService } from '../../ports/services/IAuthService'
import { IUserRepository } from '../../ports/repositories/IUserRepository'
import { IEmailService } from '../../ports/services/IEmailService'
import { User } from '../../../domain/entities/User'
import { Email } from '../../../domain/value-objects/Email'
import { UserId } from '../../../domain/value-objects/UserId'

export interface SignUpRequest {
  email: string
  password: string
  name: string
}

export interface SignUpResponse {
  user: User | null
  error: string | null
}

export class SignUpUseCase {
  constructor(
    private readonly authService: IAuthService,
    private readonly userRepository: IUserRepository,
    private readonly emailService: IEmailService
  ) {}

  async execute(request: SignUpRequest): Promise<SignUpResponse> {
    // 1. Validate email format
    const email = Email.create(request.email)
    if (!email) {
      return {
        user: null,
        error: 'Invalid email format'
      }
    }

    // 2. Validate password strength
    if (request.password.length < 8) {
      return {
        user: null,
        error: 'Password must be at least 8 characters'
      }
    }

    // 3. Validate name
    if (!request.name || request.name.trim().length < 2) {
      return {
        user: null,
        error: 'Name must be at least 2 characters'
      }
    }

    // 4. Check if user already exists
    const existingUser = await this.userRepository.findByEmail(email)
    if (existingUser) {
      return {
        user: null,
        error: 'User with this email already exists'
      }
    }

    // 5. Create user in auth service
    const authResult = await this.authService.signUp(email, request.password, {
      name: request.name
    })

    if (authResult.error || !authResult.user) {
      return {
        user: null,
        error: authResult.error?.message || 'Failed to create user account'
      }
    }

    // 6. Create user ID from auth user
    const userId = UserId.create(authResult.user.id)
    if (!userId) {
      return {
        user: null,
        error: 'Invalid user ID from auth service'
      }
    }

    // 7. Create domain user entity
    const user = User.create({
      id: userId,
      email,
      name: request.name,
      avatarUrl: null,
      bio: null,
      location: null,
      linkedinUrl: null,
      websiteUrl: null,
      skills: [],
      interests: [],
      roleIds: [3], // Default role: emprendedor (ID = 3)
      createdAt: new Date(),
      updatedAt: new Date()
    })

    // 8. Save user to repository
    try {
      await this.userRepository.save(user)
    } catch (error) {
      console.error('[SignUpUseCase] Failed to save user to repository:', error)
      // Rollback auth user if database save fails
      await this.authService.deleteUser(userId)
      return {
        user: null,
        error: 'Failed to create user profile'
      }
    }

    // 9. Send welcome email (fire and forget, don't fail if email fails)
    this.emailService.sendWelcomeEmail(email, request.name).catch(error => {
      console.error('Failed to send welcome email:', error)
    })

    return {
      user,
      error: null
    }
  }
}
