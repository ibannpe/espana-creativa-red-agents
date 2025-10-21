// ABOUTME: React Query hook for fetching total unread message count
// ABOUTME: Used for displaying notification badge in header/navigation

import { useQuery } from '@tanstack/react-query'
import { messageService } from '../../data/services/message.service'
import type { GetUnreadCountResponse } from '../../data/schemas/message.schema'

/**
 * Query hook to fetch total unread message count for current user
 *
 * @param options - React Query options
 * @returns Query result with unread count
 */
export const useUnreadCountQuery = (options?: { enabled?: boolean }) => {
  return useQuery<GetUnreadCountResponse, Error>({
    queryKey: ['unread-count'],
    queryFn: async () => {
      return await messageService.getUnreadCount()
    },
    enabled: options?.enabled !== false,
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 30 * 1000 // Auto-refetch every 30 seconds
  })
}
