import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';
import Loader from '../components/Loader';
import { User, Mail, Calendar, Heart } from 'lucide-react';

const Profile = () => {
  const { user } = useAuth();
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDonations();
  }, []);

  const loadDonations = async () => {
    try {
      const response = await authAPI.getDonations();
      setDonations(response.data.data);
    } catch (error) {
      toast.error('Failed to load donations');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader fullScreen />;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="card mb-8">
        <div className="flex items-center space-x-4">
          <div className="bg-primary-100 rounded-full p-4">
            <User className="h-12 w-12 text-primary-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{user.name}</h1>
            <div className="flex items-center text-gray-600 mt-1">
              <Mail size={16} className="mr-2" />
              {user.email}
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center space-x-2 mb-6">
          <Heart className="text-primary-600" />
          <h2 className="text-2xl font-bold">My Donations</h2>
        </div>

        {donations.length === 0 ? (
          <p className="text-gray-600 text-center py-8">No donations yet</p>
        ) : (
          <div className="space-y-4">
            {donations.map((donation) => (
              <div key={donation.pledgeId} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg">{donation.campaignTitle}</h3>
                    <div className="flex items-center text-sm text-gray-600 mt-1">
                      <Calendar size={14} className="mr-1" />
                      {new Date(donation.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary-600">
                      {donation.currency} {donation.amount.toLocaleString()}
                    </p>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium mt-2 ${
                      donation.state === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                      donation.state === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {donation.state}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
