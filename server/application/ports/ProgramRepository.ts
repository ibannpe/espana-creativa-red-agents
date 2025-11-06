// ABOUTME: ProgramRepository port interface defining program data access operations
// ABOUTME: Follows hexagonal architecture - defines contract for infrastructure adapters

import { Program, ProgramType, ProgramStatus } from '../../domain/entities/Program'

export interface ProgramWithCreator {
  program: Program
  creator: {
    id: string
    name: string
    avatar_url: string | null
    professional_title: string | null
  }
}

export interface FilterProgramsParams {
  type?: ProgramType
  status?: ProgramStatus
  skills?: string[]
  featured?: boolean
  search?: string
  createdBy?: string
}

/**
 * ProgramRepository Port
 *
 * Defines the contract for program data persistence.
 * Implementations must be provided in the infrastructure layer.
 */
export interface ProgramRepository {
  /**
   * Find a program by ID
   */
  findById(id: string): Promise<Program | null>

  /**
   * Find program by ID with creator information
   */
  findByIdWithCreator(id: string): Promise<ProgramWithCreator | null>

  /**
   * Get all programs with optional filters
   */
  findAll(filters?: FilterProgramsParams): Promise<ProgramWithCreator[]>

  /**
   * Get programs created by a specific user
   */
  findByCreator(userId: string): Promise<ProgramWithCreator[]>

  /**
   * Create a new program
   */
  create(program: Program): Promise<Program>

  /**
   * Update an existing program
   */
  update(program: Program): Promise<Program>

  /**
   * Delete a program
   */
  delete(id: string): Promise<void>

  /**
   * Check if program exists
   */
  exists(id: string): Promise<boolean>

  /**
   * Count programs matching filters
   */
  count(filters?: FilterProgramsParams): Promise<number>
}
