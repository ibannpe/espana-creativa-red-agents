// ABOUTME: Use case for canceling a program enrollment
// ABOUTME: Validates enrollment exists and belongs to user, then deletes it

import { ProgramEnrollmentRepository } from '../../ports/ProgramEnrollmentRepository'

export interface CancelEnrollmentRequest {
  enrollmentId: string
  userId: string
}

export class CancelEnrollmentUseCase {
  constructor(private enrollmentRepository: ProgramEnrollmentRepository) {}

  async execute(request: CancelEnrollmentRequest): Promise<void> {
    const { enrollmentId, userId } = request

    // Verify enrollment exists
    const enrollment = await this.enrollmentRepository.findById(enrollmentId)
    if (!enrollment) {
      throw new Error('Enrollment not found')
    }

    // Verify enrollment belongs to the user
    if (enrollment.userId !== userId) {
      throw new Error('Unauthorized: This enrollment does not belong to you')
    }

    // Delete enrollment
    await this.enrollmentRepository.delete(enrollmentId)
  }
}
