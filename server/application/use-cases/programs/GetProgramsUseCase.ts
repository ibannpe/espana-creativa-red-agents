// ABOUTME: Use case for getting all programs with optional filtering
// ABOUTME: Returns programs with creator information

import { ProgramRepository, FilterProgramsParams, ProgramWithCreator } from '../../ports/ProgramRepository'

/**
 * GetProgramsUseCase
 *
 * Retrieves all programs with optional filters.
 * Returns programs with creator information.
 */
export class GetProgramsUseCase {
  constructor(private programRepository: ProgramRepository) {}

  async execute(filters?: FilterProgramsParams): Promise<{ programs: ProgramWithCreator[]; total: number }> {
    const programs = await this.programRepository.findAll(filters)
    const total = await this.programRepository.count(filters)

    return { programs, total }
  }
}
