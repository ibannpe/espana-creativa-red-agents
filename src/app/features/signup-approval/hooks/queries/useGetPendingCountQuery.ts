// ABOUTME: React Query hook for fetching count of pending signups
// ABOUTME: Handles caching, loading states, and automatic refetching for admin badge display

import { useQuery } from '@tanstack/react-query'
import { signupApprovalService } from '../../data/services/signup-approval.service'
import { GetPendingCountResponse } from '../../data/schemas/signup-approval.schema'

interface UseGetPendingCountQueryOptions {
  enabled?: boolean
}

export function useGetPendingCountQuery({ enabled = true }: UseGetPendingCountQueryOptions = {}) {
  return useQuery<GetPendingCountResponse, Error>({
    queryKey: ['signupApproval', 'pendingCount'],
    queryFn: () => signupApprovalService.getPendingCount(),
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes for admin notifications
    enabled
  })
}
