// ABOUTME: Express routes for city-related endpoints
// ABOUTME: Handles city listing, detail view, and manager operations

import { Router } from 'express'
import { Container } from '../../di/Container'

const router = Router()

/**
 * GET /api/cities
 * Get all cities with opportunity counts
 */
router.get('/', async (req, res) => {
  try {
    console.log('[DEBUG] Container type:', typeof Container)
    console.log('[DEBUG] Container.getGetCitiesUseCase type:', typeof Container.getGetCitiesUseCase)

    const getCitiesUseCase = Container.getGetCitiesUseCase()
    console.log('[DEBUG] getCitiesUseCase value:', getCitiesUseCase)
    console.log('[DEBUG] getCitiesUseCase type:', typeof getCitiesUseCase)

    if (!getCitiesUseCase) {
      throw new Error('GetCitiesUseCase is undefined - Container not properly initialized')
    }

    const cities = await getCitiesUseCase.execute({
      activeOnly: req.query.active !== 'false'
    })

    res.json(cities)
  } catch (error) {
    console.error('Error fetching cities:', error)
    res.status(500).json({ error: 'Failed to fetch cities' })
  }
})

/**
 * GET /api/cities/:slug
 * Get city by slug
 */
router.get('/:slug', async (req, res) => {
  try {
    const getCityBySlugUseCase = Container.getGetCityBySlugUseCase()
    const result = await getCityBySlugUseCase.execute({
      slug: req.params.slug
    })

    if (result.error) {
      return res.status(404).json({ error: result.error })
    }

    res.json(result.city)
  } catch (error) {
    console.error('Error fetching city:', error)
    res.status(500).json({ error: 'Failed to fetch city' })
  }
})

/**
 * GET /api/cities/managed/list
 * Get cities managed by current user
 */
router.get('/managed/list', async (req, res) => {
  try {
    const userId = req.user?.id  // From auth middleware
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const checkUserIsCityManagerUseCase = Container.getCheckUserIsCityManagerUseCase()
    const result = await checkUserIsCityManagerUseCase.execute({ userId })

    res.json({
      isManager: result.isManager,
      managedCityIds: result.managedCityIds
    })
  } catch (error) {
    console.error('Error checking city manager status:', error)
    res.status(500).json({ error: 'Failed to check manager status' })
  }
})

/**
 * POST /api/cities/:cityId/managers
 * Assign a user as city manager (admin only)
 */
router.post('/:cityId/managers', async (req, res) => {
  try {
    const adminUserId = req.user?.id  // From auth middleware
    if (!adminUserId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const { targetUserId } = req.body
    if (!targetUserId) {
      return res.status(400).json({ error: 'targetUserId is required' })
    }

    const assignCityManagerUseCase = Container.getAssignCityManagerUseCase()
    const result = await assignCityManagerUseCase.execute({
      adminUserId,
      targetUserId,
      cityId: parseInt(req.params.cityId)
    })

    if (result.error) {
      return res.status(403).json({ error: result.error })
    }

    res.json({ success: true })
  } catch (error) {
    console.error('Error assigning city manager:', error)
    res.status(500).json({ error: 'Failed to assign city manager' })
  }
})

export default router
