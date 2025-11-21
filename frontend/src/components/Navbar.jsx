import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, User, Heart, LayoutDashboard } from 'lucide-react';

const Navbar = () => {
  const { user, logout, isAdmin } = useAuth();

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <Heart className="h-8 w-8 text-primary-600" />
              <span className="text-2xl font-bold text-primary-600">CareForAll</span>
            </Link>
            <div className="ml-10 flex space-x-4">
              <Link to="/campaigns" className="px-3 py-2 text-gray-700 hover:text-primary-600">
                Campaigns
              </Link>
              {user && (
                <Link to="/my-donations" className="px-3 py-2 text-gray-700 hover:text-primary-600">
                  My Donations
                </Link>
              )}
              {isAdmin() && (
                <Link to="/admin" className="px-3 py-2 text-gray-700 hover:text-primary-600 flex items-center gap-1">
                  <LayoutDashboard size={18} />
                  Admin
                </Link>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <Link to="/campaigns/create" className="btn-primary">
                  Create Campaign
                </Link>
                <Link to="/profile" className="flex items-center space-x-2 text-gray-700 hover:text-primary-600">
                  <User size={20} />
                  <span>{user.name}</span>
                </Link>
                <button onClick={logout} className="flex items-center space-x-2 text-gray-700 hover:text-red-600">
                  <LogOut size={20} />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-gray-700 hover:text-primary-600">
                  Login
                </Link>
                <Link to="/register" className="btn-primary">
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
