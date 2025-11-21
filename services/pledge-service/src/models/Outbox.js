const { mongoose } = require('../../shared/utils/database');

const outboxSchema = new mongoose.Schema({
  eventType: {
    type: String,
    required: true,
    index: true
  },
  aggregateId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true
  },
  payload: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'published', 'failed'],
    default: 'pending',
    index: true
  },
  retryCount: {
    type: Number,
    default: 0
  },
  maxRetries: {
    type: Number,
    default: 5
  },
  error: String,
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  publishedAt: Date
});

// Compound index for processing order
outboxSchema.index({ status: 1, createdAt: 1 });

const Outbox = mongoose.model('Outbox', outboxSchema);

module.exports = Outbox;
