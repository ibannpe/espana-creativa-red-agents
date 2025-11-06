// ABOUTME: Use case for updating an existing program
// ABOUTME: Validates ownership and applies updates

import { Program, ProgramType, ProgramStatus } from '../../../domain/entities/Program'
import { ProgramRepository } from '../../ports/ProgramRepository'

export interface UpdateProgramDTO {
  id: string
  userId: string
  title?: string
  description?: string
  type?: ProgramType
  startDate?: Date
  endDate?: Date
  duration?: string
  location?: string
  maxParticipants?: number
  instructor?: string
  status?: ProgramStatus
  featured?: boolean
  skills?: string[]
  price?: string
  imageUrl?: string
}

/**
 * UpdateProgramUseCase
 *
 * Updates an existing program.
 * Only the creator can update their program.
 */
export class UpdateProgramUseCase {
  constructor(private programRepository: ProgramRepository) {}

  async execute(dto: UpdateProgramDTO): Promise<Program> {
    // Find existing program
    const program = await this.programRepository.findById(dto.id)
    if (!program) {
      throw new Error('Program not found')
    }

    // Verify ownership
    if (!program.isCreator(dto.userId)) {
      throw new Error('Not authorized to update this program')
    }

    // Apply updates using domain entity
    program.update({
      title: dto.title,
      description: dto.description,
      type: dto.type,
      startDate: dto.startDate,
      endDate: dto.endDate,
      duration: dto.duration,
      location: dto.location,
      maxParticipants: dto.maxParticipants,
      instructor: dto.instructor,
      status: dto.status,
      featured: dto.featured,
      skills: dto.skills,
      price: dto.price,
      imageUrl: dto.imageUrl
    })

    // Persist
    return await this.programRepository.update(program)
  }
}
