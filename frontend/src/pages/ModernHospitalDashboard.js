import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { hospitalAPI, requestAPI } from '../services/api';
import * as XLSX from 'xlsx';
import SimpleHospitalReports from '../components/SimpleHospitalReports';
import GoogleMap from '../components/GoogleMap';
import {
  BuildingOfficeIcon,
  HeartIcon,
  MapPinIcon,
  ClockIcon,
  UsersIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  DocumentArrowDownIcon,
  BellIcon,
  ArrowTrendingUpIcon,
  ArrowPathIcon,
  XMarkIcon,
  PlusIcon,
  MinusIcon,
  ChevronDownIcon,
  PhoneIcon,
  EnvelopeIcon,
  CalendarIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  XCircleIcon,
  UserCircleIcon,
  CheckCircleIcon,
  PencilIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';

const ModernHospitalDashboard = () => {
  const { user } = useAuth();
  const { notifications, newBloodRequest, showNotification } = useNotifications();
  const [activeSection, setActiveSection] = useState('overview');
  const [inventory, setInventory] = useState([]);
  const [bloodRequests, setBloodRequests] = useState([]);
  const [requestHistory, setRequestHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [showCampModal, setShowCampModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showNotificationPanel, setShowNotificationPanel] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [editingInventory, setEditingInventory] = useState(null);
  const [campForm, setCampForm] = useState({
    name: '',
    date: '',
    location: '',
    description: '',
    targetUnits: 50
  });
  const [profileForm, setProfileForm] = useState({
    hospitalName: '',
    contactNumber: '',
    email: '',
    address: '',
    emergencyContact: ''
  });
  const [showMap, setShowMap] = useState(false);
  const [mapCenter, setMapCenter] = useState({ lat: 0, lng: 0 });
  const [mapMarkers, setMapMarkers] = useState([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  // Collapsible sections state
  const [showCriticalAlerts, setShowCriticalAlerts] = useState(false);
  const [showRecentRequests, setShowRecentRequests] = useState(false);
  const [showInventorySummary, setShowInventorySummary] = useState(false);

  useEffect(() => {
    fetchDashboardData();
    if (user) {
      setProfileForm({
        hospitalName: user.hospitalName || '',
        contactNumber: user.contactNumber || '',
        email: user.email || '',
        address: user.address || '',
        emergencyContact: user.emergencyContact || ''
      });
    }
  }, [user]);

  // Listen for real-time blood requests
  useEffect(() => {
    if (newBloodRequest) {
      console.log('New blood request received in hospital dashboard:', newBloodRequest);
      
      // Add the new request to the blood requests list immediately
      setBloodRequests(prev => {
        // Check if request already exists to avoid duplicates
        const exists = prev.some(req => req._id === newBloodRequest.request._id);
        if (!exists) {
          // Show notification to hospital staff
          showNotification(`🩸 New blood request! ${newBloodRequest.request.bloodGroup} blood needed for ${newBloodRequest.request.unitsNeeded} units`, 'success');
          
          // Return updated list with new request at the top
          return [newBloodRequest.request, ...prev];
        }
        return prev;
      });
    }
  }, [newBloodRequest]);

  const fetchDashboardData = async () => {
    try {
      const [inventoryResponse, requestsResponse, historyResponse, statsResponse] = await Promise.all([
        hospitalAPI.getHospitalInventory(),
        hospitalAPI.getAllBloodRequests(),
        hospitalAPI.getRequestHistory(),
        hospitalAPI.getHospitalStats()
      ]);
      
      setInventory(inventoryResponse.data.inventory || []);
      setBloodRequests(requestsResponse.data.requests || []);
      setRequestHistory(historyResponse.data.history || []);
      setStats(statsResponse.data.stats || null);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInventoryUpdate = async (bloodGroup, operation, units) => {
    try {
      console.log('Updating inventory:', { bloodGroup, operation, units });
      const response = await hospitalAPI.updateInventory({ bloodGroup, operation, unitsAvailable: units });
      console.log('Update response:', response.data);
      
      // Immediately refetch inventory data
      const inventoryResponse = await hospitalAPI.getHospitalInventory();
      console.log('Fetched inventory:', inventoryResponse.data);
      setInventory(inventoryResponse.data.inventory || []);
      
      // Also update stats to reflect changes
      const statsResponse = await hospitalAPI.getHospitalStats();
      setStats(statsResponse.data.stats || null);
      
      showNotification('Inventory updated successfully', 'success');
    } catch (error) {
      console.error('Failed to update inventory:', error);
      showNotification('Failed to update inventory', 'error');
    }
  };

  const handleRequestResponse = async (requestId, response) => {
    try {
      await requestAPI.respondToRequest(requestId, { response });
      fetchDashboardData();
      showNotification(
        response === 'accepted' ? 'Request accepted successfully' : 'Request rejected',
        response === 'accepted' ? 'success' : 'info'
      );
    } catch (error) {
      console.error('Failed to respond to request:', error);
      showNotification('Failed to process request', 'error');
    }
  };

  const handleCreateCamp = async () => {
    try {
      await hospitalAPI.createDonationCamp(campForm);
      setShowCampModal(false);
      setCampForm({
        name: '',
        date: '',
        location: '',
        description: '',
        targetUnits: 50
      });
      showNotification('Donation camp created successfully', 'success');
    } catch (error) {
      console.error('Failed to create camp:', error);
      showNotification('Failed to create donation camp', 'error');
    }
  };

  const handleProfileUpdate = async () => {
    try {
      await hospitalAPI.updateHospitalProfile(profileForm);
      setShowProfileModal(false);
      showNotification('Profile updated successfully', 'success');
    } catch (error) {
      console.error('Failed to update profile:', error);
      showNotification('Failed to update profile', 'error');
    }
  };

  const generateExcelReport = async () => {
    try {
      // Get current data for report
      const reportData = {
        hospitalName: user?.hospitalName || 'Hospital',
        generatedDate: new Date().toLocaleDateString(),
        inventory: inventory,
        requests: bloodRequests,
        history: requestHistory,
        stats: stats
      };

      // Create workbook
      const wb = XLSX.utils.book_new();

      // Inventory sheet
      const inventoryData = inventory.map(item => ({
        'Blood Group': item.bloodGroup,
        'Available Units': item.unitsAvailable,
        'Minimum Threshold': item.minThreshold,
        'Maximum Capacity': item.maxCapacity,
        'Status': getStockStatusText(item.unitsAvailable, item.minThreshold, item.maxCapacity).text
      }));
      const wsInventory = XLSX.utils.json_to_sheet(inventoryData);
      XLSX.utils.book_append_sheet(wb, wsInventory, 'Blood Inventory');

      // Requests sheet
      const requestsData = bloodRequests.map(request => ({
        'Patient Name': request.recipientName,
        'Blood Group': request.bloodGroup,
        'Units Needed': request.unitsNeeded,
        'Urgency': request.urgency,
        'Status': request.status,
        'Request Date': new Date(request.createdAt).toLocaleDateString(),
        'Location': request.location?.address || 'N/A'
      }));
      const wsRequests = XLSX.utils.json_to_sheet(requestsData);
      XLSX.utils.book_append_sheet(wb, wsRequests, 'Blood Requests');

      // History sheet
      const historyData = requestHistory.map(request => ({
        'Patient Name': request.recipientName,
        'Blood Group': request.bloodGroup,
        'Units': request.unitsNeeded,
        'Status': request.status,
        'Request Date': new Date(request.createdAt).toLocaleDateString(),
        'Response Date': request.responseDate ? new Date(request.responseDate).toLocaleDateString() : 'N/A'
      }));
      const wsHistory = XLSX.utils.json_to_sheet(historyData);
      XLSX.utils.book_append_sheet(wb, wsHistory, 'Request History');

      // Summary sheet
      const summaryData = [
        { 'Metric': 'Total Blood Units', 'Value': stats?.totalBloodUnits || 0 },
        { 'Metric': 'Active Requests', 'Value': stats?.pendingRequests || 0 },
        { 'Metric': 'Requests Handled Today', 'Value': stats?.completedRequests || 0 },
        { 'Metric': 'Low Stock Alerts', 'Value': getLowStockAlerts().length },
        { 'Metric': 'Hospital Name', 'Value': reportData.hospitalName },
        { 'Metric': 'Report Generated', 'Value': reportData.generatedDate }
      ];
      const wsSummary = XLSX.utils.json_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

      // Generate and download file
      XLSX.writeFile(wb, `blood-inventory-report-${new Date().toISOString().split('T')[0]}.xlsx`);
      showNotification('Excel report generated successfully', 'success');
    } catch (error) {
      console.error('Failed to generate report:', error);
      showNotification('Failed to generate report', 'error');
    }
  };

  
  const getStockStatusColor = (units, minThreshold, maxCapacity) => {
    if (units === 0) return { bg: 'bg-red-100', text: 'text-red-600', border: 'border-red-200' };
    if (units <= minThreshold) return { bg: 'bg-orange-100', text: 'text-orange-600', border: 'border-orange-200' };
    if (units >= maxCapacity * 0.9) return { bg: 'bg-yellow-100', text: 'text-yellow-600', border: 'border-yellow-200' };
    return { bg: 'bg-green-100', text: 'text-green-600', border: 'border-green-200' };
  };

  const getStockStatusText = (units, minThreshold, maxCapacity) => {
    if (units === 0) return { text: 'Out of Stock', level: 'critical' };
    if (units <= minThreshold) return { text: 'Low Stock', level: 'warning' };
    if (units >= maxCapacity * 0.9) return { text: 'Near Capacity', level: 'caution' };
    return { text: 'Good Stock', level: 'normal' };
  };

  const filteredRequests = bloodRequests.filter(request => {
    const matchesSearch = request.recipientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.bloodGroup?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.hospitalName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || request.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const filteredHistory = requestHistory.filter(request => {
    const matchesSearch = request.recipientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.bloodGroup?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const getLowStockAlerts = () => {
    return inventory.filter(item => {
      const status = getStockStatusText(item.unitsAvailable, item.minThreshold, item.maxCapacity);
      return status.level === 'critical' || status.level === 'warning';
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-teal-50">
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
      
      {/* Navbar removed - handled globally */}
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
                    <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                    <p className="text-xs text-gray-600 mt-1">{notification.message}</p>
                    <p className="text-xs text-gray-400 mt-2">
                      {new Date(notification.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-8">No notifications</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Hospital Dashboard
              </h1>
              <p className="text-gray-600">
                Manage blood inventory and respond to requests efficiently
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={generateExcelReport}
                className="flex items-center space-x-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
              >
                <DocumentArrowDownIcon className="h-4 w-4" />
                <span>Export Report</span>
              </button>
              <button
                onClick={() => setShowProfileModal(true)}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <UserCircleIcon className="h-4 w-4" />
                <span>Profile</span>
              </button>
              <div className="relative">
                <button
                  onClick={() => setShowNotificationPanel(true)}
                  className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <BellIcon className="h-6 w-6" />
                  {notifications.length > 0 && (
                    <span className="absolute top-0 right-0 h-3 w-3 bg-red-500 rounded-full"></span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Navigation Tabs - Desktop */}
        {!isMobile && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8 hidden md:block"
          >
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                {['overview', 'inventory', 'requests', 'map', 'reports', 'history', 'camps'].map((section) => (
                  <button
                    key={section}
                    onClick={() => setActiveSection(section)}
                    className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeSection === section
                        ? 'border-red-500 text-red-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {section.charAt(0).toUpperCase() + section.slice(1)}
                  </button>
                ))}
              </nav>
            </div>
          </motion.div>
        )}

        {/* Overview Section */}
        {activeSection === 'overview' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-8"
          >
            {/* Hero Section with Medical Theme */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              className="bg-gradient-to-r from-red-50 to-teal-50 rounded-xl p-8 border border-red-100"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    Welcome to {user?.hospitalName || 'Your Hospital'}
                  </h1>
                  <p className="text-gray-600 mb-4">
                    Saving lives, one drop at a time. Your blood bank management hub.
                  </p>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span className="flex items-center">
                      <ClockIcon className="h-4 w-4 mr-1" />
                      Last updated: {new Date().toLocaleTimeString()}
                    </span>
                    <span className="flex items-center">
                      <HeartIcon className="h-4 w-4 mr-1" />
                      {stats?.totalBloodUnits || 0} lives ready to be saved
                    </span>
                  </div>
                </div>
                <div className="hidden md:block">
                  <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center">
                    <HeartSolidIcon className="h-12 w-12 text-red-500" />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Medical Fact of the Day */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-blue-50 rounded-xl p-6 border border-blue-200"
            >
              <div className="flex items-start space-x-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <ChartBarIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">Did You Know?</h3>
                  <p className="text-blue-800">
                    "Every 2 seconds, someone in the world needs blood. Your hospital's blood bank is part of a global network that saves over 4.5 million lives each year."
                  </p>
                  <p className="text-sm text-blue-600 mt-2">- World Health Organization</p>
                </div>
              </div>
            </motion.div>

            {/* Quick Stats Cards */}
            <div className="grid md:grid-cols-4 gap-6">
              {[
                { 
                  label: 'Total Blood Units', 
                  value: stats?.totalBloodUnits || 0, 
                  icon: <HeartSolidIcon className="h-6 w-6" />, 
                  color: 'red', 
                  change: '+12%',
                  caption: 'Ready to save lives'
                },
                { 
                  label: 'Active Requests', 
                  value: stats?.pendingRequests || 0, 
                  icon: <ExclamationTriangleIcon className="h-6 w-6" />, 
                  color: 'orange', 
                  change: '+5%',
                  caption: 'Patients waiting for help'
                },
                { 
                  label: 'Requests Handled Today', 
                  value: stats?.completedRequests || 0, 
                  icon: <CheckCircleIcon className="h-6 w-6" />, 
                  color: 'green', 
                  change: '+18%',
                  caption: 'Lives impacted today'
                },
                { 
                  label: 'Low Stock Alerts', 
                  value: getLowStockAlerts().length, 
                  icon: <BellIcon className="h-6 w-6" />, 
                  color: 'yellow', 
                  change: '-2%',
                  caption: 'Needs attention'
                }
              ].map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                      <p className="text-xs text-green-600 mt-1">{stat.change} from yesterday</p>
                      <p className="text-xs text-gray-500 mt-1 italic">{stat.caption}</p>
                    </div>
                    <div className={`p-3 rounded-lg bg-${stat.color}-100 text-${stat.color}-600`}>
                      {stat.icon}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Critical Stock Alerts Card Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-r from-red-500 to-red-600 rounded-xl p-6 text-white cursor-pointer shadow-lg hover:shadow-xl transition-all"
              onClick={() => setShowCriticalAlerts(!showCriticalAlerts)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <ExclamationTriangleIcon className="h-8 w-8 mr-3" />
                  <div>
                    <h3 className="text-xl font-bold">Critical Stock Alerts</h3>
                    <p className="text-red-100">{getLowStockAlerts().length} items need attention</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="bg-white bg-opacity-20 rounded-full px-3 py-1">
                    <span className="font-semibold">{getLowStockAlerts().length}</span>
                  </div>
                  <motion.div
                    animate={{ rotate: showCriticalAlerts ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ChevronDownIcon className="h-6 w-6" />
                  </motion.div>
                </div>
              </div>
            </motion.div>

            {/* Collapsible Critical Stock Alerts Content */}
            <AnimatePresence>
              {showCriticalAlerts && getLowStockAlerts().length > 0 && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <motion.div
                    initial={{ y: -20 }}
                    animate={{ y: 0 }}
                    exit={{ y: -20 }}
                    className="bg-red-50 rounded-xl p-6 border border-red-200 mt-4"
                  >
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {getLowStockAlerts().map((item, index) => {
                        const status = getStockStatusText(item.unitsAvailable, item.minThreshold, item.maxCapacity);
                        return (
                          <div key={index} className="bg-white rounded-lg p-4 border border-red-200">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-lg font-bold text-gray-900">{item.bloodGroup}</span>
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                status.level === 'critical' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'
                              }`}>
                                {status.text}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600">Current: {item.unitsAvailable} units</p>
                            <p className="text-xs text-gray-500">Minimum: {item.minThreshold} units</p>
                            <button
                              onClick={() => {
                                setEditingInventory(item);
                                setShowInventoryModal(true);
                              }}
                              className="mt-3 text-sm text-red-600 hover:text-red-700 font-medium"
                            >
                              Update Now →
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Blood Type Education Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-purple-50 rounded-xl p-6 border border-purple-200"
            >
              <div className="flex items-start space-x-4">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <HeartIcon className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-purple-900 mb-2">Blood Type Facts</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-purple-800 mb-1">Universal Donor: O-</h4>
                      <p className="text-sm text-purple-700">Can donate to all blood types - the true lifesaver!</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-purple-800 mb-1">Universal Recipient: AB+</h4>
                      <p className="text-sm text-purple-700">Can receive from all blood types - the ultimate recipient!</p>
                    </div>
                  </div>
                  <p className="text-xs text-purple-600 mt-3 italic">"The rarest blood type is AB negative, found in less than 1% of the population."</p>
                </div>
              </div>
            </motion.div>

            {/* Recent Activity */}
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Recent Requests Card Button */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white cursor-pointer shadow-lg hover:shadow-xl transition-all"
                onClick={() => setShowRecentRequests(!showRecentRequests)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <ClockIcon className="h-8 w-8 mr-3" />
                    <div>
                      <h3 className="text-xl font-bold">Recent Requests</h3>
                      <p className="text-blue-100">{bloodRequests.slice(0, 5).length} pending requests</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="bg-white bg-opacity-20 rounded-full px-3 py-1">
                      <span className="font-semibold">{bloodRequests.filter(r => r.status === 'pending').length}</span>
                    </div>
                    <motion.div
                      animate={{ rotate: showRecentRequests ? 180 : 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <ChevronDownIcon className="h-6 w-6" />
                    </motion.div>
                  </div>
                </div>
              </motion.div>

              {/* Collapsible Recent Requests Content */}
              <AnimatePresence>
                {showRecentRequests && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <motion.div
                      initial={{ y: -20 }}
                      animate={{ y: 0 }}
                      exit={{ y: -20 }}
                      className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 mt-4"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Recent Requests</h3>
                        <div className="flex items-center text-sm text-gray-500">
                          <ClockIcon className="h-4 w-4 mr-1" />
                          Last 24 hours
                        </div>
                      </div>
                      <div className="space-y-3">
                        {bloodRequests.slice(0, 5).map((request) => (
                          <div key={request._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                            <div className="flex items-center space-x-3">
                              <div className={`w-2 h-2 rounded-full ${
                                request.status === 'pending' ? 'bg-yellow-500' :
                                request.status === 'accepted' ? 'bg-green-500' :
                                'bg-red-500'
                              }`}></div>
                              <div>
                                <p className="font-medium text-gray-900">{request.recipientName}</p>
                                <p className="text-sm text-gray-600">{request.bloodGroup} • {request.unitsNeeded} units</p>
                                <p className="text-xs text-gray-500 italic">Urgency: {request.urgency}</p>
                              </div>
                            </div>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              request.status === 'pending' ? 'bg-yellow-100 text-yellow-600' :
                              request.status === 'accepted' ? 'bg-green-100 text-green-600' :
                              'bg-red-100 text-red-600'
                            }`}>
                              {request.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Inventory Summary Card Button */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white cursor-pointer shadow-lg hover:shadow-xl transition-all"
                onClick={() => setShowInventorySummary(!showInventorySummary)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <HeartIcon className="h-8 w-8 mr-3" />
                    <div>
                      <h3 className="text-xl font-bold">Inventory Summary</h3>
                      <p className="text-green-100">{inventory.length} blood types available</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="bg-white bg-opacity-20 rounded-full px-3 py-1">
                      <span className="font-semibold">{inventory.reduce((sum, item) => sum + item.unitsAvailable, 0)}</span>
                    </div>
                    <motion.div
                      animate={{ rotate: showInventorySummary ? 180 : 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <ChevronDownIcon className="h-6 w-6" />
                    </motion.div>
                  </div>
                </div>
              </motion.div>

              {/* Collapsible Inventory Summary Content */}
              <AnimatePresence>
                {showInventorySummary && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <motion.div
                      initial={{ y: -20 }}
                      animate={{ y: 0 }}
                      exit={{ y: -20 }}
                      className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 mt-4"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Inventory Summary</h3>
                        <div className="flex items-center text-sm text-gray-500">
                          <HeartIcon className="h-4 w-4 mr-1" />
                          Life-saving units ready
                        </div>
                      </div>
                      <div className="space-y-3">
                        {inventory.slice(0, 5).map((item) => {
                          const status = getStockStatusColor(item.unitsAvailable, item.minThreshold, item.maxCapacity);
                          return (
                            <div key={item.bloodGroup} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                              <div className="flex items-center space-x-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${status.bg} ${status.text}`}>
                                  {item.bloodGroup}
                                </div>
                                <span className="font-medium text-gray-900">{item.unitsAvailable} units</span>
                              </div>
                              <span className={`text-xs px-2 py-1 rounded-full ${status.bg} ${status.text}`}>
                                {getStockStatusText(item.unitsAvailable, item.minThreshold, item.maxCapacity).text}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        {/* Inventory Section */}
        {activeSection === 'inventory' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Blood Inventory Management</h2>
              <button
                onClick={() => setShowInventoryModal(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <PlusIcon className="h-4 w-4" />
                <span>Update Inventory</span>
              </button>
            </div>

            {/* Inspiring Medical Quote */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="bg-gradient-to-r from-teal-50 to-blue-50 rounded-xl p-6 border border-teal-200"
            >
              <div className="flex items-start space-x-4">
                <div className="p-2 bg-teal-100 rounded-lg">
                  <HeartSolidIcon className="h-6 w-6 text-teal-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-teal-900 mb-2">Today's Inspiration</h3>
                  <p className="text-teal-800 italic">
                    "The blood you donate gives someone another chance at life. One day that someone may be a member of your family, a friend, or even you."
                  </p>
                  <p className="text-sm text-teal-600 mt-2">- Anonymous Blood Donor</p>
                </div>
              </div>
            </motion.div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Blood Group</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Available Units</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Min Threshold</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Max Capacity</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {inventory.map((item) => {
                      const status = getStockStatusColor(item.unitsAvailable, item.minThreshold, item.maxCapacity);
                      const statusText = getStockStatusText(item.unitsAvailable, item.minThreshold, item.maxCapacity);
                      return (
                        <tr key={item.bloodGroup} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${status.bg} ${status.text}`}>
                              {item.bloodGroup}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-lg font-semibold text-gray-900">{item.unitsAvailable}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{item.minThreshold}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{item.maxCapacity}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${status.bg} ${status.text}`}>
                              {statusText.text}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => {
                                setEditingInventory(item);
                                setShowInventoryModal(true);
                              }}
                              className="text-red-600 hover:text-red-900 mr-3"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* Requests Section */}
        {activeSection === 'requests' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Incoming Blood Requests</h2>
                <p className="text-gray-600 mt-1">Every request represents a life waiting to be saved</p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search requests..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                  <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                </div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="accepted">Accepted</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="divide-y divide-gray-200">
                {filteredRequests.length > 0 ? (
                  filteredRequests.map((request) => (
                    <div key={request._id} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <span className="text-lg font-semibold text-gray-900">{request.recipientName}</span>
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-600">
                              {request.bloodGroup}
                            </span>
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-600">
                              {request.unitsNeeded} units needed
                            </span>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              request.urgency === 'critical' ? 'bg-red-100 text-red-600' :
                              request.urgency === 'urgent' ? 'bg-orange-100 text-orange-600' :
                              'bg-yellow-100 text-yellow-600'
                            }`}>
                              {request.urgency}
                            </span>
                          </div>
                          <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600">
                            <div>
                              <p className="font-medium text-gray-900">Medical Reason:</p>
                              <p className="italic">{request.medicalReason}</p>
                              <p className="text-xs text-gray-500 mt-1">Every donation matters</p>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">Location:</p>
                              <p>{request.location?.address || 'Not specified'}</p>
                              <p className="text-xs text-gray-500 mt-1">Where help is needed</p>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">Contact:</p>
                              <p>{request.contactPhone}</p>
                              <p className="text-xs text-gray-500 mt-1">Ready to coordinate</p>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">Requested:</p>
                              <p>{new Date(request.createdAt).toLocaleDateString()}</p>
                              <p className="text-xs text-gray-500 mt-1">Time is precious</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          {request.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleRequestResponse(request._id, 'accepted')}
                                className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
                                title="Accept Request"
                              >
                                <CheckCircleIcon className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => handleRequestResponse(request._id, 'rejected')}
                                className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                                title="Reject Request"
                              >
                                <XCircleIcon className="h-5 w-5" />
                              </button>
                            </>
                          )}
                          {request.status === 'accepted' && (
                            <span className="px-3 py-1 bg-green-100 text-green-600 rounded-full text-sm font-medium">
                              Accepted
                            </span>
                          )}
                          {request.status === 'rejected' && (
                            <span className="px-3 py-1 bg-red-100 text-red-600 rounded-full text-sm font-medium">
                              Rejected
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-12 text-center">
                    <HeartIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No blood requests found</p>
                    <p className="text-sm text-gray-400 mt-2">Try adjusting your search or filters</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* History Section */}
        {activeSection === 'history' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Request History</h2>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search history..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
                <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Blood Group</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Units</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Response Date</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredHistory.map((request) => (
                      <tr key={request._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {new Date(request.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {request.recipientName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {request.bloodGroup}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {request.unitsNeeded}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            request.status === 'accepted' ? 'bg-green-100 text-green-600' :
                            request.status === 'rejected' ? 'bg-red-100 text-red-600' :
                            'bg-yellow-100 text-yellow-600'
                          }`}>
                            {request.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {request.responseDate ? new Date(request.responseDate).toLocaleDateString() : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* Map Section */}
        {activeSection === 'map' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Location Map</h2>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setShowMap(!showMap)}
                  className="flex items-center space-x-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                >
                  <MapPinIcon className="h-4 w-4" />
                  <span>{showMap ? 'Hide Map' : 'Show Map'}</span>
                </button>
              </div>
            </div>

            {showMap && (
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <GoogleMap 
                  requests={bloodRequests}
                  donors={[]} // Will be populated from API
                  hospitals={[]} // Will be populated from API
                  height="400px"
                />
                <div className="mt-4 grid md:grid-cols-3 gap-4">
                  <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                    <h4 className="font-semibold text-red-900 mb-2">Nearby Requests</h4>
                    <p className="text-2xl font-bold text-red-600">{bloodRequests.filter(r => r.status === 'pending').length}</p>
                    <p className="text-sm text-red-600">Pending requests</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <h4 className="font-semibold text-green-900 mb-2">Available Donors</h4>
                    <p className="text-2xl font-bold text-green-600">--</p>
                    <p className="text-sm text-green-600">In your area</p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <h4 className="font-semibold text-blue-900 mb-2">Nearby Hospitals</h4>
                    <p className="text-2xl font-bold text-blue-600">--</p>
                    <p className="text-sm text-blue-600">Within 50km</p>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Reports Section */}
        {activeSection === 'reports' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <SimpleHospitalReports />
          </motion.div>
        )}

        {/* Camps Section */}
        {activeSection === 'camps' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Blood Donation Camps</h2>
              <button
                onClick={() => setShowCampModal(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <PlusIcon className="h-4 w-4" />
                <span>Create Camp</span>
              </button>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Camp cards would go here - for now showing placeholder */}
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Blood Donation Camp #{i}</h3>
                  <p className="text-gray-600 mb-4">Organized at our hospital premises</p>
                  <div className="space-y-2 text-sm text-gray-600">
                    <p><strong>Date:</strong> Upcoming</p>
                    <p><strong>Target:</strong> 50 units</p>
                    <p><strong>Status:</strong> Planning</p>
                  </div>
                  <button className="mt-4 w-full px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors">
                    View Details
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Inventory Update Modal */}
      <AnimatePresence>
        {showInventoryModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowInventoryModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-xl p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {editingInventory ? 'Update Inventory' : 'Add Blood Units'}
              </h3>
              <InventoryUpdateForm
                inventory={inventory}
                editingItem={editingInventory}
                onSubmit={(bloodGroup, operation, units) => {
                  handleInventoryUpdate(bloodGroup, operation, units);
                  setShowInventoryModal(false);
                  setEditingInventory(null);
                }}
                onCancel={() => {
                  setShowInventoryModal(false);
                  setEditingInventory(null);
                }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Camp Creation Modal */}
      <AnimatePresence>
        {showCampModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowCampModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-xl p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Create Donation Camp</h3>
              <CampCreationForm
                formData={campForm}
                setFormData={setCampForm}
                onSubmit={handleCreateCamp}
                onCancel={() => setShowCampModal(false)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Profile Modal */}
      <AnimatePresence>
        {showProfileModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowProfileModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-xl p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Hospital Profile</h3>
              <ProfileForm
                formData={profileForm}
                setFormData={setProfileForm}
                onSubmit={handleProfileUpdate}
                onCancel={() => setShowProfileModal(false)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden">
          <div className="grid grid-cols-5 py-2">
            {[
              { id: 'overview', icon: <ChartBarIcon className="h-5 w-5" />, label: 'Dashboard' },
              { id: 'inventory', icon: <HeartIcon className="h-5 w-5" />, label: 'Inventory' },
              { id: 'requests', icon: <BellIcon className="h-5 w-5" />, label: 'Requests' },
              { id: 'reports', icon: <DocumentArrowDownIcon className="h-5 w-5" />, label: 'Reports' },
              { id: 'profile', icon: <UserCircleIcon className="h-5 w-5" />, label: 'Profile' }
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  if (item.id === 'profile') {
                    setShowProfileModal(true);
                  } else {
                    setActiveSection(item.id);
                  }
                }}
                className={`flex flex-col items-center py-2 px-1 transition-colors ${
                  activeSection === item.id || (item.id === 'profile' && showProfileModal)
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
      )}
    </div>
  );
};

// Inventory Update Form Component
const InventoryUpdateForm = ({ inventory, editingItem, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    bloodGroup: editingItem?.bloodGroup || '',
    operation: 'add',
    units: editingItem?.unitsAvailable || 1
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData.bloodGroup, formData.operation, formData.units);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Blood Group
        </label>
        <select
          value={formData.bloodGroup}
          onChange={(e) => setFormData(prev => ({ ...prev, bloodGroup: e.target.value }))}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
        >
          <option value="">Select blood group</option>
          {inventory.map(item => (
            <option key={item.bloodGroup} value={item.bloodGroup}>
              {item.bloodGroup} (Current: {item.unitsAvailable} units)
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Operation
        </label>
        <select
          value={formData.operation}
          onChange={(e) => setFormData(prev => ({ ...prev, operation: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
        >
          <option value="add">Add Units</option>
          <option value="subtract">Remove Units</option>
          <option value="set">Set Total Units</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Units
        </label>
        <input
          type="number"
          value={formData.units}
          onChange={(e) => setFormData(prev => ({ ...prev, units: parseInt(e.target.value) }))}
          min="1"
          max="100"
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
        />
      </div>

      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
        >
          Update Inventory
        </button>
      </div>
    </form>
  );
};

// Camp Creation Form Component
const CampCreationForm = ({ formData, setFormData, onSubmit, onCancel }) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Camp Name
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Date
        </label>
        <input
          type="date"
          value={formData.date}
          onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Location
        </label>
        <input
          type="text"
          value={formData.location}
          onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Target Units
        </label>
        <input
          type="number"
          value={formData.targetUnits}
          onChange={(e) => setFormData(prev => ({ ...prev, targetUnits: parseInt(e.target.value) }))}
          min="1"
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
        />
      </div>

      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
        >
          Create Camp
        </button>
      </div>
    </form>
  );
};

// Profile Form Component
const ProfileForm = ({ formData, setFormData, onSubmit, onCancel }) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Hospital Name
        </label>
        <input
          type="text"
          value={formData.hospitalName}
          onChange={(e) => setFormData(prev => ({ ...prev, hospitalName: e.target.value }))}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Contact Number
        </label>
        <input
          type="tel"
          value={formData.contactNumber}
          onChange={(e) => setFormData(prev => ({ ...prev, contactNumber: e.target.value }))}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Email
        </label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Address
        </label>
        <textarea
          value={formData.address}
          onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Emergency Contact
        </label>
        <input
          type="tel"
          value={formData.emergencyContact}
          onChange={(e) => setFormData(prev => ({ ...prev, emergencyContact: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
        />
      </div>

      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
        >
          Update Profile
        </button>
      </div>
    </form>
  );
};

export default ModernHospitalDashboard;
