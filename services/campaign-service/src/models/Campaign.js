const { mongoose } = require('../../shared/utils/database');

const campaignSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  story: {
    type: String,
    maxlength: [5000, 'Story cannot exceed 5000 characters']
  },
  goalAmount: {
    type: Number,
    required: [true, 'Goal amount is required'],
    min: [1, 'Goal amount must be positive']
  },
  currentAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  currency: {
    type: String,
    default: 'BDT',
    enum: ['BDT', 'USD', 'EUR']
  },
  organizerId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  organizerName: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['medical', 'education', 'disaster', 'other']
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'paused', 'completed', 'cancelled'],
    default: 'draft'
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required']
  },
  imageUrl: {
    type: String
  },
  beneficiaryName: {
    type: String,
    required: [true, 'Beneficiary name is required']
  },
  beneficiaryRelation: {
    type: String
  },
  documents: [{
    type: String
  }],
  isVerified: {
    type: Boolean,
    default: false
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  verifiedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes
campaignSchema.index({ status: 1, startDate: -1 });
campaignSchema.index({ category: 1 });
campaignSchema.index({ organizerId: 1 });
campaignSchema.index({ createdAt: -1 });
campaignSchema.index({ title: 'text', description: 'text' });

// Virtual for progress percentage
campaignSchema.virtual('progress').get(function() {
  return this.goalAmount > 0 ? Math.round((this.currentAmount / this.goalAmount) * 100) : 0;
});

campaignSchema.set('toJSON', { virtuals: true });
campaignSchema.set('toObject', { virtuals: true });

const Campaign = mongoose.model('Campaign', campaignSchema);

module.exports = Campaign;
