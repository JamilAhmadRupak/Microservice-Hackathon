const { mongoose } = require('../../shared/utils/database');

// Read model for campaign totals - optimized for queries
const campaignTotalsSchema = new mongoose.Schema({
  campaignId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    unique: true,
    ref: 'Campaign'
  },
  totalAmount: {
    type: Number,
    default: 0
  },
  totalPledges: {
    type: Number,
    default: 0
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

campaignTotalsSchema.index({ campaignId: 1 }, { unique: true });

const CampaignTotals = mongoose.model('CampaignTotals', campaignTotalsSchema);

module.exports = CampaignTotals;
