// ABOUTME: Use case for deleting/removing a connection between users
// ABOUTME: Enforces authorization - only users involved in connection can delete it

import { ConnectionRepository } from '../../ports/ConnectionRepository'

export interface DeleteConnectionDTO {
  connectionId: string
  userId: string // User making the request
}

/**
 * DeleteConnectionUseCase
 *
 * Deletes a connection between users.
 *
 * Rules:
 * - Only users involved in the connection can delete it
 * - Deletes from any status (pending, accepted, rejected, blocked)
 */
export class DeleteConnectionUseCase {
  constructor(private connectionRepository: ConnectionRepository) {}

  async execute(dto: DeleteConnectionDTO): Promise<void> {
    const connection = await this.connectionRepository.findById(dto.connectionId)

    if (!connection) {
      throw new Error('Connection not found')
    }

    // Authorization check: only involved users can delete
    if (!connection.involvesUser(dto.userId)) {
      throw new Error('Unauthorized: You are not part of this connection')
    }

    // Delete connection
    await this.connectionRepository.delete(dto.connectionId)
  }
}
