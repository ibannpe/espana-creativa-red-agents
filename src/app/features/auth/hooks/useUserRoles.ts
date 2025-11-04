// ABOUTME: Hook para verificar roles del usuario autenticado
// ABOUTME: Proporciona utilidades para comprobar si el usuario tiene roles específicos

import { useAuthContext } from './useAuthContext'

// Constantes de roles basadas en la base de datos
export const ROLE_IDS = {
  ADMIN: 1,
  MENTOR: 2,
  EMPRENDEDOR: 3
} as const

export function useUserRoles() {
  const { user, isLoading } = useAuthContext()

  const hasRole = (roleId: number): boolean => {
    if (!user || !user.role_ids) return false
    return user.role_ids.includes(roleId)
  }

  const hasAnyRole = (roleIds: number[]): boolean => {
    if (!user || !user.role_ids) return false
    return roleIds.some(roleId => user.role_ids.includes(roleId))
  }

  const hasAllRoles = (roleIds: number[]): boolean => {
    if (!user || !user.role_ids) return false
    return roleIds.every(roleId => user.role_ids.includes(roleId))
  }

  return {
    isLoading,
    roleIds: user?.role_ids || [],
    isAdmin: hasRole(ROLE_IDS.ADMIN),
    isMentor: hasRole(ROLE_IDS.MENTOR),
    isEmprendedor: hasRole(ROLE_IDS.EMPRENDEDOR),
    hasRole,
    hasAnyRole,
    hasAllRoles
  }
}
