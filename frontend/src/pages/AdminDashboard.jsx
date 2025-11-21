import { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import toast from 'react-hot-toast';
import Loader from '../components/Loader';
import { TrendingUp, Users, Heart, DollarSign, CheckCircle, XCircle } from 'lucide-react';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [pledges, setPledges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pledges');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [dashboardRes, campaignsRes, transactionsRes, pledgesRes] = await Promise.all([
        adminAPI.getDashboard(),
        adminAPI.getAllCampaigns({ status: 'draft', limit: 10 }),
        adminAPI.getTransactions({ limit: 10 }),
        adminAPI.getAllPledges({ state: 'PENDING', limit: 20 }),
      ]);

      setStats(dashboardRes.data.data);
      setCampaigns(campaignsRes.data.data.campaigns || campaignsRes.data.data);
      setTransactions(transactionsRes.data.data.transactions || transactionsRes.data.data);
      setPledges(pledgesRes.data.data.pledges || pledgesRes.data.data);
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCampaign = async (campaignId, isVerified) => {
    try {
      await adminAPI.verifyCampaign(campaignId, {
        isVerified,
        status: isVerified ? 'active' : 'draft',
      });
      toast.success(`Campaign ${isVerified ? 'approved' : 'rejected'}`);
      loadDashboardData();
    } catch (error) {
      toast.error('Failed to update campaign');
    }
  };

  const handleApprovePledge = async (pledgeId) => {
    try {
      await adminAPI.approvePledge(pledgeId);
      toast.success('Pledge approved! Payment will be processed.');
      loadDashboardData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to approve pledge');
    }
  };

  const handleRejectPledge = async (pledgeId) => {
    try {
      const reason = prompt('Enter rejection reason (optional):');
      await adminAPI.rejectPledge(pledgeId, reason || 'Rejected by admin');
      toast.success('Pledge rejected');
      loadDashboardData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to reject pledge');
    }
  };

  if (loading) return <Loader fullScreen />;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">Admin Dashboard</h1>

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Campaigns</p>
                <p className="text-3xl font-bold">{stats.totalCampaigns}</p>
              </div>
              <TrendingUp className="text-primary-600" size={40} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Active Campaigns</p>
                <p className="text-3xl font-bold">{stats.activeCampaigns}</p>
              </div>
              <Heart className="text-red-500" size={40} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Donations</p>
                <p className="text-3xl font-bold">{stats.totalPledges}</p>
              </div>
              <Users className="text-blue-500" size={40} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Amount</p>
                <p className="text-3xl font-bold">৳{stats.totalAmount?.toLocaleString() || 0}</p>
              </div>
              <DollarSign className="text-green-500" size={40} />
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex space-x-4 mb-6 border-b">
        <button
          onClick={() => setActiveTab('pledges')}
          className={`px-4 py-2 font-semibold ${
            activeTab === 'pledges'
              ? 'border-b-2 border-primary-600 text-primary-600'
              : 'text-gray-600'
          }`}
        >
          Pending Donations ({pledges.length})
        </button>
        <button
          onClick={() => setActiveTab('campaigns')}
          className={`px-4 py-2 font-semibold ${
            activeTab === 'campaigns'
              ? 'border-b-2 border-primary-600 text-primary-600'
              : 'text-gray-600'
          }`}
        >
          Pending Campaigns ({campaigns.length})
        </button>
        <button
          onClick={() => setActiveTab('transactions')}
          className={`px-4 py-2 font-semibold ${
            activeTab === 'transactions'
              ? 'border-b-2 border-primary-600 text-primary-600'
              : 'text-gray-600'
          }`}
        >
          All Transactions
        </button>
      </div>

      {/* Pending Pledges/Donations */}
      {activeTab === 'pledges' && (
        <div className="card">
          <h2 className="text-2xl font-bold mb-6">Pending Donation Approvals</h2>
          {pledges.length === 0 ? (
            <p className="text-gray-600 text-center py-8">No pending donations</p>
          ) : (
            <div className="space-y-4">
              {pledges.map((pledge) => (
                <div key={pledge._id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold">৳{pledge.amount.toLocaleString()}</h3>
                        <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-full">
                          {pledge.state}
                        </span>
                      </div>
                      <p className="text-gray-700 mb-1">
                        <strong>Campaign:</strong> {pledge.campaignTitle || 'N/A'}
                      </p>
                      <p className="text-gray-700 mb-1">
                        <strong>Donor:</strong> {pledge.donorInfo?.name || 'Anonymous'} ({pledge.donorInfo?.email || 'N/A'})
                      </p>
                      {pledge.message && (
                        <p className="text-gray-600 italic mt-2">"{pledge.message}"</p>
                      )}
                      <p className="text-sm text-gray-500 mt-2">
                        {new Date(pledge.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex space-x-2 ml-4">
                      <button
                        onClick={() => handleApprovePledge(pledge._id)}
                        className="flex items-center space-x-1 bg-green-100 text-green-700 px-4 py-2 rounded-lg hover:bg-green-200"
                      >
                        <CheckCircle size={18} />
                        <span>Approve</span>
                      </button>
                      <button
                        onClick={() => handleRejectPledge(pledge._id)}
                        className="flex items-center space-x-1 bg-red-100 text-red-700 px-4 py-2 rounded-lg hover:bg-red-200"
                      >
                        <XCircle size={18} />
                        <span>Reject</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Pending Campaigns */}
      {activeTab === 'campaigns' && (
        <div className="card">
          <h2 className="text-2xl font-bold mb-6">Pending Campaign Approvals</h2>
          {campaigns.length === 0 ? (
            <p className="text-gray-600 text-center py-8">No pending campaigns</p>
          ) : (
            <div className="space-y-4">
              {campaigns.map((campaign) => (
                <div key={campaign._id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold mb-2">{campaign.title}</h3>
                      <p className="text-gray-600 mb-2">{campaign.description}</p>
                      <div className="flex space-x-4 text-sm text-gray-500">
                        <span>Goal: ৳{campaign.goalAmount.toLocaleString()}</span>
                        <span>Category: {campaign.category}</span>
                        <span>By: {campaign.organizerName}</span>
                      </div>
                    </div>
                    <div className="flex space-x-2 ml-4">
                      <button
                        onClick={() => handleVerifyCampaign(campaign._id, true)}
                        className="flex items-center space-x-1 bg-green-100 text-green-700 px-4 py-2 rounded-lg hover:bg-green-200"
                      >
                        <CheckCircle size={18} />
                        <span>Approve</span>
                      </button>
                      <button
                        onClick={() => handleVerifyCampaign(campaign._id, false)}
                        className="flex items-center space-x-1 bg-red-100 text-red-700 px-4 py-2 rounded-lg hover:bg-red-200"
                      >
                        <XCircle size={18} />
                        <span>Reject</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Recent Transactions */}
      {activeTab === 'transactions' && (
        <div className="card">
          <h2 className="text-2xl font-bold mb-6">Recent Transactions</h2>
          {transactions.length === 0 ? (
            <p className="text-gray-600 text-center py-8">No transactions yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Transaction ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Campaign
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {transactions.map((tx) => (
                    <tr key={tx.transactionId || tx._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">
                        {(tx.transactionId || tx._id).slice(0, 8)}...
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {tx.campaignTitle || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">
                        ৳{tx.amount?.toLocaleString() || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            tx.status === 'captured'
                              ? 'bg-green-100 text-green-800'
                              : tx.status === 'authorized'
                              ? 'bg-blue-100 text-blue-800'
                              : tx.status === 'failed'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {tx.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(tx.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
