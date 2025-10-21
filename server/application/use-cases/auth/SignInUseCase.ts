// ABOUTME: Use case for user sign in with email and password
// ABOUTME: Handles authentication and returns user profile with session

import { IAuthService } from '../../ports/services/IAuthService'
import { IUserRepository } from '../../ports/repositories/IUserRepository'
import { User } from '../../../domain/entities/User'
import { Email } from '../../../domain/value-objects/Email'
import { UserId } from '../../../domain/value-objects/UserId'

export interface SignInRequest {
  email: string
  password: string
}

export interface SignInResponse {
  user: User | null
  session: any | null
  error: string | null
}

export class SignInUseCase {
  constructor(
    private readonly authService: IAuthService,
    private readonly userRepository: IUserRepository
  ) {}

  async execute(request: SignInRequest): Promise<SignInResponse> {
    // 1. Validate email format
    const email = Email.create(request.email)
    if (!email) {
      return {
        user: null,
        session: null,
        error: 'Invalid email format'
      }
    }

    // 2. Authenticate with auth service
    const authResult = await this.authService.signIn(email, request.password)

    if (authResult.error || !authResult.user) {
      return {
        user: null,
        session: null,
        error: authResult.error?.message || 'Invalid credentials'
      }
    }

    // 3. Get user profile from repository
    const userId = UserId.create(authResult.user.id)
    if (!userId) {
      return {
        user: null,
        session: null,
        error: 'Invalid user ID'
      }
    }

    const user = await this.userRepository.findById(userId)
    if (!user) {
      return {
        user: null,
        session: null,
        error: 'User profile not found'
      }
    }

    return {
      user,
      session: authResult.session,
      error: null
    }
  }
}
