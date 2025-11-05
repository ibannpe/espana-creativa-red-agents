// ABOUTME: Dependency Injection container for managing application dependencies
// ABOUTME: Creates and wires together repositories, services, and use cases with proper lifecycle management

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Repositories
import { SupabaseUserRepository } from '../adapters/repositories/SupabaseUserRepository'
import { SupabaseConnectionRepository } from '../adapters/repositories/SupabaseConnectionRepository'
import { SupabaseOpportunityRepository } from '../adapters/repositories/SupabaseOpportunityRepository'
import { SupabaseMessageRepository } from '../adapters/repositories/SupabaseMessageRepository'
import { SupabasePendingSignupRepository } from '../adapters/repositories/SupabasePendingSignupRepository'
import { OpportunityInterestRepository } from '../adapters/repositories/OpportunityInterestRepository'
import { IUserRepository } from '../../application/ports/repositories/IUserRepository'
import { ConnectionRepository } from '../../application/ports/ConnectionRepository'
import { OpportunityRepository } from '../../application/ports/OpportunityRepository'
import { MessageRepository } from '../../application/ports/MessageRepository'
import { IPendingSignupRepository } from '../../application/ports/IPendingSignupRepository'
import { IOpportunityInterestRepository } from '../../application/ports/IOpportunityInterestRepository'

// Services
import { SupabaseAuthService } from '../adapters/services/SupabaseAuthService'
import { ResendEmailService } from '../adapters/services/ResendEmailService'
import { RateLimitService } from '../adapters/services/RateLimitService'
import { TokenService } from '../adapters/services/TokenService'
import { IAuthService } from '../../application/ports/services/IAuthService'
import { IEmailService } from '../../application/ports/services/IEmailService'
import { IRateLimitService } from '../../application/ports/IRateLimitService'
import { ITokenService } from '../../application/ports/ITokenService'

// Use Cases - Auth
import { SignUpUseCase } from '../../application/use-cases/auth/SignUpUseCase'
import { SignInUseCase } from '../../application/use-cases/auth/SignInUseCase'

// Use Cases - Users
import { GetUserProfileUseCase } from '../../application/use-cases/users/GetUserProfileUseCase'
import { UpdateUserProfileUseCase } from '../../application/use-cases/users/UpdateUserProfileUseCase'
import { SearchUsersUseCase } from '../../application/use-cases/users/SearchUsersUseCase'
import { GetRecentUsersUseCase } from '../../application/use-cases/users/GetRecentUsersUseCase'

// Use Cases - Network
import { RequestConnectionUseCase } from '../../application/use-cases/network/RequestConnectionUseCase'
import { UpdateConnectionStatusUseCase } from '../../application/use-cases/network/UpdateConnectionStatusUseCase'
import { GetConnectionsUseCase } from '../../application/use-cases/network/GetConnectionsUseCase'
import { DeleteConnectionUseCase } from '../../application/use-cases/network/DeleteConnectionUseCase'
import { GetNetworkStatsUseCase } from '../../application/use-cases/network/GetNetworkStatsUseCase'
import { GetMutualConnectionsUseCase } from '../../application/use-cases/network/GetMutualConnectionsUseCase'
import { GetConnectionStatusUseCase } from '../../application/use-cases/network/GetConnectionStatusUseCase'

// Use Cases - Opportunities
import { CreateOpportunityUseCase } from '../../application/use-cases/opportunities/CreateOpportunityUseCase'
import { GetOpportunitiesUseCase } from '../../application/use-cases/opportunities/GetOpportunitiesUseCase'
import { GetOpportunityUseCase } from '../../application/use-cases/opportunities/GetOpportunityUseCase'
import { GetMyOpportunitiesUseCase } from '../../application/use-cases/opportunities/GetMyOpportunitiesUseCase'
import { UpdateOpportunityUseCase } from '../../application/use-cases/opportunities/UpdateOpportunityUseCase'
import { DeleteOpportunityUseCase } from '../../application/use-cases/opportunities/DeleteOpportunityUseCase'

// Use Cases - Opportunity Interests
import { ExpressInterestUseCase } from '../../application/use-cases/opportunity-interests/ExpressInterestUseCase'
import { GetOpportunityInterestsUseCase } from '../../application/use-cases/opportunity-interests/GetOpportunityInterestsUseCase'
import { GetUserInterestsUseCase } from '../../application/use-cases/opportunity-interests/GetUserInterestsUseCase'
import { WithdrawInterestUseCase } from '../../application/use-cases/opportunity-interests/WithdrawInterestUseCase'

