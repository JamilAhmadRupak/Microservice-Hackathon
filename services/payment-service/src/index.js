require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { connectDB } = require('../../shared/utils/database');
const { createServiceLogger } = require('../../shared/utils/logger');
const { correlationIdMiddleware } = require('../../shared/middleware/correlationId');
const { errorHandler } = require('../../shared/middleware/errorHandler');
const paymentRoutes = require('./routes/paymentRoutes');
const { subscribeToEvents } = require('./events/eventHandler');

const app = express();
const PORT = process.env.PORT || 3004;
const logger = createServiceLogger('payment-service');

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(correlationIdMiddleware);

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    correlationId: req.correlationId,
    ip: req.ip
  });
  next();
});

// Routes
app.use('/api/payments', paymentRoutes);

// Root health check
app.get('/', (req, res) => {
  res.json({ 
    service: 'payment-service', 
    status: 'running',
    version: '1.0.0'
  });
});

// Error handler (must be last)
app.use(errorHandler(logger));

// Connect to database and start server
const startServer = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/careforall';
    await connectDB(mongoUri, logger);
    
    // Subscribe to pledge events
    await subscribeToEvents();
    
    app.listen(PORT, () => {
      logger.info(`Payment Service running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
