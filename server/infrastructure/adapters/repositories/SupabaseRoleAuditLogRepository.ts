// ABOUTME: Supabase implementation of RoleAuditLogRepository port
// ABOUTME: Retrieves role change audit logs with user and role details

import { SupabaseClient } from '@supabase/supabase-js'
import {
  RoleAuditLogRepository,
  RoleAuditLogEntry,
  RoleAuditLogFilters
} from '../../../application/ports/RoleAuditLogRepository'

export class SupabaseRoleAuditLogRepository implements RoleAuditLogRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async findAll(filters?: RoleAuditLogFilters): Promise<RoleAuditLogEntry[]> {
    let query = this.supabase
      .from('role_audit_log')
      .select(`
        id,
        user_id,
        role_id,
        action,
        performed_by,
        reason,
        created_at,
        metadata,
        user:users!role_audit_log_user_id_fkey(name, email),
        role:roles!role_audit_log_role_id_fkey(name),
        performer:users!role_audit_log_performed_by_fkey(name)
      `)
      .order('created_at', { ascending: false })

    // Apply filters
    if (filters?.userId) {
      query = query.eq('user_id', filters.userId)
    }

    if (filters?.roleId) {
      query = query.eq('role_id', filters.roleId)
    }

    if (filters?.action) {
      query = query.eq('action', filters.action)
    }

    if (filters?.performedBy) {
      query = query.eq('performed_by', filters.performedBy)
    }

    if (filters?.fromDate) {
      query = query.gte('created_at', filters.fromDate.toISOString())
    }

    if (filters?.toDate) {
      query = query.lte('created_at', filters.toDate.toISOString())
    }

    // Apply pagination
    if (filters?.limit) {
      query = query.limit(filters.limit)
    }

    if (filters?.offset) {
      query = query.range(filters.offset, (filters.offset + (filters.limit || 50)) - 1)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`Failed to fetch audit logs: ${error.message}`)
    }

    return (data || []).map(this.mapToEntry)
  }

  async count(filters?: RoleAuditLogFilters): Promise<number> {
    let query = this.supabase
      .from('role_audit_log')
      .select('id', { count: 'exact', head: true })

    // Apply same filters as findAll
    if (filters?.userId) {
      query = query.eq('user_id', filters.userId)
    }

    if (filters?.roleId) {
      query = query.eq('role_id', filters.roleId)
    }

    if (filters?.action) {
      query = query.eq('action', filters.action)
    }

    if (filters?.performedBy) {
      query = query.eq('performed_by', filters.performedBy)
    }

    if (filters?.fromDate) {
      query = query.gte('created_at', filters.fromDate.toISOString())
    }

    if (filters?.toDate) {
      query = query.lte('created_at', filters.toDate.toISOString())
    }

    const { count, error } = await query

    if (error) {
      throw new Error(`Failed to count audit logs: ${error.message}`)
    }

    return count || 0
  }

  async findByUserId(userId: string, limit: number = 50): Promise<RoleAuditLogEntry[]> {
    return this.findAll({ userId, limit })
  }

  async findRecent(limit: number = 100): Promise<RoleAuditLogEntry[]> {
    return this.findAll({ limit })
  }

  private mapToEntry(data: any): RoleAuditLogEntry {
    return {
      id: data.id,
      userId: data.user_id,
      roleId: data.role_id,
      roleName: data.role?.name || 'Unknown',
      action: data.action,
      performedBy: data.performed_by,
      performedByName: data.performer?.name || null,
      reason: data.reason,
      createdAt: new Date(data.created_at),
      metadata: data.metadata || {},
      userName: data.user?.name || null,
      userEmail: data.user?.email || 'Unknown'
    }
  }
}
