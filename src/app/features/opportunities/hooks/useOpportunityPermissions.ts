// ABOUTME: Business hook for opportunity edit/delete permissions
// ABOUTME: Checks if user can modify a specific opportunity

import { useMemo } from 'react'
import { useAuthContext } from '@/app/features/auth/hooks/useAuthContext'
import { useUserRoles } from '@/app/features/auth/hooks/useUserRoles'
import { useCityPermissions } from '@/app/features/cities/hooks/useCityPermissions'
import type { Opportunity } from '../data/schemas/opportunity.schema'

/**
 * Hook to check opportunity edit/delete permissions
 *
 * Rules:
 * - Creator can always edit/delete
 * - City managers of the opportunity's city can edit/delete
 * - Admins can always edit/delete
 *
 * @param opportunity - The opportunity to check permissions for
 * @returns Permission flags for edit and delete
 */
export const useOpportunityPermissions = (opportunity: Opportunity) => {
  const { user } = useAuthContext()
  const { isAdmin } = useUserRoles()
  const { canManageCity } = useCityPermissions(opportunity.city_id)

  const permissions = useMemo(() => {
    if (!user) {
      return { canEdit: false, canDelete: false }
    }

    // Admin puede todo
    if (isAdmin) {
      return { canEdit: true, canDelete: true }
    }

    // Creador puede editar y eliminar
    const isCreator = user.id === opportunity.created_by

    // Gestor de la ciudad puede editar y eliminar
    const isCityManager = canManageCity

    const canModify = isCreator || isCityManager

    return {
      canEdit: canModify,
      canDelete: canModify
    }
  }, [user, isAdmin, opportunity.created_by, opportunity.city_id, canManageCity])

  return permissions
}
