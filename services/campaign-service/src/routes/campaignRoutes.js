const express = require('express');
const CampaignService = require('../services/campaignService');
const { sendSuccess, sendError } = require('../../shared/utils/response');
const { authMiddleware, optionalAuthMiddleware } = require('../../shared/middleware/auth');
const { createServiceLogger } = require('../../shared/utils/logger');

const router = express.Router();
const logger = createServiceLogger('campaign-service');
const campaignService = new CampaignService(logger);

// POST /api/campaigns - Create campaign (authenticated)
router.post('/', authMiddleware, async (req, res, next) => {
  try {
    const result = await campaignService.createCampaign(
      req.user.userId,
      req.user.name || 'Unknown',
      req.body
    );
    sendSuccess(res, result, 201, req.correlationId);
  } catch (error) {
    next(error);
  }
});

// GET /api/campaigns - Get all campaigns
router.get('/', async (req, res, next) => {
  try {
    const filters = {
      category: req.query.category,
      status: req.query.status,
      page: req.query.page,
      limit: req.query.limit,
      search: req.query.search
    };
    const result = await campaignService.getCampaigns(filters);
    sendSuccess(res, result, 200, req.correlationId);
  } catch (error) {
    next(error);
  }
});

// GET /api/campaigns/:id - Get campaign by ID
router.get('/:id', async (req, res, next) => {
  try {
    const result = await campaignService.getCampaignById(req.params.id);
    sendSuccess(res, result, 200, req.correlationId);
  } catch (error) {
    next(error);
  }
});

// PUT /api/campaigns/:id - Update campaign (authenticated, owner only)
router.put('/:id', authMiddleware, async (req, res, next) => {
  try {
    const result = await campaignService.updateCampaign(
      req.params.id,
      req.user.userId,
      req.body
    );
    sendSuccess(res, result, 200, req.correlationId);
  } catch (error) {
    next(error);
  }
});

// Health check
router.get('/health', (req, res) => {
  const { mongoose } = require('../../shared/utils/database');
  sendSuccess(res, { 
    status: 'healthy', 
    service: 'campaign-service',
    dbState: mongoose.connection.readyState,
    dbStates: '0=disconnected, 1=connected, 2=connecting, 3=disconnecting'
  }, 200);
});

module.exports = router;
