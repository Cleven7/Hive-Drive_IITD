import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Menu, HelpCircle, Settings, User, LogOut } from 'lucide-react';
import { getCurrentUser, logout } from '../utils/hiveUtils';

const Navbar: React.FC = () => {
  const username = getCurrentUser();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = React.useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-white shadow-sm">
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center">
          <button className="p-2 rounded-full hover:bg-gray-100">
            <Menu size={20} />
          </button>
          <Link to="/" className="flex items-center ml-2">
            <div className="text-xl font-medium text-blue-600">Hive Drive</div>
          </Link>
        </div>
        
        <div className="flex-1 max-w-2xl mx-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3">
              <Search size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search in Drive"
              className="w-full py-2 pl-10 pr-4 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button className="p-2 rounded-full hover:bg-gray-100">
            <HelpCircle size={20} />
          </button>
          <button className="p-2 rounded-full hover:bg-gray-100">
            <Settings size={20} />
          </button>
          <div className="flex items-center ml-2 relative">
            {username ? (
              <>
                <div 
                  className="flex items-center cursor-pointer"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                >
                  <div className="mr-2 text-sm font-medium">{username}</div>
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
                    {username.charAt(0).toUpperCase()}
                  </div>
                </div>
                
                {showUserMenu && (
                  <div className="absolute right-0 mt-12 w-48 bg-white rounded-md shadow-lg py-1 z-10 border border-gray-200">
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <LogOut size={16} className="mr-2" />
                      Sign out
                    </button>
                  </div>
                )}
              </>
            ) : (
              <Link to="/login" className="flex items-center">
                <User size={20} />
                <span className="ml-1">Login</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;