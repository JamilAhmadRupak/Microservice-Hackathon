const express = require('express');
const PledgeService = require('../services/pledgeService');
const { sendSuccess, sendError } = require('../../shared/utils/response');
const { authMiddleware, optionalAuthMiddleware } = require('../../shared/middleware/auth');
const { createServiceLogger } = require('../../shared/utils/logger');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();
const logger = createServiceLogger('pledge-service');
const pledgeService = new PledgeService(logger);

// POST /api/pledges - Create pledge (authenticated or guest)
router.post('/', optionalAuthMiddleware, async (req, res, next) => {
  try {
    // Get or generate idempotency key
    const idempotencyKey = req.headers['x-idempotency-key'] || uuidv4();
    
    const result = await pledgeService.createPledge(
      idempotencyKey,
      req.body,
      req.user
    );
    
    sendSuccess(res, result, 201, req.correlationId);
  } catch (error) {
    next(error);
  }
});

// GET /api/pledges/:id - Get pledge by ID
router.get('/:id', async (req, res, next) => {
  try {
    const result = await pledgeService.getPledgeById(req.params.id);
    sendSuccess(res, result, 200, req.correlationId);
  } catch (error) {
    next(error);
  }
});

// GET /api/pledges/campaign/:campaignId - Get pledges for campaign
router.get('/campaign/:campaignId', async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const result = await pledgeService.getPledgesByCampaign(
      req.params.campaignId,
      page,
      limit
    );
    sendSuccess(res, result, 200, req.correlationId);
  } catch (error) {
    next(error);
  }
});

// GET /api/pledges/user/donations - Get user donations (authenticated)
router.get('/user/donations', authMiddleware, async (req, res, next) => {
  try {
    const result = await pledgeService.getUserDonations(req.user.userId);
    sendSuccess(res, result, 200, req.correlationId);
  } catch (error) {
    next(error);
  }
});

// PUT /api/pledges/:id/state - Update pledge state (internal)
router.put('/:id/state', async (req, res, next) => {
  try {
    const { state, metadata } = req.body;
    const result = await pledgeService.updatePledgeState(
      req.params.id,
      state,
      metadata
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
    service: 'pledge-service',
    dbState: mongoose.connection.readyState,
    dbStates: '0=disconnected, 1=connected, 2=connecting, 3=disconnecting'
  }, 200);
});

module.exports = router;
