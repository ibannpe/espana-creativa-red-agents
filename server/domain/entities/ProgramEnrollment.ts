// ABOUTME: ProgramEnrollment domain entity representing user enrollments in programs
// ABOUTME: Contains business logic for enrollment lifecycle, completion, and feedback

export type EnrollmentStatus =
  | 'enrolled'
  | 'completed'
  | 'dropped'
  | 'rejected'

export interface ProgramEnrollmentProps {
  id: string
  programId: string
  userId: string
  status: EnrollmentStatus
  enrolledAt: Date
  completedAt?: Date
  rating?: number
  feedback?: string
  createdAt: Date
  updatedAt: Date
}

/**
 * ProgramEnrollment Domain Entity
 *
 * Represents a user's enrollment in a program.
 * Enforces business rules for enrollment lifecycle and feedback.
 */
export class ProgramEnrollment {
  private constructor(
    public readonly id: string,
    public readonly programId: string,
    public readonly userId: string,
    private _status: EnrollmentStatus,
    public readonly enrolledAt: Date,
    private _completedAt: Date | undefined,
    private _rating: number | undefined,
    private _feedback: string | undefined,
    public readonly createdAt: Date,
    private _updatedAt: Date
  ) {
    this.validate()
  }

  /**
   * Factory method to create a ProgramEnrollment from props
   */
  static create(props: ProgramEnrollmentProps): ProgramEnrollment {
    return new ProgramEnrollment(
      props.id,
      props.programId,
      props.userId,
      props.status,
      props.enrolledAt,
      props.completedAt,
      props.rating,
      props.feedback,
      props.createdAt,
      props.updatedAt
    )
  }

  /**
   * Factory method to create a new enrollment
   */
  static createNew(
    id: string,
    programId: string,
    userId: string
  ): ProgramEnrollment {
    const now = new Date()
    return new ProgramEnrollment(
      id,
      programId,
      userId,
      'enrolled',
      now,
      undefined,
      undefined,
      undefined,
      now,
      now
    )
  }

  // Getters
  get status(): EnrollmentStatus {
    return this._status
  }

  get completedAt(): Date | undefined {
    return this._completedAt
  }

  get rating(): number | undefined {
    return this._rating
  }

  get feedback(): string | undefined {
    return this._feedback
  }

  get updatedAt(): Date {
    return this._updatedAt
  }

  /**
   * Mark enrollment as completed
   */
  complete(rating?: number, feedback?: string): void {
    if (this._status !== 'enrolled') {
      throw new Error('Only active enrollments can be completed')
    }

    this._status = 'completed'
    this._completedAt = new Date()

    if (rating !== undefined) {
      this.setRating(rating)
    }

    if (feedback !== undefined) {
      this._feedback = feedback
    }

    this._updatedAt = new Date()
  }

  /**
   * Mark enrollment as dropped
   */
  drop(): void {
    if (this._status !== 'enrolled') {
      throw new Error('Only active enrollments can be dropped')
    }
    this._status = 'dropped'
    this._updatedAt = new Date()
  }

  /**
   * Reject enrollment (admin action)
   */
  reject(): void {
    if (this._status !== 'enrolled') {
      throw new Error('Only active enrollments can be rejected')
    }
    this._status = 'rejected'
    this._updatedAt = new Date()
  }

  /**
   * Re-enroll (if dropped or rejected)
   */
  reenroll(): void {
    if (this._status === 'enrolled') {
      throw new Error('Already enrolled')
    }
    if (this._status === 'completed') {
      throw new Error('Cannot re-enroll in completed program')
    }
    this._status = 'enrolled'
    this._updatedAt = new Date()
  }

  /**
   * Set rating (1-5)
   */
  setRating(rating: number): void {
    if (rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1 and 5')
    }
    this._rating = rating
    this._updatedAt = new Date()
  }

  /**
   * Set feedback
   */
  setFeedback(feedback: string): void {
    if (feedback && feedback.length > 2000) {
      throw new Error('Feedback cannot exceed 2000 characters')
    }
    this._feedback = feedback
    this._updatedAt = new Date()
  }

  /**
   * Update rating and feedback
   */
  updateFeedback(rating?: number, feedback?: string): void {
    if (this._status !== 'completed') {
      throw new Error('Can only provide feedback for completed enrollments')
    }

    if (rating !== undefined) {
      this.setRating(rating)
    }

    if (feedback !== undefined) {
      this.setFeedback(feedback)
    }

    this._updatedAt = new Date()
  }

  /**
   * Check if enrollment is active
   */
  isActive(): boolean {
    return this._status === 'enrolled'
  }

  /**
   * Check if enrollment is completed
   */
  isCompleted(): boolean {
    return this._status === 'completed'
  }

  /**
   * Check if user has provided feedback
   */
  hasFeedback(): boolean {
    return this._rating !== undefined || this._feedback !== undefined
  }

  /**
   * Validate enrollment business rules
   */
  private validate(): void {
    // ID validation
    if (!this.id || this.id.trim() === '') {
      throw new Error('Enrollment ID cannot be empty')
    }

    // Program ID validation
    if (!this.programId || this.programId.trim() === '') {
      throw new Error('Program ID cannot be empty')
    }

    // User ID validation
    if (!this.userId || this.userId.trim() === '') {
      throw new Error('User ID cannot be empty')
    }

    // Status validation
    const validStatuses: EnrollmentStatus[] = [
      'enrolled',
      'completed',
      'dropped',
      'rejected'
    ]
    if (!validStatuses.includes(this._status)) {
      throw new Error(`Invalid enrollment status: ${this._status}`)
    }

    // Rating validation
    if (this._rating !== undefined && (this._rating < 1 || this._rating > 5)) {
      throw new Error('Rating must be between 1 and 5')
    }

    // Feedback validation
    if (this._feedback && this._feedback.length > 2000) {
      throw new Error('Feedback cannot exceed 2000 characters')
    }

    // Completed at validation
    if (this._status === 'completed' && !this._completedAt) {
      throw new Error('Completed enrollments must have completion date')
    }

    // Date validation
    if (this._completedAt && this._completedAt < this.enrolledAt) {
      throw new Error('Completion date cannot be before enrollment date')
    }

    if (this.createdAt > this._updatedAt) {
      throw new Error('Created date cannot be after updated date')
    }
  }

  /**
   * Convert to plain object for persistence
   */
  toObject(): ProgramEnrollmentProps {
    return {
      id: this.id,
      programId: this.programId,
      userId: this.userId,
      status: this._status,
      enrolledAt: this.enrolledAt,
      completedAt: this._completedAt,
      rating: this._rating,
      feedback: this._feedback,
      createdAt: this.createdAt,
      updatedAt: this._updatedAt
    }
  }
}
