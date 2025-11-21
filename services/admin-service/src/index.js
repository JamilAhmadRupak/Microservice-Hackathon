require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { connectDB } = require('../shared/utils/database');
const { createServiceLogger } = require('../shared/utils/logger');
const { correlationIdMiddleware } = require('../shared/middleware/correlationId');
const { errorHandler } = require('../shared/middleware/errorHandler');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const PORT = process.env.PORT || 3006;
const logger = createServiceLogger('admin-service');

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(correlationIdMiddleware);

app.use('/api/admin', adminRoutes);

app.get('/', (req, res) => {
  res.json({ 
    service: 'admin-service', 
    status: 'running',
    version: '1.0.0'
  });
});

app.use(errorHandler(logger));

const startServer = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/careforall';
    await connectDB(mongoUri, logger);
    
    app.listen(PORT, () => {
      logger.info(`Admin Service running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
