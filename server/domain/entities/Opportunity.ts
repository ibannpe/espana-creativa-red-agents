// ABOUTME: Opportunity domain entity representing collaboration opportunities, jobs, or projects
// ABOUTME: Contains business logic for opportunity lifecycle and validation rules

export type OpportunityType =
  | 'proyecto'
  | 'colaboracion'
  | 'empleo'
  | 'mentoria'
  | 'evento'
  | 'otro'

export type OpportunityStatus =
  | 'abierta'
  | 'en_progreso'
  | 'cerrada'
  | 'cancelada'

export interface OpportunityProps {
  id: string
  title: string
  description: string
  type: OpportunityType
  status: OpportunityStatus
  skillsRequired: string[]
  location?: string
  remote: boolean
  duration?: string
  compensation?: string
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

/**
 * Opportunity Domain Entity
 *
 * Represents a collaboration opportunity, job posting, or project.
 * Enforces business rules for opportunity lifecycle and data validation.
 */
export class Opportunity {
  private constructor(
    public readonly id: string,
    private _title: string,
    private _description: string,
    private _type: OpportunityType,
    private _status: OpportunityStatus,
    private _skillsRequired: string[],
    private _location: string | undefined,
    private _remote: boolean,
    private _duration: string | undefined,
    private _compensation: string | undefined,
    public readonly createdBy: string,
    public readonly createdAt: Date,
    private _updatedAt: Date
  ) {
    this.validate()
  }

  /**
   * Factory method to create an Opportunity from props
   */
  static create(props: OpportunityProps): Opportunity {
    return new Opportunity(
      props.id,
      props.title,
      props.description,
      props.type,
      props.status,
      props.skillsRequired,
      props.location,
      props.remote,
      props.duration,
      props.compensation,
      props.createdBy,
      props.createdAt,
      props.updatedAt
    )
  }

  /**
   * Factory method to create a new Opportunity
   */
  static createNew(
    id: string,
    title: string,
    description: string,
    type: OpportunityType,
    skillsRequired: string[],
    createdBy: string,
    options?: {
      location?: string
      remote?: boolean
      duration?: string
      compensation?: string
    }
  ): Opportunity {
    const now = new Date()
    return new Opportunity(
      id,
      title,
      description,
      type,
      'abierta', // New opportunities start as 'abierta'
      skillsRequired,
      options?.location,
      options?.remote ?? false,
      options?.duration,
      options?.compensation,
      createdBy,
      now,
      now
    )
  }

  // Getters
  get title(): string {
    return this._title
  }

  get description(): string {
    return this._description
  }

  get type(): OpportunityType {
    return this._type
  }

  get status(): OpportunityStatus {
    return this._status
  }

  get skillsRequired(): string[] {
    return [...this._skillsRequired]
  }

  get location(): string | undefined {
    return this._location
  }

  get remote(): boolean {
    return this._remote
  }

  get duration(): string | undefined {
    return this._duration
  }

  get compensation(): string | undefined {
    return this._compensation
  }

  get updatedAt(): Date {
    return this._updatedAt
  }

  /**
   * Update opportunity details
   */
  update(updates: {
    title?: string
    description?: string
    type?: OpportunityType
    status?: OpportunityStatus
    skillsRequired?: string[]
    location?: string
    remote?: boolean
    duration?: string
    compensation?: string
  }): void {
    if (updates.title !== undefined) {
      this._title = updates.title
    }
    if (updates.description !== undefined) {
      this._description = updates.description
    }
    if (updates.type !== undefined) {
      this._type = updates.type
    }
    if (updates.status !== undefined) {
      this._status = updates.status
    }
    if (updates.skillsRequired !== undefined) {
      this._skillsRequired = updates.skillsRequired
    }
    if (updates.location !== undefined) {
      this._location = updates.location
    }
    if (updates.remote !== undefined) {
      this._remote = updates.remote
    }
    if (updates.duration !== undefined) {
      this._duration = updates.duration
    }
    if (updates.compensation !== undefined) {
      this._compensation = updates.compensation
    }

    this._updatedAt = new Date()
    this.validate()
  }

