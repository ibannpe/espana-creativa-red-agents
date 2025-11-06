// ABOUTME: Use case for updating an existing opportunity
// ABOUTME: Enforces authorization - only creator can update their opportunities

import { Opportunity, OpportunityType } from '../../../domain/entities/Opportunity'
import { OpportunityRepository } from '../../ports/OpportunityRepository'

export interface UpdateOpportunityDTO {
  opportunityId: string
  userId: string // User making the request
  updates: {
    title?: string
    description?: string
    type?: OpportunityType
    status?: 'abierta' | 'en_progreso' | 'cerrada' | 'cancelada'
    skillsRequired?: string[]
    location?: string
    remote?: boolean
    duration?: string
    compensation?: string
  }
}

/**
 * UpdateOpportunityUseCase
 *
 * Updates an opportunity with authorization check.
 * Only the creator can update their opportunities.
 */
export class UpdateOpportunityUseCase {
  constructor(private opportunityRepository: OpportunityRepository) {}

  async execute(dto: UpdateOpportunityDTO): Promise<Opportunity> {
    const opportunity = await this.opportunityRepository.findById(dto.opportunityId)

    if (!opportunity) {
      throw new Error('Opportunity not found')
    }

    // Authorization check: only creator can update
    if (!opportunity.isCreator(dto.userId)) {
      throw new Error('Unauthorized: Only the creator can update this opportunity')
    }

    // Update using domain entity method
    opportunity.update(dto.updates)

    // Persist changes
    return await this.opportunityRepository.update(opportunity)
  }
}
