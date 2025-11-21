const Outbox = require('../models/Outbox');
const redis = require('redis');
const mongoose = require('mongoose');
const { createServiceLogger } = require('../../shared/utils/logger');

const logger = createServiceLogger('outbox-worker');
let redisClient;
let isProcessing = false;

const connectRedis = async () => {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  redisClient = redis.createClient({ url: redisUrl });
  
  redisClient.on('error', (err) => logger.error('Redis Client Error', err));
  
  await redisClient.connect();
  logger.info('Outbox worker connected to Redis');
};

const publishEvent = async (event) => {
  try {
    await redisClient.publish(event.eventType, JSON.stringify(event.payload));
    logger.info('Event published to Redis', { eventType: event.eventType, eventId: event._id });
    return true;
  } catch (error) {
    logger.error('Failed to publish event:', { error: error.message, eventId: event._id });
    return false;
  }
};

const processOutbox = async () => {
  // Skip if already processing or MongoDB not connected
  if (isProcessing || mongoose.connection.readyState !== 1) {
    return;
  }

  isProcessing = true;
  
  try {
    // Find pending events
    const pendingEvents = await Outbox.find({
      status: 'pending',
      retryCount: { $lt: 5 }
    })
      .sort({ createdAt: 1 })
      .limit(10);

    if (pendingEvents.length === 0) {
      isProcessing = false;
      return;
    }

    logger.info(`Processing ${pendingEvents.length} outbox events`);

    for (const event of pendingEvents) {
      try {
        const published = await publishEvent(event);
        
        if (published) {
          event.status = 'published';
          event.publishedAt = new Date();
        } else {
          event.retryCount += 1;
          if (event.retryCount >= event.maxRetries) {
            event.status = 'failed';
            event.error = 'Max retries exceeded';
          }
        }
        
        await event.save();
      } catch (error) {
        logger.error('Error processing outbox event:', { 
          error: error.message, 
          eventId: event._id 
        });
        
        event.retryCount += 1;
        event.error = error.message;
        
        if (event.retryCount >= event.maxRetries) {
          event.status = 'failed';
        }
        
        await event.save();
      }
    }
  } catch (error) {
    logger.error('Outbox processing error:', error);
  } finally {
    isProcessing = false;
  }
};

const startOutboxWorker = async () => {
  await connectRedis();
  
  logger.info('Waiting for MongoDB connection before starting outbox worker...');
  
  // Wait for MongoDB to be ready
  const waitForMongo = setInterval(() => {
    if (mongoose.connection.readyState === 1) {
      clearInterval(waitForMongo);
      logger.info('MongoDB connected, starting outbox worker');
      
      // Process outbox every 2 seconds
      setInterval(async () => {
        await processOutbox();
      }, 2000);
    }
  }, 1000);
  
  logger.info('Outbox worker initialized');
};

module.exports = { startOutboxWorker, redisClient };