// Use Cases - Messages
import { SendMessageUseCase } from '../../application/use-cases/messages/SendMessageUseCase'
import { GetConversationsUseCase } from '../../application/use-cases/messages/GetConversationsUseCase'
import { GetConversationMessagesUseCase } from '../../application/use-cases/messages/GetConversationMessagesUseCase'
import { MarkMessagesAsReadUseCase } from '../../application/use-cases/messages/MarkMessagesAsReadUseCase'
import { DeleteMessageUseCase } from '../../application/use-cases/messages/DeleteMessageUseCase'
import { GetUnreadCountUseCase } from '../../application/use-cases/messages/GetUnreadCountUseCase'

// Use Cases - Signup Approval
import { SubmitSignupRequestUseCase } from '../../application/use-cases/signup-approval/SubmitSignupRequestUseCase'
import { ApproveSignupUseCase } from '../../application/use-cases/signup-approval/ApproveSignupUseCase'
import { RejectSignupUseCase } from '../../application/use-cases/signup-approval/RejectSignupUseCase'
import { GetPendingSignupsUseCase } from '../../application/use-cases/signup-approval/GetPendingSignupsUseCase'

// Load environment variables (silent to avoid EPIPE errors)
dotenv.config({ silent: true })

export class Container {
  // Singletons
  private static userRepository: IUserRepository
  private static connectionRepository: ConnectionRepository
  private static opportunityRepository: OpportunityRepository
  private static opportunityInterestRepository: IOpportunityInterestRepository
  private static messageRepository: MessageRepository
  private static pendingSignupRepository: IPendingSignupRepository
  private static authService: IAuthService
  private static emailService: IEmailService
  private static rateLimitService: IRateLimitService
  private static tokenService: ITokenService

  // Use Cases - Auth
  private static signUpUseCase: SignUpUseCase
  private static signInUseCase: SignInUseCase

  // Use Cases - Users
  private static getUserProfileUseCase: GetUserProfileUseCase
  private static updateUserProfileUseCase: UpdateUserProfileUseCase
  private static searchUsersUseCase: SearchUsersUseCase
  private static getRecentUsersUseCase: GetRecentUsersUseCase

  // Use Cases - Network
  private static requestConnectionUseCase: RequestConnectionUseCase
  private static updateConnectionStatusUseCase: UpdateConnectionStatusUseCase
  private static getConnectionsUseCase: GetConnectionsUseCase
  private static deleteConnectionUseCase: DeleteConnectionUseCase
  private static getNetworkStatsUseCase: GetNetworkStatsUseCase
  private static getMutualConnectionsUseCase: GetMutualConnectionsUseCase
  private static getConnectionStatusUseCase: GetConnectionStatusUseCase

  // Use Cases - Opportunities
  private static createOpportunityUseCase: CreateOpportunityUseCase
  private static getOpportunitiesUseCase: GetOpportunitiesUseCase
  private static getOpportunityUseCase: GetOpportunityUseCase
  private static getMyOpportunitiesUseCase: GetMyOpportunitiesUseCase
  private static updateOpportunityUseCase: UpdateOpportunityUseCase
  private static deleteOpportunityUseCase: DeleteOpportunityUseCase

  // Use Cases - Opportunity Interests
  private static expressInterestUseCase: ExpressInterestUseCase
  private static getOpportunityInterestsUseCase: GetOpportunityInterestsUseCase
  private static getUserInterestsUseCase: GetUserInterestsUseCase
  private static withdrawInterestUseCase: WithdrawInterestUseCase

  // Use Cases - Messages
  private static sendMessageUseCase: SendMessageUseCase
  private static getConversationsUseCase: GetConversationsUseCase
  private static getConversationMessagesUseCase: GetConversationMessagesUseCase
  private static markMessagesAsReadUseCase: MarkMessagesAsReadUseCase
  private static deleteMessageUseCase: DeleteMessageUseCase
  private static getUnreadCountUseCase: GetUnreadCountUseCase

  // Use Cases - Signup Approval
  private static submitSignupRequestUseCase: SubmitSignupRequestUseCase
  private static approveSignupUseCase: ApproveSignupUseCase
  private static rejectSignupUseCase: RejectSignupUseCase
  private static getPendingSignupsUseCase: GetPendingSignupsUseCase

