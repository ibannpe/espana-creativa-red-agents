// ABOUTME: Use case for retrieving all conversations for a user
// ABOUTME: Returns list of users with last message and unread count

import { MessageRepository, Conversation } from '../../ports/MessageRepository'

export interface GetConversationsDTO {
  userId: string
}

/**
 * GetConversationsUseCase
 *
 * Retrieves all conversations for a user.
 * Each conversation includes the other user, last message, and unread count.
 */
export class GetConversationsUseCase {
  constructor(private messageRepository: MessageRepository) {}

  async execute(dto: GetConversationsDTO): Promise<Conversation[]> {
    return await this.messageRepository.findConversations(dto.userId)
  }
}
