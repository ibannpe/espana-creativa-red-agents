// ABOUTME: Use case for requesting a new connection between users
// ABOUTME: Validates business rules and prevents duplicate connection requests

import { v4 as uuidv4 } from 'uuid'
import { Connection } from '../../../domain/entities/Connection'
import { ConnectionRepository } from '../../ports/ConnectionRepository'

export interface RequestConnectionDTO {
  requesterId: string
  addresseeId: string
}

/**
 * RequestConnectionUseCase
 *
 * Business logic for creating a new connection request.
 *
 * Rules:
 * - Cannot request connection with yourself
 * - Cannot request if connection already exists
 * - Creates connection with 'pending' status
 */
export class RequestConnectionUseCase {
  constructor(private connectionRepository: ConnectionRepository) {}

  async execute(dto: RequestConnectionDTO): Promise<Connection> {
    // Business rule: Cannot connect with yourself
    if (dto.requesterId === dto.addresseeId) {
      throw new Error('Cannot create connection with yourself')
    }

    // Business rule: Cannot create duplicate connection
    const existingConnection = await this.connectionRepository.findBetweenUsers(
      dto.requesterId,
      dto.addresseeId
    )

    if (existingConnection) {
      throw new Error(
        `Connection already exists with status: ${existingConnection.status}`
      )
    }

    // Create new pending connection
    const connection = Connection.createRequest(
      uuidv4(),
      dto.requesterId,
      dto.addresseeId
    )

    // Persist
    return await this.connectionRepository.create(connection)
  }
}
