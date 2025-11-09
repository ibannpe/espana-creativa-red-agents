// ABOUTME: Program domain entity representing courses, workshops, bootcamps, and acceleration programs
// ABOUTME: Contains business logic for program lifecycle, enrollment management, and validation rules

export type ProgramType =
  | 'aceleracion'
  | 'workshop'
  | 'bootcamp'
  | 'mentoria'
  | 'curso'
  | 'otro'

export type ProgramStatus =
  | 'upcoming'
  | 'active'
  | 'completed'
  | 'cancelled'

export interface ProgramProps {
  id: string
  title: string
  description: string
  type: ProgramType
  startDate: Date
  endDate: Date
  duration: string
  location?: string
  participants: number
  maxParticipants?: number
  instructor: string
  status: ProgramStatus
  featured: boolean
  skills: string[]
  price?: string
  imageUrl?: string
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

/**
 * Program Domain Entity
 *
 * Represents an educational program (course, workshop, bootcamp, etc.).
 * Enforces business rules for program lifecycle and enrollment management.
 */
export class Program {
  private constructor(
    public readonly id: string,
    private _title: string,
    private _description: string,
    private _type: ProgramType,
    private _startDate: Date,
    private _endDate: Date,
    private _duration: string,
    private _location: string | undefined,
    private _participants: number,
    private _maxParticipants: number | undefined,
    private _instructor: string,
    private _status: ProgramStatus,
    private _featured: boolean,
    private _skills: string[],
    private _price: string | undefined,
    private _imageUrl: string | undefined,
    public readonly createdBy: string,
    public readonly createdAt: Date,
    private _updatedAt: Date
  ) {
    this.validate()
  }

  /**
   * Factory method to create a Program from props
   */
  static create(props: ProgramProps): Program {
    return new Program(
      props.id,
      props.title,
      props.description,
      props.type,
      props.startDate,
      props.endDate,
      props.duration,
      props.location,
      props.participants,
      props.maxParticipants,
      props.instructor,
      props.status,
      props.featured,
      props.skills,
      props.price,
      props.imageUrl,
      props.createdBy,
      props.createdAt,
      props.updatedAt
    )
  }

