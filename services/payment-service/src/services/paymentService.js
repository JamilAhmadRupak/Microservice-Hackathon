const Transaction = require('../models/Transaction');
const axios = require('axios');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const { ValidationError, NotFoundError, DuplicateRequestError, PaymentError } = require('../../../shared/utils/errors');

class PaymentService {
  constructor(logger) {
    this.logger = logger;
    this.pledgeServiceUrl = process.env.PLEDGE_SERVICE_URL || 'http://localhost:3003';
  }

  // Mock payment provider
  async mockPaymentProvider(action, paymentIntentId, amount) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 95% success rate
    const success = Math.random() > 0.05;
    
    if (!success) {
      throw new Error('Payment provider error: Insufficient funds');
    }
    
    return {
      success: true,
      transactionId: `txn_${uuidv4().substring(0, 16)}`,
      status: action === 'authorize' ? 'authorized' : 'captured',
      timestamp: new Date().toISOString()
    };
  }

  async processPayment(idempotencyKey, paymentData) {
    try {
      // Check idempotency
      const existingTransaction = await Transaction.findOne({ idempotencyKey });
      if (existingTransaction) {
        this.logger.info('Duplicate payment request detected', { idempotencyKey });
        return {
          transactionId: existingTransaction._id,
          status: existingTransaction.status,
          paymentIntentId: existingTransaction.paymentIntentId,
          cached: true
        };
      }

      const { pledgeId, campaignId, amount, currency, paymentIntentId } = paymentData;

      // Create transaction record
      const transaction = new Transaction({
        idempotencyKey,
        pledgeId,
        campaignId,
        amount,
        currency: currency || 'BDT',
        paymentIntentId,
        status: 'pending'
      });

      await transaction.save();

      try {
        // Authorize payment with mock provider
        const authResult = await this.mockPaymentProvider('authorize', paymentIntentId, amount);
        
        transaction.status = 'authorized';
        transaction.providerTransactionId = authResult.transactionId;
        transaction.providerResponse = authResult;
        await transaction.save();

        // Update pledge state
        await this.updatePledgeState(pledgeId, 'AUTHORIZED');

        // Auto-capture after authorization (in real scenario, this might be manual)
        setTimeout(async () => {
          await this.capturePayment(paymentIntentId);
        }, 2000);

        this.logger.info('Payment authorized', { 
          transactionId: transaction._id,
          paymentIntentId 
        });

        return {
          transactionId: transaction._id,
          status: transaction.status,
          paymentIntentId: transaction.paymentIntentId
        };
      } catch (error) {
        transaction.status = 'failed';
        transaction.failureReason = error.message;
        await transaction.save();

        await this.updatePledgeState(pledgeId, 'FAILED', { reason: error.message });

        throw new PaymentError(error.message);
      }
    } catch (error) {
      this.logger.error('Process payment error:', { error: error.message });
      throw error;
    }
  }

  async capturePayment(paymentIntentId) {
    try {
      const transaction = await Transaction.findOne({ paymentIntentId });
      
      if (!transaction) {
        throw new NotFoundError('Transaction not found');
      }

      if (transaction.status !== 'authorized') {
        throw new ValidationError(`Cannot capture payment in ${transaction.status} status`);
      }

      // Capture with mock provider
      const captureResult = await this.mockPaymentProvider('capture', paymentIntentId, transaction.amount);
      
      transaction.status = 'captured';
      transaction.capturedAt = new Date();
      transaction.providerResponse = captureResult;
      await transaction.save();

      // Update pledge state to CAPTURED
      await this.updatePledgeState(transaction.pledgeId, 'CAPTURED');

      // Then immediately mark as COMPLETED
      await this.updatePledgeState(transaction.pledgeId, 'COMPLETED');

      this.logger.info('Payment captured and completed', { 
        transactionId: transaction._id,
        paymentIntentId 
      });

      return {
        transactionId: transaction._id,
        status: transaction.status
      };
    } catch (error) {
      this.logger.error('Capture payment error:', { error: error.message, paymentIntentId });
      throw error;
    }
  }

  async handleWebhook(webhookData, signature) {
    try {
      // Verify webhook signature (simplified)
      const expectedSignature = crypto
        .createHmac('sha256', process.env.WEBHOOK_SECRET || 'webhook-secret')
        .update(JSON.stringify(webhookData))
        .digest('hex');

      // In production, use timing-safe comparison
      if (signature && signature !== expectedSignature) {
        this.logger.warn('Invalid webhook signature');
        // Don't throw error to prevent retry storms
        return { received: true, processed: false };
      }

      const { eventType, paymentIntentId, status } = webhookData;

      // Find transaction by paymentIntentId
      const transaction = await Transaction.findOne({ paymentIntentId });
      
      if (!transaction) {
        this.logger.warn('Transaction not found for webhook', { paymentIntentId });
        return { received: true, processed: false };
      }

      // Check if webhook already processed (idempotency)
      if (transaction.webhookReceived) {
        this.logger.info('Webhook already processed', { paymentIntentId });
        return { received: true, processed: true, cached: true };
      }

      transaction.webhookReceived = true;
      transaction.webhookData = webhookData;
      
      // Update status based on webhook
      if (eventType === 'payment.captured' && status === 'captured') {
        if (transaction.status === 'authorized') {
          transaction.status = 'captured';
          transaction.capturedAt = new Date();
          await this.updatePledgeState(transaction.pledgeId, 'CAPTURED');
          await this.updatePledgeState(transaction.pledgeId, 'COMPLETED');
        }
      }

      await transaction.save();

      this.logger.info('Webhook processed', { paymentIntentId, eventType });

      return { received: true, processed: true };
    } catch (error) {
      this.logger.error('Webhook handling error:', { error: error.message });
      throw error;
    }
  }

  async updatePledgeState(pledgeId, state, metadata = {}) {
    try {
      await axios.put(
        `${this.pledgeServiceUrl}/api/pledges/${pledgeId}/state`,
        { state, metadata }
      );
      this.logger.info('Pledge state updated', { pledgeId, state });
    } catch (error) {
      this.logger.error('Failed to update pledge state:', { 
        error: error.message, 
        pledgeId, 
        state 
      });
      // Don't throw - this is a best-effort notification
    }
  }

  async getTransaction(pledgeId) {
    try {
      const transaction = await Transaction.findOne({ pledgeId }).lean();
      
      if (!transaction) {
        throw new NotFoundError('Transaction not found');
      }

      return {
        transactionId: transaction._id,
        pledgeId: transaction.pledgeId,
        amount: transaction.amount,
        status: transaction.status,
        paymentIntentId: transaction.paymentIntentId,
        createdAt: transaction.createdAt,
        capturedAt: transaction.capturedAt
      };
    } catch (error) {
      this.logger.error('Get transaction error:', { error: error.message, pledgeId });
      throw error;
    }
  }
}

module.exports = PaymentService;
