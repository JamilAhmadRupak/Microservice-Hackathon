const express = require('express');
const UserService = require('../services/userService');
const { sendSuccess, sendError } = require('../../shared/utils/response');
const { authMiddleware } = require('../../shared/middleware/auth');
const { createServiceLogger } = require('../../shared/utils/logger');

const router = express.Router();
const logger = createServiceLogger('user-service');
const userService = new UserService(logger);

// POST /api/users/register
router.post('/register', async (req, res, next) => {
  try {
    const result = await userService.register(req.body);
    sendSuccess(res, result, 201, req.correlationId);
  } catch (error) {
    next(error);
  }
});

// POST /api/users/login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await userService.login(email, password);
    sendSuccess(res, result, 200, req.correlationId);
  } catch (error) {
    next(error);
  }
});

// GET /api/users/profile (authenticated)
router.get('/profile', authMiddleware, async (req, res, next) => {
  try {
    const result = await userService.getProfile(req.user.userId);
    sendSuccess(res, result, 200, req.correlationId);
  } catch (error) {
    next(error);
  }
});

// PUT /api/users/profile (authenticated)
router.put('/profile', authMiddleware, async (req, res, next) => {
  try {
    const result = await userService.updateProfile(req.user.userId, req.body);
    sendSuccess(res, result, 200, req.correlationId);
  } catch (error) {
    next(error);
  }
});

// Health check
router.get('/health', (req, res) => {
  const mongoose = require('mongoose');
  sendSuccess(res, { 
    status: 'healthy', 
    service: 'user-service',
    dbState: mongoose.connection.readyState,
    dbStates: '0=disconnected, 1=connected, 2=connecting, 3=disconnecting'
  }, 200);
});

module.exports = router;
