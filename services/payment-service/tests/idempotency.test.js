const PaymentService = require('../src/services/paymentService');
const { createServiceLogger } = require('../../../shared/utils/logger');

describe('Payment Idempotency Tests', () => {
  let paymentService;

  beforeAll(() => {
    const logger = createServiceLogger('test');
    paymentService = new PaymentService(logger);
  });

  it('should process payment with idempotency key', async () => {
    const idempotencyKey = `test-${Date.now()}`;
    const paymentData = {
      pledgeId: 'pledge123',
      campaignId: 'campaign123',
      amount: 1000,
      currency: 'BDT',
      paymentIntentId: `pi_${Date.now()}`
    };

    // First request
    const result1 = await paymentService.processPayment(idempotencyKey, paymentData);
    expect(result1).toHaveProperty('transactionId');

    // Duplicate request with same idempotency key
    const result2 = await paymentService.processPayment(idempotencyKey, paymentData);
    expect(result2.cached).toBe(true);
    expect(result2.transactionId).toBe(result1.transactionId);
  });
});
