// ABOUTME: Use case for deleting an opportunity
// ABOUTME: Enforces authorization - only creator can delete their opportunities

import { OpportunityRepository } from '../../ports/OpportunityRepository'

export interface DeleteOpportunityDTO {
  opportunityId: string
  userId: string // User making the request
}

/**
 * DeleteOpportunityUseCase
 *
 * Deletes an opportunity with authorization check.
 * Only the creator can delete their opportunities.
 */
export class DeleteOpportunityUseCase {
  constructor(private opportunityRepository: OpportunityRepository) {}

  async execute(dto: DeleteOpportunityDTO): Promise<void> {
    const opportunity = await this.opportunityRepository.findById(dto.opportunityId)

    if (!opportunity) {
      throw new Error('Opportunity not found')
    }

    // Authorization check: only creator can delete
    if (!opportunity.isCreator(dto.userId)) {
      throw new Error('Unauthorized: Only the creator can delete this opportunity')
    }

    // Delete opportunity
    await this.opportunityRepository.delete(dto.opportunityId)
  }
}
