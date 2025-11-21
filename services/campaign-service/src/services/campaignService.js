const Campaign = require('../models/Campaign');
const CampaignTotals = require('../models/CampaignTotals');
const { ValidationError, NotFoundError, ForbiddenError } = require('../../shared/utils/errors');
const { validateRequired, validateAmount, validateDateRange } = require('../../shared/utils/validation');

class CampaignService {
  constructor(logger) {
    this.logger = logger;
  }

  async createCampaign(userId, userName, campaignData) {
    try {
      validateRequired(['title', 'description', 'goalAmount', 'category', 'startDate', 'endDate', 'beneficiaryName'], campaignData);
      validateAmount(campaignData.goalAmount);
      validateDateRange(campaignData.startDate, campaignData.endDate);

      const campaign = new Campaign({
        ...campaignData,
        organizerId: userId,
        organizerName: userName
      });

      await campaign.save();

      // Initialize campaign totals (read model)
      await CampaignTotals.create({
        campaignId: campaign._id,
        totalAmount: 0,
        totalPledges: 0
      });

      this.logger.info('Campaign created', { campaignId: campaign._id, userId });

      return {
        campaignId: campaign._id,
        title: campaign.title,
        status: campaign.status,
        createdAt: campaign.createdAt
      };
    } catch (error) {
      this.logger.error('Create campaign error:', { error: error.message });
      throw error;
    }
  }

  async getCampaigns(filters = {}) {
    try {
      const { category, status = 'active', page = 1, limit = 10, search } = filters;
      const skip = (page - 1) * limit;

      const query = {};
      
      if (category) query.category = category;
      if (status) query.status = status;
      if (search) {
        query.$text = { $search: search };
      }

      const campaigns = await Campaign.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean();

      const total = await Campaign.countDocuments(query);

      // Enrich with totals
      const enrichedCampaigns = await Promise.all(campaigns.map(async (campaign) => {
        const totals = await CampaignTotals.findOne({ campaignId: campaign._id });
        return {
          campaignId: campaign._id,
          title: campaign.title,
          description: campaign.description,
          goalAmount: campaign.goalAmount,
          currentAmount: totals?.totalAmount || 0,
          currency: campaign.currency,
          organizerName: campaign.organizerName,
          category: campaign.category,
          status: campaign.status,
          progress: campaign.goalAmount > 0 ? Math.round(((totals?.totalAmount || 0) / campaign.goalAmount) * 100) : 0,
          imageUrl: campaign.imageUrl,
          startDate: campaign.startDate,
          endDate: campaign.endDate
        };
      }));

      return {
        campaigns: enrichedCampaigns,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      this.logger.error('Get campaigns error:', { error: error.message });
      throw error;
    }
  }

  async getCampaignById(campaignId) {
    try {
      const campaign = await Campaign.findById(campaignId).lean();
      
      if (!campaign) {
        throw new NotFoundError('Campaign not found');
      }

      const totals = await CampaignTotals.findOne({ campaignId: campaign._id });

      return {
        campaignId: campaign._id,
        title: campaign.title,
        description: campaign.description,
        story: campaign.story,
        goalAmount: campaign.goalAmount,
        currentAmount: totals?.totalAmount || 0,
        currency: campaign.currency,
        organizerId: campaign.organizerId,
        organizerName: campaign.organizerName,
        category: campaign.category,
        status: campaign.status,
        progress: campaign.goalAmount > 0 ? Math.round(((totals?.totalAmount || 0) / campaign.goalAmount) * 100) : 0,
        totalPledges: totals?.totalPledges || 0,
        beneficiaryName: campaign.beneficiaryName,
        beneficiaryRelation: campaign.beneficiaryRelation,
        imageUrl: campaign.imageUrl,
        documents: campaign.documents,
        isVerified: campaign.isVerified,
        startDate: campaign.startDate,
        endDate: campaign.endDate,
        createdAt: campaign.createdAt
      };
    } catch (error) {
      this.logger.error('Get campaign error:', { error: error.message, campaignId });
      throw error;
    }
  }

  async updateCampaign(campaignId, userId, updates) {
    try {
      const campaign = await Campaign.findById(campaignId);
      
      if (!campaign) {
        throw new NotFoundError('Campaign not found');
      }

      if (campaign.organizerId.toString() !== userId) {
        throw new ForbiddenError('You can only update your own campaigns');
      }

      const allowedUpdates = ['title', 'description', 'story', 'imageUrl', 'status'];
      const updateData = {};

      for (const key of allowedUpdates) {
        if (updates[key] !== undefined) {
          updateData[key] = updates[key];
        }
      }

      Object.assign(campaign, updateData);
      await campaign.save();

      this.logger.info('Campaign updated', { campaignId, userId });

      return {
        campaignId: campaign._id,
        message: 'Campaign updated successfully'
      };
    } catch (error) {
      this.logger.error('Update campaign error:', { error: error.message, campaignId });
      throw error;
    }
  }

  async updateCampaignTotals(campaignId, amount) {
    try {
      const totals = await CampaignTotals.findOneAndUpdate(
        { campaignId },
        {
          $inc: { totalAmount: amount, totalPledges: 1 },
          lastUpdated: Date.now()
        },
        { new: true, upsert: true }
      );

      this.logger.info('Campaign totals updated', { campaignId, amount, newTotal: totals.totalAmount });

      return totals;
    } catch (error) {
      this.logger.error('Update totals error:', { error: error.message, campaignId });
      throw error;
    }
  }
}

module.exports = CampaignService;
