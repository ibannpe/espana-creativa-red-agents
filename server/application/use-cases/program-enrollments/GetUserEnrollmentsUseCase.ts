// ABOUTME: Use case for getting all enrollments for a specific user
// ABOUTME: Returns enrollments with program details

import { ProgramEnrollmentRepository, EnrollmentWithUserAndProgram } from '../../ports/ProgramEnrollmentRepository'

/**
 * GetUserEnrollmentsUseCase
 *
 * Retrieves all enrollments for a specific user.
 */
export class GetUserEnrollmentsUseCase {
  constructor(private enrollmentRepository: ProgramEnrollmentRepository) {}

  async execute(userId: string): Promise<EnrollmentWithUserAndProgram[]> {
    return await this.enrollmentRepository.findByUser(userId)
  }
}
