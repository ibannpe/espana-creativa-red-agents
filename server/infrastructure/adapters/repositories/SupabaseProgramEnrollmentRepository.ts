// ABOUTME: Supabase implementation of ProgramEnrollmentRepository port
// ABOUTME: Handles program enrollment data persistence

import { SupabaseClient } from '@supabase/supabase-js'
import { ProgramEnrollment, EnrollmentStatus } from '../../../domain/entities/ProgramEnrollment'
import {
  ProgramEnrollmentRepository,
  EnrollmentWithUserAndProgram,
  FilterEnrollmentsParams
} from '../../../application/ports/ProgramEnrollmentRepository'

export class SupabaseProgramEnrollmentRepository implements ProgramEnrollmentRepository {
  constructor(private supabase: SupabaseClient) {}

  async findById(id: string): Promise<ProgramEnrollment | null> {
    const { data, error } = await this.supabase
      .from('program_enrollments')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) return null
    return this.toDomain(data)
  }

  async findByIdWithDetails(id: string): Promise<EnrollmentWithUserAndProgram | null> {
    const { data, error } = await this.supabase
      .from('program_enrollments')
      .select(`
        *,
        user:users!program_enrollments_user_id_fkey(id, name, avatar_url, email),
        program:programs!program_enrollments_program_id_fkey(id, title, type)
      `)
      .eq('id', id)
      .single()

    if (error || !data) return null

    return {
      enrollment: this.toDomain(data),
      user: data.user,
      program: data.program
    }
  }

  async findAll(filters?: FilterEnrollmentsParams): Promise<EnrollmentWithUserAndProgram[]> {
    let query = this.supabase
      .from('program_enrollments')
      .select(`
        *,
        user:users!program_enrollments_user_id_fkey(id, name, avatar_url, email),
        program:programs!program_enrollments_program_id_fkey(*)
      `)

    if (filters?.programId) query = query.eq('program_id', filters.programId)
    if (filters?.userId) query = query.eq('user_id', filters.userId)
    if (filters?.status) query = query.eq('status', filters.status)

    const { data, error } = await query
    if (error || !data) return []

    return data.map((row: any) => {
      if (!row.program) {
        throw new Error(`Program data missing for enrollment ${row.id}`)
      }

      return {
        enrollment: this.toDomain(row),
        user: row.user,
        program: {
          id: row.program.id,
          title: row.program.title,
          description: row.program.description,
          type: row.program.type,
          startDate: new Date(row.program.start_date),
          endDate: new Date(row.program.end_date),
          duration: row.program.duration,
          location: row.program.location,
          participants: row.program.participants,
          maxParticipants: row.program.max_participants,
          instructor: row.program.instructor,
          status: row.program.status,
          featured: row.program.featured,
          skills: row.program.skills || [],
          price: row.program.price,
          imageUrl: row.program.image_url,
          createdBy: row.program.created_by,
          createdAt: new Date(row.program.created_at),
          updatedAt: new Date(row.program.updated_at)
        }
      }
    })
  }

  async findByProgram(programId: string): Promise<EnrollmentWithUserAndProgram[]> {
    return this.findAll({ programId })
  }

  async findByUser(userId: string): Promise<EnrollmentWithUserAndProgram[]> {
    return this.findAll({ userId })
  }

  async findByProgramAndUser(programId: string, userId: string): Promise<ProgramEnrollment | null> {
    const { data, error } = await this.supabase
      .from('program_enrollments')
      .select('*')
      .eq('program_id', programId)
      .eq('user_id', userId)
      .single()

    if (error || !data) return null
    return this.toDomain(data)
  }

  async create(enrollment: ProgramEnrollment): Promise<ProgramEnrollment> {
    const row = this.toRow(enrollment)
    const { data, error } = await this.supabase
      .from('program_enrollments')
      .insert(row)
      .select()
      .single()

    if (error) throw new Error(`Failed to create enrollment: ${error.message}`)
    return this.toDomain(data)
  }

  async update(enrollment: ProgramEnrollment): Promise<ProgramEnrollment> {
    const row = this.toRow(enrollment)
    const { data, error } = await this.supabase
      .from('program_enrollments')
      .update(row)
      .eq('id', enrollment.id)
      .select()
      .single()

    if (error) throw new Error(`Failed to update enrollment: ${error.message}`)
    return this.toDomain(data)
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('program_enrollments')
      .delete()
      .eq('id', id)

    if (error) throw new Error(`Failed to delete enrollment: ${error.message}`)
  }

  async exists(id: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('program_enrollments')
      .select('id')
      .eq('id', id)
      .single()

    return !error && !!data
  }

  async isUserEnrolled(programId: string, userId: string): Promise<boolean> {
    const enrollment = await this.findByProgramAndUser(programId, userId)
    return enrollment !== null && enrollment.isActive()
  }

  async count(filters?: FilterEnrollmentsParams): Promise<number> {
    let query = this.supabase
      .from('program_enrollments')
      .select('id', { count: 'exact', head: true })

    if (filters?.programId) query = query.eq('program_id', filters.programId)
    if (filters?.userId) query = query.eq('user_id', filters.userId)
    if (filters?.status) query = query.eq('status', filters.status)

    const { count } = await query
    return count || 0
  }

  private toDomain(row: any): ProgramEnrollment {
    return ProgramEnrollment.create({
      id: row.id,
      programId: String(row.program_id),
      userId: row.user_id,
      status: row.status as EnrollmentStatus,
      enrolledAt: new Date(row.enrolled_at),
      completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
      rating: row.rating !== null ? row.rating : undefined,
      feedback: row.feedback !== null ? row.feedback : undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    })
  }

  private toRow(enrollment: ProgramEnrollment): any {
    const props = enrollment.toObject()
    return {
      id: props.id,
      program_id: props.programId,
      user_id: props.userId,
      status: props.status,
      enrolled_at: props.enrolledAt.toISOString(),
      completed_at: props.completedAt?.toISOString() || null,
      rating: props.rating || null,
      feedback: props.feedback || null,
      created_at: props.createdAt.toISOString(),
      updated_at: props.updatedAt.toISOString()
    }
  }
}
