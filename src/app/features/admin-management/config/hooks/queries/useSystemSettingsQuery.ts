// ABOUTME: React Query hook for fetching all system settings
// ABOUTME: Provides caching and automatic refetching of system settings

import { useQuery } from '@tanstack/react-query'
import { systemSettingsService } from '../../data/services/config.service'

export const useSystemSettingsQuery = () => {
  return useQuery({
    queryKey: ['admin', 'config', 'settings'],
    queryFn: () => systemSettingsService.getAll(),
    staleTime: 1000 * 60 * 5 // 5 minutes
  })
}
