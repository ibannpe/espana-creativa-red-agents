// ABOUTME: Use case for creating a new program
// ABOUTME: Validates input and creates program with automatic status based on dates

import { Program, ProgramType } from '../../../domain/entities/Program'
import { ProgramRepository } from '../../ports/ProgramRepository'

export interface CreateProgramDTO {
  title: string
  description: string
  type: ProgramType
  startDate: Date
  endDate: Date
  duration: string
  instructor: string
  skills: string[]
  location?: string
  maxParticipants?: number
  price?: string
  imageUrl?: string
  moreInfoUrl?: string
  featured?: boolean
  createdBy: string
}

/**
 * CreateProgramUseCase
 *
 * Creates a new program with validation.
 * Status is automatically determined based on start and end dates.
 */
export class CreateProgramUseCase {
  constructor(private programRepository: ProgramRepository) {}

  async execute(dto: CreateProgramDTO): Promise<Program> {
    // Generate unique ID (will be handled by database auto-increment)
    const id = Date.now().toString()

    // Create new program using domain entity
    const program = Program.createNew(
      id,
      dto.title,
      dto.description,
      dto.type,
      dto.startDate,
      dto.endDate,
      dto.duration,
      dto.instructor,
      dto.skills,
      dto.createdBy,
      {
        location: dto.location,
        maxParticipants: dto.maxParticipants,
        price: dto.price,
        imageUrl: dto.imageUrl,
        moreInfoUrl: dto.moreInfoUrl,
        featured: dto.featured
      }
    )

    // Persist
    return await this.programRepository.create(program)
  }
}
