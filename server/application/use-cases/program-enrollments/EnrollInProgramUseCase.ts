// ABOUTME: Use case for enrolling a user in a program
// ABOUTME: Validates program availability and prevents duplicate enrollments

import { v4 as uuidv4 } from 'uuid'
import { ProgramEnrollment } from '../../../domain/entities/ProgramEnrollment'
import { ProgramRepository } from '../../ports/ProgramRepository'
import { ProgramEnrollmentRepository } from '../../ports/ProgramEnrollmentRepository'

export interface EnrollInProgramDTO {
  programId: string
  userId: string
}

/**
 * EnrollInProgramUseCase
 *
 * Enrolls a user in a program.
 * Validates that program exists, is accepting enrollments, and user isn't already enrolled.
 */
export class EnrollInProgramUseCase {
  constructor(
    private programRepository: ProgramRepository,
    private enrollmentRepository: ProgramEnrollmentRepository
  ) {}

  async execute(dto: EnrollInProgramDTO): Promise<ProgramEnrollment> {
    // Check if program exists
    const program = await this.programRepository.findById(dto.programId)
    if (!program) {
      throw new Error('Program not found')
    }

    // Check if program is accepting enrollments
    if (!program.isAcceptingEnrollments()) {
      if (program.isFull()) {
        throw new Error('Program is full')
      }
      if (program.hasStarted()) {
        throw new Error('Program has already started')
      }
      throw new Error('Program is not accepting enrollments')
    }

    // Check if user is already enrolled
    const existingEnrollment = await this.enrollmentRepository.findByProgramAndUser(
      dto.programId,
      dto.userId
    )
    if (existingEnrollment) {
      if (existingEnrollment.isActive()) {
        // Return existing enrollment instead of throwing error
        // This makes the operation idempotent
        return existingEnrollment
      }
      if (existingEnrollment.isCompleted()) {
        throw new Error('Already completed this program')
      }
      // If dropped or rejected, allow re-enrollment
      existingEnrollment.reenroll()
      return await this.enrollmentRepository.update(existingEnrollment)
    }

    // Create new enrollment
    const enrollment = ProgramEnrollment.createNew(
      uuidv4(),
      dto.programId,
      dto.userId
    )

    // Persist
    return await this.enrollmentRepository.create(enrollment)
  }
}
