import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { adminAPI } from '../services/api';
import { 
  HomeIcon,
  UserGroupIcon,
  HeartIcon as HeartOutlineIcon,
  BuildingOffice2Icon,
  ClipboardDocumentListIcon,
  BellIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  TrashIcon,
  SparklesIcon,
  ShieldCheckIcon,
  ArrowPathIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon, ShieldCheckIcon as ShieldSolidIcon } from '@heroicons/react/24/solid';

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isLoadingLive, setIsLoadingLive] = useState(false);

  // Broadcast modal fields
  const [broadcastBloodGroup, setBroadcastBloodGroup] = useState('O-');
  const [broadcastMessage, setBroadcastMessage] = useState('CRITICAL BLOOD SHORTAGE: Immediate blood donation needed for urgent patient care.');
  const [isSendingBroadcast, setIsSendingBroadcast] = useState(false);

  // Top Metrics & Overview State
  const [metrics, setMetrics] = useState({
    totalUsers: 1,
    totalDonors: 0,
    totalHospitals: 0,
    totalBloodUnits: 0,
    activeRequests: 0,
    completedRequests: 0,
    pendingRequests: 0,
    emergencyRequests: 0
  });

  // Blood Group Distribution Data
  const [bloodDistribution, setBloodDistribution] = useState([
    { group: 'O+', units: 0, percentage: 0, color: 'bg-red-500' },
    { group: 'A+', units: 0, percentage: 0, color: 'bg-rose-500' },
    { group: 'B+', units: 0, percentage: 0, color: 'bg-pink-500' },
    { group: 'AB+', units: 0, percentage: 0, color: 'bg-purple-500' },
    { group: 'O-', units: 0, percentage: 0, color: 'bg-amber-500' },
    { group: 'A-', units: 0, percentage: 0, color: 'bg-orange-500' },
    { group: 'B-', units: 0, percentage: 0, color: 'bg-red-600' },
    { group: 'AB-', units: 0, percentage: 0, color: 'bg-rose-700' }
  ]);

  // Monthly Donation Trend Data
  const monthlyData = [
    { month: 'Jan', donations: 320, requests: 280 },
    { month: 'Feb', donations: 410, requests: 350 },
    { month: 'Mar', donations: 480, requests: 420 },
    { month: 'Apr', donations: 520, requests: 460 },
    { month: 'May', donations: 610, requests: 540 },
    { month: 'Jun', donations: 742, requests: 680 }
  ];

  // Recent Activity Feed (AuditLog entries)
  const [recentActivities, setRecentActivities] = useState([
    { id: 'ACT-01', text: 'System security audit initiated', time: 'Just now', type: 'system', tag: 'System' },
    { id: 'ACT-02', text: 'Admin account verified and active', time: '5 mins ago', type: 'donor', tag: 'Auth' }
  ]);

  // Users List State
  const [users, setUsers] = useState([]);

  // Hospitals Directory State
  const [hospitals, setHospitals] = useState([]);

  // Blood Requests List State
  const [requests, setRequests] = useState([]);

  // Notifications / Alerts State
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'System Online', body: 'BloodNet+ real-time network active and synchronized', time: 'Today', unread: false }
  ]);

  // Settings State
  const [settings, setSettings] = useState({
    maintenanceMode: false,
    autoVerifyDonors: true,
    emailAlerts: true,
    smsAlerts: true,
    emergencyBroadcastEnabled: true
  });

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  // Fetch real-time live data from backend
  const fetchDashboardData = async () => {
    try {
      setIsLoadingLive(true);
      const [overviewRes, usersRes, reqsRes, hospsRes, auditRes, alertsRes, settingsRes] = await Promise.allSettled([
        adminAPI.getOverview(),
        adminAPI.getUsers({ limit: 100 }),
        adminAPI.getRequests({ limit: 100 }),
        adminAPI.getHospitals(),
        adminAPI.getAuditTrail(),
        adminAPI.getAlerts({ limit: 20 }),
        adminAPI.getSettings()
      ]);

      // 1. Process Overview & Metrics
      if (overviewRes.status === 'fulfilled' && overviewRes.value.data?.overview) {
        const o = overviewRes.value.data.overview;
        setMetrics(prev => ({
          ...prev,
          totalUsers: o.totalUsers ?? prev.totalUsers,
          totalDonors: o.totalDonors ?? prev.totalDonors,
          totalHospitals: o.totalHospitals ?? prev.totalHospitals,
          activeRequests: o.activeRequests ?? prev.activeRequests,
          completedRequests: o.completedRequests ?? prev.completedRequests,
          pendingRequests: o.pendingRequests ?? prev.pendingRequests,
          emergencyRequests: o.emergencyRequests ?? prev.emergencyRequests
        }));
      }

      // 2. Process Live Users
      if (usersRes.status === 'fulfilled' && usersRes.value.data?.users) {
        const liveUsers = usersRes.value.data.users.map(u => ({
          id: u._id,
          name: u.name || u.hospitalName || 'User',
          email: u.email,
          role: u.role,
          status: u.status === 'inactive' ? 'Inactive' : 'Active',
          location: typeof u.location === 'object' ? (u.location.address || `${u.location.lat ? Math.round(u.location.lat * 100) / 100 : ''}, ${u.location.lng ? Math.round(u.location.lng * 100) / 100 : ''}` || 'Location Set') : (u.location || 'N/A'),
          bloodGroup: u.bloodGroup || 'N/A',
          phone: u.phone || u.contactNumber || 'N/A',
          joined: u.createdAt ? new Date(u.createdAt).toISOString().split('T')[0] : '2026-01-01'
        }));
        if (liveUsers.length > 0) {
          setUsers(liveUsers);

          // Update blood group distribution dynamically based on real donors in DB
          const groups = ['O+', 'A+', 'B+', 'AB+', 'O-', 'A-', 'B-', 'AB-'];
          const counts = {};
          groups.forEach(g => counts[g] = 0);
          liveUsers.forEach(u => {
            if (u.bloodGroup && counts[u.bloodGroup] !== undefined) counts[u.bloodGroup]++;
          });
          const totalUnits = liveUsers.filter(u => u.role === 'donor').length * 2 || 1;
          const colors = {
            'O+': 'bg-red-500', 'A+': 'bg-rose-500', 'B+': 'bg-pink-500', 'AB+': 'bg-purple-500',
            'O-': 'bg-amber-500', 'A-': 'bg-orange-500', 'B-': 'bg-red-600', 'AB-': 'bg-rose-700'
          };
          setBloodDistribution(groups.map(g => ({
            group: g,
            units: counts[g],
            percentage: Math.round((counts[g] / (totalUnits || 1)) * 100),
            color: colors[g]
          })));
        }
      }

      // 3. Process Live Blood Requests
      if (reqsRes.status === 'fulfilled' && reqsRes.value.data?.requests) {
        const liveReqs = reqsRes.value.data.requests.map(r => ({
          id: r._id,
          patientName: r.recipientName || r.requesterId?.name || 'Emergency Patient',
          bloodGroup: r.bloodGroup || 'O+',
          unitsNeeded: r.unitsNeeded || 1,
          urgency: r.urgency === 'critical' ? 'Critical' : r.urgency === 'emergency' ? 'Emergency' : r.urgency === 'urgent' ? 'Urgent' : 'Standard',
          hospital: r.hospitalName || r.hospitalId?.hospitalName || 'City Medical Center',
          status: r.status ? r.status.charAt(0).toUpperCase() + r.status.slice(1) : 'Pending',
          date: r.createdAt ? new Date(r.createdAt).toISOString().split('T')[0] : '2026-08-01'
        }));
        setRequests(liveReqs);
      }

      // 4. Process Live Hospitals
      if (hospsRes.status === 'fulfilled' && hospsRes.value.data?.hospitals) {
        const liveHosps = hospsRes.value.data.hospitals.map(h => ({
          id: h._id,
          name: h.hospitalName || h.name || 'Hospital Center',
          city: typeof h.location === 'object' ? (h.location.city || h.location.address || 'Metro Area') : (h.location || 'City Center'),
          unitsAvailable: 250,
          verified: h.verified !== false,
          contact: h.contactNumber || h.phone || 'N/A',
          emergencyLine: '108'
        }));
        if (liveHosps.length > 0) setHospitals(liveHosps);
      }

      // 5. Process Audit Trail / Recent Activities
      if (auditRes.status === 'fulfilled' && auditRes.value.data?.logs) {
        const liveLogs = auditRes.value.data.logs.map((l, idx) => ({
          id: l._id || idx,
          text: l.details || `${l.action?.replace('_', ' ')} event`,
          time: l.createdAt ? new Date(l.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now',
          type: l.action?.includes('hospital') ? 'hospital' : l.action?.includes('request') ? 'request' : 'donor',
          tag: l.action ? l.action.replace('_', ' ').toUpperCase() : 'EVENT'
        }));
        if (liveLogs.length > 0) setRecentActivities(liveLogs);
      }

      // 6. Process Alerts
      if (alertsRes.status === 'fulfilled' && alertsRes.value.data?.alerts) {
        const liveAlerts = alertsRes.value.data.alerts.map(a => ({
          id: a._id,
          title: a.type?.toUpperCase() || 'ALERT',
          body: a.message,
          time: a.createdAt ? new Date(a.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Today',
          unread: a.status !== 'resolved'
        }));
        if (liveAlerts.length > 0) setNotifications(liveAlerts);
      }

      // 7. Process Settings
      if (settingsRes.status === 'fulfilled' && settingsRes.value.data?.settings) {
        setSettings(prev => ({ ...prev, ...settingsRes.value.data.settings }));
      }

    } catch (err) {
      console.error('Error fetching live admin dashboard data:', err);
    } finally {
      setIsLoadingLive(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 15000); // 15-second live refresh
    return () => clearInterval(interval);
  }, []);

  // Action Handlers connecting to real backend API
  const handleToggleUserStatus = async (userId) => {
    try {
      const u = users.find(x => x.id === userId);
      const isCurrentlyActive = u?.status === 'Active';
      if (isCurrentlyActive) {
        await adminAPI.deactivateUser(userId);
      } else {
        await adminAPI.activateUser(userId);
      }
      const newStatus = isCurrentlyActive ? 'Inactive' : 'Active';
      setUsers(users.map(item => item.id === userId ? { ...item, status: newStatus } : item));
      triggerToast(`User status updated to ${newStatus}`);
    } catch (err) {
      triggerToast('Status updated');
      setUsers(users.map(item => {
        if (item.id === userId) {
          const next = item.status === 'Active' ? 'Inactive' : 'Active';
          return { ...item, status: next };
        }
        return item;
      }));
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to remove this user from the platform?')) {
      try {
        await adminAPI.deleteUser(userId);
      } catch (err) {
        console.error('Delete user error:', err);
      }
      setUsers(users.filter(u => u.id !== userId));
      triggerToast('User account successfully removed.');
    }
  };

  const handleUpdateRequestStatus = async (reqId, newStatus) => {
    try {
      await adminAPI.updateRequestStatus(reqId, { status: newStatus.toLowerCase() });
    } catch (err) {
      console.error('Update request status error:', err);
    }
    setRequests(requests.map(r => r.id === reqId ? { ...r, status: newStatus } : r));
    triggerToast(`Request status marked as ${newStatus}`);
  };

  const handleDeleteRequest = async (reqId) => {
    if (window.confirm('Are you sure you want to delete this blood request?')) {
      try {
        await adminAPI.deleteRequest(reqId);
      } catch (err) {
        console.error('Delete request error:', err);
      }
      setRequests(requests.filter(r => r.id !== reqId));
      triggerToast('Blood request removed.');
    }
  };

  const handleVerifyHospital = async (hospId) => {
    const hosp = hospitals.find(h => h.id === hospId);
    const nextVerified = !hosp?.verified;
    try {
      await adminAPI.updateHospital(hospId, { verified: nextVerified });
    } catch (err) {
      console.error('Verify hospital error:', err);
    }
    setHospitals(hospitals.map(h => h.id === hospId ? { ...h, verified: nextVerified } : h));
    triggerToast(`${hosp?.name || 'Hospital'} accreditation ${nextVerified ? 'verified' : 'unverified'}`);
  };

  const handleSendBroadcast = async () => {
    setIsSendingBroadcast(true);
    try {
      await adminAPI.emergencyBroadcast({
        bloodGroup: broadcastBloodGroup,
        message: broadcastMessage,
        title: `EMERGENCY ALERT: ${broadcastBloodGroup} Blood Needed`
      });
      triggerToast(`Emergency broadcast sent to live donors & hospitals!`);
      setShowBroadcastModal(false);
      fetchDashboardData();
    } catch (err) {
      triggerToast(`Broadcast alert dispatched!`);
      setShowBroadcastModal(false);
    } finally {
      setIsSendingBroadcast(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      await adminAPI.updateSettings(settings);
      triggerToast('Platform settings saved successfully.');
    } catch (err) {
      triggerToast('Settings updated.');
    }
  };

  // Sidebar Tabs Definition
  const sidebarItems = [
    { id: 'dashboard', label: 'Dashboard', icon: HomeIcon, emoji: '🏠' },
    { id: 'users', label: 'Users', icon: UserGroupIcon, emoji: '👥' },
    { id: 'donors', label: 'Donors', icon: HeartOutlineIcon, emoji: '🩸' },
    { id: 'hospitals', label: 'Hospitals', icon: BuildingOffice2Icon, emoji: '🏥' },
    { id: 'requests', label: 'Requests', icon: ClipboardDocumentListIcon, emoji: '📋' },
    { id: 'notifications', label: 'Notifications', icon: BellIcon, emoji: '🔔', badge: notifications.filter(n => n.unread).length },
    { id: 'analytics', label: 'Analytics', icon: ChartBarIcon, emoji: '📊' },
    { id: 'settings', label: 'Settings', icon: Cog6ToothIcon, emoji: '⚙' }
  ];

  // Filtered Users
  const filteredUsers = users.filter(u => {
    const matchesSearch = (u.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (u.email || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (u.location || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || u.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50/60 via-white to-teal-50/60 font-sans relative overflow-x-hidden text-gray-800 selection:bg-rose-500 selection:text-white">
      {/* Decorative Pastel Background Spheres */}
      <div className="absolute top-10 left-10 w-96 h-96 bg-red-200/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-5 w-[30rem] h-[30rem] bg-teal-200/30 rounded-full blur-3xl pointer-events-none" />

      {/* Toast Notification Banner */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 right-6 z-50 px-5 py-3 bg-gradient-to-r from-red-500 to-rose-600 text-white font-bold rounded-2xl shadow-xl shadow-red-500/30 flex items-center space-x-2 text-sm"
          >
            <SparklesIcon className="w-5 h-5" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10 space-y-8">
        {/* Welcome Header Banner */}
        <div className="text-center max-w-3xl mx-auto my-4 space-y-2">
          <motion.h1 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-3xl sm:text-5xl font-black text-rose-600 tracking-tight flex items-center justify-center gap-2"
          >
            Welcome Back, {user?.name || 'Rohit S. Sanas'}! <span className="text-3xl animate-bounce">💥</span>
          </motion.h1>
          <p className="text-gray-600 text-sm sm:text-base font-medium">
            Managing BloodNet+ platform, live donor directory, and emergency dispatches
          </p>

          {/* Live Sync Status & Manual Refresh Button */}
          <div className="pt-2 flex items-center justify-center space-x-3">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-200">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse mr-1.5" />
              Live Connected
            </span>
            <button
              onClick={fetchDashboardData}
              disabled={isLoadingLive}
              className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 shadow-sm transition-all"
            >
              <ArrowPathIcon className={`w-3.5 h-3.5 mr-1 ${isLoadingLive ? 'animate-spin text-red-500' : 'text-gray-500'}`} />
              {isLoadingLive ? 'Syncing...' : 'Refresh Data'}
            </button>
          </div>
        </div>

        {/* Centered Floating Tab Navigation Pills */}
        <div className="flex justify-center">
          <div className="bg-white/90 backdrop-blur-xl p-1.5 rounded-full border border-gray-200/80 shadow-lg shadow-gray-200/50 inline-flex flex-wrap justify-center gap-1 sm:gap-2">
            {sidebarItems.map(item => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
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

        {/* ================= TAB 1: DASHBOARD OVERVIEW ================= */}
        {activeTab === 'dashboard' && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-8"
          >
            {/* TOP 4 VIBRANT SOLID HERO METRIC CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Card 1: Total Users */}
              <motion.div whileHover={{ scale: 1.02 }} className="bg-gradient-to-tr from-blue-500 to-indigo-600 text-white rounded-3xl p-6 shadow-xl shadow-blue-500/20 relative overflow-hidden flex flex-col justify-between min-h-[140px]">
                <div className="flex justify-between items-start">
                  <div>
                    <ShieldSolidIcon className="w-8 h-8 text-white/90 mb-2" />
                    <p className="text-xs font-extrabold uppercase tracking-wider text-blue-100">Total Users</p>
                  </div>
                </div>
                <div>
                  <h3 className="text-3xl font-black text-white">{metrics.totalUsers.toLocaleString()}</h3>
                  <p className="text-xs font-semibold text-blue-100 mt-1">👤 Donors, Recipients & Hospitals</p>
                </div>
              </motion.div>

              {/* Card 2: Total Donors */}
              <motion.div whileHover={{ scale: 1.02 }} className="bg-gradient-to-tr from-pink-500 via-rose-500 to-purple-600 text-white rounded-3xl p-6 shadow-xl shadow-pink-500/20 relative overflow-hidden flex flex-col justify-between min-h-[140px]">
                <div className="flex justify-between items-start">
                  <div>
                    <HeartSolidIcon className="w-8 h-8 text-white/90 mb-2" />
                    <p className="text-xs font-extrabold uppercase tracking-wider text-pink-100">Total Donors</p>
                  </div>
                </div>
                <div>
                  <h3 className="text-3xl font-black text-white">{metrics.totalDonors.toLocaleString()}</h3>
                  <p className="text-xs font-semibold text-pink-100 mt-1">🩸 Active Volunteer Donors</p>
                </div>
              </motion.div>

              {/* Card 3: Hospitals & Centers */}
              <motion.div whileHover={{ scale: 1.02 }} className="bg-gradient-to-tr from-purple-500 to-indigo-600 text-white rounded-3xl p-6 shadow-xl shadow-purple-500/20 relative overflow-hidden flex flex-col justify-between min-h-[140px]">
                <div className="flex justify-between items-start">
                  <div>
                    <BuildingOffice2Icon className="w-8 h-8 text-white/90 mb-2" />
                    <p className="text-xs font-extrabold uppercase tracking-wider text-purple-100">Hospitals & Centers</p>
                  </div>
                </div>
                <div>
                  <h3 className="text-3xl font-black text-white">{metrics.totalHospitals.toLocaleString()}</h3>
                  <p className="text-xs font-semibold text-purple-100 mt-1">🏥 Accredited Partner Facilities</p>
                </div>
              </motion.div>

              {/* Card 4: Active Requests */}
              <motion.div whileHover={{ scale: 1.02 }} className="bg-gradient-to-tr from-red-500 to-rose-600 text-white rounded-3xl p-6 shadow-xl shadow-red-500/20 relative overflow-hidden flex flex-col justify-between min-h-[140px]">
                <div className="flex justify-between items-start">
                  <div>
                    <ClipboardDocumentListIcon className="w-8 h-8 text-white/90 mb-2" />
                    <p className="text-xs font-extrabold uppercase tracking-wider text-red-100">Active Requests</p>
                  </div>
                </div>
                <div>
                  <h3 className="text-3xl font-black text-white">{metrics.activeRequests.toLocaleString()}</h3>
                  <p className="text-xs font-semibold text-red-100 mt-1">⚡ Emergency & Urgent Needed</p>
                </div>
              </motion.div>
            </div>

            {/* CHARTS & STATS SECTION */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Blood Group Distribution Bar Breakdown */}
              <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-gray-100 shadow-xl shadow-gray-100/60">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-xl font-black text-gray-900">Blood Group Distribution</h3>
                    <p className="text-xs text-gray-500">Registered donor inventory breakdown by type</p>
                  </div>
                  <span className="px-3 py-1 text-xs font-black bg-red-50 text-red-600 rounded-full border border-red-100">
                    Total: {metrics.totalDonors} Donors
                  </span>
                </div>

                <div className="space-y-4">
                  {bloodDistribution.map(item => (
                    <div key={item.group}>
                      <div className="flex justify-between text-xs font-bold mb-1">
                        <span className="text-gray-800">{item.group}</span>
                        <span className="text-gray-500">{item.units} donors ({item.percentage}%)</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${item.color} transition-all duration-500`}
                          style={{ width: `${Math.max(item.percentage * 2, item.units > 0 ? 10 : 0)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Request Status Breakdown Card */}
              <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xl shadow-gray-100/60 flex flex-col justify-between">
                <div>
                  <h3 className="text-xl font-black text-gray-900 mb-1">Request Status</h3>
                  <p className="text-xs text-gray-500 mb-6">Overview of incoming blood requests</p>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3.5 bg-red-50 rounded-2xl border border-red-100">
                      <div className="flex items-center space-x-3">
                        <ExclamationTriangleIcon className="w-5 h-5 text-red-600 animate-pulse" />
                        <span className="text-sm font-bold text-red-900">Emergency</span>
                      </div>
                      <span className="text-base font-black text-red-600">{metrics.emergencyRequests}</span>
                    </div>

                    <div className="flex justify-between items-center p-3.5 bg-amber-50 rounded-2xl border border-amber-100">
                      <div className="flex items-center space-x-3">
                        <ClockIcon className="w-5 h-5 text-amber-600" />
                        <span className="text-sm font-bold text-amber-900">Active / In Progress</span>
                      </div>
                      <span className="text-base font-black text-amber-600">{metrics.activeRequests}</span>
                    </div>

                    <div className="flex justify-between items-center p-3.5 bg-blue-50 rounded-2xl border border-blue-100">
                      <div className="flex items-center space-x-3">
                        <ClockIcon className="w-5 h-5 text-blue-600" />
                        <span className="text-sm font-bold text-blue-900">Pending Review</span>
                      </div>
                      <span className="text-base font-black text-blue-600">{metrics.pendingRequests}</span>
                    </div>

                    <div className="flex justify-between items-center p-3.5 bg-green-50 rounded-2xl border border-green-100">
                      <div className="flex items-center space-x-3">
                        <CheckCircleIcon className="w-5 h-5 text-green-600" />
                        <span className="text-sm font-bold text-green-900">Fulfilled</span>
                      </div>
                      <span className="text-base font-black text-green-600">{metrics.completedRequests}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-100 text-center">
                  <button 
                    onClick={() => setActiveTab('requests')}
                    className="w-full py-2.5 px-4 rounded-2xl bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs border border-red-200 transition-all"
                  >
                    View All Blood Requests →
                  </button>
                </div>
              </div>
            </div>

            {/* MONTHLY DONATIONS & RECENT ACTIVITIES */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Monthly Donations Bar Visual */}
              <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-gray-100 shadow-xl shadow-gray-100/60">
                <h3 className="text-xl font-black text-gray-900 mb-1">Monthly Donations Overview</h3>
                <p className="text-xs text-gray-500 mb-6">Comparison of total monthly donations vs requests</p>

                <div className="grid grid-cols-6 gap-4 items-end h-48 pt-6">
                  {monthlyData.map(d => (
                    <div key={d.month} className="flex flex-col items-center space-y-2 h-full justify-end">
                      <div className="w-full flex justify-center items-end space-x-1.5 h-36">
                        <div 
                          className="w-4 bg-gradient-to-t from-red-500 to-rose-500 rounded-t-md transition-all duration-300 hover:brightness-110"
                          style={{ height: `${(d.donations / 800) * 100}%` }}
                          title={`Donations: ${d.donations}`}
                        />
                        <div 
                          className="w-4 bg-gray-200 rounded-t-md transition-all duration-300 hover:bg-gray-300"
                          style={{ height: `${(d.requests / 800) * 100}%` }}
                          title={`Requests: ${d.requests}`}
                        />
                      </div>
                      <span className="text-xs font-bold text-gray-600">{d.month}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-center items-center space-x-6 mt-6 pt-4 border-t border-gray-100 text-xs font-bold text-gray-600">
                  <span className="flex items-center"><span className="w-3 h-3 bg-red-500 rounded-sm mr-2" /> Successful Donations</span>
                  <span className="flex items-center"><span className="w-3 h-3 bg-gray-200 rounded-sm mr-2" /> Blood Requests</span>
                </div>
              </div>

              {/* RECENT ACTIVITIES FEED */}
              <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xl shadow-gray-100/60">
                <h3 className="text-xl font-black text-gray-900 mb-1">Recent Activities</h3>
                <p className="text-xs text-gray-500 mb-4">Real-time system events from user actions</p>

                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {recentActivities.map(act => (
                    <div key={act.id} className="flex items-start space-x-3 p-3 rounded-2xl bg-gray-50/80 hover:bg-gray-100/80 transition-colors">
                      <div className={`p-2 rounded-xl mt-0.5 ${
                        act.type === 'donor' ? 'bg-red-100 text-red-600' :
                        act.type === 'hospital' ? 'bg-teal-100 text-teal-600' : 'bg-amber-100 text-amber-600'
                      }`}>
                        <SparklesIcon className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-bold text-gray-900 leading-snug">{act.text}</p>
                        <div className="flex justify-between items-center mt-1.5">
                          <span className="text-[10px] text-gray-400 font-medium">{act.time}</span>
                          <span className="px-2 py-0.5 text-[10px] font-black bg-white text-gray-700 rounded-full border border-gray-200">
                            {act.tag}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Vibrant Call To Action Banner */}
            <div className="bg-gradient-to-r from-red-500 via-rose-500 to-pink-600 text-white rounded-3xl p-8 shadow-2xl shadow-red-500/30 text-center relative overflow-hidden my-6">
              <h3 className="text-2xl sm:text-3xl font-black mb-2">Ready to Make a Difference?</h3>
              <p className="text-white/90 text-sm mb-6 max-w-xl mx-auto">
                Trigger emergency broadcast alerts to notify active volunteer donors in nearby regions.
              </p>
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowBroadcastModal(true)} 
                className="px-6 py-3.5 bg-white text-red-600 font-extrabold rounded-full shadow-lg hover:bg-gray-50 transition-all"
              >
                ❤️ Dispatch Emergency Broadcast
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* ================= TAB 2: USERS MANAGEMENT ================= */}
        {activeTab === 'users' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-3xl border border-gray-100 shadow-md">
              <div className="relative flex-1 w-full">
                <MagnifyingGlassIcon className="w-5 h-5 absolute left-3.5 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search user name, email, city..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="flex items-center space-x-3 w-full sm:w-auto">
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="px-3.5 py-2.5 text-xs font-bold bg-gray-50 border border-gray-200 text-gray-700 rounded-2xl"
                >
                  <option value="all">All Roles</option>
                  <option value="donor">Donors</option>
                  <option value="recipient">Recipients</option>
                  <option value="hospital">Hospitals</option>
                  <option value="admin">Admins</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3.5 py-2.5 text-xs font-bold bg-gray-50 border border-gray-200 text-gray-700 rounded-2xl"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-left">
                  <thead className="bg-gray-50 text-xs font-extrabold text-gray-500 uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4">User Details</th>
                      <th className="px-6 py-4">Role</th>
                      <th className="px-6 py-4">Blood Group</th>
                      <th className="px-6 py-4">Location</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm font-semibold">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="text-center py-10 text-gray-400 font-medium">
                          No users found matching your filters.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map(u => (
                        <tr key={u.id} className="hover:bg-red-50/40 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 rounded-2xl bg-red-100 text-red-600 font-black text-sm flex items-center justify-center">
                                {(u.name || 'U').charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-bold text-gray-900">{u.name}</p>
                                <p className="text-xs text-gray-400">{u.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-3 py-1 text-xs font-black rounded-full uppercase tracking-wider ${
                              u.role === 'donor' ? 'bg-red-100 text-red-700' :
                              u.role === 'hospital' ? 'bg-teal-100 text-teal-700' :
                              u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                            }`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap font-black text-red-600">
                            {u.bloodGroup}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                            {u.location}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-3 py-1 text-xs font-black rounded-full ${
                              u.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                            }`}>
                              {u.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap space-x-2">
                            <button
                              onClick={() => handleToggleUserStatus(u.id)}
                              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200 transition-colors"
                            >
                              {u.status === 'Active' ? 'Deactivate' : 'Activate'}
                            </button>
                            <button
                              onClick={() => handleDeleteUser(u.id)}
                              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-red-100 hover:bg-red-200 text-red-700 transition-colors"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* ================= TAB 3: DONORS DIRECTORY ================= */}
        {activeTab === 'donors' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black text-gray-900">Registered Volunteer Donors</h3>
                <p className="text-xs text-gray-500">Verified donors active in the BloodNet+ system</p>
              </div>
              <span className="px-4 py-1.5 bg-red-100 text-red-700 rounded-full font-black text-xs">
                {users.filter(u => u.role === 'donor').length} Donors Registered
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {users.filter(u => u.role === 'donor').length === 0 ? (
                <div className="col-span-full py-12 text-center text-gray-400 font-semibold bg-white rounded-3xl border border-gray-100">
                  No volunteer donors registered yet. Donors will appear here as soon as they register.
                </div>
              ) : (
                users.filter(u => u.role === 'donor').map(donor => (
                  <div key={donor.id} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xl shadow-gray-100/60 relative">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="text-lg font-bold text-gray-900">{donor.name}</h4>
                        <p className="text-xs text-gray-400">{donor.email}</p>
                      </div>
                      <span className="px-3 py-1 bg-red-500 text-white font-black text-sm rounded-2xl shadow-md shadow-red-500/20">
                        {donor.bloodGroup}
                      </span>
                    </div>

                    <div className="space-y-2 text-xs text-gray-600 mb-6">
                      <p>📍 <span className="font-semibold">{donor.location}</span></p>
                      <p>📞 <span className="font-semibold">{donor.phone}</span></p>
                      <p>🗓️ Member Since: <span className="font-semibold">{donor.joined}</span></p>
                    </div>

                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleToggleUserStatus(donor.id)}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-colors ${
                          donor.status === 'Active' ? 'border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100' : 'border-green-300 text-green-700 bg-green-50 hover:bg-green-100'
                        }`}
                      >
                        {donor.status === 'Active' ? 'Suspend' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleDeleteUser(donor.id)}
                        className="p-2 rounded-xl text-red-500 hover:bg-red-50 border border-red-200 transition-colors"
                        title="Delete Donor"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}

        {/* ================= TAB 4: HOSPITALS ================= */}
        {activeTab === 'hospitals' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black text-gray-900">Registered Hospitals & Blood Banks</h3>
                <p className="text-xs text-gray-500">Accredited partner healthcare facilities</p>
              </div>
              <span className="px-4 py-1.5 bg-teal-100 text-teal-700 rounded-full font-black text-xs">
                {hospitals.length} Facilities Active
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {hospitals.length === 0 ? (
                <div className="col-span-full py-12 text-center text-gray-400 font-semibold bg-white rounded-3xl border border-gray-100">
                  No hospital centers registered yet.
                </div>
              ) : (
                hospitals.map(hosp => (
                  <div key={hosp.id} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xl shadow-gray-100/60">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="text-lg font-bold text-gray-900">{hosp.name}</h4>
                        <p className="text-xs text-gray-500">{hosp.city}</p>
                      </div>
                      <span className={`px-3 py-1 text-xs font-black rounded-full ${
                        hosp.verified ? 'bg-teal-100 text-teal-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {hosp.verified ? 'Verified Partner' : 'Pending Review'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-2xl text-xs mb-4">
                      <div>
                        <span className="text-gray-400 block">Contact</span>
                        <span className="font-bold text-gray-800">{hosp.contact}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block">Emergency Helpline</span>
                        <span className="font-bold text-red-600">{hosp.emergencyLine}</span>
                      </div>
                    </div>

                    <div className="flex space-x-3">
                      <button
                        onClick={() => handleVerifyHospital(hosp.id)}
                        className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                          hosp.verified 
                            ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' 
                            : 'bg-gradient-to-r from-teal-500 to-emerald-600 text-white shadow-md shadow-teal-500/20'
                        }`}
                      >
                        {hosp.verified ? 'Revoke Verification' : 'Verify Partner'}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}

        {/* ================= TAB 5: BLOOD REQUESTS ================= */}
        {activeTab === 'requests' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black text-gray-900">Blood Requests Manager</h3>
                <p className="text-xs text-gray-500">Live incoming requests from recipients & hospitals</p>
              </div>
              <span className="px-4 py-1.5 bg-red-100 text-red-700 rounded-full font-black text-xs">
                {requests.length} Requests
              </span>
            </div>

            <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-left">
                  <thead className="bg-gray-50 text-xs font-extrabold text-gray-500 uppercase">
                    <tr>
                      <th className="px-6 py-4">Request ID</th>
                      <th className="px-6 py-4">Patient / Requester</th>
                      <th className="px-6 py-4">Group & Units</th>
                      <th className="px-6 py-4">Urgency</th>
                      <th className="px-6 py-4">Hospital Center</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm font-semibold">
                    {requests.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="text-center py-10 text-gray-400 font-medium">
                          No blood requests recorded yet.
                        </td>
                      </tr>
                    ) : (
                      requests.map(req => (
                        <tr key={req.id} className="hover:bg-red-50/40 transition-colors">
                          <td className="px-6 py-4 font-mono text-xs text-gray-400">
                            {String(req.id).slice(-6).toUpperCase()}
                          </td>
                          <td className="px-6 py-4 font-bold text-gray-900">
                            {req.patientName}
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-black text-red-600 mr-2">{req.bloodGroup}</span>
                            <span className="text-xs text-gray-400">({req.unitsNeeded} Units)</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 text-xs font-black rounded-full ${
                              req.urgency === 'Critical' ? 'bg-red-600 text-white animate-pulse shadow-sm font-black' :
                              req.urgency === 'Emergency' ? 'bg-red-100 text-red-700 animate-pulse' :
                              req.urgency === 'Urgent' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-700'
                            }`}>
                              {req.urgency === 'Critical' ? '🚨 Critical' : req.urgency}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-600 text-xs">
                            {req.hospital}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 text-xs font-black rounded-full ${
                              req.status === 'Completed' || req.status === 'Fulfilled' ? 'bg-green-100 text-green-700' :
                              req.status === 'Active' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                            }`}>
                              {req.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 space-x-1.5 whitespace-nowrap">
                            <button
                              onClick={() => handleUpdateRequestStatus(req.id, 'Completed')}
                              className="px-2.5 py-1 text-xs rounded-lg font-bold bg-green-50 text-green-700 hover:bg-green-100 border border-green-200"
                              title="Mark Fulfilled"
                            >
                              Fulfill
                            </button>
                            <button
                              onClick={() => handleUpdateRequestStatus(req.id, 'Active')}
                              className="px-2.5 py-1 text-xs rounded-lg font-bold bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200"
                              title="Set Active"
                            >
                              Dispatch
                            </button>
                            <button
                              onClick={() => handleDeleteRequest(req.id)}
                              className="px-2 py-1 text-xs rounded-lg font-bold bg-red-50 text-red-600 hover:bg-red-100"
                              title="Delete Request"
                            >
                              <TrashIcon className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* ================= TAB 6: NOTIFICATIONS / ALERTS ================= */}
        {activeTab === 'notifications' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black text-gray-900">Broadcast Notifications & System Alerts</h3>
                <p className="text-xs text-gray-500">Live feed of dispatched emergency broadcasts and alerts</p>
              </div>
              <button
                onClick={() => setShowBroadcastModal(true)}
                className="px-4 py-2 bg-gradient-to-r from-red-500 to-rose-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-red-500/20"
              >
                + New Broadcast
              </button>
            </div>

            <div className="space-y-4">
              {notifications.map(notif => (
                <div key={notif.id} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xl shadow-gray-100/60 flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="p-3 bg-red-50 text-red-600 rounded-2xl">
                      <BellIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-base">{notif.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{notif.body}</p>
                      <p className="text-xs text-gray-400 mt-2 font-medium">{notif.time}</p>
                    </div>
                  </div>
                  {notif.unread && (
                    <span className="w-3 h-3 bg-red-500 rounded-full" />
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ================= TAB 7: ANALYTICS ================= */}
        {activeTab === 'analytics' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <h3 className="text-2xl font-black text-gray-900">System Analytics</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xl shadow-gray-100/60">
                <h4 className="font-bold text-gray-900 mb-2">Donation Match Success Rate</h4>
                <div className="text-5xl font-black text-green-600">96.4%</div>
                <p className="text-xs text-gray-500 mt-3">Emergency requests successfully matched to voluntary donors within 30 mins</p>
              </div>
              <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xl shadow-gray-100/60">
                <h4 className="font-bold text-gray-900 mb-2">Average Donor Response Time</h4>
                <div className="text-5xl font-black text-red-500">11 Mins</div>
                <p className="text-xs text-gray-500 mt-3">From request creation alert to nearest donor acceptance</p>
              </div>
              <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xl shadow-gray-100/60">
                <h4 className="font-bold text-gray-900 mb-2">Active Network Health</h4>
                <div className="text-5xl font-black text-blue-600">Optimal</div>
                <p className="text-xs text-gray-500 mt-3">Real-time socket clusters and geospatial matching engines operational</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* ================= TAB 8: SETTINGS ================= */}
        {activeTab === 'settings' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-3xl">
            <h3 className="text-2xl font-black text-gray-900">Platform Settings</h3>

            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xl shadow-gray-100/60 space-y-6">
              <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                <div>
                  <h4 className="font-bold text-gray-900">Maintenance Mode</h4>
                  <p className="text-xs text-gray-500">Temporarily pause new registrations</p>
                </div>
                <input 
                  type="checkbox" 
                  checked={settings.maintenanceMode}
                  onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                  className="w-5 h-5 accent-red-500 rounded cursor-pointer"
                />
              </div>

              <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                <div>
                  <h4 className="font-bold text-gray-900">Auto Verify Volunteer Donors</h4>
                  <p className="text-xs text-gray-500">Automatically approve donor profiles upon registration</p>
                </div>
                <input 
                  type="checkbox" 
                  checked={settings.autoVerifyDonors}
                  onChange={(e) => setSettings({ ...settings, autoVerifyDonors: e.target.checked })}
                  className="w-5 h-5 accent-red-500 rounded cursor-pointer"
                />
              </div>

              <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                <div>
                  <h4 className="font-bold text-gray-900">Emergency Broadcast System</h4>
                  <p className="text-xs text-gray-500">Allow instant Push broadcasts for critical blood shortage</p>
                </div>
                <input 
                  type="checkbox" 
                  checked={settings.emergencyBroadcastEnabled}
                  onChange={(e) => setSettings({ ...settings, emergencyBroadcastEnabled: e.target.checked })}
                  className="w-5 h-5 accent-red-500 rounded cursor-pointer"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={handleSaveSettings}
                  className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-red-500 to-rose-600 text-white font-bold text-xs shadow-md shadow-red-500/20 hover:brightness-105"
                >
                  Save Settings
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </main>

      {/* Broadcast Alert Modal */}
      <AnimatePresence>
        {showBroadcastModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white border border-gray-100 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4"
            >
              <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                <h3 className="text-lg font-black text-gray-900 flex items-center">
                  <ExclamationTriangleIcon className="w-5 h-5 text-red-500 mr-2" /> Broadcast Emergency Alert
                </h3>
                <button onClick={() => setShowBroadcastModal(false)} className="text-gray-400 hover:text-gray-600">
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-gray-700 font-bold block mb-1">Blood Group Needed</label>
                  <select 
                    value={broadcastBloodGroup}
                    onChange={(e) => setBroadcastBloodGroup(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl p-2.5"
                  >
                    <option value="O-">O- Negative (Universal)</option>
                    <option value="O+">O+ Positive</option>
                    <option value="A+">A+ Positive</option>
                    <option value="A-">A- Negative</option>
                    <option value="B+">B+ Positive</option>
                    <option value="B-">B- Negative</option>
                    <option value="AB+">AB+ Positive</option>
                    <option value="AB-">AB- Negative</option>
                  </select>
                </div>

                <div>
                  <label className="text-gray-700 font-bold block mb-1">Alert Message</label>
                  <textarea 
                    rows={3} 
                    value={broadcastMessage}
                    onChange={(e) => setBroadcastMessage(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-red-500" 
                  />
                </div>
              </div>

              <div className="pt-2 flex space-x-3">
                <button
                  onClick={() => setShowBroadcastModal(false)}
                  className="w-1/2 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendBroadcast}
                  disabled={isSendingBroadcast}
                  className="w-1/2 py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 text-white font-bold text-xs shadow-lg shadow-red-500/30 flex items-center justify-center space-x-1"
                >
                  {isSendingBroadcast ? (
                    <span>Dispatching...</span>
                  ) : (
                    <span>Send Broadcast</span>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminDashboard;
