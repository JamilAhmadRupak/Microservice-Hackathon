const redis = require('redis');
const CampaignService = require('../services/campaignService');
const { createServiceLogger } = require('../../../shared/utils/logger');

const logger = createServiceLogger('campaign-event-handler');
const campaignService = new CampaignService(logger);

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

  // Subscribe to pledge completed events to update campaign totals
  await subscriber.subscribe('pledge.completed', async (message) => {
    try {
      const event = JSON.parse(message);
      logger.info('Received pledge.completed event', { event });

      await campaignService.updateCampaignTotals(event.campaignId, event.amount);
      
      logger.info('Campaign totals updated successfully', { 
        campaignId: event.campaignId, 
        amount: event.amount 
      });
    } catch (error) {
      logger.error('Error handling pledge.completed event:', error);
    }
  });

  logger.info('Subscribed to pledge.completed events');
};

module.exports = { subscribeToEvents, redisClient };
