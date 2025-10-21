import { supabase } from '@/lib/supabase'
import { User, Role } from '@/types'
import { devLogger } from '@/lib/logger'

export async function getUserProfile(userId: string): Promise<User | null> {
  devLogger.apiCall('GET', 'users/profile', { userId }, 'getUserProfile')
  
  const { data, error } = await supabase
    .from('users')
    .select(`
      *,
      user_roles!inner(
        roles(*)
      )
    `)
    .eq('id', userId)
    .single()
  
  if (error || !data) {
    devLogger.error('getUserProfile failed', { userId, error })
    return null
  }
  
  const user = {
    ...data,
    roles: data.user_roles.map((ur: { roles: Role }) => ur.roles)
  }
  
  devLogger.info('getUserProfile success', { userId, hasRoles: user.roles.length })
  return user
}

export async function updateUserProfile(userId: string, updates: Partial<User>) {
  devLogger.apiCall('UPDATE', 'users/profile', { userId, fields: Object.keys(updates) }, 'updateUserProfile')
  
  const { data, error } = await supabase
    .from('users')
    .update({
      name: updates.name,
      bio: updates.bio,
      location: updates.location,
      linkedin_url: updates.linkedin_url,
      website_url: updates.website_url,
      skills: updates.skills,
      interests: updates.interests,
      avatar_url: updates.avatar_url
    })
    .eq('id', userId)
    .select()
    .single()
  
  if (error) {
    devLogger.error('updateUserProfile failed', { userId, error, updates })
  } else {
    devLogger.info('updateUserProfile success', { userId, updatedFields: Object.keys(updates) })
  }
  
  return { data, error }
}

export async function searchUsers(query: string, filters: {
  role?: string
  location?: string
  skills?: string[]
} = {}) {
  devLogger.apiCall('GET', 'users/search', { query, filters }, 'searchUsers')
  
  let queryBuilder = supabase
    .from('users')
    .select(`
      *,
      user_roles!inner(
        roles(*)
      )
    `)
  
  // Search on name and bio using ilike (case-insensitive like)
  if (query) {
    devLogger.debug('Adding text search filter', { query })
    queryBuilder = queryBuilder.or(`name.ilike.%${query}%, bio.ilike.%${query}%`)
  }
  
  // Filter by role using the roles table
  if (filters.role) {
    devLogger.debug('Adding role filter', { role: filters.role })
    queryBuilder = queryBuilder.eq('user_roles.roles.name', filters.role)
  }
  
  // Filter by location
  if (filters.location) {
    devLogger.debug('Adding location filter', { location: filters.location })
    queryBuilder = queryBuilder.ilike('location', `%${filters.location}%`)
  }
  
  // Filter by skills
  if (filters.skills && filters.skills.length > 0) {
    devLogger.debug('Adding skills filter', { skills: filters.skills })
    queryBuilder = queryBuilder.overlaps('skills', filters.skills)
  }
  
  const { data, error } = await queryBuilder
    .order('updated_at', { ascending: false })
    .limit(50)
  
  if (error) {
    devLogger.error('searchUsers failed', { query, filters, error })
    return { data: [], error }
  }
  
  const users = data?.map(user => ({
    ...user,
    roles: user.user_roles.map((ur: { roles: Role }) => ur.roles)
  })) || []
  
  devLogger.info('searchUsers success', { 
    query, 
    filters, 
    resultCount: users.length,
    hasQuery: !!query,
    hasFilters: Object.keys(filters).length > 0
  })
  
  return { data: users, error: null }
}

export async function getAllUsers() {
  devLogger.apiCall('GET', 'users/all', {}, 'getAllUsers')
  
  const { data, error } = await supabase
    .from('users')
    .select(`
      *,
      user_roles!inner(
        roles(*)
      )
    `)
    .order('created_at', { ascending: false })
  
  if (error) {
    devLogger.error('getAllUsers failed', { error })
    return { data: [], error }
  }
  
  const users = data?.map(user => ({
    ...user,
    roles: user.user_roles.map((ur: { roles: Role }) => ur.roles)
  })) || []
  
  devLogger.info('getAllUsers success', { userCount: users.length })
  
  return { data: users, error: null }
}