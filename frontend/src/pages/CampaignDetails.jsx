import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { campaignAPI, pledgeAPI } from '../services/api';
import toast from 'react-hot-toast';
import Loader from '../components/Loader';
import { Calendar, User, TrendingUp, Heart, DollarSign } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { v4 as uuidv4 } from 'uuid';

const CampaignDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState(null);
  const [pledges, setPledges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDonateModal, setShowDonateModal] = useState(false);
  const [donationAmount, setDonationAmount] = useState('');
  const [donationMessage, setDonationMessage] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadCampaign();
    loadPledges();
  }, [id]);

  const loadCampaign = async () => {
    try {
      const response = await campaignAPI.getById(id);
      setCampaign(response.data.data);
    } catch (error) {
      toast.error('Failed to load campaign');
      navigate('/campaigns');
    } finally {
      setLoading(false);
    }
  };

  const loadPledges = async () => {
    try {
      const response = await pledgeAPI.getByCampaign(id);
      setPledges(response.data.data.pledges || []);
    } catch (error) {
      console.error('Failed to load pledges');
    }
  };

  const handleDonate = async (e) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Please login to donate');
      navigate('/login');
      return;
    }

    const amount = parseFloat(donationAmount);
    if (amount < 1) {
      toast.error('Minimum donation is 1 BDT');
      return;
    }

    setProcessing(true);

    try {
      const pledgeData = {
        campaignId: id,
        amount,
        currency: 'BDT',
        message: donationMessage,
      };

      const idempotencyKey = uuidv4();
      const response = await pledgeAPI.create(pledgeData, idempotencyKey);
      
      toast.success('Donation created! Processing payment...');
      setShowDonateModal(false);
      
      // Reload campaign and pledges
      loadCampaign();
      loadPledges();
      
      // Show payment info
      setTimeout(() => {
        toast.success('Payment is being processed. Check your profile for status.', {
          duration: 5000,
        });
      }, 1000);
      
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create donation');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <Loader fullScreen />;
  if (!campaign) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {campaign.imageUrl && (
            <img
              src={campaign.imageUrl}
              alt={campaign.title}
              className="w-full h-96 object-cover rounded-xl mb-6"
            />
          )}
          
          <span className="inline-block bg-primary-100 text-primary-800 text-sm font-semibold px-4 py-2 rounded-full mb-4">
            {campaign.category}
          </span>
          
          <h1 className="text-4xl font-bold mb-4">{campaign.title}</h1>
          
          <div className="flex items-center space-x-6 text-gray-600 mb-6">
            <div className="flex items-center">
              <User size={20} className="mr-2" />
              <span>{campaign.organizerName}</span>
            </div>
            <div className="flex items-center">
              <Calendar size={20} className="mr-2" />
              <span>Ends {new Date(campaign.endDate).toLocaleDateString()}</span>
            </div>
          </div>
          
          <div className="card mb-8">
            <h2 className="text-2xl font-bold mb-4">Campaign Story</h2>
            <p className="text-gray-700 whitespace-pre-line">{campaign.story || campaign.description}</p>
            
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold mb-2">Beneficiary Information</h3>
              <p className="text-gray-700">
                <strong>Name:</strong> {campaign.beneficiaryName}
              </p>
              {campaign.beneficiaryRelation && (
                <p className="text-gray-700">
                  <strong>Relation:</strong> {campaign.beneficiaryRelation}
                </p>
              )}
            </div>
          </div>
          
          {/* Recent Donations */}
          <div className="card">
            <h2 className="text-2xl font-bold mb-4">Recent Donations</h2>
            {pledges.length === 0 ? (
              <p className="text-gray-600">No donations yet. Be the first to donate!</p>
            ) : (
              <div className="space-y-4">
                {pledges.slice(0, 5).map((pledge, index) => (
                  <div key={index} className="flex justify-between items-center py-3 border-b last:border-b-0">
                    <div>
                      <p className="font-semibold">{pledge.donorName || 'Anonymous'}</p>
                      {pledge.message && (
                        <p className="text-sm text-gray-600 italic">"{pledge.message}"</p>
                      )}
                    </div>
                    <p className="text-lg font-bold text-primary-600">
                      ৳{pledge.amount.toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="card sticky top-4">
            <div className="mb-6">
              <h3 className="text-3xl font-bold text-primary-600 mb-2">
                ৳{(campaign.currentAmount || 0).toLocaleString()}
              </h3>
              <p className="text-gray-600">
                raised of ৳{campaign.goalAmount.toLocaleString()} goal
              </p>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-3 mb-6">
              <div
                className="bg-primary-600 h-3 rounded-full"
                style={{ width: `${Math.min((campaign.currentAmount || 0) / campaign.goalAmount * 100, 100)}%` }}
              ></div>
            </div>
            
            <div className="space-y-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center text-gray-600">
                  <TrendingUp size={20} className="mr-2" />
                  <span>Progress</span>
                </div>
                <span className="font-semibold">{campaign.progress || 0}%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center text-gray-600">
                  <Heart size={20} className="mr-2" />
                  <span>Donors</span>
                </div>
                <span className="font-semibold">{campaign.totalPledges || pledges.length}</span>
              </div>
            </div>
            
            <button
              onClick={() => setShowDonateModal(true)}
              className="w-full btn-primary py-4 text-lg"
            >
              Donate Now
            </button>
          </div>
        </div>
      </div>
      
      {/* Donation Modal */}
      {showDonateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold mb-4">Make a Donation</h2>
            <form onSubmit={handleDonate}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Donation Amount (BDT)
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="number"
                    min="1"
                    required
                    className="input-field pl-10"
                    placeholder="Enter amount"
                    value={donationAmount}
                    onChange={(e) => setDonationAmount(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message (Optional)
                </label>
                <textarea
                  className="input-field"
                  rows="3"
                  placeholder="Leave a message of support..."
                  value={donationMessage}
                  onChange={(e) => setDonationMessage(e.target.value)}
                ></textarea>
              </div>
              
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowDonateModal(false)}
                  className="flex-1 btn-secondary"
                  disabled={processing}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 btn-primary"
                  disabled={processing}
                >
                  {processing ? 'Processing...' : 'Donate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CampaignDetails;
