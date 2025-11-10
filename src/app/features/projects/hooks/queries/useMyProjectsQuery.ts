// ABOUTME: React Query hook for fetching current user's project enrollments
// ABOUTME: Returns list of projects the user is enrolled in with project details

import { useQuery } from '@tanstack/react-query'
import { projectService } from '../../data/services/project.service'
import type { EnrollmentWithProject } from '../../data/schemas/enrollment.schema'

/**
 * Query hook to fetch project enrollments for current user
 *
 * @param options - React Query options
 * @returns Query result with array of user's enrollments including project details
 */
export const useMyProjectsQuery = (options?: { enabled?: boolean }) => {
  return useQuery<{ enrollments: EnrollmentWithProject[] }, Error>({
    queryKey: ['my-programs'],
    queryFn: async () => {
      return await projectService.getMyEnrollments()
    },
    enabled: options?.enabled !== false,
    staleTime: 0, // Always consider data stale to ensure UI updates immediately
    gcTime: 5 * 60 * 1000 // 5 minutes
  })
}
