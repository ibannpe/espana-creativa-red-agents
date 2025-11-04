// ABOUTME: React Query hook for fetching platform statistics
// ABOUTME: Provides loading states, error handling, and automatic cache management

import { useQuery } from '@tanstack/react-query'
import { statisticsService } from '../../data/services/statistics.service'

export const STATISTICS_QUERY_KEY = ['admin', 'statistics'] as const

export function useStatisticsQuery() {
  return useQuery({
    queryKey: STATISTICS_QUERY_KEY,
    queryFn: () => statisticsService.getStatistics(),
    staleTime: 1000 * 60 * 2, // 2 minutes
    retry: 1
  })
}
