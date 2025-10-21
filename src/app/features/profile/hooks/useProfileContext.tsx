// ABOUTME: Profile context hook providing unified interface for profile operations
// ABOUTME: Orchestrates profile queries and mutations with React Context

import { createContext, useContext, type ReactNode } from 'react'
import { useUserProfileQuery } from './queries/useUserProfileQuery'
import { useSearchUsersQuery } from './queries/useSearchUsersQuery'
import { useAllUsersQuery } from './queries/useAllUsersQuery'
import { useUpdateProfileMutation } from './mutations/useUpdateProfileMutation'
import { useUploadAvatarMutation } from './mutations/useUploadAvatarMutation'
import type {
  UserProfile,
  UpdateProfileRequest,
  SearchUsersRequest
} from '../data/schemas/profile.schema'

interface ProfileContextValue {
  // Current user profile (requires userId)
  getUserProfile: (userId: string) => {
    profile: UserProfile | undefined
    isLoading: boolean
    error: Error | null
    refetch: () => void
  }

  // Update profile
  updateProfile: (data: UpdateProfileRequest) => void
  isUpdatingProfile: boolean
  updateProfileError: Error | null
  updateProfileSuccess: boolean

  // Upload avatar
  uploadAvatar: (file: File) => void
  isUploadingAvatar: boolean
  uploadAvatarError: Error | null
  uploadAvatarSuccess: boolean

  // Search users
  searchUsers: (params: SearchUsersRequest) => {
    users: UserProfile[]
    isLoading: boolean
    error: Error | null
  }

  // Get all users
  getAllUsers: () => {
    users: UserProfile[]
    isLoading: boolean
    error: Error | null
  }
}

const ProfileContext = createContext<ProfileContextValue | undefined>(undefined)

interface ProfileProviderProps {
  children: ReactNode
  currentUserId?: string // Optional: ID of current logged-in user for mutations
}

export const ProfileProvider = ({ children, currentUserId }: ProfileProviderProps) => {
  // Mutations (only if currentUserId is provided)
  const updateProfileMutation = currentUserId
    ? useUpdateProfileMutation(currentUserId)
    : { action: () => {}, isLoading: false, error: null, isSuccess: false, data: undefined }

  const uploadAvatarMutation = currentUserId
    ? useUploadAvatarMutation(currentUserId)
    : { action: () => {}, isLoading: false, error: null, isSuccess: false, data: undefined }

  const value: ProfileContextValue = {
    // Get user profile (lazy - only fetches when called)
    getUserProfile: (userId: string) => {
      const { data, isLoading, error, refetch } = useUserProfileQuery(userId)
      return {
        profile: data,
        isLoading,
        error,
        refetch
      }
    },

    // Update profile
    updateProfile: updateProfileMutation.action,
    isUpdatingProfile: updateProfileMutation.isLoading,
    updateProfileError: updateProfileMutation.error,
    updateProfileSuccess: updateProfileMutation.isSuccess,

    // Upload avatar
    uploadAvatar: uploadAvatarMutation.action,
    isUploadingAvatar: uploadAvatarMutation.isLoading,
    uploadAvatarError: uploadAvatarMutation.error,
    uploadAvatarSuccess: uploadAvatarMutation.isSuccess,

    // Search users (lazy)
    searchUsers: (params: SearchUsersRequest) => {
      const { data, isLoading, error } = useSearchUsersQuery(params)
      return {
        users: data || [],
        isLoading,
        error
      }
    },

    // Get all users (lazy)
    getAllUsers: () => {
      const { data, isLoading, error } = useAllUsersQuery()
      return {
        users: data || [],
        isLoading,
        error
      }
    }
  }

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
}

/**
 * Hook to access profile context
 *
 * Must be used within ProfileProvider
 *
 * @returns Profile context value with all profile operations
 */
export const useProfileContext = () => {
  const context = useContext(ProfileContext)

  if (context === undefined) {
    throw new Error('useProfileContext must be used within ProfileProvider')
  }

  return context
}
