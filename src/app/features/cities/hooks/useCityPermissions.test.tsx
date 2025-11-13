// ABOUTME: Unit tests for useCityPermissions hook
// ABOUTME: Tests permission logic for admins, city managers, and regular users

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useCityPermissions } from './useCityPermissions'
import { cityService } from '../data/services/city.service'

// Mock dependencies
vi.mock('../data/services/city.service')
vi.mock('@/app/features/auth/hooks/useUserRoles')
vi.mock('@/app/features/auth/hooks/useAuthContext', () => ({
  useAuthContext: () => ({
    isAuthenticated: true,
    user: { id: '550e8400-e29b-41d4-a716-446655440000', name: 'Test User' }
  })
}))

describe('useCityPermissions', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false }
      }
    })
    vi.clearAllMocks()
  })

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

  it('should grant full permissions to admin users', async () => {
    // Mock admin user
    const { useUserRoles } = await import('@/app/features/auth/hooks/useUserRoles')
    vi.mocked(useUserRoles).mockReturnValue({
      isAdmin: true,
      isMentor: false,
      isEmprendedor: false,
      roleIds: [1],
      isLoading: false,
      hasRole: () => true,
      hasAnyRole: () => false,
      hasAllRoles: () => false
    })

    // Mock city manager query (aunque admin no necesita estar en la lista)
    vi.mocked(cityService.getIsCityManager).mockResolvedValue({
      isCityManager: false,
      managedCities: []
    })

    const { result } = renderHook(() => useCityPermissions(1), { wrapper })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.canManageAnyCity).toBe(true)
    expect(result.current.canManageCity).toBe(true)
    expect(result.current.managedCities).toHaveLength(0)
  })

  it('should grant permissions to city manager for managed cities', async () => {
    // Mock non-admin user
    const { useUserRoles } = await import('@/app/features/auth/hooks/useUserRoles')
    vi.mocked(useUserRoles).mockReturnValue({
      isAdmin: false,
      isMentor: false,
      isEmprendedor: false,
      roleIds: [2],
      isLoading: false,
      hasRole: () => false,
      hasAnyRole: () => false,
      hasAllRoles: () => false
    })

    // Mock city manager with managed cities
    vi.mocked(cityService.getIsCityManager).mockResolvedValue({
      isCityManager: true,
      managedCities: [
        { id: 1, name: 'Madrid', slug: 'madrid' },
        { id: 2, name: 'Barcelona', slug: 'barcelona' }
      ]
    })

    const { result } = renderHook(() => useCityPermissions(1), { wrapper })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.canManageAnyCity).toBe(true)
    expect(result.current.canManageCity).toBe(true) // Ciudad 1 está en lista
    expect(result.current.managedCities).toHaveLength(2)
  })

  it('should deny permissions to city manager for unmanaged cities', async () => {
    // Mock non-admin user
    const { useUserRoles } = await import('@/app/features/auth/hooks/useUserRoles')
    vi.mocked(useUserRoles).mockReturnValue({
      isAdmin: false,
      isMentor: false,
      isEmprendedor: false,
      roleIds: [2],
      isLoading: false,
      hasRole: () => false,
      hasAnyRole: () => false,
      hasAllRoles: () => false
    })

    // Mock city manager pero sin ciudad 3
    vi.mocked(cityService.getIsCityManager).mockResolvedValue({
      isCityManager: true,
      managedCities: [
        { id: 1, name: 'Madrid', slug: 'madrid' },
        { id: 2, name: 'Barcelona', slug: 'barcelona' }
      ]
    })

    const { result } = renderHook(() => useCityPermissions(3), { wrapper })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.canManageAnyCity).toBe(true) // Es manager de otras
    expect(result.current.canManageCity).toBe(false) // Pero NO de ciudad 3
    expect(result.current.managedCities).toHaveLength(2)
  })

  it('should deny all permissions to regular users', async () => {
    // Mock regular user (not admin, not city manager)
    const { useUserRoles } = await import('@/app/features/auth/hooks/useUserRoles')
    vi.mocked(useUserRoles).mockReturnValue({
      isAdmin: false,
      isMentor: false,
      isEmprendedor: true,
      roleIds: [3],
      isLoading: false,
      hasRole: () => false,
      hasAnyRole: () => false,
      hasAllRoles: () => false
    })

    // Mock non-manager
    vi.mocked(cityService.getIsCityManager).mockResolvedValue({
      isCityManager: false,
      managedCities: []
    })

    const { result } = renderHook(() => useCityPermissions(1), { wrapper })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.canManageAnyCity).toBe(false)
    expect(result.current.canManageCity).toBe(false)
    expect(result.current.managedCities).toHaveLength(0)
  })

  it('should handle permissions without specific cityId', async () => {
    // Mock city manager
    const { useUserRoles } = await import('@/app/features/auth/hooks/useUserRoles')
    vi.mocked(useUserRoles).mockReturnValue({
      isAdmin: false,
      isMentor: false,
      isEmprendedor: false,
      roleIds: [2],
      isLoading: false,
      hasRole: () => false,
      hasAnyRole: () => false,
      hasAllRoles: () => false
    })

    vi.mocked(cityService.getIsCityManager).mockResolvedValue({
      isCityManager: true,
      managedCities: [
        { id: 1, name: 'Madrid', slug: 'madrid' }
      ]
    })

    // Sin cityId específico
    const { result } = renderHook(() => useCityPermissions(), { wrapper })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.canManageAnyCity).toBe(true)
    expect(result.current.canManageCity).toBe(true) // Sin cityId, usa canManageAnyCity
    expect(result.current.managedCities).toHaveLength(1)
  })

  it('should track loading state correctly', async () => {
    const { useUserRoles } = await import('@/app/features/auth/hooks/useUserRoles')
    vi.mocked(useUserRoles).mockReturnValue({
      isAdmin: false,
      isMentor: false,
      isEmprendedor: false,
      roleIds: [2],
      isLoading: false,
      hasRole: () => false,
      hasAnyRole: () => false,
      hasAllRoles: () => false
    })

    vi.mocked(cityService.getIsCityManager).mockResolvedValue({
      isCityManager: false,
      managedCities: []
    })

    const { result } = renderHook(() => useCityPermissions(), { wrapper })

    expect(result.current.isLoading).toBe(true)

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.isLoading).toBe(false)
  })
})
