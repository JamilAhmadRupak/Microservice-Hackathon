const mongoose = require('mongoose');

const PLEDGE_STATES = {
  PENDING: 'PENDING',
  AUTHORIZED: 'AUTHORIZED',
  CAPTURED: 'CAPTURED',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED'
};

const STATE_TRANSITIONS = {
  PENDING: ['AUTHORIZED', 'FAILED'],
  AUTHORIZED: ['CAPTURED', 'FAILED'],
  CAPTURED: ['COMPLETED', 'FAILED', 'REFUNDED'],
  COMPLETED: ['REFUNDED'],
  FAILED: [],
  REFUNDED: []
};

const pledgeSchema = new mongoose.Schema({
  idempotencyKey: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  campaignId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Campaign',
    index: true
  },
  campaignTitle: {
    type: String,
    required: true
  },
  donorUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  donorInfo: {
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    phone: String,
    isAnonymous: {
      type: Boolean,
      default: false
    }
  },
  amount: {
    type: Number,
    required: true,
    min: 1
  },
  currency: {
    type: String,
    default: 'BDT'
  },
  state: {
    type: String,
    enum: Object.values(PLEDGE_STATES),
    default: PLEDGE_STATES.PENDING
  },
  paymentIntentId: String,
  message: String,
  metadata: mongoose.Schema.Types.Mixed,
  stateHistory: [{
    state: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    metadata: mongoose.Schema.Types.Mixed
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
pledgeSchema.index({ idempotencyKey: 1 }, { unique: true });
pledgeSchema.index({ campaignId: 1, createdAt: -1 });
pledgeSchema.index({ donorUserId: 1, createdAt: -1 });
pledgeSchema.index({ state: 1 });

// State machine validation
pledgeSchema.methods.canTransitionTo = function(newState) {
  const allowedStates = STATE_TRANSITIONS[this.state] || [];
  return allowedStates.includes(newState);
};

pledgeSchema.methods.transitionTo = function(newState, metadata = {}) {
  if (!this.canTransitionTo(newState)) {
    throw new Error(`Invalid state transition from ${this.state} to ${newState}`);
  }
  
  this.stateHistory.push({
    state: this.state,
    timestamp: new Date(),
    metadata
  });
  
  this.state = newState;
  this.updatedAt = new Date();
};

const Pledge = mongoose.model('Pledge', pledgeSchema);

module.exports = { Pledge, PLEDGE_STATES, STATE_TRANSITIONS };
