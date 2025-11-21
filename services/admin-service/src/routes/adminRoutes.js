const express = require('express');
const AdminService = require('../services/adminService');
const { sendSuccess } = require('../../shared/utils/response');
const { authMiddleware, adminMiddleware } = require('../../shared/middleware/auth');
const { createServiceLogger } = require('../../shared/utils/logger');

const router = express.Router();
const logger = createServiceLogger('admin-service');
const adminService = new AdminService(logger);

// All routes require admin authentication
router.use(authMiddleware, adminMiddleware);

// GET /api/admin/dashboard
router.get('/dashboard', async (req, res, next) => {
  try {
    const result = await adminService.getDashboardStats();
    sendSuccess(res, result, 200, req.correlationId);
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/campaigns
router.get('/campaigns', async (req, res, next) => {
  try {
    const filters = {
      status: req.query.status,
      page: req.query.page,
      limit: req.query.limit
    };
    const result = await adminService.getAllCampaigns(filters);
    sendSuccess(res, result, 200, req.correlationId);
  } catch (error) {
    next(error);
  }
});

// PUT /api/admin/campaigns/:id/verify
router.put('/campaigns/:id/verify', async (req, res, next) => {
  try {
    const { isVerified, status } = req.body;
    const result = await adminService.verifyCampaign(
      req.params.id,
      req.user.userId,
      isVerified,
      status
    );
    sendSuccess(res, result, 200, req.correlationId);
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/transactions
router.get('/transactions', async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const result = await adminService.getAllTransactions(page, limit);
    sendSuccess(res, result, 200, req.correlationId);
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/pledges
router.get('/pledges', async (req, res, next) => {
  try {
    const filters = {
      state: req.query.state,
      page: req.query.page,
      limit: req.query.limit
    };
    const result = await adminService.getAllPledges(filters);
    sendSuccess(res, result, 200, req.correlationId);
  } catch (error) {
    next(error);
  }
});

// PUT /api/admin/pledges/:id/approve
router.put('/pledges/:id/approve', async (req, res, next) => {
  try {
    const result = await adminService.approvePledge(
      req.params.id,
      req.user.userId
    );
    sendSuccess(res, result, 200, req.correlationId);
  } catch (error) {
    next(error);
  }
});

// PUT /api/admin/pledges/:id/reject
router.put('/pledges/:id/reject', async (req, res, next) => {
  try {
    const { reason } = req.body;
    const result = await adminService.rejectPledge(
      req.params.id,
      req.user.userId,
      reason
    );
    sendSuccess(res, result, 200, req.correlationId);
  } catch (error) {
    next(error);
  }
});

// Health check
router.get('/health', (req, res) => {
  sendSuccess(res, { status: 'healthy', service: 'admin-service' }, 200);
});

module.exports = router;
