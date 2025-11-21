require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { createProxyMiddleware } = require('http-proxy-middleware');
const { createServiceLogger } = require('../shared/utils/logger');
const { correlationIdMiddleware } = require('../shared/middleware/correlationId');

const app = express();
const PORT = process.env.PORT || 3000;
const logger = createServiceLogger('api-gateway');

// Security middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(correlationIdMiddleware);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    correlationId: req.correlationId,
    ip: req.ip
  });
  next();
});

// Service URLs
const services = {
  user: process.env.USER_SERVICE_URL || 'http://localhost:3001',
  campaign: process.env.CAMPAIGN_SERVICE_URL || 'http://localhost:3002',
  pledge: process.env.PLEDGE_SERVICE_URL || 'http://localhost:3003',
  payment: process.env.PAYMENT_SERVICE_URL || 'http://localhost:3004',
  notification: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3005',
  admin: process.env.ADMIN_SERVICE_URL || 'http://localhost:3006'
};

// Proxy configuration
const proxyOptions = (target) => ({
  target,
  changeOrigin: true,
  onProxyReq: (proxyReq, req) => {
    // Forward correlation ID
    if (req.correlationId) {
      proxyReq.setHeader('X-Correlation-Id', req.correlationId);
    }
    // Forward authorization header
    if (req.headers.authorization) {
      proxyReq.setHeader('Authorization', req.headers.authorization);
    }
  },
  onError: (err, req, res) => {
    logger.error('Proxy error:', { error: err.message, path: req.path });
    res.status(503).json({
      success: false,
      error: 'Service temporarily unavailable',
      code: 'SERVICE_UNAVAILABLE'
    });
  }
});

// Route proxies
app.use('/api/users', createProxyMiddleware(proxyOptions(services.user)));
app.use('/api/campaigns', createProxyMiddleware(proxyOptions(services.campaign)));
app.use('/api/pledges', createProxyMiddleware(proxyOptions(services.pledge)));
app.use('/api/payments', createProxyMiddleware(proxyOptions(services.payment)));
app.use('/api/admin', createProxyMiddleware(proxyOptions(services.admin)));

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'CareForAll API Gateway',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      users: '/api/users',
      campaigns: '/api/campaigns',
      pledges: '/api/pledges',
      payments: '/api/payments',
      admin: '/api/admin'
    }
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'api-gateway' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    code: 'NOT_FOUND'
  });
});

// Error handler
app.use((err, req, res, next) => {
  logger.error('Gateway error:', { error: err.message });
  res.status(500).json({
    success: false,
    error: 'Internal gateway error',
    code: 'GATEWAY_ERROR'
  });
});

app.listen(PORT, () => {
  logger.info(`API Gateway running on port ${PORT}`);
  logger.info('Service URLs:', services);
});

module.exports = app;
