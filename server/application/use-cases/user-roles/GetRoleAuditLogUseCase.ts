// ABOUTME: Use case for retrieving role change audit log
// ABOUTME: Only admins can view audit logs

import { IUserRepository } from '../../ports/repositories/IUserRepository'
import {
  RoleAuditLogRepository,
  RoleAuditLogEntry,
  RoleAuditLogFilters
} from '../../ports/RoleAuditLogRepository'
import { UserId } from '../../../domain/value-objects/UserId'

export interface GetRoleAuditLogDTO {
  requestedBy: string // Admin user ID
  filters?: RoleAuditLogFilters
}

export interface GetRoleAuditLogResponse {
  logs: RoleAuditLogEntry[]
  total: number
  error: string | null
}

/**
 * GetRoleAuditLogUseCase
 *
 * Retrieves the role change audit log.
 * Only admins can view audit logs.
 */
export class GetRoleAuditLogUseCase {
  constructor(
    private userRepository: IUserRepository,
    private roleAuditLogRepository: RoleAuditLogRepository
  ) {}

  async execute(dto: GetRoleAuditLogDTO): Promise<GetRoleAuditLogResponse> {
    // 1. Validate admin user
    const adminId = UserId.create(dto.requestedBy)
    if (!adminId) {
      return { logs: [], total: 0, error: 'Invalid admin user ID' }
    }

    const admin = await this.userRepository.findById(adminId)
    if (!admin) {
      return { logs: [], total: 0, error: 'Admin user not found' }
    }

    if (!admin.isAdmin()) {
      return { logs: [], total: 0, error: 'Only admins can view audit logs' }
    }

    // 2. Fetch audit logs
    try {
      const logs = await this.roleAuditLogRepository.findAll(dto.filters)
      const total = await this.roleAuditLogRepository.count(dto.filters)

      return { logs, total, error: null }
    } catch (error) {
      return {
        logs: [],
        total: 0,
        error: error instanceof Error ? error.message : 'Failed to fetch audit logs'
      }
    }
  }
}
