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
    it('should calculate 100% for complete profile', () => {
      const user = createTestUser({
        name: 'Complete User',
        bio: 'I have a bio',
        location: 'Madrid',
        skills: ['Skill1'],
        interests: ['Interest1']
      })

      const completion = user.calculateCompletionPercentage()
      expect(completion.getValue()).toBe(100)
    })

    it('should calculate 0% for empty profile', () => {
      const user = createTestUser({
        name: null,
        bio: null,
        location: null,
        skills: [],
        interests: []
      })

      const completion = user.calculateCompletionPercentage()
      expect(completion.getValue()).toBe(0)
    })

    it('should give 20 points for name', () => {
      const user = createTestUser({
        name: 'User',
        bio: null,
        location: null,
        skills: [],
        interests: []
      })

      expect(user.calculateCompletionPercentage().getValue()).toBe(20)
    })

    it('should give 25 points for bio', () => {
      const user = createTestUser({
        name: null,
        bio: 'My bio',
        location: null,
        skills: [],
        interests: []
      })

      expect(user.calculateCompletionPercentage().getValue()).toBe(25)
    })

    it('should give 15 points for location', () => {
      const user = createTestUser({
        name: null,
        bio: null,
        location: 'City',
        skills: [],
        interests: []
      })

      expect(user.calculateCompletionPercentage().getValue()).toBe(15)
    })

    it('should give 20 points for skills', () => {
      const user = createTestUser({
        name: null,
        bio: null,
        location: null,
        skills: ['Skill1'],
        interests: []
      })

      expect(user.calculateCompletionPercentage().getValue()).toBe(20)
    })

    it('should give 20 points for interests', () => {
      const user = createTestUser({
        name: null,
        bio: null,
        location: null,
        skills: [],
        interests: ['Interest1']
      })

      expect(user.calculateCompletionPercentage().getValue()).toBe(20)
    })

    it('should not count whitespace-only fields', () => {
      const user = createTestUser({
        name: '   ',
        bio: '  ',
        location: '',
        skills: [],
        interests: []
      })

      expect(user.calculateCompletionPercentage().getValue()).toBe(0)
    })
  })

  describe('isProfileComplete', () => {
    it('should return true when completion >= 80%', () => {
      const user = createTestUser({
        name: 'User',
        bio: 'Bio',
        location: 'Location',
        skills: ['Skill'],
        interests: [] // 20+25+15+20 = 80%
      })

      expect(user.isProfileComplete()).toBe(true)
    })

    it('should return false when completion < 80%', () => {
      const user = createTestUser({
        name: 'User',
        bio: 'Bio',
        location: 'Location',
        skills: [],
        interests: [] // 20+25+15 = 60%
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
