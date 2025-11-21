const { mongoose } = require('../../shared/utils/database');

// Define schemas directly (shared database access)
const campaignSchema = new mongoose.Schema({
  title: String,
  description: String,
  goalAmount: Number,
  category: String,
  organizerName: String,
  status: String,
  isVerified: Boolean,
  verifiedBy: mongoose.Schema.Types.ObjectId,
  verifiedAt: Date,
  createdAt: { type: Date, default: Date.now }
}, { collection: 'campaigns', timestamps: true });

const pledgeSchema = new mongoose.Schema({
  campaignId: mongoose.Schema.Types.ObjectId,
  campaignTitle: String,
  amount: Number,
  state: String,
  donorInfo: {
    name: String,
    email: String
  },
  message: String,
  approvedBy: mongoose.Schema.Types.ObjectId,
  approvedAt: Date,
  rejectedBy: mongoose.Schema.Types.ObjectId,
  rejectedAt: Date,
  rejectionReason: String,
  createdAt: { type: Date, default: Date.now }
}, { collection: 'pledges', timestamps: true });

const transactionSchema = new mongoose.Schema({
  pledgeId: mongoose.Schema.Types.ObjectId,
  transactionId: String,
  amount: Number,
  status: String,
  campaignTitle: String,
  createdAt: { type: Date, default: Date.now }
}, { collection: 'transactions', timestamps: true });

const userSchema = new mongoose.Schema({
  email: String,
  name: String,
  createdAt: { type: Date, default: Date.now }
}, { collection: 'users', timestamps: true });

class AdminService {
  constructor(logger) {
    this.logger = logger;
    // Use existing models or create new ones from shared mongoose instance
    this.Campaign = mongoose.models.Campaign || mongoose.model('Campaign', campaignSchema);
    this.Pledge = mongoose.models.Pledge || mongoose.model('Pledge', pledgeSchema);
    this.Transaction = mongoose.models.Transaction || mongoose.model('Transaction', transactionSchema);
    this.User = mongoose.models.User || mongoose.model('User', userSchema);
  }

  async getDashboardStats() {
    try {
      const [totalCampaigns, activeCampaigns, totalPledges, totalAmount, todayPledges, todayAmount] = await Promise.all([
        this.Campaign.countDocuments(),
        this.Campaign.countDocuments({ status: 'active' }),
        // Count ALL pledges, not just COMPLETED ones
        this.Pledge.countDocuments(),
        // Sum amount from all non-FAILED pledges
        this.Pledge.aggregate([
          { $match: { state: { $ne: 'FAILED' } } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]),
        this.Pledge.countDocuments({
          createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
        }),
        this.Pledge.aggregate([
          {
            $match: {
              state: { $ne: 'FAILED' },
              createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
            }
          },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ])
      ]);

      return {
        totalCampaigns,
        activeCampaigns,
        totalPledges,
        totalAmount: totalAmount[0]?.total || 0,
        todayPledges,
        todayAmount: todayAmount[0]?.total || 0
      };
    } catch (error) {
      this.logger.error('Get dashboard stats error:', { error: error.message });
      throw error;
    }
  }

  async getAllCampaigns(filters = {}) {
    try {
      const { status, page = 1, limit = 20 } = filters;
      const skip = (page - 1) * limit;

      const query = status ? { status } : {};

      const campaigns = await this.Campaign.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean();

      const total = await this.Campaign.countDocuments(query);

      return {
        campaigns,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      this.logger.error('Get all campaigns error:', { error: error.message });
      throw error;
    }
  }

  async verifyCampaign(campaignId, adminId, isVerified, status) {
    try {
      const campaign = await this.Campaign.findById(campaignId);
      
      if (!campaign) {
        throw new Error('Campaign not found');
      }

      campaign.isVerified = isVerified;
      if (status) {
        campaign.status = status;
      }
      campaign.verifiedBy = adminId;
      campaign.verifiedAt = new Date();

      await campaign.save();

      this.logger.info('Campaign verified', { campaignId, adminId, isVerified });

      return { message: 'Campaign updated successfully', campaignId };
    } catch (error) {
      this.logger.error('Verify campaign error:', { error: error.message, campaignId });
      throw error;
    }
  }

  async getAllTransactions(page = 1, limit = 20) {
    try {
      const skip = (page - 1) * limit;

      const transactions = await this.Transaction.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean();

      const total = await this.Transaction.countDocuments();

      return {
        transactions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      this.logger.error('Get all transactions error:', { error: error.message });
      throw error;
    }
  }

  async getAllPledges(filters = {}) {
    try {
      const { state, page = 1, limit = 20 } = filters;
      const skip = (page - 1) * limit;

      const query = state ? { state } : {};

      const pledges = await this.Pledge.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean();

      const total = await this.Pledge.countDocuments(query);

      return {
        pledges,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      this.logger.error('Get all pledges error:', { error: error.message });
      throw error;
    }
  }

  async approvePledge(pledgeId, adminId) {
    try {
      const pledge = await this.Pledge.findById(pledgeId);
      
      if (!pledge) {
        throw new Error('Pledge not found');
      }

      if (pledge.state !== 'PENDING') {
        throw new Error(`Cannot approve pledge in ${pledge.state} state`);
      }

      // Update pledge state to AUTHORIZED (ready for payment processing)
      pledge.state = 'AUTHORIZED';
      pledge.approvedBy = adminId;
      pledge.approvedAt = new Date();
      
      await pledge.save();

      // Publish event to trigger payment processing
      await this.publishPledgeAuthorizedEvent(pledge);

      this.logger.info('Pledge approved', { pledgeId, adminId });

      return { message: 'Pledge approved successfully', pledgeId };
    } catch (error) {
      this.logger.error('Approve pledge error:', { error: error.message, pledgeId });
      throw error;
    }
  }

  async publishPledgeAuthorizedEvent(pledge) {
    try {
      const redis = require('redis');
      const redisClient = redis.createClient({ 
        url: process.env.REDIS_URL || 'redis://localhost:6379' 
      });
      await redisClient.connect();
      
      const event = {
        pledgeId: pledge._id.toString(),
        campaignId: pledge.campaignId.toString(),
        amount: pledge.amount,
        currency: pledge.currency || 'BDT',
        paymentIntentId: pledge.paymentIntentId,
        idempotencyKey: pledge.idempotencyKey
      };
      
      await redisClient.publish('pledge.authorized', JSON.stringify(event));
      await redisClient.quit();
      
      this.logger.info('Published pledge.authorized event', { pledgeId: pledge._id });
    } catch (error) {
      this.logger.error('Failed to publish pledge.authorized event:', { error: error.message });
      // Don't throw - pledge is already approved in DB
    }
  }

  async rejectPledge(pledgeId, adminId, reason) {
    try {
      const pledge = await this.Pledge.findById(pledgeId);
      
      if (!pledge) {
        throw new Error('Pledge not found');
      }

      if (pledge.state !== 'PENDING') {
        throw new Error(`Cannot reject pledge in ${pledge.state} state`);
      }

      // Update pledge state to FAILED
      pledge.state = 'FAILED';
      pledge.rejectedBy = adminId;
      pledge.rejectedAt = new Date();
      pledge.rejectionReason = reason;
      
      await pledge.save();

      this.logger.info('Pledge rejected', { pledgeId, adminId, reason });

      return { message: 'Pledge rejected successfully', pledgeId };
    } catch (error) {
      this.logger.error('Reject pledge error:', { error: error.message, pledgeId });
      throw error;
    }
  }
}

module.exports = AdminService;
