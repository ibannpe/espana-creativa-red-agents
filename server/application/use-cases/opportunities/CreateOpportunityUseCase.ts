// ABOUTME: Use case for creating a new opportunity
// ABOUTME: Validates input and creates opportunity with 'abierta' status

import { v4 as uuidv4 } from 'uuid'
import { Opportunity, OpportunityType } from '../../../domain/entities/Opportunity'
import { OpportunityRepository } from '../../ports/OpportunityRepository'

export interface CreateOpportunityDTO {
  title: string
  description: string
  type: OpportunityType
  skillsRequired: string[]
  location?: string
  remote?: boolean
  duration?: string
  compensation?: string
  createdBy: string
}

/**
 * CreateOpportunityUseCase
 *
 * Creates a new opportunity with validation.
 * New opportunities start with 'abierta' status.
 */
export class CreateOpportunityUseCase {
  constructor(private opportunityRepository: OpportunityRepository) {}

  async execute(dto: CreateOpportunityDTO): Promise<Opportunity> {
    // Create new opportunity using domain entity
    const opportunity = Opportunity.createNew(
      uuidv4(),
      dto.title,
      dto.description,
      dto.type,
      dto.skillsRequired,
      dto.createdBy,
      {
        location: dto.location,
        remote: dto.remote,
        duration: dto.duration,
        compensation: dto.compensation
      }
    )

    // Persist
    return await this.opportunityRepository.create(opportunity)
  }
}
