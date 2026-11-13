import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { requestAPI, userAPI } from '../services/api';
import { 
  HeartIcon, 
  MapPinIcon, 
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  UserGroupIcon,
  BellIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';

// Request Form Component
const RequestForm = ({ onSubmit }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    bloodGroup: '',
    urgency: 'normal',
    unitsNeeded: 1,
    location: {
      address: user?.location?.address || '',
      lat: user?.location?.lat || 0,
      lng: user?.location?.lng || 0
    },
    notes: ''
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);
    
    try {
      // Prepare request data with proper location format
      const requestData = {
        bloodGroup: formData.bloodGroup,
        urgency: formData.urgency,
        unitsNeeded: formData.unitsNeeded,
        location: {
          address: formData.location.address,
          lat: parseFloat(formData.location.lat) || 0,
          lng: parseFloat(formData.location.lng) || 0
        },
        notes: formData.notes
      };

      console.log('Sending request data:', requestData);
      const response = await requestAPI.createRequest(requestData);
      console.log('Request created successfully:', response.data);
      setSuccess(true);
      setTimeout(() => {
        onSubmit();
      }, 1500);
    } catch (err) {
      console.error('Error creating request:', err);
      setError(err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Failed to create request');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Blood Group *
          </label>
          <select
            name="bloodGroup"
            value={formData.bloodGroup}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
          >
            <option value="">Select Blood Group</option>
            {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(group => (
              <option key={group} value={group}>{group}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Urgency Level *
          </label>
          <select
            name="urgency"
            value={formData.urgency}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
          >
            <option value="normal">Normal</option>
            <option value="urgent">Urgent</option>
            <option value="critical">Critical</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Units Needed *
          </label>
          <input
            type="number"
            name="unitsNeeded"
            value={formData.unitsNeeded}
            onChange={handleChange}
            min="1"
            max="10"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Address *
          </label>
          <input
            type="text"
            name="location.address"
            value={formData.location.address}
            onChange={handleChange}
            required
            placeholder="Enter your location"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Additional Notes
        </label>
        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          rows="3"
          placeholder="Any additional information or special requirements"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
        />
      </div>

      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={onSubmit}
          className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || success}
          className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Creating...' : success ? 'Request Sent!' : 'Create Request'}
        </button>
      </div>
    </form>
  );
};

const RecipientDashboard = () => {
  const { user } = useAuth();
  const { notifications } = useNotifications();
  const [nearbyDonors, setNearbyDonors] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [showRequestHistory, setShowRequestHistory] = useState(false);
  const [showSearchDonors, setShowSearchDonors] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showBloodStocks, setShowBloodStocks] = useState(false);
  const [bloodStocks, setBloodStocks] = useState([]);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [searchFilters, setSearchFilters] = useState({
    bloodGroup: '',
    maxDistance: 50
  });

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      console.log('Fetching dashboard data...');
      const [requestsResponse, bloodStocksResponse] = await Promise.all([
        requestAPI.getMyRequests(),
        userAPI.getNearbyBloodStocks()
      ]);
      console.log('Requests response:', requestsResponse);
      console.log('Requests data:', requestsResponse.data.requests);
      setMyRequests(requestsResponse.data.requests);
      console.log('My requests set:', requestsResponse.data.requests);
      console.log('Blood stocks response:', bloodStocksResponse);
      setBloodStocks(bloodStocksResponse.data.stocks || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchDonors = async () => {
    try {
      setLoading(true);
      setSearchPerformed(true);
      
      const searchParams = {
        bloodGroup: searchFilters.bloodGroup || undefined,
        maxDistance: searchFilters.maxDistance
      };
      
      const response = await userAPI.searchNearbyDonors(searchParams);
      setNearbyDonors(response.data);
    } catch (error) {
      console.error('Error searching donors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRequest = async (requestId) => {
    if (!window.confirm('Are you sure you want to delete this blood request? This action cannot be undone.')) {
      return;
    }
    
    try {
      await requestAPI.deleteRequest(requestId);
      fetchDashboardData();
    } catch (error) {
      console.error('Error deleting request:', error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  if (loading && myRequests.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-teal-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Big Welcome Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-12 text-center"
        >
          <div className="bg-gradient-to-br from-pink-200 via-rose-300 to-pink-400 rounded-3xl p-12 shadow-2xl">
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="flex justify-center mb-6">
                <div className="bg-white bg-opacity-50 p-4 rounded-full">
                  <HeartSolidIcon className="h-16 w-16 text-rose-600" />
                </div>
              </div>
              <h1 className="text-5xl font-bold text-rose-800 mb-4">
                Welcome Back, {user.name}!
              </h1>
              <p className="text-xl text-rose-700 mb-8">
                Your BloodNet+ Dashboard
              </p>
              <div className="bg-white bg-opacity-60 rounded-2xl p-6 max-w-2xl mx-auto">
                <p className="text-rose-800 text-lg leading-relaxed">
                  Manage your blood requests, connect with nearby donors, and save lives. 
                  Together, we're building a community of hope and support.
                </p>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="space-y-8">
          {/* Four Main Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Create Blood Request Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <button
                onClick={() => setShowRequestForm(!showRequestForm)}
                className="w-full bg-rose-300 hover:bg-rose-400 text-rose-800 rounded-2xl p-8 flex flex-col items-center justify-center space-y-4 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <PlusIcon className="h-12 w-12" />
                <div className="text-center">
                  <h3 className="text-xl font-bold mb-2">Create Blood Request</h3>
                  <p className="text-sm opacity-80">Request blood donation</p>
                </div>
              </button>
            </motion.div>

            {/* Search Nearby Donors Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <button
                onClick={() => setShowSearchDonors(!showSearchDonors)}
                className="w-full bg-pink-300 hover:bg-pink-400 text-pink-800 rounded-2xl p-8 flex flex-col items-center justify-center space-y-4 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <MagnifyingGlassIcon className="h-12 w-12" />
                <div className="text-center">
                  <h3 className="text-xl font-bold mb-2">Search Nearby Donors</h3>
                  <p className="text-sm opacity-80">Find donors in your area</p>
                </div>
              </button>
            </motion.div>

            {/* Blood Request History Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <button
                onClick={() => {
                  console.log('History button clicked, current state:', showRequestHistory);
                  setShowRequestHistory(!showRequestHistory);
                  console.log('History button clicked, new state:', !showRequestHistory);
                }}
                className="w-full bg-rose-200 hover:bg-rose-300 text-rose-700 rounded-2xl p-8 flex flex-col items-center justify-center space-y-4 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <ClockIcon className="h-12 w-12" />
                <div className="text-center">
                  <h3 className="text-xl font-bold mb-2">My Blood History</h3>
                  <p className="text-sm opacity-80">View your requests</p>
                  <span className="inline-block mt-2 bg-white bg-opacity-60 px-3 py-1 rounded-full text-xs font-semibold">
                    {myRequests.length} requests
                  </span>
                </div>
              </button>
            </motion.div>

            {/* Blood Stocks Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <button
                onClick={() => setShowBloodStocks(!showBloodStocks)}
                className="w-full bg-purple-300 hover:bg-purple-400 text-purple-800 rounded-2xl p-8 flex flex-col items-center justify-center space-y-4 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <BuildingOfficeIcon className="h-12 w-12" />
                <div className="text-center">
                  <h3 className="text-xl font-bold mb-2">Blood Banks</h3>
                  <p className="text-sm opacity-80">Check blood availability</p>
                  <span className="inline-block mt-2 bg-white bg-opacity-60 px-3 py-1 rounded-full text-xs font-semibold">
                    {bloodStocks.length} facilities
                  </span>
                </div>
              </button>
            </motion.div>
          </div>

          {/* Content Grid */}
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column - Forms and History */}
            <div className="lg:col-span-2 space-y-6">
              {/* Request Form */}
              {showRequestForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-white rounded-xl shadow-sm p-6 border border-gray-200"
                >
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Create Blood Request</h3>
                  <RequestForm onSubmit={() => {
                    setShowRequestForm(false);
                    fetchDashboardData();
                  }} />
                </motion.div>
              )}

              {/* Blood Request History */}
              {showRequestHistory && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-white rounded-xl shadow-sm p-6 border border-gray-200"
                >
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Blood Request History</h3>
                  {console.log('Rendering history section, showRequestHistory:', showRequestHistory, 'myRequests:', myRequests)}
                  {myRequests.length > 0 ? (
                    <div className="space-y-4">
                      {myRequests.map((request) => (
                        <div key={request._id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                  {request.bloodGroup}
                                </span>
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                                  (request.urgency === 'critical' || request.urgency === 'emergency') ? 'bg-red-600 text-white animate-pulse' :
                                  request.urgency === 'urgent' ? 'bg-amber-100 text-amber-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>{request.urgency === 'critical' || request.urgency === 'emergency' ? `🚨 ${(request.urgency || '').toUpperCase()}` : request.urgency}</span>
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                  request.status === 'accepted' ? 'bg-green-100 text-green-800' :
                                  request.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>{request.status}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Location:</span>
                                <span className="font-medium">{request.location?.address || 'Not specified'}</span>
                              </div>
                              {request.notes && (
                                <div>
                                  <span className="text-gray-600">Notes:</span>
                                  <p className="font-medium mt-1">{request.notes}</p>
                                </div>
                              )}
                            </div>
                            {request.status === 'pending' && (
                              <button
                                onClick={() => handleDeleteRequest(request._id)}
                                className="text-red-600 hover:text-red-800 text-sm font-medium"
                                title="Delete Request"
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">No blood requests found</p>
                  )}
                </motion.div>
              )}
            </div>

            {/* Right Column - Search & Info */}
            <div className="space-y-6">
              {/* Search Donors */}
              {showSearchDonors && (
                <motion.div
                  id="search-section"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-white rounded-xl shadow-sm p-6 border border-gray-200"
                >
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Search Nearby Donors</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Blood Group
                    </label>
                    <select
                      value={searchFilters.bloodGroup}
                      onChange={(e) => setSearchFilters(prev => ({ ...prev, bloodGroup: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-400 focus:border-transparent"
                    >
                      <option value="">All Blood Groups</option>
                      {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(group => (
                        <option key={group} value={group}>{group}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Max Distance (km)
                    </label>
                    <input
                      type="number"
                      value={searchFilters.maxDistance}
                      onChange={(e) => setSearchFilters(prev => ({ ...prev, maxDistance: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-400 focus:border-transparent"
                      min="1"
                      max="100"
                    />
                  </div>
                  <button 
                    onClick={handleSearchDonors}
                    className="w-full bg-rose-200 text-rose-700 py-2 rounded-lg hover:bg-rose-300 transition-colors flex items-center justify-center space-x-2"
                  >
                    <MagnifyingGlassIcon className="h-4 w-4" />
                    <span>Search Donors</span>
                  </button>
                </div>

                {/* Search Results */}
                {nearbyDonors.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.6 }}
                    className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 mt-6"
                  >
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Search Results</h3>
                    <div className="space-y-3">
                      {nearbyDonors.map((donor) => (
                        <div key={donor._id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium text-gray-900">{donor.name}</h4>
                              <p className="text-sm text-gray-600">{donor.bloodGroup} • {donor.phone}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                {donor.location?.address || 'Location not specified'}
                              </p>
                            </div>
                            <div className="text-right">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Available
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* No Donors Found Message */}
                {nearbyDonors.length === 0 && searchPerformed && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.6 }}
                    className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 mt-6"
                  >
                    <div className="text-center py-8">
                      <UserGroupIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No active donors found</p>
                      <p className="text-sm text-gray-400 mt-2">
                        Try adjusting your search criteria or distance range
                      </p>
                    </div>
                  </motion.div>
                )}
                </motion.div>
              )}

              {/* Blood Stocks Section */}
              {showBloodStocks && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-white rounded-xl shadow-sm p-6 border border-gray-200"
                >
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Nearby Blood Banks & Hospitals</h3>
                  <p className="text-gray-600 mb-6">Check blood availability at nearby facilities</p>
                  
                  {bloodStocks.length > 0 ? (
                    <div className="space-y-4">
                      {bloodStocks.map((facility) => (
                        <div key={facility._id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h4 className="font-semibold text-gray-900">{facility.name}</h4>
                              <p className="text-sm text-gray-600">{facility.type}</p>
                              <p className="text-sm text-gray-500">{facility.location}</p>
                              <p className="text-sm text-gray-500">{facility.distance} km away</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-500">{facility.operatingHours}</p>
                              <p className="text-sm text-gray-500">{facility.phone}</p>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-4 gap-2">
                            {Object.entries(facility.bloodStock).map(([bloodType, units]) => (
                              <div key={bloodType} className="text-center">
                                <div className={`text-xs font-semibold px-2 py-1 rounded ${
                                  units === 0 ? 'bg-red-100 text-red-700' :
                                  units <= 5 ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-green-100 text-green-700'
                                }`}>
                                  {bloodType}
                                </div>
                                <div className="text-sm text-gray-600">{units}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <BuildingOfficeIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">No blood banks found</h4>
                      <p className="text-gray-600">Check back later for blood stock information</p>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Recent Notifications */}
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-white rounded-xl shadow-sm p-6 border border-gray-200"
                >
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Notifications</h3>
                <div className="space-y-3">
                  {notifications.slice(0, 5).map((notification) => (
                    <div key={notification._id} className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                      <p className="text-xs text-gray-600 mt-1">{notification.message}</p>
                      <p className="text-xs text-gray-400 mt-2">
                        {new Date(notification.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                  {notifications.length === 0 && (
                    <p className="text-gray-500 text-center py-4">No notifications</p>
                  )}
                </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecipientDashboard;
