// ABOUTME: React Query hook for fetching a specific system setting by key
// ABOUTME: Provides caching and automatic refetching of individual setting

import { useQuery } from '@tanstack/react-query'
import { systemSettingsService } from '../../data/services/config.service'

export const useSystemSettingQuery = (key: string) => {
  return useQuery({
    queryKey: ['admin', 'config', 'settings', key],
    queryFn: () => systemSettingsService.getByKey(key),
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: !!key
  })
}
