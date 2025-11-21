const mongoose = require('mongoose');

// Define schemas directly (shared database access)
const campaignSchema = new mongoose.Schema({
  title: String,
  status: String,
  isVerified: Boolean,
  verifiedBy: mongoose.Schema.Types.ObjectId,
  verifiedAt: Date,
  createdAt: { type: Date, default: Date.now }
}, { collection: 'campaigns', timestamps: true });

const pledgeSchema = new mongoose.Schema({
  campaignId: mongoose.Schema.Types.ObjectId,
  amount: Number,
  state: String,
  createdAt: { type: Date, default: Date.now }
}, { collection: 'pledges', timestamps: true });

const transactionSchema = new mongoose.Schema({
  pledgeId: mongoose.Schema.Types.ObjectId,
  amount: Number,
  status: String,
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
    // Use existing models or create new ones
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
        this.Pledge.countDocuments({ state: 'COMPLETED' }),
        this.Pledge.aggregate([
          { $match: { state: 'COMPLETED' } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]),
        this.Pledge.countDocuments({
          state: 'COMPLETED',
          createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
        }),
        this.Pledge.aggregate([
          {
            $match: {
              state: 'COMPLETED',
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
}

module.exports = AdminService;
