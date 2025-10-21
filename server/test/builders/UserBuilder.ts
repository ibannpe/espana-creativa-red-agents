// ABOUTME: Test data builder for User entities with fluent interface
// ABOUTME: Provides flexible test data creation with sensible defaults and method chaining

import { User } from '../../domain/entities/User'
import { UserId } from '../../domain/value-objects/UserId'
import { Email } from '../../domain/value-objects/Email'
import { generateTestId } from '../utils/testHelpers'

export class UserBuilder {
  private id: UserId = UserId.create(generateTestId())!
  private email: Email = Email.create('test@example.com')!
  private name: string = 'Test User'
  private avatarUrl: string | null = null
  private bio: string | null = 'Test bio'
  private location: string | null = 'Madrid, Spain'
  private linkedinUrl: string | null = null
  private websiteUrl: string | null = null
  private skills: string[] = ['TypeScript']
  private interests: string[] = ['AI']
  private roleIds: number[] = [3] // Default: emprendedor
  private createdAt: Date = new Date('2024-01-01')
  private updatedAt: Date = new Date('2024-01-01')

  withId(id: string): this {
    this.id = UserId.create(id)!
    return this
  }

  withEmail(email: string): this {
    this.email = Email.create(email)!
    return this
  }

  withName(name: string): this {
    this.name = name
    return this
  }

  withAvatarUrl(url: string | null): this {
    this.avatarUrl = url
    return this
  }

  withBio(bio: string | null): this {
    this.bio = bio
    return this
  }

  withLocation(location: string | null): this {
    this.location = location
    return this
  }

  withLinkedinUrl(url: string | null): this {
    this.linkedinUrl = url
    return this
  }

  withWebsiteUrl(url: string | null): this {
    this.websiteUrl = url
    return this
  }

  withSkills(skills: string[]): this {
    this.skills = skills
    return this
  }

  withInterests(interests: string[]): this {
    this.interests = interests
    return this
  }

  withRoleIds(roleIds: number[]): this {
    this.roleIds = roleIds
    return this
  }

  withCreatedAt(date: Date): this {
    this.createdAt = date
    return this
  }

  withUpdatedAt(date: Date): this {
    this.updatedAt = date
    return this
  }

  /**
   * Creates a user with minimal profile (only name filled)
   * Completion percentage: 20%
   */
  asIncompleteProfile(): this {
    this.bio = null
    this.location = null
    this.skills = []
    this.interests = []
    return this
  }

  /**
   * Creates a user with complete profile
   * Completion percentage: 100%
   */
  asCompleteProfile(): this {
    this.bio = 'Comprehensive bio about the user'
    this.location = 'Madrid, Spain'
    this.skills = ['TypeScript', 'React', 'Node.js']
    this.interests = ['AI', 'Web Development', 'Startups']
    return this
  }

  /**
   * Creates a user with admin role (role ID 1)
   */
  asAdmin(): this {
    this.roleIds = [1]
    return this
  }

  /**
   * Creates a user with mentor role (role ID 2)
   */
  asMentor(): this {
    this.roleIds = [2]
    return this
  }

  /**
   * Creates a user with emprendedor role (role ID 3)
   */
  asEmprendedor(): this {
    this.roleIds = [3]
    return this
  }

  /**
   * Creates a user with multiple roles
   */
  withMultipleRoles(roleIds: number[]): this {
    this.roleIds = roleIds
    return this
  }

  /**
   * Builds and returns the User entity
   */
  build(): User {
    return User.create({
      id: this.id,
      email: this.email,
      name: this.name,
      avatarUrl: this.avatarUrl,
      bio: this.bio,
      location: this.location,
      linkedinUrl: this.linkedinUrl,
      websiteUrl: this.websiteUrl,
      skills: this.skills,
      interests: this.interests,
      roleIds: this.roleIds,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    })
  }
}

/**
 * Usage examples:
 *
 * const user = new UserBuilder().build()
 * const admin = new UserBuilder().asAdmin().withName('Admin User').build()
 * const incomplete = new UserBuilder().asIncompleteProfile().build()
 * const mentor = new UserBuilder()
 *   .asMentor()
 *   .withEmail('mentor@example.com')
 *   .asCompleteProfile()
 *   .build()
 */
