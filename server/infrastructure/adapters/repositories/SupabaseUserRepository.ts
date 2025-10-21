// ABOUTME: Supabase implementation of IUserRepository port
// ABOUTME: Handles data persistence and retrieval using Supabase client, maps DB models to domain entities

import { SupabaseClient } from '@supabase/supabase-js'
import { IUserRepository, SearchFilters } from '../../../application/ports/repositories/IUserRepository'
import { User } from '../../../domain/entities/User'
import { UserId } from '../../../domain/value-objects/UserId'
import { Email } from '../../../domain/value-objects/Email'

export class SupabaseUserRepository implements IUserRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async findById(id: UserId): Promise<User | null> {
    const { data, error } = await this.supabase
      .from('users')
      .select(`
        *,
        user_roles!inner(
          role_id
        )
      `)
      .eq('id', id.getValue())
      .single()

    if (error || !data) {
      return null
    }

    return this.mapToEntity(data)
  }

  async findByEmail(email: Email): Promise<User | null> {
    const { data, error } = await this.supabase
      .from('users')
      .select(`
        *,
        user_roles!inner(
          role_id
        )
      `)
      .eq('email', email.getValue())
      .single()

    if (error || !data) {
      return null
    }

    return this.mapToEntity(data)
  }

  async search(query: string, filters?: SearchFilters): Promise<User[]> {
    let queryBuilder = this.supabase
      .from('users')
      .select(`
        *,
        user_roles!inner(
          role_id,
          roles(name)
        )
      `)

    // Text search on name and bio
    if (query) {
      queryBuilder = queryBuilder.or(`name.ilike.%${query}%,bio.ilike.%${query}%`)
    }

    // Filter by location
    if (filters?.location) {
      queryBuilder = queryBuilder.ilike('location', `%${filters.location}%`)
    }

    // Filter by skills
    if (filters?.skills && filters.skills.length > 0) {
      queryBuilder = queryBuilder.overlaps('skills', filters.skills)
    }

    // Filter by role
    if (filters?.role) {
      queryBuilder = queryBuilder.eq('user_roles.roles.name', filters.role)
    }

    const { data, error } = await queryBuilder
      .order('updated_at', { ascending: false })
      .limit(50)

    if (error || !data) {
      return []
    }

    return data.map(row => this.mapToEntity(row))
  }

  async findAll(): Promise<User[]> {
    const { data, error } = await this.supabase
      .from('users')
      .select(`
        *,
        user_roles!inner(
          role_id
        )
      `)
      .order('created_at', { ascending: false })

    if (error || !data) {
      return []
    }

    return data.map(row => this.mapToEntity(row))
  }

  async save(user: User): Promise<User> {
    const primitives = user.toPrimitives()

    // Calculate completion percentage
    const completionPct = user.calculateCompletionPercentage().getValue()

    // Upsert user (INSERT or UPDATE if exists - handles Supabase Auth trigger that may pre-create the row)
    const { data: userData, error: userError } = await this.supabase
      .from('users')
      .upsert({
        id: primitives.id,
        email: primitives.email,
        name: primitives.name,
        avatar_url: primitives.avatarUrl,
        bio: primitives.bio,
        location: primitives.location,
        linkedin_url: primitives.linkedinUrl,
        website_url: primitives.websiteUrl,
        skills: primitives.skills,
        interests: primitives.interests,
        completed_pct: completionPct,
        created_at: primitives.createdAt.toISOString(),
        updated_at: primitives.updatedAt.toISOString()
      })
      .select()
      .single()

    if (userError) {
      throw new Error(`Failed to save user: ${userError.message}`)
    }

    // Upsert user roles (INSERT or UPDATE if exists - handles Supabase Auth trigger that may pre-create roles)
    const roleUpserts = primitives.roleIds.map(roleId => ({
      user_id: primitives.id,
      role_id: roleId
    }))

    const { error: rolesError } = await this.supabase
      .from('user_roles')
      .upsert(roleUpserts)

    if (rolesError) {
      // Rollback user insert
      await this.supabase.from('users').delete().eq('id', primitives.id)
      throw new Error(`Failed to save user roles: ${rolesError.message}`)
    }

    return user
  }

  async update(user: User): Promise<User> {
    const primitives = user.toPrimitives()

    // Calculate completion percentage
    const completionPct = user.calculateCompletionPercentage().getValue()

    const { error } = await this.supabase
      .from('users')
      .update({
        name: primitives.name,
        avatar_url: primitives.avatarUrl,
        bio: primitives.bio,
        location: primitives.location,
        linkedin_url: primitives.linkedinUrl,
        website_url: primitives.websiteUrl,
        skills: primitives.skills,
        interests: primitives.interests,
        completed_pct: completionPct,
        updated_at: primitives.updatedAt.toISOString()
      })
      .eq('id', primitives.id)

    if (error) {
      throw new Error(`Failed to update user: ${error.message}`)
    }

    return user
  }

  async delete(id: UserId): Promise<void> {
    const { error } = await this.supabase
      .from('users')
      .delete()
      .eq('id', id.getValue())

    if (error) {
      throw new Error(`Failed to delete user: ${error.message}`)
    }
  }

  // Helper method to map database row to domain entity
  private mapToEntity(data: any): User {
    const userId = UserId.create(data.id)!
    const email = Email.create(data.email)!

    // Extract role IDs from user_roles join
    const roleIds = data.user_roles ? data.user_roles.map((ur: any) => ur.role_id) : []

    return User.create({
      id: userId,
      email,
      name: data.name,
      avatarUrl: data.avatar_url,
      bio: data.bio,
      location: data.location,
      linkedinUrl: data.linkedin_url,
      websiteUrl: data.website_url,
      skills: data.skills || [],
      interests: data.interests || [],
      roleIds,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    })
  }
}
