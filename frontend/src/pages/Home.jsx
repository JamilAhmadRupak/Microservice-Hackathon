import { Link } from 'react-router-dom';
import { ArrowRight, Heart, Users, TrendingUp } from 'lucide-react';

const Home = () => {
  return (
    <div>
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 text-white">
        <div className="max-w-7xl mx-auto px-4 py-20 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl font-extrabold mb-6">
              Make a Difference Today
            </h1>
            <p className="text-xl mb-8 text-primary-100">
              Join thousands of donors supporting meaningful causes across Bangladesh
            </p>
            <div className="flex justify-center space-x-4">
              <Link to="/campaigns" className="bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors flex items-center">
                Browse Campaigns
                <ArrowRight className="ml-2" size={20} />
              </Link>
              <Link to="/campaigns/create" className="border-2 border-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-primary-600 transition-colors">
                Start a Campaign
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="bg-primary-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Heart className="text-primary-600" size={32} />
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-2">10,000+</h3>
            <p className="text-gray-600">Campaigns Funded</p>
          </div>
          <div className="text-center">
            <div className="bg-primary-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Users className="text-primary-600" size={32} />
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-2">50,000+</h3>
            <p className="text-gray-600">Active Donors</p>
          </div>
          <div className="text-center">
            <div className="bg-primary-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="text-primary-600" size={32} />
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-2">৳50M+</h3>
            <p className="text-gray-600">Raised to Date</p>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose CareForAll?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="card">
              <h3 className="text-xl font-semibold mb-3">Secure Payments</h3>
              <p className="text-gray-600">
                Your donations are processed securely with industry-leading payment technology.
              </p>
            </div>
            <div className="card">
              <h3 className="text-xl font-semibold mb-3">100% Transparent</h3>
              <p className="text-gray-600">
                Track every donation and see exactly where your money goes.
              </p>
            </div>
            <div className="card">
              <h3 className="text-xl font-semibold mb-3">Verified Campaigns</h3>
              <p className="text-gray-600">
                All campaigns are verified by our team to ensure authenticity.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="bg-primary-600 rounded-2xl p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Ready to Make an Impact?</h2>
          <p className="text-xl mb-8">Join our community and start helping those in need today.</p>
          <Link to="/register" className="bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors inline-block">
            Get Started
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home;
