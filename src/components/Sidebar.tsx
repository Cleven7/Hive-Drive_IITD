import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  HardDrive, 
  Clock, 
  Star, 
  Share2, 
  Trash2, 
  Cloud, 
  Plus 
} from 'lucide-react';

const Sidebar: React.FC = () => {
  const location = useLocation();
  
  const navItems = [
    { icon: <HardDrive size={18} />, label: 'My Drive', path: '/' },
    { icon: <Clock size={18} />, label: 'Recent', path: '/recent' },
    { icon: <Star size={18} />, label: 'Starred', path: '/starred' },
    { icon: <Share2 size={18} />, label: 'Shared', path: '/shared' },
    { icon: <Trash2 size={18} />, label: 'Trash', path: '/trash' }
  ];
  
  return (
    <div className="w-64 h-full bg-white border-r border-gray-200">
      <div className="p-4">
        <button className="flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50">
          <Plus size={18} className="mr-2" />
          <span>New</span>
        </button>
      </div>
      
      <nav className="mt-2">
        <ul>
          {navItems.map((item, index) => (
            <li key={index}>
              <Link
                to={item.path}
                className={`flex items-center px-4 py-2 text-sm font-medium ${
                  location.pathname === item.path
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="mr-3">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      
      <div className="p-4 mt-6">
        <div className="flex items-center">
          <Cloud size={18} className="text-gray-500" />
          <div className="ml-3">
            <div className="text-xs text-gray-500">Storage</div>
            <div className="w-full h-2 mt-1 bg-gray-200 rounded-full">
              <div className="w-1/4 h-2 bg-blue-500 rounded-full"></div>
            </div>
            <div className="mt-1 text-xs text-gray-500">2.5 GB of 10 GB used</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;