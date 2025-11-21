const redis = require('redis');
const PaymentService = require('../services/paymentService');
const { createServiceLogger } = require('../../shared/utils/logger');

const logger = createServiceLogger('payment-event-handler');
const paymentService = new PaymentService(logger);

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

  // Subscribe to pledge created events
  await subscriber.subscribe('pledge.created', async (message) => {
    try {
      const event = JSON.parse(message);
      logger.info('Received pledge.created event', { event });

      // Process payment with idempotency key
      await paymentService.processPayment(event.idempotencyKey, {
        pledgeId: event.pledgeId,
        campaignId: event.campaignId,
        amount: event.amount,
        currency: event.currency,
        paymentIntentId: event.paymentIntentId
      });
      
      logger.info('Payment processed successfully', { pledgeId: event.pledgeId });
    } catch (error) {
      logger.error('Error handling pledge.created event:', error);
    }
  });

  logger.info('Subscribed to pledge.created events');
};

module.exports = { subscribeToEvents, redisClient };
