// ABOUTME: Use case for deleting a message
// ABOUTME: Only sender can delete their own messages

import { MessageRepository } from '../../ports/MessageRepository'

export interface DeleteMessageDTO {
  messageId: string
  userId: string // User making the request
}

/**
 * DeleteMessageUseCase
 *
 * Deletes a message.
 * Only the sender can delete their own messages.
 */
export class DeleteMessageUseCase {
  constructor(private messageRepository: MessageRepository) {}

  async execute(dto: DeleteMessageDTO): Promise<void> {
    const message = await this.messageRepository.findById(dto.messageId)

    if (!message) {
      throw new Error('Message not found')
    }

    // Authorization check: only sender can delete
    if (!message.isSender(dto.userId)) {
      throw new Error('Unauthorized: Only the sender can delete this message')
    }

    // Delete message
    await this.messageRepository.delete(dto.messageId)
  }
}
