// ABOUTME: Supabase implementation of OpportunityRepository port
// ABOUTME: Handles opportunity data persistence with advanced filtering capabilities

import { SupabaseClient } from '@supabase/supabase-js'
import { Opportunity, OpportunityType, OpportunityStatus } from '../../../domain/entities/Opportunity'
import {
  OpportunityRepository,
  OpportunityWithCreator,
  FilterOpportunitiesParams
} from '../../../application/ports/OpportunityRepository'

interface OpportunityRow {
  id: string
  title: string
  description: string
  type: OpportunityType
  status: OpportunityStatus
  skills_required: string[]
  location: string | null
  remote: boolean
  duration: string | null
  compensation: string | null
  created_by: string
  created_at: string
  updated_at: string
}

interface UserRow {
  id: string
  name: string
  avatar_url: string | null
  professional_title: string | null
}

/**
 * SupabaseOpportunityRepository
 *
 * Infrastructure adapter for opportunity persistence using Supabase.
 * Implements OpportunityRepository port from application layer.
 */
export class SupabaseOpportunityRepository implements OpportunityRepository {
  constructor(private supabase: SupabaseClient) {}

  async findById(id: string): Promise<Opportunity | null> {
    const { data, error } = await this.supabase
      .from('opportunities')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      return null
    }

    return this.toDomain(data)
  }

  async findByIdWithCreator(id: string): Promise<OpportunityWithCreator | null> {
    const { data, error } = await this.supabase
      .from('opportunities')
      .select(`
        *,
        creator:users!opportunities_created_by_fkey(id, name, avatar_url)
      `)
      .eq('id', id)
      .single()

    if (error || !data) {
      return null
    }

    return {
      opportunity: this.toDomain(data),
      creator: {
        id: data.creator.id,
        name: data.creator.name,
        avatar_url: data.creator.avatar_url,
        professional_title: null
      }
    }
  }

  async findAll(filters?: FilterOpportunitiesParams): Promise<OpportunityWithCreator[]> {
    let query = this.supabase
      .from('opportunities')
      .select(`
        *,
        creator:users!opportunities_created_by_fkey(id, name, avatar_url)
      `)

    // Apply filters
    if (filters?.type) {
      query = query.eq('type', filters.type)
    }

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }

    if (filters?.remote !== undefined) {
      query = query.eq('remote', filters.remote)
    }

    if (filters?.createdBy) {
      query = query.eq('created_by', filters.createdBy)
    }

    // Skills filter (array contains)
    if (filters?.skills && filters.skills.length > 0) {
      query = query.contains('skills_required', filters.skills)
    }

    // Text search (title or description)
    if (filters?.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
    }

    // Order by created_at descending (newest first)
    query = query.order('created_at', { ascending: false })

    const { data, error } = await query

    if (error) {
      console.error('[SupabaseOpportunityRepository] Error fetching opportunities:', error)
      return []
    }

    if (!data) {
      console.log('[SupabaseOpportunityRepository] No data returned from query')
      return []
    }

    return data.map((row: any) => ({
      opportunity: this.toDomain(row),
      creator: {
        id: row.creator.id,
        name: row.creator.name,
        avatar_url: row.creator.avatar_url,
        professional_title: null
      }
    }))
  }

  async findByCreator(userId: string): Promise<OpportunityWithCreator[]> {
    return await this.findAll({ createdBy: userId })
  }

  async create(opportunity: Opportunity): Promise<Opportunity> {
    const row = this.toRow(opportunity)

    // Omit id for insert - let database generate it
    const { id, ...insertRow } = row

    const { data, error } = await this.supabase
      .from('opportunities')
      .insert(insertRow)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create opportunity: ${error.message}`)
    }

    return this.toDomain(data)
  }

  async update(opportunity: Opportunity): Promise<Opportunity> {
    const row = this.toRow(opportunity)

    const { data, error } = await this.supabase
      .from('opportunities')
      .update(row)
      .eq('id', opportunity.id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update opportunity: ${error.message}`)
    }

    return this.toDomain(data)
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase.from('opportunities').delete().eq('id', id)

    if (error) {
      throw new Error(`Failed to delete opportunity: ${error.message}`)
    }
  }

  async exists(id: string): Promise<boolean> {
    const { count } = await this.supabase
      .from('opportunities')
      .select('*', { count: 'exact', head: true })
      .eq('id', id)

    return (count || 0) > 0
  }

  async count(filters?: FilterOpportunitiesParams): Promise<number> {
    let query = this.supabase
      .from('opportunities')
      .select('*', { count: 'exact', head: true })

    if (filters?.type) {
      query = query.eq('type', filters.type)
    }

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }

    if (filters?.remote !== undefined) {
      query = query.eq('remote', filters.remote)
    }

    if (filters?.createdBy) {
      query = query.eq('created_by', filters.createdBy)
    }

    if (filters?.skills && filters.skills.length > 0) {
      query = query.contains('skills_required', filters.skills)
    }

    if (filters?.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
    }

    const { count } = await query

    return count || 0
  }

  /**
   * Convert database row to domain entity
   */
  private toDomain(row: OpportunityRow): Opportunity {
    return Opportunity.create({
      id: String(row.id),
      title: row.title,
      description: row.description,
      type: row.type,
      status: row.status,
      skillsRequired: row.skills_required,
      location: row.location || undefined,
      remote: row.remote,
      duration: row.duration || undefined,
      compensation: row.compensation || undefined,
      createdBy: row.created_by,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    })
  }

  /**
   * Convert domain entity to database row
   */
  private toRow(opportunity: Opportunity): Omit<OpportunityRow, 'created_at' | 'updated_at'> & {
    created_at?: string
    updated_at?: string
  } {
    return {
      id: opportunity.id,
      title: opportunity.title,
      description: opportunity.description,
      type: opportunity.type,
      status: opportunity.status,
      skills_required: opportunity.skillsRequired,
      location: opportunity.location || null,
      remote: opportunity.remote,
      duration: opportunity.duration || null,
      compensation: opportunity.compensation || null,
      created_by: opportunity.createdBy,
      created_at: opportunity.createdAt.toISOString(),
      updated_at: opportunity.updatedAt.toISOString()
    }
  }
}
