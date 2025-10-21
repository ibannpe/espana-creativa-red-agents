// ABOUTME: Use case for retrieving messages in a specific conversation
// ABOUTME: Returns paginated messages between current user and another user

import { MessageRepository, MessageWithUsers, GetConversationMessagesParams } from '../../ports/MessageRepository'

export interface GetConversationMessagesDTO {
  userId: string
  otherUserId: string
  limit?: number
  offset?: number
}

/**
 * GetConversationMessagesUseCase
 *
 * Retrieves messages in a conversation between two users.
 * Supports pagination via limit/offset.
 */
export class GetConversationMessagesUseCase {
  constructor(private messageRepository: MessageRepository) {}

  async execute(dto: GetConversationMessagesDTO): Promise<MessageWithUsers[]> {
    return await this.messageRepository.findConversationMessages({
      userId: dto.userId,
      otherUserId: dto.otherUserId,
      limit: dto.limit,
      offset: dto.offset
    })
  }
}
