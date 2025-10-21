// ABOUTME: Use case for retrieving network statistics for a user
// ABOUTME: Returns total connections, pending requests, and sent requests counts

import { ConnectionRepository, NetworkStats } from '../../ports/ConnectionRepository'

export interface GetNetworkStatsDTO {
  userId: string
}

/**
 * GetNetworkStatsUseCase
 *
 * Retrieves network statistics for a user including:
 * - Total accepted connections
 * - Pending received requests
 * - Pending sent requests
 */
export class GetNetworkStatsUseCase {
  constructor(private connectionRepository: ConnectionRepository) {}

  async execute(dto: GetNetworkStatsDTO): Promise<NetworkStats> {
    return await this.connectionRepository.getNetworkStats(dto.userId)
  }
}
