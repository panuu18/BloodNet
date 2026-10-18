import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';

const AdminNavPills = ({ activeTab }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', path: '/admin', emoji: '🏠' },
    { id: 'users', label: 'Users', path: '/admin/users', emoji: '👥' },
    { id: 'donors', label: 'Donors', path: '/admin/donors', emoji: '🩸' },
    { id: 'hospitals', label: 'Hospitals', path: '/admin/hospitals', emoji: '🏥' },
    { id: 'requests', label: 'Requests', path: '/admin/requests', emoji: '📋' },
    { id: 'notifications', label: 'Notifications', path: '/admin/notifications', emoji: '🔔', badge: 2 },
    { id: 'analytics', label: 'Analytics', path: '/admin/analytics', emoji: '📊' },
    { id: 'settings', label: 'Settings', path: '/admin/settings', emoji: '⚙' }
  ];

  return (
    <div className="space-y-6 my-4">
      {/* Welcome Header Banner */}
      <div className="text-center max-w-3xl mx-auto">
        <motion.h1 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-3xl sm:text-5xl font-black text-rose-600 tracking-tight flex items-center justify-center gap-2"
        >
          Welcome Back, Bhavana! <span className="text-3xl animate-bounce">💥</span>
        </motion.h1>
        <p className="text-gray-600 text-sm sm:text-base font-medium mt-2">
          BloodNet+ Platform Control & Administration Center
        </p>
      </div>

      {/* Centered Floating Pill Tabs Bar */}
      <div className="flex justify-center">
        <div className="bg-white/90 backdrop-blur-xl p-1.5 rounded-full border border-gray-200/80 shadow-lg shadow-gray-200/50 inline-flex flex-wrap justify-center gap-1 sm:gap-2">
          {navItems.map(item => {
            const isActive = location.pathname === item.path || activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className={`px-5 py-2.5 rounded-full text-xs font-extrabold transition-all duration-300 flex items-center space-x-2 ${
                  isActive 
                    ? 'bg-gradient-to-r from-red-500 via-rose-500 to-pink-500 text-white shadow-md shadow-red-500/30 scale-105' 
                    : 'text-gray-600 hover:text-red-500 hover:bg-red-50/50'
                }`}
              >
                <span>{item.emoji}</span>
                <span>{item.label}</span>
                {item.badge ? (
                  <span className="ml-1.5 px-2 py-0.5 text-[10px] font-black bg-white text-red-600 rounded-full shadow">
                    {item.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AdminNavPills;
