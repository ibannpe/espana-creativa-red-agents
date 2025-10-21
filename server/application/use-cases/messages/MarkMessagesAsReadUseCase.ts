// ABOUTME: Use case for marking messages as read
// ABOUTME: Only recipient can mark messages as read

import { MessageRepository } from '../../ports/MessageRepository'

export interface MarkMessagesAsReadDTO {
  messageIds: string[]
  userId: string // User marking as read (must be recipient)
}

/**
 * MarkMessagesAsReadUseCase
 *
 * Marks multiple messages as read.
 * Validates that user is the recipient before marking.
 */
export class MarkMessagesAsReadUseCase {
  constructor(private messageRepository: MessageRepository) {}

  async execute(dto: MarkMessagesAsReadDTO): Promise<number> {
    if (dto.messageIds.length === 0) {
      throw new Error('No message IDs provided')
    }

    // Validate all messages exist and user is recipient
    for (const messageId of dto.messageIds) {
      const message = await this.messageRepository.findById(messageId)

      if (!message) {
        throw new Error(`Message ${messageId} not found`)
      }

      if (!message.isRecipient(dto.userId)) {
        throw new Error('Unauthorized: Only recipient can mark messages as read')
      }
    }

    // Mark all as read
    return await this.messageRepository.markAsRead(dto.messageIds)
  }
}
