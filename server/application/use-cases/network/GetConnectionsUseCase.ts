// ABOUTME: Use case for retrieving user's connections with optional status filtering
// ABOUTME: Returns connections enriched with user profile information

import { ConnectionStatus } from '../../../domain/entities/Connection'
import { ConnectionRepository, ConnectionWithUser } from '../../ports/ConnectionRepository'

export interface GetConnectionsDTO {
  userId: string
  status?: ConnectionStatus
}

/**
 * GetConnectionsUseCase
 *
 * Retrieves all connections for a user, optionally filtered by status.
 * Returns connections with associated user information.
 */
export class GetConnectionsUseCase {
  constructor(private connectionRepository: ConnectionRepository) {}

  async execute(dto: GetConnectionsDTO): Promise<ConnectionWithUser[]> {
    return await this.connectionRepository.findByUser({
      userId: dto.userId,
      status: dto.status
    })
  }
}
