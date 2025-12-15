// ABOUTME: Unit tests for ExpressInterestUseCase
// ABOUTME: Tests interest expression with validation, repository mocks, and email notification

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ExpressInterestUseCase } from './ExpressInterestUseCase'
import type { IOpportunityInterestRepository } from '../../ports/IOpportunityInterestRepository'
import type { IOpportunityRepository } from '../../ports/IOpportunityRepository'
import type { IUserRepository } from '../../ports/repositories/IUserRepository'
import type { IEmailService } from '../../ports/services/IEmailService'
import type { Opportunity } from '../../../domain/entities/Opportunity'
import type { User } from '../../../domain/entities/User'
import type { OpportunityInterest } from '../../../domain/entities/OpportunityInterest'

describe('ExpressInterestUseCase', () => {
  let useCase: ExpressInterestUseCase
  let mockOpportunityInterestRepository: IOpportunityInterestRepository
  let mockOpportunityRepository: IOpportunityRepository
  let mockUserRepository: IUserRepository
  let mockEmailService: IEmailService

  const mockOpportunity = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    title: 'Test Opportunity',
    description: 'Test description',
    type: 'proyecto' as const,
    status: 'abierta' as const,
    createdBy: 'creator-user-id',
    cityId: 1,
    skillsRequired: [],
    remote: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    creator: {
      id: 'creator-user-id',
      name: 'Creator User',
      email: 'creator@test.com',
      avatar_url: null,
      professional_title: null
    }
  }

  const mockCreator: User = {
    id: 'creator-user-id',
    email: 'creator@test.com',
    name: 'Creator User',
    surname: 'Test',
    city: 'Madrid',
    emailVerified: true,
    completionPercentage: 100,
    createdAt: new Date(),
    updatedAt: new Date()
  }

  const mockInterestedUser: User = {
    id: 'interested-user-id',
    email: 'interested@test.com',
    name: 'Interested User',
    surname: 'Test',
    city: 'Barcelona',
    emailVerified: true,
    completionPercentage: 100,
    createdAt: new Date(),
    updatedAt: new Date()
  }

  const mockInterest: OpportunityInterest = {
    id: 'interest-uuid',
    opportunityId: '550e8400-e29b-41d4-a716-446655440000',
    userId: 'interested-user-id',
    status: 'pending',
    createdAt: new Date(),
    updatedAt: new Date()
  }

  beforeEach(() => {
    // Mock repositories
    mockOpportunityInterestRepository = {
      create: vi.fn(),
      findById: vi.fn(),
      findByOpportunityId: vi.fn(),
      findByUserId: vi.fn(),
      hasUserExpressedInterest: vi.fn(),
      updateStatus: vi.fn(),
      delete: vi.fn()
    } as unknown as IOpportunityInterestRepository

    mockOpportunityRepository = {
      findById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findAll: vi.fn(),
      findByCreator: vi.fn()
    } as unknown as IOpportunityRepository

    mockUserRepository = {
      findById: vi.fn(),
      findByEmail: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findAll: vi.fn()
    } as unknown as IUserRepository

    mockEmailService = {
      sendEmail: vi.fn(),
      sendWelcomeEmail: vi.fn(),
      sendProfileIncompleteEmail: vi.fn(),
      sendNewMessageEmail: vi.fn(),
      sendNewOpportunityEmail: vi.fn(),
      sendAdminSignupNotification: vi.fn(),
      sendSignupApprovedEmail: vi.fn(),
      sendSignupRejectedEmail: vi.fn(),
      sendOpportunityInterestEmail: vi.fn()
    } as unknown as IEmailService

    useCase = new ExpressInterestUseCase(
      mockOpportunityInterestRepository,
      mockOpportunityRepository,
      mockUserRepository,
      mockEmailService
    )
  })

  describe('execute', () => {
    it('should create interest and send email notification successfully', async () => {
      const data = {
        opportunityId: '550e8400-e29b-41d4-a716-446655440000',
        userId: 'interested-user-id'
      }

      // Mock successful responses
      vi.mocked(mockOpportunityRepository.findByIdWithCreator).mockResolvedValue(mockOpportunity)
      vi.mocked(mockOpportunityInterestRepository.hasUserExpressedInterest).mockResolvedValue(false)
      vi.mocked(mockOpportunityInterestRepository.create).mockResolvedValue(mockInterest)
      vi.mocked(mockUserRepository.findById)
        .mockResolvedValueOnce(mockInterestedUser)
        .mockResolvedValueOnce(mockCreator)
      vi.mocked(mockEmailService.sendOpportunityInterestEmail).mockResolvedValue({
        success: true,
        messageId: 'email-123'
      })

      const result = await useCase.execute(data)

      expect(result).toEqual(mockInterest)
      expect(mockOpportunityRepository.findByIdWithCreator).toHaveBeenCalledWith('550e8400-e29b-41d4-a716-446655440000')
      expect(mockOpportunityInterestRepository.hasUserExpressedInterest).toHaveBeenCalledWith('550e8400-e29b-41d4-a716-446655440000', 'interested-user-id')
      expect(mockOpportunityInterestRepository.create).toHaveBeenCalledWith(data)
      expect(mockEmailService.sendOpportunityInterestEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          value: 'creator@test.com'
        }),
        'Creator User',
        'Interested User',
        'Test Opportunity'
      )
    })

    it('should throw error when opportunity not found', async () => {
      const data = {
        opportunityId: '999e8400-e29b-41d4-a716-446655440999',
        userId: 'interested-user-id'
      }

      vi.mocked(mockOpportunityRepository.findByIdWithCreator).mockResolvedValue(null)

      await expect(useCase.execute(data)).rejects.toThrow('Opportunity not found')
      expect(mockOpportunityInterestRepository.create).not.toHaveBeenCalled()
      expect(mockEmailService.sendOpportunityInterestEmail).not.toHaveBeenCalled()
    })

    it('should throw error when opportunity is not open', async () => {
      const closedOpportunity = { ...mockOpportunity, status: 'cerrada' as const }
      const data = {
        opportunityId: '550e8400-e29b-41d4-a716-446655440000',
        userId: 'interested-user-id'
      }

      vi.mocked(mockOpportunityRepository.findByIdWithCreator).mockResolvedValue(closedOpportunity)

      await expect(useCase.execute(data)).rejects.toThrow('Cannot express interest in a closed opportunity')
      expect(mockOpportunityInterestRepository.create).not.toHaveBeenCalled()
      expect(mockEmailService.sendOpportunityInterestEmail).not.toHaveBeenCalled()
    })

    it('should throw error when user tries to express interest in their own opportunity', async () => {
      const data = {
        opportunityId: '550e8400-e29b-41d4-a716-446655440000',
        userId: 'creator-user-id' // Same as opportunity creator
      }

      vi.mocked(mockOpportunityRepository.findByIdWithCreator).mockResolvedValue(mockOpportunity)

      await expect(useCase.execute(data)).rejects.toThrow('Cannot express interest in your own opportunity')
      expect(mockOpportunityInterestRepository.create).not.toHaveBeenCalled()
      expect(mockEmailService.sendOpportunityInterestEmail).not.toHaveBeenCalled()
    })

    it('should throw error when user has already expressed interest', async () => {
      const data = {
        opportunityId: '550e8400-e29b-41d4-a716-446655440000',
        userId: 'interested-user-id'
      }

      vi.mocked(mockOpportunityRepository.findByIdWithCreator).mockResolvedValue(mockOpportunity)
      vi.mocked(mockOpportunityInterestRepository.hasUserExpressedInterest).mockResolvedValue(true)

      await expect(useCase.execute(data)).rejects.toThrow('You have already expressed interest in this opportunity')
      expect(mockOpportunityInterestRepository.create).not.toHaveBeenCalled()
      expect(mockEmailService.sendOpportunityInterestEmail).not.toHaveBeenCalled()
    })

    it('should create interest even if email sending fails', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const data = {
        opportunityId: '550e8400-e29b-41d4-a716-446655440000',
        userId: 'interested-user-id'
      }

      vi.mocked(mockOpportunityRepository.findByIdWithCreator).mockResolvedValue(mockOpportunity)
      vi.mocked(mockOpportunityInterestRepository.hasUserExpressedInterest).mockResolvedValue(false)
      vi.mocked(mockOpportunityInterestRepository.create).mockResolvedValue(mockInterest)
      vi.mocked(mockUserRepository.findById)
        .mockResolvedValueOnce(mockInterestedUser)
        .mockResolvedValueOnce(mockCreator)
      vi.mocked(mockEmailService.sendOpportunityInterestEmail).mockRejectedValue(
        new Error('Email service unavailable')
      )

      const result = await useCase.execute(data)

      expect(result).toEqual(mockInterest)
      expect(mockOpportunityInterestRepository.create).toHaveBeenCalled()
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to send opportunity interest email:',
        expect.any(Error)
      )

      consoleErrorSpy.mockRestore()
    })

    it('should not send email when creator is not found', async () => {
      const data = {
        opportunityId: '550e8400-e29b-41d4-a716-446655440000',
        userId: 'interested-user-id'
      }

      vi.mocked(mockOpportunityRepository.findByIdWithCreator).mockResolvedValue(mockOpportunity)
      vi.mocked(mockOpportunityInterestRepository.hasUserExpressedInterest).mockResolvedValue(false)
      vi.mocked(mockOpportunityInterestRepository.create).mockResolvedValue(mockInterest)
      vi.mocked(mockUserRepository.findById)
        .mockResolvedValueOnce(mockInterestedUser)
        .mockResolvedValueOnce(null) // Creator not found

      const result = await useCase.execute(data)

      expect(result).toEqual(mockInterest)
      expect(mockOpportunityInterestRepository.create).toHaveBeenCalled()
      expect(mockEmailService.sendOpportunityInterestEmail).not.toHaveBeenCalled()
    })

    it('should not send email when interested user is not found', async () => {
      const data = {
        opportunityId: '550e8400-e29b-41d4-a716-446655440000',
        userId: 'interested-user-id'
      }

      vi.mocked(mockOpportunityRepository.findByIdWithCreator).mockResolvedValue(mockOpportunity)
      vi.mocked(mockOpportunityInterestRepository.hasUserExpressedInterest).mockResolvedValue(false)
      vi.mocked(mockOpportunityInterestRepository.create).mockResolvedValue(mockInterest)
      vi.mocked(mockUserRepository.findById)
        .mockResolvedValueOnce(null) // Interested user not found
        .mockResolvedValueOnce(mockCreator)

      const result = await useCase.execute(data)

      expect(result).toEqual(mockInterest)
      expect(mockOpportunityInterestRepository.create).toHaveBeenCalled()
      expect(mockEmailService.sendOpportunityInterestEmail).not.toHaveBeenCalled()
    })

    it('should handle optional message in interest', async () => {
      const data = {
        opportunityId: '550e8400-e29b-41d4-a716-446655440000',
        userId: 'interested-user-id',
        message: 'I would love to collaborate on this project!'
      }

      const interestWithMessage = { ...mockInterest, message: data.message }

      vi.mocked(mockOpportunityRepository.findByIdWithCreator).mockResolvedValue(mockOpportunity)
      vi.mocked(mockOpportunityInterestRepository.hasUserExpressedInterest).mockResolvedValue(false)
      vi.mocked(mockOpportunityInterestRepository.create).mockResolvedValue(interestWithMessage)
      vi.mocked(mockUserRepository.findById)
        .mockResolvedValueOnce(mockInterestedUser)
        .mockResolvedValueOnce(mockCreator)
      vi.mocked(mockEmailService.sendOpportunityInterestEmail).mockResolvedValue({
        success: true
      })

      const result = await useCase.execute(data)

      expect(result.message).toBe(data.message)
      expect(mockOpportunityInterestRepository.create).toHaveBeenCalledWith(data)
    })
  })
})
