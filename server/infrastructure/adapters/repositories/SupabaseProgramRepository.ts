// ABOUTME: Supabase implementation of ProgramRepository port
// ABOUTME: Handles program data persistence with filtering capabilities

import { SupabaseClient } from '@supabase/supabase-js'
import { Program, ProgramType, ProgramStatus } from '../../../domain/entities/Program'
import {
  ProgramRepository,
  ProgramWithCreator,
  FilterProgramsParams
} from '../../../application/ports/ProgramRepository'

interface ProgramRow {
  id: string
  title: string
  description: string
  type: ProgramType
  start_date: string
  end_date: string
  duration: string
  location: string | null
  participants: number
  max_participants: number | null
  instructor: string
  status: ProgramStatus
  featured: boolean
  skills: string[]
  price: string | null
  image_url: string | null
  created_by: string
  created_at: string
  updated_at: string
}

/**
 * SupabaseProgramRepository
 *
 * Infrastructure adapter for program persistence using Supabase.
 * Implements ProgramRepository port from application layer.
 */
export class SupabaseProgramRepository implements ProgramRepository {
  constructor(private supabase: SupabaseClient) {}

  async findById(id: string): Promise<Program | null> {
    const { data, error} = await this.supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      return null
    }

    return this.toDomain(data)
  }

  async findByIdWithCreator(id: string): Promise<ProgramWithCreator | null> {
    const { data, error } = await this.supabase
      .from('projects')
      .select(`
        *,
        creator:users!programs_created_by_fkey(id, name, avatar_url, bio)
      `)
      .eq('id', id)
      .single()

    if (error || !data) {
      return null
    }

    return {
      program: this.toDomain(data),
      creator: {
        id: data.creator.id,
        name: data.creator.name,
        avatar_url: data.creator.avatar_url,
        professional_title: data.creator.bio || null
      }
    }
  }

  async findAll(filters?: FilterProgramsParams): Promise<ProgramWithCreator[]> {
    let query = this.supabase
      .from('projects')
      .select(`
        *,
        creator:users!programs_created_by_fkey(id, name, avatar_url, bio)
      `)

    // Apply filters
    if (filters?.type) {
      query = query.eq('type', filters.type)
    }

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }

    if (filters?.featured !== undefined) {
      query = query.eq('featured', filters.featured)
    }

    if (filters?.createdBy) {
      query = query.eq('created_by', filters.createdBy)
    }

    // Skills filter (array contains)
    if (filters?.skills && filters.skills.length > 0) {
      query = query.contains('skills', filters.skills)
    }

    // Text search (title or description)
    if (filters?.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
    }

    // Order by start_date descending (newest first)
    query = query.order('start_date', { ascending: false })

    const { data, error } = await query

    if (error) {
      console.error('[SupabaseProgramRepository] Error fetching programs:', error)
      return []
    }

    if (!data) {
      return []
    }

    return data.map((row: any) => ({
      program: this.toDomain(row),
      creator: {
        id: row.creator.id,
        name: row.creator.name,
        avatar_url: row.creator.avatar_url,
        professional_title: row.creator.bio || null
      }
    }))
  }

  async findByCreator(userId: string): Promise<ProgramWithCreator[]> {
    return await this.findAll({ createdBy: userId })
  }

  async create(program: Program): Promise<Program> {
    const row = this.toRow(program)

    const { data, error } = await this.supabase
      .from('projects')
      .insert(row)
      .select()
      .single()

    if (error) {
      console.error('[SupabaseProgramRepository] Error creating program:', error)
      throw new Error(`Failed to create program: ${error.message}`)
    }

    return this.toDomain(data)
  }

  async update(program: Program): Promise<Program> {
    const row = this.toRow(program)

    const { data, error } = await this.supabase
      .from('projects')
      .update(row)
      .eq('id', program.id)
      .select()
      .single()

    if (error) {
      console.error('[SupabaseProgramRepository] Error updating program:', error)
      throw new Error(`Failed to update program: ${error.message}`)
    }

    return this.toDomain(data)
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('projects')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('[SupabaseProgramRepository] Error deleting program:', error)
      throw new Error(`Failed to delete program: ${error.message}`)
    }
  }

  async exists(id: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('projects')
      .select('id')
      .eq('id', id)
      .single()

    return !error && !!data
  }

  async count(filters?: FilterProgramsParams): Promise<number> {
    let query = this.supabase
      .from('projects')
      .select('id', { count: 'exact', head: true })

    // Apply same filters as findAll
    if (filters?.type) {
      query = query.eq('type', filters.type)
    }

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }

    if (filters?.featured !== undefined) {
      query = query.eq('featured', filters.featured)
    }

    if (filters?.createdBy) {
      query = query.eq('created_by', filters.createdBy)
    }

    if (filters?.skills && filters.skills.length > 0) {
      query = query.contains('skills', filters.skills)
    }

    if (filters?.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
    }

    const { count } = await query

    return count || 0
  }

  private toDomain(row: ProgramRow): Program {
    return Program.create({
      id: String(row.id),
      title: row.title,
      description: row.description,
      type: row.type,
      startDate: new Date(row.start_date),
      endDate: new Date(row.end_date),
      duration: row.duration,
      location: row.location || undefined,
      participants: row.participants,
      maxParticipants: row.max_participants || undefined,
      instructor: row.instructor,
      status: row.status,
      featured: row.featured,
      skills: row.skills,
      price: row.price || undefined,
      imageUrl: row.image_url || undefined,
      createdBy: row.created_by,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    })
  }

  private toRow(program: Program): Omit<ProgramRow, 'id'> {
    const props = program.toObject()
    return {
      title: props.title,
      description: props.description,
      type: props.type,
      start_date: props.startDate.toISOString(),
      end_date: props.endDate.toISOString(),
      duration: props.duration,
      location: props.location || null,
      participants: props.participants,
      max_participants: props.maxParticipants || null,
      instructor: props.instructor,
      status: props.status,
      featured: props.featured,
      skills: props.skills,
      price: props.price || null,
      image_url: props.imageUrl || null,
      created_by: props.createdBy,
      created_at: props.createdAt.toISOString(),
      updated_at: props.updatedAt.toISOString()
    }
  }
}
