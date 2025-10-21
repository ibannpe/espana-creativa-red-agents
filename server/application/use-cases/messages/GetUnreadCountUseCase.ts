// ABOUTME: Use case for getting total unread message count for a user
// ABOUTME: Used for notification badges in UI

import { MessageRepository } from '../../ports/MessageRepository'

export interface GetUnreadCountDTO {
  userId: string
}

/**
 * GetUnreadCountUseCase
 *
 * Gets the total count of unread messages for a user.
 * Used for displaying notification badges.
 */
export class GetUnreadCountUseCase {
  constructor(private messageRepository: MessageRepository) {}

  async execute(dto: GetUnreadCountDTO): Promise<number> {
    return await this.messageRepository.getUnreadCount(dto.userId)
  }
}