  /**
   * Mark opportunity as in progress
   */
  startProgress(): void {
    if (this._status !== 'abierta') {
      throw new Error('Only open opportunities can be started')
    }
    this._status = 'en_progreso'
    this._updatedAt = new Date()
  }

  /**
   * Mark opportunity as closed (successfully completed)
   */
  close(): void {
    if (this._status === 'cerrada') {
      throw new Error('Opportunity is already closed')
    }
    if (this._status === 'cancelada') {
      throw new Error('Cannot close a cancelled opportunity')
    }
    this._status = 'cerrada'
    this._updatedAt = new Date()
  }

  /**
   * Cancel opportunity
   */
  cancel(): void {
    if (this._status === 'cerrada') {
      throw new Error('Cannot cancel a closed opportunity')
    }
    if (this._status === 'cancelada') {
      throw new Error('Opportunity is already cancelled')
    }
    this._status = 'cancelada'
    this._updatedAt = new Date()
  }

  /**
   * Reopen a closed or cancelled opportunity
   */
  reopen(): void {
    if (this._status === 'abierta' || this._status === 'en_progreso') {
      throw new Error('Opportunity is already active')
    }
    this._status = 'abierta'
    this._updatedAt = new Date()
  }

  /**
   * Check if opportunity is active (open or in progress)
   */
  isActive(): boolean {
    return this._status === 'abierta' || this._status === 'en_progreso'
  }

  /**
   * Check if opportunity is closed or cancelled
   */
  isFinished(): boolean {
    return this._status === 'cerrada' || this._status === 'cancelada'
  }

  /**
   * Check if user is the creator
   */
  isCreator(userId: string): boolean {
    return this.createdBy === userId
  }

  /**
   * Validate opportunity business rules
   */
  private validate(): void {
    // ID validation
    if (!this.id || this.id.trim() === '') {
      throw new Error('Opportunity ID cannot be empty')
    }

    // Title validation
    if (!this._title || this._title.trim() === '') {
      throw new Error('Title cannot be empty')
    }
    if (this._title.length < 5) {
      throw new Error('Title must be at least 5 characters')
    }
    if (this._title.length > 100) {
      throw new Error('Title cannot exceed 100 characters')
    }

    // Description validation
    if (!this._description || this._description.trim() === '') {
      throw new Error('Description cannot be empty')
    }
    if (this._description.length < 20) {
      throw new Error('Description must be at least 20 characters')
    }
    if (this._description.length > 2000) {
      throw new Error('Description cannot exceed 2000 characters')
    }

    // Skills validation
    if (!this._skillsRequired || this._skillsRequired.length === 0) {
      throw new Error('At least one skill is required')
    }

    // Type validation
    const validTypes: OpportunityType[] = [
      'proyecto',
      'colaboracion',
      'empleo',
      'mentoria',
      'evento',
      'otro'
    ]
    if (!validTypes.includes(this._type)) {
      throw new Error(`Invalid opportunity type: ${this._type}`)
    }

    // Status validation
    const validStatuses: OpportunityStatus[] = [
      'abierta',
      'en_progreso',
      'cerrada',
      'cancelada'
    ]
    if (!validStatuses.includes(this._status)) {
      throw new Error(`Invalid opportunity status: ${this._status}`)
    }

    // Created by validation
    if (!this.createdBy || this.createdBy.trim() === '') {
      throw new Error('Creator ID cannot be empty')
    }

    // Date validation
    if (this.createdAt > this._updatedAt) {
      throw new Error('Created date cannot be after updated date')
    }
  }

  /**
   * Convert to plain object for persistence
   */
  toObject(): OpportunityProps {
    return {
      id: this.id,
      title: this._title,
      description: this._description,
      type: this._type,
      status: this._status,
      skillsRequired: this._skillsRequired,
      location: this._location,
      remote: this._remote,
      duration: this._duration,
      compensation: this._compensation,
      createdBy: this.createdBy,
      createdAt: this.createdAt,
      updatedAt: this._updatedAt
    }
  }
}
