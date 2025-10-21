// ABOUTME: Use case for checking connection status between current user and another user
// ABOUTME: Returns null if no connection exists, or the current connection status

import { Connection } from '../../../domain/entities/Connection'
import { ConnectionRepository } from '../../ports/ConnectionRepository'

export interface GetConnectionStatusDTO {
  currentUserId: string
  otherUserId: string
}

/**
 * GetConnectionStatusUseCase
 *
 * Checks if a connection exists between two users and returns its status.
 * Returns null if no connection exists.
 *
 * Useful for UI to show appropriate action button (Connect, Pending, Connected, etc.)
 */
export class GetConnectionStatusUseCase {
  constructor(private connectionRepository: ConnectionRepository) {}

  async execute(dto: GetConnectionStatusDTO): Promise<Connection | null> {
    return await this.connectionRepository.findBetweenUsers(
      dto.currentUserId,
      dto.otherUserId
    )
  }
}
