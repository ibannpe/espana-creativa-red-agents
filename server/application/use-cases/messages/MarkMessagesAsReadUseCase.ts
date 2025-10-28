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
    console.log('[MarkMessagesAsReadUseCase] Execute called with:', {
      userId: dto.userId,
      messageIds: dto.messageIds
    })

    if (dto.messageIds.length === 0) {
      throw new Error('No message IDs provided')
    }

    // Validate all messages exist and user is recipient
    for (const messageId of dto.messageIds) {
      console.log(`[MarkMessagesAsReadUseCase] Validating message ${messageId}`)
      const message = await this.messageRepository.findById(messageId)

      if (!message) {
        console.error(`[MarkMessagesAsReadUseCase] Message ${messageId} not found`)
        throw new Error(`Message ${messageId} not found`)
      }

      console.log(`[MarkMessagesAsReadUseCase] Message ${messageId} found:`, {
        recipientId: message.recipientId,
        senderId: message.senderId,
        isRecipient: message.isRecipient(dto.userId)
      })

      if (!message.isRecipient(dto.userId)) {
        console.error(`[MarkMessagesAsReadUseCase] User ${dto.userId} is not recipient of message ${messageId}`)
        throw new Error('Unauthorized: Only recipient can mark messages as read')
      }
    }

    // Mark all as read
    console.log('[MarkMessagesAsReadUseCase] All validations passed, marking as read')
    const count = await this.messageRepository.markAsRead(dto.messageIds)
    console.log('[MarkMessagesAsReadUseCase] Marked', count, 'messages as read')
    return count
  }
}
