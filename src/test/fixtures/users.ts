// ABOUTME: Test fixture data for user entities
// ABOUTME: Provides reusable test data builders for creating mock users with various states

import { User, Role } from '@/types'

export const mockRole: Role = {
  id: 1,
  name: 'emprendedor',
  description: 'Entrepreneur with standard access',
}

export const mockAdminRole: Role = {
  id: 2,
  name: 'admin',
  description: 'Administrator with full system access',
}

export const mockMentorRole: Role = {
  id: 3,
  name: 'mentor',
  description: 'Mentor with extended privileges',
}

export const createMockUser = (overrides?: Partial<User>): User => ({
  id: '123e4567-e89b-12d3-a456-426614174000',
  email: 'test@example.com',
  name: 'Test User',
  avatar_url: null,
  bio: 'Test bio',
  location: 'Madrid, Spain',
  linkedin_url: 'https://linkedin.com/in/testuser',
  website_url: 'https://testuser.com',
  skills: ['TypeScript', 'React'],
  interests: ['AI', 'Web Development'],
  completed_pct: 80,
  roles: [mockRole],
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides,
})

export const mockIncompleteUser = createMockUser({
  bio: null,
  location: null,
  skills: null,
  interests: null,
  completed_pct: 20,
})

export const mockAdminUser = createMockUser({
  email: 'admin@example.com',
  name: 'Admin User',
  roles: [mockAdminRole],
})

export const mockMentorUser = createMockUser({
  email: 'mentor@example.com',
  name: 'Mentor User',
  roles: [mockMentorRole],
})
