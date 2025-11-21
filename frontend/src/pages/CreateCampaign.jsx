import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { campaignAPI } from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const CreateCampaign = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    story: '',
    goalAmount: '',
    currency: 'BDT',
    category: 'medical',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    beneficiaryName: '',
    beneficiaryRelation: '',
    imageUrl: '',
    status: 'draft',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = {
        ...formData,
        goalAmount: parseFloat(formData.goalAmount),
      };

      const response = await campaignAPI.create(data);
      toast.success('Campaign created successfully!');
      navigate(`/campaigns/${response.data.data.campaignId || response.data.data._id}`);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create campaign');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="card">
        <h1 className="text-3xl font-bold mb-6">Create New Campaign</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Campaign Title *
              </label>
              <input
                type="text"
                name="title"
                required
                maxLength="200"
                className="input-field"
                placeholder="Enter campaign title"
                value={formData.title}
                onChange={handleChange}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Short Description *
              </label>
              <textarea
                name="description"
                required
                maxLength="1000"
                rows="3"
                className="input-field"
                placeholder="Brief description of your campaign"
                value={formData.description}
                onChange={handleChange}
              ></textarea>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Story
              </label>
              <textarea
                name="story"
                maxLength="5000"
                rows="6"
                className="input-field"
                placeholder="Tell the full story of your campaign..."
                value={formData.story}
                onChange={handleChange}
              ></textarea>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Goal Amount (BDT) *
              </label>
              <input
                type="number"
                name="goalAmount"
                required
                min="1"
                className="input-field"
                placeholder="Enter goal amount"
                value={formData.goalAmount}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <select
                name="category"
                required
                className="input-field"
                value={formData.category}
                onChange={handleChange}
              >
                <option value="medical">Medical</option>
                <option value="education">Education</option>
                <option value="disaster">Disaster Relief</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date *
              </label>
              <input
                type="date"
                name="startDate"
                required
                className="input-field"
                value={formData.startDate}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date *
              </label>
              <input
                type="date"
                name="endDate"
                required
                className="input-field"
                value={formData.endDate}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Beneficiary Name *
              </label>
              <input
                type="text"
                name="beneficiaryName"
                required
                className="input-field"
                placeholder="Who will benefit?"
                value={formData.beneficiaryName}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Beneficiary Relation
              </label>
              <input
                type="text"
                name="beneficiaryRelation"
                className="input-field"
                placeholder="e.g., Daughter, Community"
                value={formData.beneficiaryRelation}
                onChange={handleChange}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Image URL
              </label>
              <input
                type="url"
                name="imageUrl"
                className="input-field"
                placeholder="https://example.com/image.jpg"
                value={formData.imageUrl}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="flex space-x-4 pt-4">
            <button
              type="button"
              onClick={() => navigate('/campaigns')}
              className="btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Campaign'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateCampaign;
