import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { hospitalAPI, requestAPI } from '../services/api';
import MobileReportSection from '../components/MobileReportSection';
import {
  BellIcon,
  UserCircleIcon,
  HeartIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  HomeIcon,
  DocumentTextIcon,
  MapPinIcon,
  ClockIcon,
  PhoneIcon,
  PencilIcon,
  XMarkIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  DocumentArrowDownIcon,
  PlusIcon,
  MinusIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';

const ALL_BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const formatRelativeTime = (timestamp) => {
  if (!timestamp) return 'Just now';
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return 'Recently';

  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;
  return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
};

const MobileHospitalDashboard = () => {
  const { user } = useAuth();
  const { notifications } = useNotifications();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [inventory, setInventory] = useState([]);
  const [bloodRequests, setBloodRequests] = useState([]);
  const [requestHistory, setRequestHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showNotificationPanel, setShowNotificationPanel] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editValue, setEditValue] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [inventoryRes, requestsRes, statsRes, historyRes] = await Promise.all([
        hospitalAPI.getHospitalInventory(),
        hospitalAPI.getAllBloodRequests(),
        hospitalAPI.getHospitalStats(),
        hospitalAPI.getRequestHistory()
      ]);

      setInventory(inventoryRes.data?.inventory || inventoryRes.data || []);
      setBloodRequests(requestsRes.data?.requests || requestsRes.data || []);
      setStats(statsRes.data?.stats || statsRes.data || {});
      setRequestHistory(historyRes.data?.history || historyRes.data || []);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestResponse = async (requestId, response) => {
    try {
      await requestAPI.respondToRequest(requestId, { response });
      await fetchDashboardData();
    } catch (error) {
      console.error('Failed to respond to request:', error);
      if (error.response?.status === 409 && error.response?.data?.code === 'INSUFFICIENT_STOCK') {
        alert(error.response.data.message || 'Not enough stock is available to fulfill this request.');
      } else {
        alert(error.response?.data?.message || 'Failed to process request.');
      }
    }
  };

  const handleInventoryUpdate = async (bloodGroup, operation, units) => {
    try {
      await hospitalAPI.updateInventory({ bloodGroup, operation, unitsAvailable: units });
      await fetchDashboardData();
      setEditingItem(null);
      setEditValue('');
    } catch (error) {
      console.error('Mobile - Failed to update inventory:', error);
      alert(error.response?.data?.message || 'Failed to update inventory');
    }
  };

  const getCriticalStockAlerts = () => {
    return inventory.filter(item => {
      const min = item.minThreshold || 5;
      return item.unitsAvailable === 0 || item.unitsAvailable <= Math.floor(min / 2);
    });
  };

  const getLowStockAlerts = () => {
    return inventory.filter(item => {
      const min = item.minThreshold || 5;
      return item.unitsAvailable > Math.floor(min / 2) && item.unitsAvailable <= min;
    });
  };

  const getStockStatus = (available, minThreshold) => {
    if (available === 0) return { text: 'Out of Stock', color: 'red', icon: '❌' };
    if (available <= minThreshold) return { text: 'Critical', color: 'yellow', icon: '⚠️' };
    return { text: 'Normal', color: 'green', icon: '✅' };
  };

  const filteredRequests = bloodRequests.filter(req => req.status === 'pending');

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading BloodNet+...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-teal-50 pb-32">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-20 left-20 w-64 h-64 bg-red-200 rounded-full opacity-20"
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 50, 0],
            y: [0, 30, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute bottom-20 right-20 w-96 h-96 bg-teal-200 rounded-full opacity-20"
          animate={{
            scale: [1.2, 1, 1.2],
            x: [0, -50, 0],
            y: [0, -30, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>
      {/* Sticky Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-xl font-bold text-red-600">BloodNet+</h1>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowNotificationPanel(!showNotificationPanel)}
              className="relative p-2 text-gray-600 hover:text-gray-900"
            >
              <BellIcon className="h-6 w-6" />
              {notifications.length > 0 && (
                <span className="absolute top-1 right-1 h-3 w-3 bg-red-500 rounded-full"></span>
              )}
            </button>
            <button
              onClick={() => setActiveSection('profile')}
              className="p-2 text-gray-600 hover:text-gray-900"
            >
              <UserCircleIcon className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Notification Panel */}
      <AnimatePresence>
        {showNotificationPanel && (
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            className="fixed right-0 top-0 h-full w-80 bg-white shadow-2xl z-50 overflow-y-auto"
          >
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                <button
                  onClick={() => setShowNotificationPanel(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="p-4 space-y-3">
              {notifications.length > 0 ? (
                notifications.map((notification) => (
                  <div key={notification._id} className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-900">{notification.message}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(notification.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center">No new notifications</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="px-4 py-6 space-y-6">
        {/* Dashboard Section */}
        {activeSection === 'dashboard' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Overview Cards - Horizontal Scroll */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Overview</h2>
              <div className="flex space-x-4 overflow-x-auto pb-2">
                {[
                  { label: 'Total Blood', value: stats?.totalBloodUnits ?? inventory.reduce((s, i) => s + (i.unitsAvailable || 0), 0), icon: '🩸', color: 'red' },
                  { label: 'Active Requests', value: stats?.activeRequests ?? bloodRequests.filter(r => r.status === 'pending' || r.status === 'active').length, icon: '📩', color: 'blue' },
                  { label: 'Handled Today', value: stats?.requestsHandledToday ?? 0, icon: '✅', color: 'green' },
                  { label: 'Critical Stock', value: getCriticalStockAlerts().length, icon: '🚨', color: 'red' },
                  { label: 'Low Stock', value: getLowStockAlerts().length, icon: '⚠️', color: 'yellow' }
                ].map((stat, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex-shrink-0 w-36 bg-white rounded-xl p-4 shadow-sm border border-gray-200"
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-2">{stat.icon}</div>
                      <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                      <p className="text-xs text-gray-600 mt-1">{stat.label}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Critical Stock Alerts */}
            {getCriticalStockAlerts().length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 rounded-xl p-4 border border-red-300"
              >
                <h3 className="text-lg font-semibold text-red-900 mb-3 flex items-center gap-2">
                  <span>🚨</span> Critical / Out of Stock
                </h3>
                <div className="space-y-2">
                  {getCriticalStockAlerts().map((item, index) => (
                    <div key={index} className="bg-white rounded-lg p-3 border border-red-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-red-900">{item.bloodGroup} Blood</p>
                          <p className="text-xs text-red-700 font-medium">
                            {item.unitsAvailable === 0 ? '❌ Out of stock (0 units)' : `🚨 Critically low (${item.unitsAvailable} left)`}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-red-600">{item.unitsAvailable}</p>
                          <p className="text-xs text-red-600">units left</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Low Stock Warnings */}
            {getLowStockAlerts().length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-amber-50 rounded-xl p-4 border border-amber-300"
              >
                <h3 className="text-lg font-semibold text-amber-900 mb-3 flex items-center gap-2">
                  <span>⚠️</span> Low Stock Warnings
                </h3>
                <div className="space-y-2">
                  {getLowStockAlerts().map((item, index) => (
                    <div key={index} className="bg-white rounded-lg p-3 border border-amber-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-amber-900">{item.bloodGroup} Blood</p>
                          <p className="text-xs text-amber-700">
                            Below threshold ({item.unitsAvailable} / min {item.minThreshold || 5})
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-amber-600">{item.unitsAvailable}</p>
                          <p className="text-xs text-amber-600">units</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Inventory Summary Mobile Panel */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 bg-emerald-100 text-emerald-600 rounded-lg">
                    <HeartIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-gray-900">Inventory Summary</h2>
                    <p className="text-[11px] text-gray-500">
                      {stats?.totalBloodUnits ?? inventory.reduce((s, i) => s + (i.unitsAvailable || 0), 0)} Total Units
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveSection('inventory')}
                  className="text-xs font-semibold text-emerald-600 hover:text-emerald-700"
                >
                  Manage Stock →
                </button>
              </div>

              {/* 8 Blood Groups Grid */}
              <div className="grid grid-cols-4 gap-2">
                {ALL_BLOOD_GROUPS.map((group) => {
                  const item = inventory.find(i => i.bloodGroup === group) || {
                    bloodGroup: group,
                    unitsAvailable: 0,
                    minThreshold: 5
                  };
                  const units = item.unitsAvailable || 0;
                  const min = item.minThreshold || 5;
                  const isOutOfStock = units === 0;
                  const isCritical = units > 0 && units <= Math.floor(min / 2);
                  const isLow = units > Math.floor(min / 2) && units <= min;

                  return (
                    <div
                      key={group}
                      onClick={() => setActiveSection('inventory')}
                      className={`p-2 rounded-lg border text-center cursor-pointer transition-all ${
                        isOutOfStock
                          ? 'bg-red-50/80 border-red-200'
                          : isCritical
                          ? 'bg-rose-50/80 border-rose-200'
                          : isLow
                          ? 'bg-amber-50/80 border-amber-200'
                          : 'bg-emerald-50/50 border-emerald-100'
                      }`}
                    >
                      <p className={`text-xs font-extrabold ${
                        isOutOfStock || isCritical ? 'text-red-700' : isLow ? 'text-amber-700' : 'text-gray-900'
                      }`}>
                        {group}
                      </p>
                      <p className="text-sm font-bold text-gray-900 mt-0.5">{units}</p>
                      <span className={`inline-block text-[9px] px-1 py-0.2 rounded font-semibold uppercase ${
                        isOutOfStock
                          ? 'text-red-700 bg-red-100'
                          : isCritical
                          ? 'text-rose-700 bg-rose-100'
                          : isLow
                          ? 'text-amber-700 bg-amber-100'
                          : 'text-emerald-700 bg-emerald-100'
                      }`}>
                        {isOutOfStock ? 'Empty' : isCritical ? 'Crit' : isLow ? 'Low' : 'Good'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent Requests Mobile Panel */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 bg-blue-100 text-blue-600 rounded-lg">
                    <ClockIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-gray-900">Recent Requests</h2>
                    <p className="text-[11px] text-gray-500">
                      {bloodRequests.filter(r => r.status === 'pending' || r.status === 'active').length} Active Requests
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveSection('requests')}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                >
                  View All →
                </button>
              </div>

              {bloodRequests.length > 0 ? (
                <div className="space-y-3">
                  {bloodRequests.slice(0, 4).map((request) => {
                    const matchedStock = inventory.find(i => i.bloodGroup === request.bloodGroup);
                    const availableUnits = matchedStock ? (matchedStock.unitsAvailable || 0) : 0;
                    const hasEnoughStock = availableUnits >= (request.unitsNeeded || 1);

                    return (
                      <motion.div
                        key={request._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-xl p-3.5 shadow-sm border border-gray-200"
                      >
                        <div className="flex items-start justify-between gap-2">
                          {/* Blood Tag & Details */}
                          <div className="flex items-start space-x-2.5 flex-1 min-w-0">
                            <div className="w-10 h-10 rounded-lg bg-red-600 text-white font-bold flex flex-col items-center justify-center flex-shrink-0 shadow-sm">
                              <span className="text-xs font-extrabold leading-none">{request.bloodGroup}</span>
                              <span className="text-[8px] uppercase tracking-tighter opacity-80 mt-0.5">Blood</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-1.5 flex-wrap">
                                <p className="font-semibold text-gray-900 text-sm truncate">
                                  {request.recipientName || 'Emergency Patient'}
                                </p>
                                <span className={`px-1.5 py-0.2 text-[9px] font-bold rounded uppercase ${
                                  request.urgency === 'critical' || request.urgency === 'emergency'
                                    ? 'bg-red-100 text-red-700'
                                    : request.urgency === 'urgent'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-blue-100 text-blue-700'
                                }`}>
                                  {request.urgency === 'critical' ? '🚨 Critical' : request.urgency === 'urgent' ? '⚡ Urgent' : 'Normal'}
                                </span>
                              </div>
                              <p className="text-xs text-gray-600 mt-0.5">
                                <span className="font-medium text-gray-800">{request.unitsNeeded} units</span> • {formatRelativeTime(request.createdAt)}
                              </p>
                              {/* Stock status tag */}
                              <p className={`text-[10px] mt-1 font-medium ${
                                hasEnoughStock ? 'text-emerald-700' : 'text-red-700'
                              }`}>
                                {hasEnoughStock ? `✓ Ready in stock (${availableUnits} avail)` : `⚠ Insufficient stock (${availableUnits} / ${request.unitsNeeded})`}
                              </p>
                            </div>
                          </div>

                          {/* Action Button */}
                          <div className="flex flex-col items-end space-y-1 flex-shrink-0">
                            <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full capitalize ${
                              request.status === 'pending'
                                ? 'bg-amber-100 text-amber-800'
                                : request.status === 'accepted'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-gray-100 text-gray-700'
                            }`}>
                              {request.status}
                            </span>
                            <button
                              onClick={() => setActiveSection('requests')}
                              className="px-2.5 py-1 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700 transition-colors shadow-xs"
                            >
                              Respond
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-white rounded-xl p-6 text-center border border-gray-200">
                  <ClockIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-gray-800">No Recent Requests</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Incoming patient requests will appear here in real-time.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Requests Section */}
        {activeSection === 'requests' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <h2 className="text-xl font-bold text-gray-900">Incoming Requests</h2>
            <div className="space-y-4">
              {filteredRequests.length > 0 ? (
                filteredRequests.map((request) => (
                  <motion.div
                    key={request._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-xl p-4 shadow-sm border border-gray-200"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-lg font-semibold text-gray-900">{request.recipientName}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-600">
                              {request.bloodGroup}
                            </span>
                            <span className="text-sm text-gray-600">{request.unitsNeeded} units needed</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-center">
                          <MapPinIcon className="h-4 w-4 mr-2" />
                          {request.location?.address || 'Location not specified'}
                        </div>
                        <div className="flex items-center">
                          <PhoneIcon className="h-4 w-4 mr-2" />
                          {request.contactPhone}
                        </div>
                        <div className="flex items-center">
                          <ClockIcon className="h-4 w-4 mr-2" />
                          {new Date(request.createdAt).toLocaleString()}
                        </div>
                      </div>

                      <div className="flex space-x-3">
                        <button
                          onClick={() => handleRequestResponse(request._id, 'accepted')}
                          className="flex-1 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                        >
                          ✅ Accept
                        </button>
                        <button
                          onClick={() => handleRequestResponse(request._id, 'rejected')}
                          className="flex-1 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                        >
                          ❌ Reject
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <HeartIcon className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-gray-600">No pending requests</p>
                  <p className="text-sm text-gray-500 mt-1">All caught up!</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Inventory Section */}
        {activeSection === 'inventory' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <h2 className="text-xl font-bold text-gray-900">Blood Inventory</h2>
            <div className="space-y-4">
              {inventory.map((item) => {
                const status = getStockStatus(item.unitsAvailable, item.minThreshold);
                return (
                  <motion.div
                    key={item.bloodGroup}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-xl p-4 shadow-sm border border-gray-200"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white ${
                            status.color === 'red' ? 'bg-red-500' :
                            status.color === 'yellow' ? 'bg-yellow-500' :
                            'bg-green-500'
                          }`}>
                            {item.bloodGroup}
                          </div>
                          <div>
                            <p className="text-lg font-semibold text-gray-900">{item.bloodGroup} Blood</p>
                            <p className="text-sm text-gray-600">{status.icon} {status.text}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-gray-900">{item.unitsAvailable}</p>
                          <p className="text-sm text-gray-600">units</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-center text-sm">
                        <div className="bg-gray-50 rounded-lg p-2">
                          <p className="text-green-600 font-semibold">+{Math.floor(Math.random() * 20) + 5}</p>
                          <p className="text-gray-600">Added</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-2">
                          <p className="text-red-600 font-semibold">-{Math.floor(Math.random() * 15) + 2}</p>
                          <p className="text-gray-600">Used</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-2">
                          <p className="text-gray-700 font-semibold">{item.minThreshold}</p>
                          <p className="text-gray-600">Min</p>
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setEditingItem(item);
                            setEditValue('1');
                          }}
                          className="flex-1 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors font-medium"
                        >
                          <PlusIcon className="h-4 w-4 inline mr-1" />
                          Add
                        </button>
                        <button
                          onClick={() => {
                            setEditingItem(item);
                            setEditValue('1');
                          }}
                          className="flex-1 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-medium"
                        >
                          <MinusIcon className="h-4 w-4 inline mr-1" />
                          Use
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Notifications Section */}
        {activeSection === 'notifications' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <h2 className="text-xl font-bold text-gray-900">Notifications</h2>
            <div className="space-y-3">
              {notifications.length > 0 ? (
                notifications.map((notification) => (
                  <motion.div
                    key={notification._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-xl p-4 shadow-sm border border-gray-200"
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`p-2 rounded-full ${
                        notification.type === 'urgent' ? 'bg-red-100' :
                        notification.type === 'warning' ? 'bg-yellow-100' :
                        'bg-blue-100'
                      }`}>
                        {notification.type === 'urgent' ? '🚨' :
                         notification.type === 'warning' ? '⚠️' :
                         'ℹ️'}
                      </div>
                      <div className="flex-1">
                        <p className="text-gray-900">{notification.message}</p>
                        <p className="text-sm text-gray-500 mt-1">
                          {new Date(notification.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BellIcon className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-gray-600">No notifications</p>
                  <p className="text-sm text-gray-500 mt-1">You're all caught up!</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Reports Section */}
        {activeSection === 'reports' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <MobileReportSection onBack={() => setActiveSection('dashboard')} />
          </motion.div>
        )}

        {/* Profile Section */}
        {activeSection === 'profile' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <h2 className="text-xl font-bold text-gray-900">Hospital Profile</h2>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <div className="space-y-4">
                <div className="text-center">
                  <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <HeartSolidIcon className="h-10 w-10 text-red-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">{user?.hospitalName || 'Hospital'}</h3>
                  <p className="text-sm text-gray-600">Blood Bank Partner</p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <MapPinIcon className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Location</p>
                      <p className="text-gray-900">{user?.address || 'Not specified'}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <PhoneIcon className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Contact</p>
                      <p className="text-gray-900">{user?.contactNumber || 'Not specified'}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <UserCircleIcon className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Admin</p>
                      <p className="text-gray-900">{user?.name || 'Hospital Admin'}</p>
                    </div>
                  </div>
                </div>

                <button className="w-full py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium">
                  <PencilIcon className="h-4 w-4 inline mr-2" />
                  Edit Profile
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setEditingItem(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl p-6 w-full max-w-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Update {editingItem.bloodGroup} Blood
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Units to {editValue.includes('-') ? 'Remove' : 'Add'}
                  </label>
                  <input
                    type="number"
                    value={editValue.replace(/[^0-9]/g, '')}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    min="1"
                  />
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      handleInventoryUpdate(editingItem.bloodGroup, 'add', parseInt(editValue));
                    }}
                    className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Add Units
                  </button>
                  <button
                    onClick={() => {
                      handleInventoryUpdate(editingItem.bloodGroup, 'subtract', parseInt(editValue));
                    }}
                    className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Use Units
                  </button>
                </div>
                <button
                  onClick={() => setEditingItem(null)}
                  className="w-full py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fixed Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
        <div className="grid grid-cols-5 py-2">
          {[
            { id: 'dashboard', icon: <HomeIcon className="h-5 w-5" />, label: 'Home' },
            { id: 'requests', icon: <DocumentTextIcon className="h-5 w-5" />, label: 'Requests' },
            { id: 'inventory', icon: <HeartIcon className="h-5 w-5" />, label: 'Inventory' },
            { id: 'reports', icon: <DocumentArrowDownIcon className="h-5 w-5" />, label: 'Reports' },
            { id: 'profile', icon: <UserCircleIcon className="h-5 w-5" />, label: 'Profile' }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`flex flex-col items-center py-2 px-1 transition-colors ${
                activeSection === item.id
                  ? 'text-red-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {item.icon}
              <span className="text-xs mt-1">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MobileHospitalDashboard;
