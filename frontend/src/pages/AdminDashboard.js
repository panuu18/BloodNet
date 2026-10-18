import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
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
  XMarkIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon, ShieldCheckIcon as ShieldSolidIcon } from '@heroicons/react/24/solid';
import Button from '../components/ui/Button';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Top Metrics & Overview State
  const [metrics] = useState({
    totalUsers: 1248,
    totalDonors: 742,
    totalHospitals: 38,
    totalBloodUnits: 4520,
    activeRequests: 45,
    completedRequests: 890,
    pendingRequests: 28,
    emergencyRequests: 12
  });

  // Blood Group Distribution Data
  const [bloodDistribution] = useState([
    { group: 'O+', units: 1250, percentage: 28, color: 'bg-red-500' },
    { group: 'A+', units: 980, percentage: 22, color: 'bg-rose-500' },
    { group: 'B+', units: 840, percentage: 18, color: 'bg-pink-500' },
    { group: 'AB+', units: 450, percentage: 10, color: 'bg-purple-500' },
    { group: 'O-', units: 380, percentage: 8, color: 'bg-amber-500' },
    { group: 'A-', units: 290, percentage: 6, color: 'bg-orange-500' },
    { group: 'B-', units: 210, percentage: 5, color: 'bg-red-600' },
    { group: 'AB-', units: 120, percentage: 3, color: 'bg-rose-700' }
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

  // Recent Activity Feed
  const [recentActivities] = useState([
    { id: 1, text: 'New donor Rahul Sharma registered', time: '2 mins ago', type: 'donor', tag: 'Registration' },
    { id: 2, text: 'Emergency A+ Blood Request accepted by City Hospital', time: '8 mins ago', type: 'request', tag: 'Accepted' },
    { id: 3, text: 'Apollo Hospital updated blood inventory (+50 units O+)', time: '15 mins ago', type: 'hospital', tag: 'Inventory' },
    { id: 4, text: 'Blood donation verified for Donor Ananya Roy', time: '24 mins ago', type: 'donor', tag: 'Verification' },
    { id: 5, text: 'New Hospital registration request from Max Healthcare', time: '40 mins ago', type: 'hospital', tag: 'Pending' }
  ]);

  // Users List State
  const [users, setUsers] = useState([
    { id: 'USR-101', name: 'Dr. Ramesh Kumar', email: 'ramesh.k@cityhospital.com', role: 'hospital', status: 'Active', location: 'Mumbai', bloodGroup: 'N/A', phone: '+91 98765 43210', joined: '2026-01-15' },
    { id: 'USR-102', name: 'Priya Sharma', email: 'priya.s@gmail.com', role: 'donor', status: 'Active', location: 'Delhi', bloodGroup: 'O+', phone: '+91 98123 45678', joined: '2026-02-10' },
    { id: 'USR-103', name: 'Amitabh Verma', email: 'averma@yahoo.com', role: 'recipient', status: 'Pending', location: 'Bangalore', bloodGroup: 'AB+', phone: '+91 99887 76655', joined: '2026-03-01' },
    { id: 'USR-104', name: 'Sneha Patel', email: 'sneha.p@outlook.com', role: 'donor', status: 'Active', location: 'Ahmedabad', bloodGroup: 'A-', phone: '+91 97654 32109', joined: '2026-03-12' },
    { id: 'USR-105', name: 'Metro Life Hospital', email: 'contact@metrolife.org', role: 'hospital', status: 'Active', location: 'Hyderabad', bloodGroup: 'N/A', phone: '+91 91234 56789', joined: '2026-03-20' },
    { id: 'USR-106', name: 'Vikram Singh', email: 'vikram.s@gmail.com', role: 'donor', status: 'Inactive', location: 'Pune', bloodGroup: 'B+', phone: '+91 94567 89012', joined: '2026-04-05' }
  ]);

  // Hospitals Directory State
  const [hospitals, setHospitals] = useState([
    { id: 'HSP-01', name: 'City Central Hospital', city: 'Mumbai', unitsAvailable: 850, verified: true, contact: '+91 22 2456 7890', emergencyLine: '108' },
    { id: 'HSP-02', name: 'Apollo Red Cross Care', city: 'Delhi', unitsAvailable: 1120, verified: true, contact: '+91 11 4123 9900', emergencyLine: '102' },
    { id: 'HSP-03', name: 'Max Super Speciality', city: 'Bangalore', unitsAvailable: 640, verified: true, contact: '+91 80 3344 5566', emergencyLine: '108' },
    { id: 'HSP-04', name: 'Sunrise Trauma Center', city: 'Hyderabad', unitsAvailable: 410, verified: false, contact: '+91 40 5566 7788', emergencyLine: '108' }
  ]);

  // Blood Requests List State
  const [requests, setRequests] = useState([
    { id: 'REQ-901', patientName: 'Suresh Raina', bloodGroup: 'O+', unitsNeeded: 3, urgency: 'Emergency', hospital: 'Apollo Red Cross Care', status: 'Active', date: '2026-07-31' },
    { id: 'REQ-902', patientName: 'Kavita Roy', bloodGroup: 'A-', unitsNeeded: 2, urgency: 'Urgent', hospital: 'City Central Hospital', status: 'Completed', date: '2026-07-30' },
    { id: 'REQ-903', patientName: 'Rajesh Mehta', bloodGroup: 'AB+', unitsNeeded: 1, urgency: 'Standard', hospital: 'Max Super Speciality', status: 'Pending', date: '2026-07-31' },
    { id: 'REQ-904', patientName: 'Deepak Chopra', bloodGroup: 'B+', unitsNeeded: 4, urgency: 'Emergency', hospital: 'Sunrise Trauma Center', status: 'Active', date: '2026-07-31' }
  ]);

  // Notifications State
  const [notifications] = useState([
    { id: 1, title: 'Critical Shortage Alert', body: 'O- Blood supply drops below 10% in Delhi region', time: '1 hour ago', unread: true },
    { id: 2, title: 'System Security Audit', body: 'Automated database backup completed successfully', time: '4 hours ago', unread: false },
    { id: 3, title: 'New Hospital Verification', body: 'Sunrise Trauma Center submitted accreditation documents', time: 'Yesterday', unread: true }
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
    setTimeout(() => setToastMessage(''), 3000);
  };

  // Action Handlers
  const handleToggleUserStatus = (userId) => {
    setUsers(users.map(u => {
      if (u.id === userId) {
        const newStatus = u.status === 'Active' ? 'Inactive' : 'Active';
        triggerToast(`User ${u.name} status updated to ${newStatus}`);
        return { ...u, status: newStatus };
      }
      return u;
    }));
  };

  const handleDeleteUser = (userId) => {
    if (window.confirm(`Are you sure you want to remove user ${userId}?`)) {
      setUsers(users.filter(u => u.id !== userId));
      triggerToast('User account removed successfully.');
    }
  };

  const handleUpdateRequestStatus = (reqId, newStatus) => {
    setRequests(requests.map(r => r.id === reqId ? { ...r, status: newStatus } : r));
    triggerToast(`Request ${reqId} updated to ${newStatus}`);
  };

  const handleVerifyHospital = (hospId) => {
    setHospitals(hospitals.map(h => {
      if (h.id === hospId) {
        const next = !h.verified;
        triggerToast(`${h.name} verification ${next ? 'approved' : 'revoked'}`);
        return { ...h, verified: next };
      }
      return h;
    }));
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
    const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          u.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          u.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || u.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50/60 via-white to-teal-50/60 font-sans relative overflow-x-hidden text-gray-800 selection:bg-rose-500 selection:text-white">
      {/* Universal Top Navigation Header */}
      <Navbar />

      {/* Decorative Pastel Background Spheres (Matching screenshot) */}
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
        {/* Welcome Header Banner (Exact match to screenshot style) */}
        <div className="text-center max-w-3xl mx-auto my-4">
          <motion.h1 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-3xl sm:text-5xl font-black text-rose-600 tracking-tight flex items-center justify-center gap-2"
          >
            Welcome Back, Bhavana! <span className="text-3xl animate-bounce">💥</span>
          </motion.h1>
          <p className="text-gray-600 text-sm sm:text-base font-medium mt-2">
            Managing BloodNet+ platform, live donor directory, and emergency dispatches
          </p>
        </div>

        {/* Centered Floating Tab Navigation Pills (Exact match to screenshot style) */}
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
            {/* TOP 3-4 VIBRANT SOLID HERO METRIC CARDS (Exact match to screenshot cards) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Card 1: Solid Blue Gradient */}
              <motion.div whileHover={{ scale: 1.02 }} className="bg-gradient-to-tr from-blue-500 to-indigo-600 text-white rounded-3xl p-6 shadow-xl shadow-blue-500/20 relative overflow-hidden flex flex-col justify-between min-h-[140px]">
                <div className="flex justify-between items-start">
                  <div>
                    <ShieldSolidIcon className="w-8 h-8 text-white/90 mb-2" />
                    <p className="text-xs font-extrabold uppercase tracking-wider text-blue-100">Total Users</p>
                  </div>
                </div>
                <div>
                  <h3 className="text-3xl font-black text-white">{metrics.totalUsers.toLocaleString()}</h3>
                  <p className="text-xs font-semibold text-blue-100 mt-1">👤 Donors & Hospitals</p>
                </div>
              </motion.div>

              {/* Card 2: Solid Magenta/Pink Gradient */}
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

              {/* Card 3: Solid Purple/Violet Gradient */}
              <motion.div whileHover={{ scale: 1.02 }} className="bg-gradient-to-tr from-purple-500 to-indigo-600 text-white rounded-3xl p-6 shadow-xl shadow-purple-500/20 relative overflow-hidden flex flex-col justify-between min-h-[140px]">
                <div className="flex justify-between items-start">
                  <div>
                    <BuildingOffice2Icon className="w-8 h-8 text-white/90 mb-2" />
                    <p className="text-xs font-extrabold uppercase tracking-wider text-purple-100">Verified Hospitals</p>
                  </div>
                </div>
                <div>
                  <h3 className="text-3xl font-black text-white">{metrics.totalHospitals.toLocaleString()}</h3>
                  <p className="text-xs font-semibold text-purple-100 mt-1">🏥 Emergency Blood Banks</p>
                </div>
              </motion.div>

              {/* Card 4: Solid Crimson Red Gradient */}
              <motion.div whileHover={{ scale: 1.02 }} className="bg-gradient-to-tr from-red-500 to-rose-600 text-white rounded-3xl p-6 shadow-xl shadow-red-500/20 relative overflow-hidden flex flex-col justify-between min-h-[140px]">
                <div className="flex justify-between items-start">
                  <div>
                    <ClipboardDocumentListIcon className="w-8 h-8 text-white/90 mb-2" />
                    <p className="text-xs font-extrabold uppercase tracking-wider text-red-100">Blood Units Stock</p>
                  </div>
                </div>
                <div>
                  <h3 className="text-3xl font-black text-white">{metrics.totalBloodUnits.toLocaleString()}</h3>
                  <p className="text-xs font-semibold text-red-100 mt-1">📦 Stock Ready For Dispatch</p>
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
                    <p className="text-xs text-gray-500">Available inventory units across blood types</p>
                  </div>
                  <span className="px-3 py-1 text-xs font-black bg-red-50 text-red-600 rounded-full border border-red-100">
                    Total: {metrics.totalBloodUnits} Units
                  </span>
                </div>

                <div className="space-y-4">
                  {bloodDistribution.map(item => (
                    <div key={item.group}>
                      <div className="flex justify-between text-xs font-bold mb-1">
                        <span className="text-gray-800">{item.group}</span>
                        <span className="text-gray-500">{item.units} units ({item.percentage}%)</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${item.color} transition-all duration-500`}
                          style={{ width: `${item.percentage * 3}%` }}
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
                <h3 className="text-xl font-black text-gray-900 mb-1">Monthly Donations</h3>
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
                <p className="text-xs text-gray-500 mb-4">Real-time system events</p>

                <div className="space-y-3">
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

            {/* Vibrant Call To Action Banner (Matching bottom screenshot banner) */}
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
                ❤️ Save a Life Today
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
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3.5 py-2.5 text-xs font-bold bg-gray-50 border border-gray-200 text-gray-700 rounded-2xl"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="pending">Pending</option>
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
                      <th className="px-6 py-4">City</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm font-semibold">
                    {filteredUsers.map(user => (
                      <tr key={user.id} className="hover:bg-red-50/40 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-2xl bg-red-100 text-red-600 font-black text-sm flex items-center justify-center">
                              {user.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-bold text-gray-900">{user.name}</p>
                              <p className="text-xs text-gray-400">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 text-xs font-black rounded-full uppercase tracking-wider ${
                            user.role === 'donor' ? 'bg-red-100 text-red-700' :
                            user.role === 'hospital' ? 'bg-teal-100 text-teal-700' : 'bg-blue-100 text-blue-700'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap font-black text-red-600">
                          {user.bloodGroup}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                          {user.location}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 text-xs font-black rounded-full ${
                            user.status === 'Active' ? 'bg-green-100 text-green-700' :
                            user.status === 'Pending' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-700'
                          }`}>
                            {user.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap space-x-2">
                          <button
                            onClick={() => handleToggleUserStatus(user.id)}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200 transition-colors"
                          >
                            {user.status === 'Active' ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-red-100 hover:bg-red-200 text-red-700 transition-colors"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* ================= TAB 3: DONORS MANAGEMENT ================= */}
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
              {users.filter(u => u.role === 'donor').map(donor => (
                <div key={donor.id} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xl shadow-gray-100/60 relative">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-200 text-red-600 font-black text-xl flex items-center justify-center">
                        {donor.bloodGroup}
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 text-base">{donor.name}</h4>
                        <p className="text-xs text-gray-500">{donor.location}</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-0.5 text-[10px] font-black bg-green-100 text-green-700 rounded-full">
                      Verified
                    </span>
                  </div>

                  <div className="space-y-2 text-xs text-gray-600 mb-6 pt-3 border-t border-gray-100">
                    <p><span className="text-gray-400 font-bold">Email:</span> {donor.email}</p>
                    <p><span className="text-gray-400 font-bold">Phone:</span> {donor.phone}</p>
                    <p><span className="text-gray-400 font-bold">Joined:</span> {donor.joined}</p>
                  </div>

                  <button 
                    onClick={() => triggerToast(`Blood Request Broadcast sent to ${donor.name}`)}
                    className="w-full py-2.5 rounded-2xl bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white font-bold text-xs shadow-md shadow-red-500/20 transition-all"
                  >
                    Send Request
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ================= TAB 4: HOSPITALS MANAGEMENT ================= */}
        {activeTab === 'hospitals' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <h3 className="text-2xl font-black text-gray-900">Registered Hospitals & Blood Banks</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {hospitals.map(hosp => (
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

                  <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-2xl mb-4 text-xs font-semibold border border-gray-100">
                    <div>
                      <p className="text-gray-400">Stock Units</p>
                      <p className="text-xl font-black text-gray-900 mt-1">{hosp.unitsAvailable} Units</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Emergency Line</p>
                      <p className="text-xl font-black text-red-600 mt-1">{hosp.emergencyLine}</p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <span className="text-xs text-gray-500">Contact: {hosp.contact}</span>
                    <button
                      onClick={() => handleVerifyHospital(hosp.id)}
                      className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
                        hosp.verified 
                          ? 'bg-gray-100 hover:bg-gray-200 text-gray-700' 
                          : 'bg-gradient-to-r from-teal-500 to-emerald-600 text-white shadow-md'
                      }`}
                    >
                      {hosp.verified ? 'Revoke Verification' : 'Approve Verification'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ================= TAB 5: REQUESTS MANAGEMENT ================= */}
        {activeTab === 'requests' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <h3 className="text-2xl font-black text-gray-900">Blood Requests Manager</h3>

            <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-left">
                  <thead className="bg-gray-50 text-xs font-extrabold text-gray-500 uppercase">
                    <tr>
                      <th className="px-6 py-4">Request ID</th>
                      <th className="px-6 py-4">Patient</th>
                      <th className="px-6 py-4">Group & Units</th>
                      <th className="px-6 py-4">Urgency</th>
                      <th className="px-6 py-4">Hospital</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm font-semibold">
                    {requests.map(req => (
                      <tr key={req.id} className="hover:bg-red-50/30">
                        <td className="px-6 py-4 font-bold text-gray-900">{req.id}</td>
                        <td className="px-6 py-4 text-gray-800">{req.patientName}</td>
                        <td className="px-6 py-4">
                          <span className="font-black text-red-600 mr-2">{req.bloodGroup}</span>
                          <span className="text-xs text-gray-500">({req.unitsNeeded} Units)</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 text-xs font-black rounded-full ${
                            req.urgency === 'Emergency' ? 'bg-red-100 text-red-700 animate-pulse' :
                            req.urgency === 'Urgent' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                          }`}>
                            {req.urgency}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-600">{req.hospital}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 text-xs font-black rounded-full ${
                            req.status === 'Completed' ? 'bg-green-100 text-green-700' :
                            req.status === 'Active' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                          }`}>
                            {req.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 space-x-2">
                          {req.status !== 'Completed' && (
                            <button
                              onClick={() => handleUpdateRequestStatus(req.id, 'Completed')}
                              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-green-100 hover:bg-green-200 text-green-700 transition-colors"
                            >
                              Fulfill
                            </button>
                          )}
                          {req.status === 'Active' && (
                            <button
                              onClick={() => handleUpdateRequestStatus(req.id, 'Cancelled')}
                              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-red-100 hover:bg-red-200 text-red-700 transition-colors"
                            >
                              Cancel
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* ================= TAB 6: NOTIFICATIONS ================= */}
        {activeTab === 'notifications' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <h3 className="text-2xl font-black text-gray-900">Broadcast Notifications Log</h3>
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
                    <span className="px-3 py-1 text-xs font-black bg-red-500 text-white rounded-full shadow-md">New Alert</span>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xl shadow-gray-100/60">
                <h4 className="font-bold text-gray-900 mb-4">Donation Match Success Rate</h4>
                <div className="text-5xl font-black text-green-600">94.8%</div>
                <p className="text-xs text-gray-500 mt-3">Emergency requests matched to nearby donors within 30 mins</p>
              </div>
              <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xl shadow-gray-100/60">
                <h4 className="font-bold text-gray-900 mb-4">Average Donor Response Time</h4>
                <div className="text-5xl font-black text-red-500">12 Mins</div>
                <p className="text-xs text-gray-500 mt-3">From broadcast alert to donor confirmation</p>
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

              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-gray-900">Emergency Broadcast System</h4>
                  <p className="text-xs text-gray-500">Allow instant SMS/Push broadcasts for critical blood shortage</p>
                </div>
                <input 
                  type="checkbox" 
                  checked={settings.emergencyBroadcastEnabled}
                  onChange={(e) => setSettings({ ...settings, emergencyBroadcastEnabled: e.target.checked })}
                  className="w-5 h-5 accent-red-500 rounded cursor-pointer"
                />
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
                  <select className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl p-2.5">
                    <option>O- Negative (Universal)</option>
                    <option>O+ Positive</option>
                    <option>A+ Positive</option>
                    <option>B+ Positive</option>
                    <option>AB+ Positive</option>
                  </select>
                </div>

                <div>
                  <label className="text-gray-700 font-bold block mb-1">Target Region / City</label>
                  <input type="text" defaultValue="Delhi NCR" className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl p-2.5" />
                </div>

                <div>
                  <label className="text-gray-700 font-bold block mb-1">Message</label>
                  <textarea rows={3} defaultValue="CRITICAL BLOOD SHORTAGE: O- Negative blood urgently needed at Apollo Hospital." className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl p-2.5" />
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
                  onClick={() => {
                    setShowBroadcastModal(false);
                    triggerToast('Emergency Broadcast Alert dispatched to donors!');
                  }}
                  className="w-1/2 py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 text-white font-bold text-xs shadow-lg shadow-red-500/30"
                >
                  Send Broadcast
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
