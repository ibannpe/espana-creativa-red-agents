// ABOUTME: Use case for updating connection status (accept/reject/block)
// ABOUTME: Enforces authorization - only addressee can accept/reject pending requests

import { Connection, ConnectionStatus } from '../../../domain/entities/Connection'
import { ConnectionRepository } from '../../ports/ConnectionRepository'

export interface UpdateConnectionStatusDTO {
  connectionId: string
  newStatus: ConnectionStatus
  userId: string // User making the request
}

/**
 * UpdateConnectionStatusUseCase
 *
 * Updates connection status with proper authorization checks.
 *
 * Rules:
 * - Only addressee can accept/reject pending requests
 * - Anyone involved can block
 * - Uses domain entity methods to ensure valid transitions
 */
export class UpdateConnectionStatusUseCase {
  constructor(private connectionRepository: ConnectionRepository) {}

  async execute(dto: UpdateConnectionStatusDTO): Promise<Connection> {
    const connection = await this.connectionRepository.findById(dto.connectionId)

    if (!connection) {
      throw new Error('Connection not found')
    }

    // Authorization check
    if (!connection.involvesUser(dto.userId)) {
      throw new Error('Unauthorized: You are not part of this connection')
    }

    // Apply status change using domain entity methods
    switch (dto.newStatus) {
      case 'accepted':
        // Only addressee can accept
        if (!connection.isAddressee(dto.userId)) {
          throw new Error('Only the addressee can accept a connection request')
        }
        connection.accept()
        break

      case 'rejected':
        // Only addressee can reject
        if (!connection.isAddressee(dto.userId)) {
          throw new Error('Only the addressee can reject a connection request')
        }
        connection.reject()
        break

      case 'blocked':
        // Anyone involved can block
        connection.block()
        break

      case 'pending':
        throw new Error('Cannot manually set status to pending')

      default:
        throw new Error(`Invalid status: ${dto.newStatus}`)
    }

    // Persist updated connection
    return await this.connectionRepository.update(connection)
  }
}
