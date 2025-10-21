// ABOUTME: Use case for finding mutual connections between two users
// ABOUTME: Returns users that are connected to both specified users

import { ConnectionRepository, ConnectionWithUser } from '../../ports/ConnectionRepository'

export interface GetMutualConnectionsDTO {
  userId1: string
  userId2: string
}

/**
 * GetMutualConnectionsUseCase
 *
 * Finds users that are connected to both specified users.
 * Useful for "N mutual connections" feature in UI.
 */
export class GetMutualConnectionsUseCase {
  constructor(private connectionRepository: ConnectionRepository) {}

  async execute(dto: GetMutualConnectionsDTO): Promise<ConnectionWithUser[]> {
    return await this.connectionRepository.getMutualConnections(
      dto.userId1,
      dto.userId2
    )
  }
}
