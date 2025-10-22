// ABOUTME: React Query hook for fetching list of pending signups
// ABOUTME: Handles caching, loading states, and automatic refetching with pagination support

import { useQuery } from '@tanstack/react-query'
import { signupApprovalService } from '../../data/services/signup-approval.service'
import { GetPendingSignupsResponse } from '../../data/schemas/signup-approval.schema'

interface UseGetPendingSignupsQueryOptions {
  status?: 'pending' | 'approved' | 'rejected'
  limit?: number
  offset?: number
  enabled?: boolean
}

export function useGetPendingSignupsQuery({
  status = 'pending',
  limit = 20,
  offset = 0,
  enabled = true
}: UseGetPendingSignupsQueryOptions = {}) {
  return useQuery<GetPendingSignupsResponse, Error>({
    queryKey: ['signupApproval', 'pendingSignups', status, limit, offset],
    queryFn: () => signupApprovalService.getPendingSignups(status, limit, offset),
    staleTime: 30 * 1000, // 30 seconds
    enabled
  })
}
