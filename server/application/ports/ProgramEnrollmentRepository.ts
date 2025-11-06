// ABOUTME: ProgramEnrollmentRepository port interface defining enrollment data access operations
// ABOUTME: Follows hexagonal architecture - defines contract for infrastructure adapters

import { ProgramEnrollment, EnrollmentStatus } from '../../domain/entities/ProgramEnrollment'

export interface EnrollmentWithUserAndProgram {
  enrollment: ProgramEnrollment
  user: {
    id: string
    name: string
    avatar_url: string | null
    email: string
  }
  program: {
    id: string
    title: string
    type: string
  }
}

export interface FilterEnrollmentsParams {
  programId?: string
  userId?: string
  status?: EnrollmentStatus
}

/**
 * ProgramEnrollmentRepository Port
 *
 * Defines the contract for program enrollment data persistence.
 * Implementations must be provided in the infrastructure layer.
 */
export interface ProgramEnrollmentRepository {
  /**
   * Find an enrollment by ID
   */
  findById(id: string): Promise<ProgramEnrollment | null>

  /**
   * Find enrollment by ID with user and program info
   */
  findByIdWithDetails(id: string): Promise<EnrollmentWithUserAndProgram | null>

  /**
   * Get all enrollments with optional filters
   */
  findAll(filters?: FilterEnrollmentsParams): Promise<EnrollmentWithUserAndProgram[]>

  /**
   * Get enrollments for a specific program
   */
  findByProgram(programId: string): Promise<EnrollmentWithUserAndProgram[]>

  /**
   * Get enrollments for a specific user
   */
  findByUser(userId: string): Promise<EnrollmentWithUserAndProgram[]>

  /**
   * Find enrollment by program and user
   */
  findByProgramAndUser(programId: string, userId: string): Promise<ProgramEnrollment | null>

  /**
   * Create a new enrollment
   */
  create(enrollment: ProgramEnrollment): Promise<ProgramEnrollment>

  /**
   * Update an existing enrollment
   */
  update(enrollment: ProgramEnrollment): Promise<ProgramEnrollment>

  /**
   * Delete an enrollment
   */
  delete(id: string): Promise<void>

  /**
   * Check if enrollment exists
   */
  exists(id: string): Promise<boolean>

  /**
   * Check if user is enrolled in program
   */
  isUserEnrolled(programId: string, userId: string): Promise<boolean>

  /**
   * Count enrollments matching filters
   */
  count(filters?: FilterEnrollmentsParams): Promise<number>
}
