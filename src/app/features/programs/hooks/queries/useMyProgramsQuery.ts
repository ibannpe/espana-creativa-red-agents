// ABOUTME: React Query hook for fetching current user's program enrollments
// ABOUTME: Returns list of programs the user is enrolled in with program details

import { useQuery } from '@tanstack/react-query'
import { programService } from '../../data/services/program.service'
import type { EnrollmentWithProgram } from '../../data/schemas/enrollment.schema'

/**
 * Query hook to fetch program enrollments for current user
 *
 * @param options - React Query options
 * @returns Query result with array of user's enrollments including program details
 */
export const useMyProgramsQuery = (options?: { enabled?: boolean }) => {
  return useQuery<{ enrollments: EnrollmentWithProgram[] }, Error>({
    queryKey: ['my-programs'],
    queryFn: async () => {
      return await programService.getMyEnrollments()
    },
    enabled: options?.enabled !== false,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000 // 5 minutes
  })
}
