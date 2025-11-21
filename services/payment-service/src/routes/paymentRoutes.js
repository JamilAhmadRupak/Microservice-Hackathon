const express = require('express');
const PaymentService = require('../services/paymentService');
const { sendSuccess, sendError } = require('../../shared/utils/response');
const { createServiceLogger } = require('../../shared/utils/logger');

const router = express.Router();
const logger = createServiceLogger('payment-service');
const paymentService = new PaymentService(logger);

// POST /api/payments/webhook - Payment provider webhook
router.post('/webhook', async (req, res, next) => {
  try {
    const signature = req.headers['x-webhook-signature'];
    const result = await paymentService.handleWebhook(req.body, signature);
    sendSuccess(res, result, 200, req.correlationId);
  } catch (error) {
    next(error);
  }
});

// GET /api/payments/transaction/:pledgeId - Get transaction by pledge ID
router.get('/transaction/:pledgeId', async (req, res, next) => {
  try {
    const result = await paymentService.getTransaction(req.params.pledgeId);
    sendSuccess(res, result, 200, req.correlationId);
  } catch (error) {
    next(error);
  }
});

// GET /api/payments/checkout/:paymentIntentId - Mock checkout page
router.get('/checkout/:paymentIntentId', (req, res) => {
  res.json({
    message: 'Mock Payment Checkout',
    paymentIntentId: req.params.paymentIntentId,
    instructions: 'In a real scenario, this would redirect to a payment gateway'
  });
});

// POST /api/payments/capture/:paymentIntentId - Manual capture (admin/internal)
router.post('/capture/:paymentIntentId', async (req, res, next) => {
  try {
    const result = await paymentService.capturePayment(req.params.paymentIntentId);
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
    service: 'payment-service',
    dbState: mongoose.connection.readyState,
    dbStates: '0=disconnected, 1=connected, 2=connecting, 3=disconnecting'
  }, 200);
});

module.exports = router;
