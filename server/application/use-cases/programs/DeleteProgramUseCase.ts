// ABOUTME: Use case for deleting a program
// ABOUTME: Validates ownership before deletion

import { ProgramRepository } from '../../ports/ProgramRepository'

export interface DeleteProgramDTO {
  id: string
  userId: string
}

/**
 * DeleteProgramUseCase
 *
 * Deletes a program.
 * Only the creator can delete their program.
 */
export class DeleteProgramUseCase {
  constructor(private programRepository: ProgramRepository) {}

  async execute(dto: DeleteProgramDTO): Promise<void> {
    // Find existing program
    const program = await this.programRepository.findById(dto.id)
    if (!program) {
      throw new Error('Program not found')
    }

    // Verify ownership
    if (!program.isCreator(dto.userId)) {
      throw new Error('Not authorized to delete this program')
    }

    // Delete
    await this.programRepository.delete(dto.id)
  }
}