  /**
   * Factory method to create a new Program
   */
  static createNew(
    id: string,
    title: string,
    description: string,
    type: ProgramType,
    startDate: Date,
    endDate: Date,
    duration: string,
    instructor: string,
    skills: string[],
    createdBy: string,
    options?: {
      location?: string
      maxParticipants?: number
      price?: string
      imageUrl?: string
      featured?: boolean
    }
  ): Program {
    const now = new Date()

    // Determine initial status based on dates
    let status: ProgramStatus = 'upcoming'
    if (now >= startDate && now <= endDate) {
      status = 'active'
    } else if (now > endDate) {
      status = 'completed'
    }

    return new Program(
      id,
      title,
      description,
      type,
      startDate,
      endDate,
      duration,
      options?.location,
      0, // Start with 0 participants
      options?.maxParticipants,
      instructor,
      status,
      options?.featured ?? false,
      skills,
      options?.price,
      options?.imageUrl,
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

  get type(): ProgramType {
    return this._type
  }

  get startDate(): Date {
    return this._startDate
  }

  get endDate(): Date {
    return this._endDate
  }

  get duration(): string {
    return this._duration
  }

  get location(): string | undefined {
    return this._location
  }

  get participants(): number {
    return this._participants
  }

  get maxParticipants(): number | undefined {
    return this._maxParticipants
  }

  get instructor(): string {
    return this._instructor
  }

  get status(): ProgramStatus {
    return this._status
  }

  get featured(): boolean {
    return this._featured
  }

  get skills(): string[] {
    return [...this._skills]
  }

  get price(): string | undefined {
    return this._price
  }

  get imageUrl(): string | undefined {
    return this._imageUrl
  }

  get updatedAt(): Date {
    return this._updatedAt
  }

  /**
   * Update program details
   */
  update(updates: {
    title?: string
    description?: string
    type?: ProgramType
    startDate?: Date
    endDate?: Date
    duration?: string
    location?: string
    maxParticipants?: number
    instructor?: string
    status?: ProgramStatus
    featured?: boolean
    skills?: string[]
    price?: string
    imageUrl?: string
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
    if (updates.startDate !== undefined) {
      this._startDate = updates.startDate
    }
    if (updates.endDate !== undefined) {
      this._endDate = updates.endDate
    }
    if (updates.duration !== undefined) {
      this._duration = updates.duration
    }
    if (updates.location !== undefined) {
      this._location = updates.location
    }
    if (updates.maxParticipants !== undefined) {
      this._maxParticipants = updates.maxParticipants
    }
    if (updates.instructor !== undefined) {
      this._instructor = updates.instructor
    }
    if (updates.status !== undefined) {
      this._status = updates.status
    }
    if (updates.featured !== undefined) {
      this._featured = updates.featured
    }
    if (updates.skills !== undefined) {
      this._skills = updates.skills
    }
    if (updates.price !== undefined) {
      this._price = updates.price
    }
    if (updates.imageUrl !== undefined) {
      this._imageUrl = updates.imageUrl
    }

    this._updatedAt = new Date()
    this.validate()
  }

  /**
   * Start the program (mark as active)
   */
  start(): void {
    if (this._status !== 'upcoming') {
      throw new Error('Only upcoming programs can be started')
    }
    this._status = 'active'
    this._updatedAt = new Date()
  }

  /**
   * Complete the program
   */
  complete(): void {
    if (this._status !== 'active') {
      throw new Error('Only active programs can be completed')
    }
    this._status = 'completed'
    this._updatedAt = new Date()
  }

  /**
   * Cancel the program
   */
  cancel(): void {
    if (this._status === 'completed') {
      throw new Error('Cannot cancel a completed program')
    }
    if (this._status === 'cancelled') {
      throw new Error('Program is already cancelled')
    }
    this._status = 'cancelled'
    this._updatedAt = new Date()
  }

  /**
   * Feature the program
   */
  feature(): void {
    this._featured = true
    this._updatedAt = new Date()
  }

  /**
   * Unfeature the program
   */
  unfeature(): void {
    this._featured = false
    this._updatedAt = new Date()
  }

  /**
   * Check if program is accepting enrollments
   */
  isAcceptingEnrollments(): boolean {
    if (this._status !== 'upcoming') {
      return false
    }
    if (this._maxParticipants && this._participants >= this._maxParticipants) {
      return false
    }
    const now = new Date()
    if (now >= this._startDate) {
      return false
    }
    return true
  }

  /**
   * Check if program is full
   */
  isFull(): boolean {
    if (!this._maxParticipants) {
      return false
    }
    return this._participants >= this._maxParticipants
  }

  /**
   * Check if program is active
   */
  isActive(): boolean {
    return this._status === 'active'
  }

  /**
   * Check if program has started
   */
  hasStarted(): boolean {
    return this._status === 'active' || this._status === 'completed'
  }

  /**
   * Check if program is finished
   */
  isFinished(): boolean {
    return this._status === 'completed' || this._status === 'cancelled'
  }

  /**
   * Check if user is the creator
   */
  isCreator(userId: string): boolean {
    return this.createdBy === userId
  }

  /**
   * Increment participant count (called by enrollment trigger)
   */
  incrementParticipants(): void {
    this._participants += 1
    this._updatedAt = new Date()
  }

  /**
   * Decrement participant count (called by enrollment trigger)
   */
  decrementParticipants(): void {
    if (this._participants > 0) {
      this._participants -= 1
      this._updatedAt = new Date()
    }
  }

  /**
   * Validate program business rules
   */
  private validate(): void {
    // ID validation
    if (!this.id || this.id.trim() === '') {
      throw new Error('Program ID cannot be empty')
    }

    // Title validation
    if (!this._title || this._title.trim() === '') {
      throw new Error('Title cannot be empty')
    }
    if (this._title.length < 5) {
      throw new Error('Title must be at least 5 characters')
    }
    if (this._title.length > 255) {
      throw new Error('Title cannot exceed 255 characters')
    }

    // Description validation
    if (!this._description || this._description.trim() === '') {
      throw new Error('Description cannot be empty')
    }
    if (this._description.length < 20) {
      throw new Error('Description must be at least 20 characters')
    }

    // Instructor validation
    if (!this._instructor || this._instructor.trim() === '') {
      throw new Error('Instructor cannot be empty')
    }

    // Duration validation
    if (!this._duration || this._duration.trim() === '') {
      throw new Error('Duration cannot be empty')
    }

    // Date validation (allow same-day programs like 1-day workshops)
    if (this._startDate > this._endDate) {
      throw new Error('Start date cannot be after end date')
    }

    // Participants validation
    if (this._participants < 0) {
      throw new Error('Participants cannot be negative')
    }
    if (this._maxParticipants && this._maxParticipants <= 0) {
      throw new Error('Max participants must be positive')
    }
    if (this._maxParticipants && this._participants > this._maxParticipants) {
      throw new Error('Participants cannot exceed max participants')
    }

    // Type validation
    const validTypes: ProgramType[] = [
      'aceleracion',
      'workshop',
      'bootcamp',
      'mentoria',
      'curso',
      'otro'
    ]
    if (!validTypes.includes(this._type)) {
      throw new Error(`Invalid program type: ${this._type}`)
    }

    // Status validation
    const validStatuses: ProgramStatus[] = [
      'upcoming',
      'active',
      'completed',
      'cancelled'
    ]
    if (!validStatuses.includes(this._status)) {
      throw new Error(`Invalid program status: ${this._status}`)
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
  toObject(): ProgramProps {
    return {
      id: this.id,
      title: this._title,
      description: this._description,
      type: this._type,
      startDate: this._startDate,
      endDate: this._endDate,
      duration: this._duration,
      location: this._location,
      participants: this._participants,
      maxParticipants: this._maxParticipants,
      instructor: this._instructor,
      status: this._status,
      featured: this._featured,
      skills: this._skills,
      price: this._price,
      imageUrl: this._imageUrl,
      createdBy: this.createdBy,
      createdAt: this.createdAt,
      updatedAt: this._updatedAt
    }
  }
}
