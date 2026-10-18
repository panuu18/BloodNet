import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { 
  HeartIcon, 
  BellIcon, 
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  HomeIcon,
  ChartBarIcon,
  UserIcon,
  UserGroupIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const { notifications, unreadCount, markAllAsRead } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getDashboardLink = () => {
    if (!user) return '/';
    if (user.role === 'admin') return '/admin';
    return `/dashboard/${user.role}`;
  };

  const getRoleIcon = () => {
    switch (user?.role) {
      case 'recipient':
        return <UserGroupIcon className="h-5 w-5" />;
      case 'donor':
        return <HeartSolidIcon className="h-5 w-5 text-red-500" />;
      case 'hospital':
        return <BuildingOfficeIcon className="h-5 w-5" />;
      default:
        return <UserCircleIcon className="h-5 w-5" />;
    }
  };

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <HeartSolidIcon className="h-8 w-8 text-red-500" />
              <span className="text-xl font-bold text-gray-800">BloodNet+</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {isAuthenticated && user?.role === 'admin' && (
              <Link
                to="/admin"
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-sm"
              >
                <span>🛡️ Admin Portal</span>
              </Link>
            )}
            {isAuthenticated ? (
              <>
                <Link
                  to={getDashboardLink()}
                  className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium ${
                    location.pathname.startsWith('/dashboard')
                      ? 'bg-red-50 text-red-600'
                      : 'text-gray-700 hover:text-red-600 hover:bg-red-50'
                  }`}
                >
                  {getRoleIcon()}
                  <span>Dashboard</span>
                </Link>

                
                {/* Profile */}
                <Link
                  to="/profile"
                  className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium ${
                    location.pathname === '/profile'
                      ? 'bg-red-50 text-red-600'
                      : 'text-gray-700 hover:text-red-600 hover:bg-red-50'
                  }`}
                >
                  <UserIcon className="h-5 w-5" />
                  <span>Profile</span>
                </Link>

                {/* Notifications */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setShowNotifications(!showNotifications);
                      if (showNotifications) {
                        markAllAsRead();
                      }
                    }}
                    className="relative p-2 text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-full"
                  >
                    <BellIcon className="h-6 w-6" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  <AnimatePresence>
                    {showNotifications && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 max-h-96 overflow-y-auto"
                      >
                        <div className="p-4 border-b border-gray-200">
                          <h3 className="font-semibold text-gray-800">Notifications</h3>
                        </div>
                        {notifications.length > 0 ? (
                          notifications.slice(0, 5).map((notification) => (
                            <div
                              key={notification._id}
                              className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                                !notification.isRead ? 'bg-blue-50' : ''
                              }`}
                            >
                              <div className="flex items-start space-x-3">
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-gray-800">
                                    {notification.title}
                                  </p>
                                  <p className="text-xs text-gray-600 mt-1">
                                    {notification.message}
                                  </p>
                                  <p className="text-xs text-gray-400 mt-2">
                                    {new Date(notification.createdAt).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-4 text-center text-gray-500">
                            No notifications
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* User Menu */}
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-700">
                    Welcome, {user?.name || user?.hospitalName}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-1 px-3 py-2 text-sm text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-md"
                  >
                    <ArrowRightOnRectangleIcon className="h-4 w-4" />
                    <span>Logout</span>
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-red-600 hover:bg-red-50 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-red-500 text-white hover:bg-red-600 px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Register
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="text-gray-700 hover:text-red-600 p-2"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {showMobileMenu && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-gray-200"
            >
              <div className="px-2 pt-2 pb-3 space-y-1">
                {isAuthenticated ? (
                  <>
                    <Link
                      to={getDashboardLink()}
                      className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-red-600 hover:bg-red-50"
                      onClick={() => setShowMobileMenu(false)}
                    >
                      Dashboard
                    </Link>
                                        <Link
                      to="/profile"
                      className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-red-600 hover:bg-red-50"
                      onClick={() => setShowMobileMenu(false)}
                    >
                      Profile
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-red-600 hover:bg-red-50"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-red-600 hover:bg-red-50"
                      onClick={() => setShowMobileMenu(false)}
                    >
                      Login
                    </Link>
                    <Link
                      to="/register"
                      className="block px-3 py-2 rounded-md text-base font-medium text-white bg-red-500 hover:bg-red-600"
                      onClick={() => setShowMobileMenu(false)}
                    >
                      Register
                    </Link>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
};

export default Navbar;
