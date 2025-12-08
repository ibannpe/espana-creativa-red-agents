// ABOUTME: Express routes for city-related endpoints
// ABOUTME: Handles city listing, detail view, and manager operations

import { Router } from 'express'
import { Container } from '../../di/Container'
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.middleware'

const router = Router()

/**
 * GET /api/cities
 * Get all cities with opportunity counts
 */
router.get('/', async (req, res) => {
  try {
    const getCitiesUseCase = Container.getGetCitiesUseCase()

    if (!getCitiesUseCase) {
      throw new Error('GetCitiesUseCase is undefined - Container not properly initialized')
    }

    const cities = await getCitiesUseCase.execute({
      activeOnly: req.query.active !== 'false'
    })

    // Transform backend format to match frontend schema
    const response = {
      cities: cities.map(item => ({
        id: item.city.id,
        name: item.city.name,
        slug: item.city.slug.value,
        image_url: item.city.imageUrl,
        description: item.city.description,
        active: item.city.active,
        display_order: item.city.displayOrder,
        created_at: item.city.createdAt.toISOString(),
        updated_at: item.city.updatedAt.toISOString(),
        opportunities_count: 0, // TODO: implement when we have total count
        active_opportunities_count: item.activeOpportunitiesCount
      }))
    }

    res.json(response)
  } catch (error) {
    console.error('Error fetching cities:', error)
    res.status(500).json({ error: 'Failed to fetch cities' })
  }
})

/**
 * GET /api/cities/my-managed
 * Get cities managed by current user
 * Returns manager status and list of managed cities with details
 * IMPORTANT: This route must be BEFORE /:slug to avoid conflict
 */
router.get('/my-managed', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user.id

    const checkUserIsCityManagerUseCase = Container.getCheckUserIsCityManagerUseCase()
    const result = await checkUserIsCityManagerUseCase.execute({ userId })

    // If not a manager, return empty result
    if (!result.isManager || result.managedCityIds.length === 0) {
      return res.json({
        isCityManager: false,
        managedCities: []
      })
    }

    // Get city details for all managed cities
    const cityRepository = Container.getCityRepository()
    const managedCities = await Promise.all(
      result.managedCityIds.map(async (cityId) => {
        const city = await cityRepository.findById(cityId)
        return city ? {
          id: city.id,
          name: city.name,
          slug: city.slug.value
        } : null
      })
    )

    // Filter out any null values
    const validCities = managedCities.filter(city => city !== null)

    res.json({
      isCityManager: true,
      managedCities: validCities
    })
  } catch (error) {
    console.error('Error checking city manager status:', error)
    res.status(500).json({ error: 'Failed to check manager status' })
  }
})

/**
 * POST /api/cities/:cityId/managers
 * Assign a user as city manager (admin only)
 * IMPORTANT: This route must be BEFORE /:slug to avoid conflict with numeric IDs
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

/**
 * POST /api/cities
 * Create a new city (admin only)
 */
router.post('/', authMiddleware, async (req, res) => {
  try {
    const adminUserId = (req as AuthenticatedRequest).user.id

    const { name, slug, image_url, description, active, display_order } = req.body

    if (!name || !slug || !image_url) {
      return res.status(400).json({ error: 'name, slug, and image_url are required' })
    }

    const createCityUseCase = Container.getCreateCityUseCase()
    const result = await createCityUseCase.execute({
      adminUserId,
      name,
      slug,
      imageUrl: image_url,
      description,
      active,
      displayOrder: display_order
    })

    if (!result.success || !result.city) {
      return res.status(400).json({ error: result.error || 'Failed to create city' })
    }

    // Transform to frontend format
    const response = {
      city: {
        id: result.city.id,
        name: result.city.name,
        slug: result.city.slug.value,
        image_url: result.city.imageUrl,
        description: result.city.description,
        active: result.city.active,
        display_order: result.city.displayOrder,
        created_at: result.city.createdAt.toISOString(),
        updated_at: result.city.updatedAt.toISOString()
      }
    }

    res.status(201).json(response)
  } catch (error) {
    console.error('Error creating city:', error)
    res.status(500).json({ error: 'Failed to create city' })
  }
})

/**
 * PUT /api/cities/:cityId
 * Update a city (admin only)
 */
router.put('/:cityId', authMiddleware, async (req, res) => {
  try {
    const adminUserId = (req as AuthenticatedRequest).user.id

    const cityId = parseInt(req.params.cityId)
    if (isNaN(cityId)) {
      return res.status(400).json({ error: 'Invalid city ID' })
    }

    const { name, image_url, description, active, display_order } = req.body

    const updateCityUseCase = Container.getUpdateCityUseCase()
    const result = await updateCityUseCase.execute({
      adminUserId,
      cityId,
      name,
      imageUrl: image_url,
      description,
      active,
      displayOrder: display_order
    })

    if (!result.success || !result.city) {
      console.error('[UPDATE CITY ERROR]', result.error)
      console.error('[UPDATE CITY REQUEST]', { cityId, name, image_url, description, active, display_order })
      return res.status(400).json({ error: result.error || 'Failed to update city' })
    }

    // Transform to frontend format
    const response = {
      city: {
        id: result.city.id,
        name: result.city.name,
        slug: result.city.slug.value,
        image_url: result.city.imageUrl,
        description: result.city.description,
        active: result.city.active,
        display_order: result.city.displayOrder,
        created_at: result.city.createdAt.toISOString(),
        updated_at: result.city.updatedAt.toISOString()
      }
    }

    res.json(response)
  } catch (error) {
    console.error('Error updating city:', error)
    res.status(500).json({ error: 'Failed to update city' })
  }
})

/**
 * DELETE /api/cities/:cityId
 * Delete a city (admin only)
 * IMPORTANT: This route must be BEFORE /:slug to avoid conflict with numeric IDs
 */
router.delete('/:cityId', authMiddleware, async (req, res) => {
  try {
    const adminUserId = (req as AuthenticatedRequest).user.id

    const cityId = parseInt(req.params.cityId)
    if (isNaN(cityId)) {
      return res.status(400).json({ error: 'Invalid city ID' })
    }

    const deleteCityUseCase = Container.getDeleteCityUseCase()
    const result = await deleteCityUseCase.execute({
      adminUserId,
      cityId
    })

    if (!result.success) {
      return res.status(400).json({ error: result.error || 'Failed to delete city' })
    }

    res.json({ success: true })
  } catch (error) {
    console.error('Error deleting city:', error)
    res.status(500).json({ error: 'Failed to delete city' })
  }
})

/**
 * GET /api/cities/:slug
 * Get city by slug
 * IMPORTANT: This route must be LAST to avoid conflicts with specific routes
 * It will match any string that doesn't match previous routes
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

    // Transform backend format to match frontend schema
    const response = {
      city: {
        id: result.city.id,
        name: result.city.name,
        slug: result.city.slug.value,
        image_url: result.city.imageUrl,
        description: result.city.description,
        active: result.city.active,
        display_order: result.city.displayOrder,
        created_at: result.city.createdAt.toISOString(),
        updated_at: result.city.updatedAt.toISOString(),
        opportunities_count: 0, // TODO: implement when we have total count
        active_opportunities_count: result.activeOpportunitiesCount || 0
      }
    }

    res.json(response)
  } catch (error) {
    console.error('Error fetching city:', error)
    res.status(500).json({ error: 'Failed to fetch city' })
  }
})

export default router
