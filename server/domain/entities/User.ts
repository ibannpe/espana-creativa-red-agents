// ABOUTME: Domain entity representing a user in the España Creativa network
// ABOUTME: Contains business logic for profile validation, completion calculation, and user operations

import { UserId } from '../value-objects/UserId'
import { Email } from '../value-objects/Email'
import { CompletionPercentage } from '../value-objects/CompletionPercentage'

export interface UserProps {
  id: UserId
  email: Email
  name: string | null
  avatarUrl: string | null
  bio: string | null
  location: string | null
  linkedinUrl: string | null
  websiteUrl: string | null
  skills: string[]
  interests: string[]
  roleIds: number[]
  createdAt: Date
  updatedAt: Date
}

export class User {
  private constructor(private readonly props: UserProps) {}

  static create(props: UserProps): User {
    return new User(props)
  }

  // Getters
  getId(): UserId {
    return this.props.id
  }

  getEmail(): Email {
    return this.props.email
  }

  getName(): string | null {
    return this.props.name
  }

  getAvatarUrl(): string | null {
    return this.props.avatarUrl
  }

  getBio(): string | null {
    return this.props.bio
  }

  getLocation(): string | null {
    return this.props.location
  }

  getLinkedinUrl(): string | null {
    return this.props.linkedinUrl
  }

  getWebsiteUrl(): string | null {
    return this.props.websiteUrl
  }

  getSkills(): string[] {
    return [...this.props.skills]
  }

  getInterests(): string[] {
    return [...this.props.interests]
  }

  getRoleIds(): number[] {
    return [...this.props.roleIds]
  }

  getCreatedAt(): Date {
    return this.props.createdAt
  }

  getUpdatedAt(): Date {
    return this.props.updatedAt
  }

  // Business logic: Calculate profile completion percentage
  // Criterios de completado (cada uno vale 20%):
  // 1. Información básica (name)
  // 2. Foto de perfil (avatar_url)
  // 3. Biografía (bio)
  // 4. Habilidades (skills)
  // 5. Enlaces sociales (linkedin_url o website_url)
  calculateCompletionPercentage(): CompletionPercentage {
    let points = 0

    // 1. Información básica (name) - 20%
    if (this.props.name && this.props.name.trim().length > 0) {
      points += 20
    }

    // 2. Foto de perfil (avatar_url) - 20%
    if (this.props.avatarUrl && this.props.avatarUrl.trim().length > 0) {
      points += 20
    }

    // 3. Biografía (bio) - 20%
    if (this.props.bio && this.props.bio.trim().length > 0) {
      points += 20
    }

    // 4. Habilidades (skills) - 20%
    if (this.props.skills.length > 0) {
      points += 20
    }

    // 5. Enlaces sociales (linkedin_url o website_url) - 20%
    if ((this.props.linkedinUrl && this.props.linkedinUrl.trim().length > 0) ||
        (this.props.websiteUrl && this.props.websiteUrl.trim().length > 0)) {
      points += 20
    }

    return CompletionPercentage.create(points)!
  }

  // Business logic: Check if profile is complete enough for full access
  isProfileComplete(): boolean {
    const completion = this.calculateCompletionPercentage()
    return completion.getValue() >= 80
  }

  // Business logic: Update profile
  updateProfile(updates: Partial<{
    name: string | null
    avatarUrl: string | null
    bio: string | null
    location: string | null
    linkedinUrl: string | null
    websiteUrl: string | null
    skills: string[]
    interests: string[]
  }>): User {
    return new User({
      ...this.props,
      ...updates,
      updatedAt: new Date()
    })
  }

  // Business logic: Check if user has a specific role
  hasRole(roleId: number): boolean {
    return this.props.roleIds.includes(roleId)
  }

  // Business logic: Check if user is admin
  isAdmin(): boolean {
    // Assuming admin role ID is 1 (as per schema)
    return this.hasRole(1)
  }

  // Business logic: Check if user is mentor
  isMentor(): boolean {
    // Assuming mentor role ID is 2 (as per schema)
    return this.hasRole(2)
  }

  // Convert to plain object for persistence
  toPrimitives(): {
    id: string
    email: string
    name: string | null
    avatarUrl: string | null
    bio: string | null
    location: string | null
    linkedinUrl: string | null
    websiteUrl: string | null
    skills: string[]
    interests: string[]
    roleIds: number[]
    createdAt: Date
    updatedAt: Date
  } {
    return {
      id: this.props.id.getValue(),
      email: this.props.email.getValue(),
      name: this.props.name,
      avatarUrl: this.props.avatarUrl,
      bio: this.props.bio,
      location: this.props.location,
      linkedinUrl: this.props.linkedinUrl,
      websiteUrl: this.props.websiteUrl,
      skills: [...this.props.skills],
      interests: [...this.props.interests],
      roleIds: [...this.props.roleIds],
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt
    }
  }
}
