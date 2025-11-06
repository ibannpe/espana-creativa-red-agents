// ABOUTME: Use case for getting a single program by ID
// ABOUTME: Returns program with creator information

import { ProgramRepository, ProgramWithCreator } from '../../ports/ProgramRepository'

/**
 * GetProgramUseCase
 *
 * Retrieves a single program by ID with creator information.
 */
export class GetProgramUseCase {
  constructor(private programRepository: ProgramRepository) {}

  async execute(id: string): Promise<ProgramWithCreator | null> {
    return await this.programRepository.findByIdWithCreator(id)
  }
}
