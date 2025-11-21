const { Pledge, PLEDGE_STATES } = require('../models/Pledge');
const Outbox = require('../models/Outbox');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const { ValidationError, NotFoundError, DuplicateRequestError } = require('../../../shared/utils/errors');
const { validateRequired, validateAmount, validateEmail } = require('../../../shared/utils/validation');

class PledgeService {
  constructor(logger) {
    this.logger = logger;
    this.paymentServiceUrl = process.env.PAYMENT_SERVICE_URL || 'http://localhost:3004';
  }

  async createPledge(idempotencyKey, pledgeData, user = null) {
    try {
      // Check idempotency - if already exists, return cached response
      const existingPledge = await Pledge.findOne({ idempotencyKey });
      if (existingPledge) {
        this.logger.info('Duplicate request detected', { idempotencyKey });
        throw new DuplicateRequestError('This pledge has already been created');
      }

      // Validate based on user type
      if (user) {
        // Registered user
        validateRequired(['campaignId', 'amount'], pledgeData);
        pledgeData.donorInfo = {
          name: user.name || 'Anonymous',
          email: user.email,
          isAnonymous: pledgeData.isAnonymous || false
        };
        pledgeData.donorUserId = user.userId;
      } else {
        // Guest user
        validateRequired(['campaignId', 'amount', 'donorInfo'], pledgeData);
        validateRequired(['name', 'email'], pledgeData.donorInfo);
        validateEmail(pledgeData.donorInfo.email);
      }

      validateAmount(pledgeData.amount);

      // Get campaign info (would call campaign service in real scenario)
      const campaignTitle = pledgeData.campaignTitle || 'Campaign';

      // Create payment intent ID
      const paymentIntentId = `pi_${uuidv4().replace(/-/g, '')}`;

      // Create pledge with state machine
      const pledge = new Pledge({
        idempotencyKey,
        campaignId: pledgeData.campaignId,
        campaignTitle,
        donorUserId: pledgeData.donorUserId,
        donorInfo: pledgeData.donorInfo,
        amount: pledgeData.amount,
        currency: pledgeData.currency || 'BDT',
        state: PLEDGE_STATES.PENDING,
        paymentIntentId,
        message: pledgeData.message,
        metadata: pledgeData.metadata
      });

      await pledge.save();

      // Create outbox event for payment service
      await Outbox.create({
        eventType: 'pledge.created',
        aggregateId: pledge._id,
        payload: {
          pledgeId: pledge._id,
          campaignId: pledge.campaignId,
          amount: pledge.amount,
          currency: pledge.currency,
          paymentIntentId,
          donorEmail: pledge.donorInfo.email,
          idempotencyKey
        }
      });

      this.logger.info('Pledge created with outbox event', { 
        pledgeId: pledge._id, 
        paymentIntentId 
      });

      return {
        pledgeId: pledge._id,
        campaignId: pledge.campaignId,
        amount: pledge.amount,
        state: pledge.state,
        paymentIntentId,
        paymentUrl: `${this.paymentServiceUrl}/api/payments/checkout/${paymentIntentId}`
      };
    } catch (error) {
      this.logger.error('Create pledge error:', { error: error.message });
      throw error;
    }
  }

  async getPledgeById(pledgeId) {
    try {
      const pledge = await Pledge.findById(pledgeId).lean();
      
      if (!pledge) {
        throw new NotFoundError('Pledge not found');
      }

      return {
        pledgeId: pledge._id,
        campaignId: pledge.campaignId,
        campaignTitle: pledge.campaignTitle,
        amount: pledge.amount,
        currency: pledge.currency,
        state: pledge.state,
        donorInfo: {
          name: pledge.donorInfo.isAnonymous ? 'Anonymous' : pledge.donorInfo.name,
          isAnonymous: pledge.donorInfo.isAnonymous
        },
        message: pledge.message,
        createdAt: pledge.createdAt
      };
    } catch (error) {
      this.logger.error('Get pledge error:', { error: error.message, pledgeId });
      throw error;
    }
  }

  async getPledgesByCampaign(campaignId, page = 1, limit = 20) {
    try {
      const skip = (page - 1) * limit;

      const pledges = await Pledge.find({ 
        campaignId,
        state: PLEDGE_STATES.COMPLETED 
      })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean();

      const total = await Pledge.countDocuments({ 
        campaignId,
        state: PLEDGE_STATES.COMPLETED 
      });

      return {
        pledges: pledges.map(p => ({
          pledgeId: p._id,
          amount: p.amount,
          donorName: p.donorInfo.isAnonymous ? 'Anonymous' : p.donorInfo.name,
          message: p.message,
          createdAt: p.createdAt
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total
        }
      };
    } catch (error) {
      this.logger.error('Get campaign pledges error:', { error: error.message, campaignId });
      throw error;
    }
  }

  async getUserDonations(userId) {
    try {
      const pledges = await Pledge.find({ donorUserId: userId })
        .sort({ createdAt: -1 })
        .lean();

      return pledges.map(p => ({
        pledgeId: p._id,
        campaignId: p.campaignId,
        campaignTitle: p.campaignTitle,
        amount: p.amount,
        currency: p.currency,
        state: p.state,
        createdAt: p.createdAt
      }));
    } catch (error) {
      this.logger.error('Get user donations error:', { error: error.message, userId });
      throw error;
    }
  }

  async updatePledgeState(pledgeId, newState, metadata = {}) {
    try {
      const pledge = await Pledge.findById(pledgeId);
      
      if (!pledge) {
        throw new NotFoundError('Pledge not found');
      }

      // Use state machine to validate transition
      pledge.transitionTo(newState, metadata);
      await pledge.save();

      // Create outbox event for completed pledges
      if (newState === PLEDGE_STATES.COMPLETED) {
        await Outbox.create({
          eventType: 'pledge.completed',
          aggregateId: pledge._id,
          payload: {
            pledgeId: pledge._id,
            campaignId: pledge.campaignId,
            amount: pledge.amount,
            currency: pledge.currency,
            donorUserId: pledge.donorUserId
          }
        });
      }

      this.logger.info('Pledge state updated', { pledgeId, newState });

      return { pledgeId, state: newState };
    } catch (error) {
      this.logger.error('Update pledge state error:', { error: error.message, pledgeId });
      throw error;
    }
  }
}

module.exports = PledgeService;
