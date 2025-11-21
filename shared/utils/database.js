// MongoDB connection utility
const mongoose = require('mongoose');

const connectDB = async (mongoUri, logger) => {
  try {
    // Configure Mongoose before connecting
    mongoose.set('bufferCommands', true);
    mongoose.set('bufferTimeoutMS', 30000); // 30 seconds buffer timeout
    
    const conn = await mongoose.connect(mongoUri, {
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      family: 4 // Force IPv4
    });

    logger.info(`MongoDB Connected: ${conn.connection.host}`);
    
    // Ensure connection is ready
    if (mongoose.connection.readyState !== 1) {
      logger.info('Waiting for MongoDB connection to be ready...');
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Connection ready timeout')), 5000);
        mongoose.connection.once('open', () => {
          clearTimeout(timeout);
          resolve();
        });
      });
    }
    logger.info('MongoDB connection is ready');

    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      logger.info('MongoDB connection closed due to app termination');
      process.exit(0);
    });

    return conn;
  } catch (error) {
    logger.error('MongoDB connection failed:', error);
    process.exit(1);
  }
};

// Export both the connection function and mongoose instance
module.exports = { connectDB, mongoose };
