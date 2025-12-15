// ABOUTME: Use case for expressing interest in an opportunity
// ABOUTME: Validates, creates interest record and sends notification email to creator

import type { IOpportunityInterestRepository } from '../../ports/IOpportunityInterestRepository'
import type { IOpportunityRepository } from '../../ports/IOpportunityRepository'
import type { IUserRepository } from '../../ports/repositories/IUserRepository'
import type { IEmailService } from '../../ports/services/IEmailService'
import type { OpportunityInterest, CreateOpportunityInterestData } from '../../../domain/entities/OpportunityInterest'
import { Email } from '../../../domain/value-objects/Email'
import { UserId } from '../../../domain/value-objects/UserId'

export class ExpressInterestUseCase {
  constructor(
    private opportunityInterestRepository: IOpportunityInterestRepository,
    private opportunityRepository: IOpportunityRepository,
    private userRepository: IUserRepository,
    private emailService: IEmailService
  ) {}

  async execute(data: CreateOpportunityInterestData): Promise<OpportunityInterest> {
    // Verify opportunity exists
    const opportunityWithCreator = await this.opportunityRepository.findByIdWithCreator(data.opportunityId)
    if (!opportunityWithCreator) {
      throw new Error('Opportunity not found')
    }

    const { opportunity, creator: opportunityCreator } = opportunityWithCreator

    // Check if opportunity is open
    if (opportunity.status !== 'abierta') {
      throw new Error('Cannot express interest in a closed opportunity')
    }

    // Check if user is the creator
    if (opportunity.createdBy === data.userId) {
      throw new Error('Cannot express interest in your own opportunity')
    }

    // Check if user has already expressed interest
    const hasInterest = await this.opportunityInterestRepository.hasUserExpressedInterest(
      data.opportunityId,
      data.userId
    )

    if (hasInterest) {
      throw new Error('You have already expressed interest in this opportunity')
    }

    // Create interest
    const interest = await this.opportunityInterestRepository.create(data)

    // Get interested user and creator info for email notification
    const [interestedUser, creator] = await Promise.all([
      this.userRepository.findById(UserId.create(data.userId)),
      this.userRepository.findById(UserId.create(opportunity.createdBy))
    ])

    // Send notification email to opportunity creator
    console.log('📧 [ExpressInterestUseCase] Preparing to send email notification')
    console.log('📧 [ExpressInterestUseCase] Creator:', {
      hasCreator: !!creator,
      hasEmail: !!creator?.email,
      email: creator?.email,
      name: creator?.name
    })
    console.log('📧 [ExpressInterestUseCase] Interested user:', {
      hasUser: !!interestedUser,
      name: interestedUser?.name
    })

    if (creator && creator.email && interestedUser) {
      try {
        console.log('📧 [ExpressInterestUseCase] Creating Email value object...')
        const creatorEmail = Email.create(creator.email)
        console.log('📧 [ExpressInterestUseCase] Calling sendOpportunityInterestEmail...')

        const result = await this.emailService.sendOpportunityInterestEmail(
          creatorEmail,
          creator.name || 'Usuario',
          interestedUser.name || 'Un usuario',
          opportunity.title
        )

        console.log('📧 [ExpressInterestUseCase] Email send result:', result)

        if (!result.success) {
          console.error('❌ [ExpressInterestUseCase] Email failed to send:', result.error)
        } else {
          console.log('✅ [ExpressInterestUseCase] Email sent successfully! Message ID:', result.messageId)
        }
      } catch (emailError) {
        // Log error but don't fail the operation if email fails
        console.error('❌ [ExpressInterestUseCase] Exception while sending email:', emailError)
      }
    } else {
      console.warn('⚠️ [ExpressInterestUseCase] Skipping email - missing required data')
    }

    return interest
  }
}