  // Initialize all dependencies
  static initialize() {
    // Create Supabase client
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      db: {
        schema: 'public'
      },
      global: {
        headers: {
          'apikey': supabaseServiceKey
        }
      }
    })

    // Initialize repositories
    this.userRepository = new SupabaseUserRepository(supabase)
    this.connectionRepository = new SupabaseConnectionRepository(supabase)
    this.opportunityRepository = new SupabaseOpportunityRepository(supabase)
    this.opportunityInterestRepository = new OpportunityInterestRepository(supabase)
    this.messageRepository = new SupabaseMessageRepository(supabase)
    this.pendingSignupRepository = new SupabasePendingSignupRepository(supabase)

    // Initialize services
    this.authService = new SupabaseAuthService(supabase)

    const resendApiKey = process.env.RESEND_API_KEY
    if (!resendApiKey) {
      console.warn('RESEND_API_KEY not found, email service will fail')
    }
    this.emailService = new ResendEmailService(resendApiKey || '')
    this.rateLimitService = new RateLimitService(supabase)
    this.tokenService = new TokenService()

    // Initialize use cases
    this.signUpUseCase = new SignUpUseCase(
      this.authService,
      this.userRepository,
      this.emailService
    )

    this.signInUseCase = new SignInUseCase(
      this.authService,
      this.userRepository
    )

    this.getUserProfileUseCase = new GetUserProfileUseCase(
      this.userRepository
    )

    this.updateUserProfileUseCase = new UpdateUserProfileUseCase(
      this.userRepository
    )

    this.searchUsersUseCase = new SearchUsersUseCase(
      this.userRepository
    )

    this.getRecentUsersUseCase = new GetRecentUsersUseCase(
      this.userRepository
    )

    // Initialize Network use cases
    this.requestConnectionUseCase = new RequestConnectionUseCase(
      this.connectionRepository
    )

    this.updateConnectionStatusUseCase = new UpdateConnectionStatusUseCase(
      this.connectionRepository
    )

    this.getConnectionsUseCase = new GetConnectionsUseCase(
      this.connectionRepository
    )

    this.deleteConnectionUseCase = new DeleteConnectionUseCase(
      this.connectionRepository
    )

    this.getNetworkStatsUseCase = new GetNetworkStatsUseCase(
      this.connectionRepository
    )

    this.getMutualConnectionsUseCase = new GetMutualConnectionsUseCase(
      this.connectionRepository
    )

    this.getConnectionStatusUseCase = new GetConnectionStatusUseCase(
      this.connectionRepository
    )

    // Initialize Opportunities use cases
    this.createOpportunityUseCase = new CreateOpportunityUseCase(
      this.opportunityRepository
    )

    this.getOpportunitiesUseCase = new GetOpportunitiesUseCase(
      this.opportunityRepository
    )

    this.getOpportunityUseCase = new GetOpportunityUseCase(
      this.opportunityRepository
    )

    this.getMyOpportunitiesUseCase = new GetMyOpportunitiesUseCase(
      this.opportunityRepository
    )

    this.updateOpportunityUseCase = new UpdateOpportunityUseCase(
      this.opportunityRepository
    )

    this.deleteOpportunityUseCase = new DeleteOpportunityUseCase(
      this.opportunityRepository
    )

    // Initialize Opportunity Interests use cases
    this.expressInterestUseCase = new ExpressInterestUseCase(
      this.opportunityInterestRepository,
      this.opportunityRepository
    )

    this.getOpportunityInterestsUseCase = new GetOpportunityInterestsUseCase(
      this.opportunityInterestRepository
    )

    this.getUserInterestsUseCase = new GetUserInterestsUseCase(
      this.opportunityInterestRepository
    )

    this.withdrawInterestUseCase = new WithdrawInterestUseCase(
      this.opportunityInterestRepository
    )

    // Initialize Messages use cases
    this.sendMessageUseCase = new SendMessageUseCase(
      this.messageRepository,
      this.userRepository
    )

    this.getConversationsUseCase = new GetConversationsUseCase(
      this.messageRepository,
      this.userRepository
    )

    this.getConversationMessagesUseCase = new GetConversationMessagesUseCase(
      this.messageRepository
    )

    this.markMessagesAsReadUseCase = new MarkMessagesAsReadUseCase(
      this.messageRepository
    )

    this.deleteMessageUseCase = new DeleteMessageUseCase(
      this.messageRepository
    )

    this.getUnreadCountUseCase = new GetUnreadCountUseCase(
      this.messageRepository
    )

    // Initialize Signup Approval use cases
    this.submitSignupRequestUseCase = new SubmitSignupRequestUseCase(
      this.pendingSignupRepository,
      this.rateLimitService,
      this.emailService,
      this.authService
    )

    this.approveSignupUseCase = new ApproveSignupUseCase(
      this.pendingSignupRepository,
      this.authService,
      this.emailService
    )

    this.rejectSignupUseCase = new RejectSignupUseCase(
      this.pendingSignupRepository,
      this.emailService
    )

    this.getPendingSignupsUseCase = new GetPendingSignupsUseCase(
      this.pendingSignupRepository
    )

    console.log('✅ DI Container initialized successfully')
  }

  // Getters for repositories
  static getUserRepository(): IUserRepository {
    return this.userRepository
  }

  // Getters for services
  static getAuthService(): IAuthService {
    return this.authService
  }

  static getEmailService(): IEmailService {
    return this.emailService
  }

  // Getters for use cases - Auth
  static getSignUpUseCase(): SignUpUseCase {
    return this.signUpUseCase
  }

  static getSignInUseCase(): SignInUseCase {
    return this.signInUseCase
  }

  // Getters for use cases - Users
  static getGetUserProfileUseCase(): GetUserProfileUseCase {
    return this.getUserProfileUseCase
  }

  static getUpdateUserProfileUseCase(): UpdateUserProfileUseCase {
    return this.updateUserProfileUseCase
  }

  static getSearchUsersUseCase(): SearchUsersUseCase {
    return this.searchUsersUseCase
  }

  static getGetRecentUsersUseCase(): GetRecentUsersUseCase {
    return this.getRecentUsersUseCase
  }

  // Getters for use cases - Network
  static getRequestConnectionUseCase(): RequestConnectionUseCase {
    return this.requestConnectionUseCase
  }

  static getUpdateConnectionStatusUseCase(): UpdateConnectionStatusUseCase {
    return this.updateConnectionStatusUseCase
  }

  static getGetConnectionsUseCase(): GetConnectionsUseCase {
    return this.getConnectionsUseCase
  }

  static getDeleteConnectionUseCase(): DeleteConnectionUseCase {
    return this.deleteConnectionUseCase
  }

  static getGetNetworkStatsUseCase(): GetNetworkStatsUseCase {
    return this.getNetworkStatsUseCase
  }

  static getGetMutualConnectionsUseCase(): GetMutualConnectionsUseCase {
    return this.getMutualConnectionsUseCase
  }

  static getGetConnectionStatusUseCase(): GetConnectionStatusUseCase {
    return this.getConnectionStatusUseCase
  }

  // Getters for use cases - Opportunities
  static getCreateOpportunityUseCase(): CreateOpportunityUseCase {
    return this.createOpportunityUseCase
  }

  static getGetOpportunitiesUseCase(): GetOpportunitiesUseCase {
    return this.getOpportunitiesUseCase
  }

  static getGetOpportunityUseCase(): GetOpportunityUseCase {
    return this.getOpportunityUseCase
  }

  static getGetMyOpportunitiesUseCase(): GetMyOpportunitiesUseCase {
    return this.getMyOpportunitiesUseCase
  }

  static getUpdateOpportunityUseCase(): UpdateOpportunityUseCase {
    return this.updateOpportunityUseCase
  }

  static getDeleteOpportunityUseCase(): DeleteOpportunityUseCase {
    return this.deleteOpportunityUseCase
  }

  // Getters for use cases - Messages
  static getSendMessageUseCase(): SendMessageUseCase {
    return this.sendMessageUseCase
  }

  static getGetConversationsUseCase(): GetConversationsUseCase {
    return this.getConversationsUseCase
  }

  static getGetConversationMessagesUseCase(): GetConversationMessagesUseCase {
    return this.getConversationMessagesUseCase
  }

  static getMarkMessagesAsReadUseCase(): MarkMessagesAsReadUseCase {
    return this.markMessagesAsReadUseCase
  }

  static getDeleteMessageUseCase(): DeleteMessageUseCase {
    return this.deleteMessageUseCase
  }

  static getGetUnreadCountUseCase(): GetUnreadCountUseCase {
    return this.getUnreadCountUseCase
  }

  // Getters for use cases - Signup Approval
  static getSubmitSignupRequestUseCase(): SubmitSignupRequestUseCase {
    return this.submitSignupRequestUseCase
  }

  static getApproveSignupUseCase(): ApproveSignupUseCase {
    return this.approveSignupUseCase
  }

  static getRejectSignupUseCase(): RejectSignupUseCase {
    return this.rejectSignupUseCase
  }

  static getGetPendingSignupsUseCase(): GetPendingSignupsUseCase {
    return this.getPendingSignupsUseCase
  }

  // Getters for use cases - Opportunity Interests
  static getExpressInterestUseCase(): ExpressInterestUseCase {
    return this.expressInterestUseCase
  }

  static getGetOpportunityInterestsUseCase(): GetOpportunityInterestsUseCase {
    return this.getOpportunityInterestsUseCase
  }

  static getGetUserInterestsUseCase(): GetUserInterestsUseCase {
    return this.getUserInterestsUseCase
  }

  static getWithdrawInterestUseCase(): WithdrawInterestUseCase {
    return this.withdrawInterestUseCase
  }
}
