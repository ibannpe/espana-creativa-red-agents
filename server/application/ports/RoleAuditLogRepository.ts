// ABOUTME: Port (interface) for RoleAuditLog repository
// ABOUTME: Defines contract for role audit log retrieval operations

export interface RoleAuditLogEntry {
  id: number
  userId: string
  roleId: number
  roleName: string
  action: 'assigned' | 'removed'
  performedBy: string | null
  performedByName: string | null
  reason: string | null
  createdAt: Date
  metadata: Record<string, any>
  // User details
  userName: string | null
  userEmail: string
}

export interface RoleAuditLogFilters {
  userId?: string
  roleId?: number
  action?: 'assigned' | 'removed'
  performedBy?: string
  fromDate?: Date
  toDate?: Date
  limit?: number
  offset?: number
}

export interface RoleAuditLogRepository {
  /**
   * Get audit log entries with optional filters
   */
  findAll(filters?: RoleAuditLogFilters): Promise<RoleAuditLogEntry[]>

  /**
   * Get total count of audit log entries matching filters
   */
  count(filters?: RoleAuditLogFilters): Promise<number>

  /**
   * Get audit log for a specific user
   */
  findByUserId(userId: string, limit?: number): Promise<RoleAuditLogEntry[]>

  /**
   * Get recent audit log entries
   */
  findRecent(limit?: number): Promise<RoleAuditLogEntry[]>
}
