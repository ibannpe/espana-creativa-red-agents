// ABOUTME: Supabase implementation of IPendingSignupRepository
// ABOUTME: Handles persistence of pending signup requests with database mapping

import { SupabaseClient } from '@supabase/supabase-js'
import { IPendingSignupRepository } from '../../../application/ports/IPendingSignupRepository'
import { PendingSignup } from '../../../domain/entities/PendingSignup'
import { PendingSignupId } from '../../../domain/value-objects/PendingSignupId'
import { ApprovalToken } from '../../../domain/value-objects/ApprovalToken'
import { Email } from '../../../domain/value-objects/Email'
import { SignupStatus } from '../../../domain/value-objects/SignupStatus'
import { UserId } from '../../../domain/value-objects/UserId'

export class SupabasePendingSignupRepository implements IPendingSignupRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async save(signup: PendingSignup): Promise<void> {
    const primitives = signup.toPrimitives()

    const { error } = await this.supabase
      .from('pending_signups')
      .insert({
        id: primitives.id,
        email: primitives.email,
        name: primitives.name,
        surname: primitives.surname,
        approval_token: primitives.approvalToken,
        status: primitives.status,
        ip_address: primitives.ipAddress,
        user_agent: primitives.userAgent
      })

    if (error) {
      throw new Error(`Failed to save pending signup: ${error.message}`)
    }
  }

  async update(signup: PendingSignup): Promise<void> {
    const primitives = signup.toPrimitives()

    const { error } = await this.supabase
      .from('pending_signups')
      .update({
        status: primitives.status,
        approved_at: primitives.approvedAt,
        approved_by: primitives.approvedBy,
        rejected_at: primitives.rejectedAt,
        rejected_by: primitives.rejectedBy,
        token_used_at: primitives.tokenUsedAt
      })
      .eq('id', primitives.id)

    if (error) {
      throw new Error(`Failed to update pending signup: ${error.message}`)
    }
  }

  async findById(id: PendingSignupId): Promise<PendingSignup | null> {
    const { data, error } = await this.supabase
      .from('pending_signups')
      .select('*')
      .eq('id', id.getValue())
      .single()

    if (error || !data) {
      return null
    }

    return this.toDomain(data)
  }

  async findByEmail(email: Email): Promise<PendingSignup | null> {
    const { data, error } = await this.supabase
      .from('pending_signups')
      .select('*')
      .eq('email', email.getValue())
      .single()

    if (error || !data) {
      return null
    }

    return this.toDomain(data)
  }

  async findByToken(token: ApprovalToken): Promise<PendingSignup | null> {
    const { data, error } = await this.supabase
      .from('pending_signups')
      .select('*')
      .eq('approval_token', token.getValue())
      .single()

    if (error || !data) {
      return null
    }

    return this.toDomain(data)
  }

  async findByStatus(status: SignupStatus, limit = 20, offset = 0): Promise<PendingSignup[]> {
    const { data, error } = await this.supabase
      .from('pending_signups')
      .select('*')
      .eq('status', status.getValue())
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error || !data) {
      return []
    }

    return data.map(row => this.toDomain(row))
  }

  async countByStatus(status: SignupStatus): Promise<number> {
    const { count, error } = await this.supabase
      .from('pending_signups')
      .select('*', { count: 'exact', head: true })
      .eq('status', status.getValue())

    if (error) {
      return 0
    }

    return count || 0
  }

  async deleteOldRecords(olderThanDays: number): Promise<number> {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays)

    const { data, error } = await this.supabase
      .from('pending_signups')
      .delete()
      .lt('created_at', cutoffDate.toISOString())
      .select()

    if (error) {
      return 0
    }

    return data?.length || 0
  }

  private toDomain(row: any): PendingSignup {
    return PendingSignup.create({
      id: PendingSignupId.create(row.id)!,
      email: Email.create(row.email)!,
      name: row.name,
      surname: row.surname,
      approvalToken: ApprovalToken.create(row.approval_token)!,
      status: SignupStatus.create(row.status)!,
      createdAt: new Date(row.created_at),
      approvedAt: row.approved_at ? new Date(row.approved_at) : null,
      approvedBy: row.approved_by ? UserId.create(row.approved_by)! : null,
      rejectedAt: row.rejected_at ? new Date(row.rejected_at) : null,
      rejectedBy: row.rejected_by ? UserId.create(row.rejected_by)! : null,
      ipAddress: row.ip_address,
      userAgent: row.user_agent,
      tokenUsedAt: row.token_used_at ? new Date(row.token_used_at) : null
    })
  }
}
