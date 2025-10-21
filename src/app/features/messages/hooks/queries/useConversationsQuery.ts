// ABOUTME: React Query hook for fetching user's conversations list
// ABOUTME: Returns all conversations with last message and unread count

import { useQuery } from '@tanstack/react-query'
import { messageService } from '../../data/services/message.service'
import type { GetConversationsResponse } from '../../data/schemas/message.schema'

/**
 * Query hook to fetch all conversations for current user
 *
 * @param options - React Query options
 * @returns Query result with array of conversations
 */
export const useConversationsQuery = (options?: { enabled?: boolean }) => {
  return useQuery<GetConversationsResponse, Error>({
    queryKey: ['conversations'],
    queryFn: async () => {
      return await messageService.getConversations()
    },
    enabled: options?.enabled !== false,
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 30 * 1000 // Auto-refetch every 30 seconds for new messages
  })
}
