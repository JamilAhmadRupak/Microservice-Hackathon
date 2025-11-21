import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { campaignAPI } from '../services/api';
import toast from 'react-hot-toast';
import Loader from '../components/Loader';
import { Calendar, TrendingUp, Search } from 'lucide-react';

const CampaignList = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    category: '',
    search: '',
  });

  useEffect(() => {
    loadCampaigns();
  }, [filters]);

  const loadCampaigns = async () => {
    try {
      const params = {
        status: 'active',
        ...(filters.category && { category: filters.category }),
        ...(filters.search && { search: filters.search }),
      };
      const response = await campaignAPI.getAll(params);
      setCampaigns(response.data.data.campaigns || response.data.data);
    } catch (error) {
      toast.error('Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader fullScreen />;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Active Campaigns</h1>
        
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search campaigns..."
              className="input-field pl-10"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>
          <select
            className="input-field"
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
          >
            <option value="">All Categories</option>
            <option value="medical">Medical</option>
            <option value="education">Education</option>
            <option value="disaster">Disaster Relief</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      {campaigns.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-xl text-gray-600">No campaigns found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaigns.map((campaign) => (
            <Link
              key={campaign._id || campaign.campaignId}
              to={`/campaigns/${campaign._id || campaign.campaignId}`}
              className="card hover:shadow-xl transition-shadow"
            >
              {campaign.imageUrl && (
                <img
                  src={campaign.imageUrl}
                  alt={campaign.title}
                  className="w-full h-48 object-cover rounded-lg mb-4"
                />
              )}
              
              <span className="inline-block bg-primary-100 text-primary-800 text-xs font-semibold px-3 py-1 rounded-full mb-2">
                {campaign.category}
              </span>
              
              <h3 className="text-xl font-bold mb-2 line-clamp-2">{campaign.title}</h3>
              <p className="text-gray-600 text-sm mb-4 line-clamp-3">{campaign.description}</p>
              
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-semibold">
                    {campaign.currency} {(campaign.currentAmount || 0).toLocaleString()}
                  </span>
                  <span className="text-gray-600">
                    of {campaign.currency} {campaign.goalAmount.toLocaleString()}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary-600 h-2 rounded-full"
                    style={{ width: `${Math.min((campaign.currentAmount || 0) / campaign.goalAmount * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="flex items-center justify-between text-sm text-gray-600">
                <div className="flex items-center">
                  <Calendar size={16} className="mr-1" />
                  <span>{new Date(campaign.endDate).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center">
                  <TrendingUp size={16} className="mr-1" />
                  <span>{campaign.progress || 0}%</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default CampaignList;
