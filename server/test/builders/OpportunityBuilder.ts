// ABOUTME: Test data builder for Opportunity entities with fluent interface
// ABOUTME: Provides easy creation of opportunities with various configurations for testing

import { Opportunity, OpportunityType, OpportunityStatus } from '../../domain/entities/Opportunity'
import { generateTestId } from '../utils/testHelpers'

export class OpportunityBuilder {
  private id: string = generateTestId()
  private title: string = 'Test Opportunity'
  private description: string = 'This is a test opportunity description with enough characters'
  private type: OpportunityType = 'proyecto'
  private status: OpportunityStatus = 'abierta'
  private skillsRequired: string[] = ['TypeScript']
  private location?: string = 'Madrid, Spain'
  private remote: boolean = false
  private duration?: string = '3 months'
  private compensation?: string = 'Negotiable'
  private createdBy: string = generateTestId()
  private createdAt: Date = new Date('2024-01-01')
  private updatedAt: Date = new Date('2024-01-01')

  withId(id: string): this {
    this.id = id
    return this
  }

  withTitle(title: string): this {
    this.title = title
    return this
  }

  withDescription(description: string): this {
    this.description = description
    return this
  }

  withType(type: OpportunityType): this {
    this.type = type
    return this
  }

  withStatus(status: OpportunityStatus): this {
    this.status = status
    return this
  }

  withSkillsRequired(skills: string[]): this {
    this.skillsRequired = skills
    return this
  }

  withLocation(location: string | undefined): this {
    this.location = location
    return this
  }

  withRemote(remote: boolean): this {
    this.remote = remote
    return this
  }

  withDuration(duration: string | undefined): this {
    this.duration = duration
    return this
  }

  withCompensation(compensation: string | undefined): this {
    this.compensation = compensation
    return this
  }

  withCreatedBy(userId: string): this {
    this.createdBy = userId
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
   * Creates a project opportunity
   */
  asProject(): this {
    this.type = 'proyecto'
    return this
  }

  /**
   * Creates a collaboration opportunity
   */
  asCollaboration(): this {
    this.type = 'colaboracion'
    return this
  }

  /**
   * Creates a job opportunity
   */
  asJob(): this {
    this.type = 'empleo'
    return this
  }

  /**
   * Creates a mentorship opportunity
   */
  asMentorship(): this {
    this.type = 'mentoria'
    return this
  }

  /**
   * Creates an event opportunity
   */
  asEvent(): this {
    this.type = 'evento'
    return this
  }

  /**
   * Creates an open opportunity (default state)
   */
  asOpen(): this {
    this.status = 'abierta'
    return this
  }

  /**
   * Creates an in-progress opportunity
   */
  asInProgress(): this {
    this.status = 'en_progreso'
    return this
  }

  /**
   * Creates a closed opportunity
   */
  asClosed(): this {
    this.status = 'cerrada'
    return this
  }

  /**
   * Creates a cancelled opportunity
   */
  asCancelled(): this {
    this.status = 'cancelada'
    return this
  }

  /**
   * Creates a remote opportunity
   */
  asRemote(): this {
    this.remote = true
    this.location = undefined
    return this
  }

  /**
   * Creates an on-site opportunity
   */
  asOnSite(location: string): this {
    this.remote = false
    this.location = location
    return this
  }

  /**
   * Creates a hybrid opportunity
   */
  asHybrid(location: string): this {
    this.remote = true
    this.location = location
    return this
  }

  /**
   * Builds and returns the Opportunity entity
   */
  build(): Opportunity {
    return Opportunity.create({
      id: this.id,
      title: this.title,
      description: this.description,
      type: this.type,
      status: this.status,
      skillsRequired: this.skillsRequired,
      location: this.location,
      remote: this.remote,
      duration: this.duration,
      compensation: this.compensation,
      createdBy: this.createdBy,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    })
  }

  /**
   * Builds a new opportunity (convenience method)
   */
  buildNew(): Opportunity {
    return Opportunity.createNew(
      this.id,
      this.title,
      this.description,
      this.type,
      this.skillsRequired,
      this.createdBy,
      {
        location: this.location,
        remote: this.remote,
        duration: this.duration,
        compensation: this.compensation
      }
    )
  }
}

/**
 * Usage examples:
 *
 * const opportunity = new OpportunityBuilder().build()
 * const remoteJob = new OpportunityBuilder()
 *   .asJob()
 *   .asRemote()
 *   .withSkillsRequired(['React', 'TypeScript'])
 *   .build()
 * const mentorship = new OpportunityBuilder()
 *   .asMentorship()
 *   .asOnSite('Barcelona')
 *   .withCreatedBy('mentor-user-id')
 *   .build()
 */
