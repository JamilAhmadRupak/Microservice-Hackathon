const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  idempotencyKey: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  pledgeId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Pledge',
    index: true
  },
  campaignId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Campaign'
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'BDT'
  },
  status: {
    type: String,
    enum: ['pending', 'authorized', 'captured', 'failed', 'refunded'],
    default: 'pending',
    index: true
  },
  paymentMethod: String,
  paymentProvider: {
    type: String,
    default: 'mock'
  },
  paymentIntentId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  providerTransactionId: String,
  providerResponse: mongoose.Schema.Types.Mixed,
  webhookReceived: {
    type: Boolean,
    default: false
  },
  webhookData: mongoose.Schema.Types.Mixed,
  failureReason: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  capturedAt: Date,
  refundedAt: Date
}, {
  timestamps: true
});

// Indexes
transactionSchema.index({ idempotencyKey: 1 }, { unique: true });
transactionSchema.index({ paymentIntentId: 1 }, { unique: true });
transactionSchema.index({ pledgeId: 1 });
transactionSchema.index({ status: 1 });
transactionSchema.index({ createdAt: -1 });

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;
