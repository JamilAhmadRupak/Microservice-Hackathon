const redis = require('redis');
const NotificationService = require('../services/notificationService');
const { createServiceLogger } = require('../../../shared/utils/logger');

const logger = createServiceLogger('notification-event-handler');
const notificationService = new NotificationService(logger);

let redisClient;

const connectRedis = async () => {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  redisClient = redis.createClient({ url: redisUrl });
  
  redisClient.on('error', (err) => logger.error('Redis Client Error', err));
  
  await redisClient.connect();
  logger.info('Connected to Redis for event handling');
};

const subscribeToEvents = async () => {
  await connectRedis();
  
  const subscriber = redisClient.duplicate();
  await subscriber.connect();

  // Subscribe to pledge completed events
  await subscriber.subscribe('pledge.completed', async (message) => {
    try {
      const event = JSON.parse(message);
      logger.info('Received pledge.completed event', { event });

      await notificationService.handlePledgeCompleted(event);
      
      logger.info('Notification sent for completed pledge', { pledgeId: event.pledgeId });
    } catch (error) {
      logger.error('Error handling pledge.completed event:', error);
    }
  });

  logger.info('Subscribed to pledge.completed events');
};

module.exports = { subscribeToEvents, redisClient };
