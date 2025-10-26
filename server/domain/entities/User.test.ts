// ABOUTME: Unit tests for User domain entity
// ABOUTME: Tests user creation, profile completion calculation, role checks, and profile updates

import { describe, it, expect } from 'vitest'
import { User, UserProps } from './User'
import { UserId } from '../value-objects/UserId'
import { Email } from '../value-objects/Email'

describe('User Entity', () => {
  const createTestUser = (overrides: Partial<UserProps> = {}): User => {
    const defaultProps: UserProps = {
      id: UserId.create('550e8400-e29b-41d4-a716-446655440000')!,
      email: Email.create('test@example.com')!,
      name: 'Test User',
      avatarUrl: null,
      bio: 'A test bio',
      location: 'Madrid',
      linkedinUrl: null,
      websiteUrl: null,
      skills: ['JavaScript', 'TypeScript'],
      interests: ['Web Development'],
      roleIds: [3], // Emprendedor
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      ...overrides
    }
    return User.create(defaultProps)
  }

  describe('create', () => {
    it('should create a User with valid props', () => {
      const user = createTestUser()

      expect(user).toBeDefined()
      expect(user.getName()).toBe('Test User')
      expect(user.getEmail().getValue()).toBe('test@example.com')
    })

    it('should create a User with minimal props', () => {
      const user = createTestUser({
        name: null,
        bio: null,
        location: null,
        skills: [],
        interests: []
      })

      expect(user).toBeDefined()
      expect(user.getName()).toBeNull()
      expect(user.getBio()).toBeNull()
    })
  })

  describe('getters', () => {
    it('should return all properties correctly', () => {
      const props: UserProps = {
        id: UserId.create('550e8400-e29b-41d4-a716-446655440000')!,
        email: Email.create('test@example.com')!,
        name: 'John Doe',
        avatarUrl: 'https://example.com/avatar.jpg',
        bio: 'Software developer',
        location: 'Barcelona',
        linkedinUrl: 'https://linkedin.com/in/johndoe',
        websiteUrl: 'https://johndoe.com',
        skills: ['React', 'Node.js'],
        interests: ['AI', 'Blockchain'],
        roleIds: [2, 3], // Mentor and Emprendedor
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-02-01')
      }

      const user = User.create(props)

      expect(user.getId().getValue()).toBe('550e8400-e29b-41d4-a716-446655440000')
      expect(user.getEmail().getValue()).toBe('test@example.com')
      expect(user.getName()).toBe('John Doe')
      expect(user.getAvatarUrl()).toBe('https://example.com/avatar.jpg')
      expect(user.getBio()).toBe('Software developer')
      expect(user.getLocation()).toBe('Barcelona')
      expect(user.getLinkedinUrl()).toBe('https://linkedin.com/in/johndoe')
      expect(user.getWebsiteUrl()).toBe('https://johndoe.com')
      expect(user.getSkills()).toEqual(['React', 'Node.js'])
      expect(user.getInterests()).toEqual(['AI', 'Blockchain'])
      expect(user.getRoleIds()).toEqual([2, 3])
    })

    it('should return copies of arrays to prevent mutation', () => {
      const user = createTestUser({
        skills: ['JavaScript'],
        interests: ['Web']
      })

      const skills = user.getSkills()
      const interests = user.getInterests()
      const roleIds = user.getRoleIds()

      skills.push('Python')
      interests.push('Mobile')
      roleIds.push(999)

      expect(user.getSkills()).toEqual(['JavaScript'])
      expect(user.getInterests()).toEqual(['Web'])
      expect(user.getRoleIds()).toEqual([3])
    })
  })

  describe('calculateCompletionPercentage', () => {
    // Los criterios de completado han cambiado:
    // 1. Información básica (name) - 20%
    // 2. Foto de perfil (avatar_url) - 20%
    // 3. Biografía (bio) - 20%
    // 4. Habilidades (skills) - 20%
    // 5. Enlaces sociales (linkedin_url o website_url) - 20%

    it('should calculate 100% for complete profile with all 5 criteria', () => {
      const user = createTestUser({
        name: 'Complete User',
        avatarUrl: 'https://example.com/avatar.jpg',
        bio: 'I have a bio',
        skills: ['Skill1'],
        linkedinUrl: 'https://linkedin.com/in/user'
      })

      const completion = user.calculateCompletionPercentage()
      expect(completion.getValue()).toBe(100)
    })

    it('should calculate 100% for complete profile with website instead of linkedin', () => {
      const user = createTestUser({
        name: 'Complete User',
        avatarUrl: 'https://example.com/avatar.jpg',
        bio: 'I have a bio',
        skills: ['Skill1'],
        websiteUrl: 'https://example.com'
      })

      const completion = user.calculateCompletionPercentage()
      expect(completion.getValue()).toBe(100)
    })

    it('should calculate 0% for empty profile', () => {
      const user = createTestUser({
        name: null,
        avatarUrl: null,
        bio: null,
        skills: [],
        linkedinUrl: null,
        websiteUrl: null
      })

      const completion = user.calculateCompletionPercentage()
      expect(completion.getValue()).toBe(0)
    })

    it('should give 20 points for name only', () => {
      const user = createTestUser({
        name: 'User',
        avatarUrl: null,
        bio: null,
        skills: [],
        linkedinUrl: null,
        websiteUrl: null
      })

      expect(user.calculateCompletionPercentage().getValue()).toBe(20)
    })

    it('should give 20 points for avatar_url only', () => {
      const user = createTestUser({
        name: null,
        avatarUrl: 'https://example.com/avatar.jpg',
        bio: null,
        skills: [],
        linkedinUrl: null,
        websiteUrl: null
      })

      expect(user.calculateCompletionPercentage().getValue()).toBe(20)
    })

    it('should give 20 points for bio only', () => {
      const user = createTestUser({
        name: null,
        avatarUrl: null,
        bio: 'My bio',
        skills: [],
        linkedinUrl: null,
        websiteUrl: null
      })

      expect(user.calculateCompletionPercentage().getValue()).toBe(20)
    })

    it('should give 20 points for skills only', () => {
      const user = createTestUser({
        name: null,
        avatarUrl: null,
        bio: null,
        skills: ['Skill1'],
        linkedinUrl: null,
        websiteUrl: null
      })

      expect(user.calculateCompletionPercentage().getValue()).toBe(20)
    })

    it('should give 20 points for linkedin_url only', () => {
      const user = createTestUser({
        name: null,
        avatarUrl: null,
        bio: null,
        skills: [],
        linkedinUrl: 'https://linkedin.com/in/user',
        websiteUrl: null
      })

      expect(user.calculateCompletionPercentage().getValue()).toBe(20)
    })

    it('should give 20 points for website_url only', () => {
      const user = createTestUser({
        name: null,
        avatarUrl: null,
        bio: null,
        skills: [],
        linkedinUrl: null,
        websiteUrl: 'https://example.com'
      })

      expect(user.calculateCompletionPercentage().getValue()).toBe(20)
    })

    it('should give 20 points for either linkedin or website (not 40)', () => {
      const user = createTestUser({
        name: null,
        avatarUrl: null,
        bio: null,
        skills: [],
        linkedinUrl: 'https://linkedin.com/in/user',
        websiteUrl: 'https://example.com'
      })

      expect(user.calculateCompletionPercentage().getValue()).toBe(20)
    })

    it('should not count whitespace-only fields', () => {
      const user = createTestUser({
        name: '   ',
        avatarUrl: '  ',
        bio: '',
        skills: [],
        linkedinUrl: '   ',
        websiteUrl: ''
      })

      expect(user.calculateCompletionPercentage().getValue()).toBe(0)
    })
  })

  describe('isProfileComplete', () => {
    it('should return true when completion >= 80%', () => {
      const user = createTestUser({
        name: 'User',
        avatarUrl: 'https://example.com/avatar.jpg',
        bio: 'Bio',
        skills: ['Skill'],
        linkedinUrl: null,
        websiteUrl: null
        // 20+20+20+20 = 80%
      })

      expect(user.isProfileComplete()).toBe(true)
    })

    it('should return false when completion < 80%', () => {
      const user = createTestUser({
        name: 'User',
        avatarUrl: 'https://example.com/avatar.jpg',
        bio: 'Bio',
        skills: [],
        linkedinUrl: null,
        websiteUrl: null
        // 20+20+20 = 60%
      })

      expect(user.isProfileComplete()).toBe(false)
    })
  })

  describe('updateProfile', () => {
    it('should update user profile and return new instance', () => {
      const originalUser = createTestUser({ name: 'Original' })
      const updatedUser = originalUser.updateProfile({ name: 'Updated' })

      expect(updatedUser.getName()).toBe('Updated')
      expect(originalUser.getName()).toBe('Original') // Original unchanged
    })

    it('should update multiple fields', () => {
      const user = createTestUser()
      const updated = user.updateProfile({
        name: 'New Name',
        bio: 'New Bio',
        location: 'New Location',
        skills: ['New Skill']
      })

      expect(updated.getName()).toBe('New Name')
      expect(updated.getBio()).toBe('New Bio')
      expect(updated.getLocation()).toBe('New Location')
      expect(updated.getSkills()).toEqual(['New Skill'])
    })

    it('should update updatedAt timestamp', () => {
      const user = createTestUser()
      const originalUpdatedAt = user.getUpdatedAt()

      // Small delay to ensure different timestamp
      const updated = user.updateProfile({ name: 'New' })

      expect(updated.getUpdatedAt().getTime()).toBeGreaterThanOrEqual(originalUpdatedAt.getTime())
    })
  })

  describe('role checks', () => {
    it('should return true when user has role', () => {
      const user = createTestUser({ roleIds: [1, 2, 3] })

      expect(user.hasRole(1)).toBe(true)
      expect(user.hasRole(2)).toBe(true)
      expect(user.hasRole(3)).toBe(true)
    })

    it('should return false when user does not have role', () => {
      const user = createTestUser({ roleIds: [3] })

      expect(user.hasRole(1)).toBe(false)
      expect(user.hasRole(2)).toBe(false)
    })

    it('should identify admin correctly (role 1)', () => {
      const admin = createTestUser({ roleIds: [1] })
      const nonAdmin = createTestUser({ roleIds: [3] })

      expect(admin.isAdmin()).toBe(true)
      expect(nonAdmin.isAdmin()).toBe(false)
    })

    it('should identify mentor correctly (role 2)', () => {
      const mentor = createTestUser({ roleIds: [2] })
      const nonMentor = createTestUser({ roleIds: [3] })

      expect(mentor.isMentor()).toBe(true)
      expect(nonMentor.isMentor()).toBe(false)
    })
  })

  describe('toPrimitives', () => {
    it('should convert User to plain object', () => {
      const user = createTestUser({
        name: 'John',
        skills: ['JS'],
        interests: ['Web']
      })

      const primitives = user.toPrimitives()

      expect(primitives).toEqual({
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'test@example.com',
        name: 'John',
        avatarUrl: null,
        bio: 'A test bio',
        location: 'Madrid',
        linkedinUrl: null,
        websiteUrl: null,
        skills: ['JS'],
        interests: ['Web'],
        roleIds: [3],
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date)
      })
    })

    it('should return copies of arrays', () => {
      const user = createTestUser({ skills: ['JS'] })
      const primitives = user.toPrimitives()

      primitives.skills.push('Python')

      expect(user.getSkills()).toEqual(['JS'])
    })
  })
})
