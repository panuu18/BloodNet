import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import AdminNavPills from './AdminNavPills';
import { 
  UserGroupIcon,
  BuildingOffice2Icon,
  ClipboardDocumentListIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  SparklesIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon, ShieldCheckIcon as ShieldSolidIcon } from '@heroicons/react/24/solid';

const AdminDashboardPage = () => {
  const navigate = useNavigate();
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const metrics = {
    totalUsers: 1248,
    totalDonors: 742,
    totalHospitals: 38,
    totalBloodUnits: 4520,
    activeRequests: 45,
    completedRequests: 890,
    pendingRequests: 28,
    emergencyRequests: 12
  };

  const bloodDistribution = [
    { group: 'O+', units: 1250, percentage: 28, color: 'bg-red-500' },
    { group: 'A+', units: 980, percentage: 22, color: 'bg-rose-500' },
    { group: 'B+', units: 840, percentage: 18, color: 'bg-pink-500' },
    { group: 'AB+', units: 450, percentage: 10, color: 'bg-purple-500' },
    { group: 'O-', units: 380, percentage: 8, color: 'bg-amber-500' },
    { group: 'A-', units: 290, percentage: 6, color: 'bg-orange-500' },
    { group: 'B-', units: 210, percentage: 5, color: 'bg-red-600' },
    { group: 'AB-', units: 120, percentage: 3, color: 'bg-rose-700' }
  ];

  const monthlyData = [
    { month: 'Jan', donations: 320, requests: 280 },
    { month: 'Feb', donations: 410, requests: 350 },
    { month: 'Mar', donations: 480, requests: 420 },
    { month: 'Apr', donations: 520, requests: 460 },
    { month: 'May', donations: 610, requests: 540 },
    { month: 'Jun', donations: 742, requests: 680 }
  ];

  const recentActivities = [
    { id: 1, text: 'New donor Rahul Sharma registered', time: '2 mins ago', type: 'donor', tag: 'Registration' },
    { id: 2, text: 'Emergency A+ Blood Request accepted by City Hospital', time: '8 mins ago', type: 'request', tag: 'Accepted' },
    { id: 3, text: 'Apollo Hospital updated blood inventory (+50 units O+)', time: '15 mins ago', type: 'hospital', tag: 'Inventory' },
    { id: 4, text: 'Blood donation verified for Donor Ananya Roy', time: '24 mins ago', type: 'donor', tag: 'Verification' },
    { id: 5, text: 'New Hospital registration request from Max Healthcare', time: '40 mins ago', type: 'hospital', tag: 'Pending' }
  ];

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50/60 via-white to-teal-50/60 font-sans relative overflow-x-hidden text-gray-800 selection:bg-rose-500 selection:text-white">
      {/* Decorative Orbs */}
      <div className="absolute top-10 left-10 w-96 h-96 bg-red-200/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-5 w-[30rem] h-[30rem] bg-teal-200/30 rounded-full blur-3xl pointer-events-none" />

      {/* Toast Notification */}
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 relative z-10 space-y-8">
        <AdminNavPills activeTab="dashboard" />

        {/* TOP VIBRANT HERO CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div whileHover={{ scale: 1.02 }} className="bg-gradient-to-tr from-blue-500 to-indigo-600 text-white rounded-3xl p-6 shadow-xl shadow-blue-500/20 flex flex-col justify-between min-h-[140px]">
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

          <motion.div whileHover={{ scale: 1.02 }} className="bg-gradient-to-tr from-pink-500 via-rose-500 to-purple-600 text-white rounded-3xl p-6 shadow-xl shadow-pink-500/20 flex flex-col justify-between min-h-[140px]">
            <div className="flex justify-between items-start">
              <div>
                <HeartSolidIcon className="w-8 h-8 text-white/90 mb-2" />
                <p className="text-xs font-extrabold uppercase tracking-wider text-pink-100">Total Donors</p>
              </div>
            </div>
            <div>
              <h3 className="text-3xl font-black text-white">{metrics.totalDonors.toLocaleString()}</h3>
              <p className="text-xs font-semibold text-pink-100 mt-1">🩸 Volunteer Donors</p>
            </div>
          </motion.div>

          <motion.div whileHover={{ scale: 1.02 }} className="bg-gradient-to-tr from-purple-500 to-indigo-600 text-white rounded-3xl p-6 shadow-xl shadow-purple-500/20 flex flex-col justify-between min-h-[140px]">
            <div className="flex justify-between items-start">
              <div>
                <BuildingOffice2Icon className="w-8 h-8 text-white/90 mb-2" />
                <p className="text-xs font-extrabold uppercase tracking-wider text-purple-100">Verified Hospitals</p>
              </div>
            </div>
            <div>
              <h3 className="text-3xl font-black text-white">{metrics.totalHospitals.toLocaleString()}</h3>
              <p className="text-xs font-semibold text-purple-100 mt-1">🏥 Emergency Banks</p>
            </div>
          </motion.div>

          <motion.div whileHover={{ scale: 1.02 }} className="bg-gradient-to-tr from-red-500 to-rose-600 text-white rounded-3xl p-6 shadow-xl shadow-red-500/20 flex flex-col justify-between min-h-[140px]">
            <div className="flex justify-between items-start">
              <div>
                <ClipboardDocumentListIcon className="w-8 h-8 text-white/90 mb-2" />
                <p className="text-xs font-extrabold uppercase tracking-wider text-red-100">Blood Units Stock</p>
              </div>
            </div>
            <div>
              <h3 className="text-3xl font-black text-white">{metrics.totalBloodUnits.toLocaleString()}</h3>
              <p className="text-xs font-semibold text-red-100 mt-1">📦 Stock Ready</p>
            </div>
          </motion.div>
        </div>

        {/* CHARTS SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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
                onClick={() => navigate('/admin/requests')}
                className="w-full py-2.5 px-4 rounded-2xl bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs border border-red-200 transition-all"
              >
                View All Blood Requests →
              </button>
            </div>
          </div>
        </div>

        {/* MONTHLY DONATIONS & RECENT ACTIVITIES */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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
                    />
                    <div 
                      className="w-4 bg-gray-200 rounded-t-md transition-all duration-300 hover:bg-gray-300"
                      style={{ height: `${(d.requests / 800) * 100}%` }}
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

          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xl shadow-gray-100/60">
            <h3 className="text-xl font-black text-gray-900 mb-1">Recent Activities</h3>
            <p className="text-xs text-gray-500 mb-4">Real-time system events</p>

            <div className="space-y-3">
              {recentActivities.map(act => (
                <div key={act.id} className="flex items-start space-x-3 p-3 rounded-2xl bg-gray-50/80">
                  <div className="p-2 bg-red-100 text-red-600 rounded-xl mt-0.5">
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

        {/* Bottom Banner */}
        <div className="bg-gradient-to-r from-red-500 via-rose-500 to-pink-600 text-white rounded-3xl p-8 shadow-2xl shadow-red-500/30 text-center relative overflow-hidden my-6">
          <h3 className="text-2xl sm:text-3xl font-black mb-2">Ready to Make a Difference?</h3>
          <p className="text-white/90 text-sm mb-6 max-w-xl mx-auto">
            Trigger emergency broadcast alerts to notify active volunteer donors in nearby regions.
          </p>
          <button 
            onClick={() => setShowBroadcastModal(true)} 
            className="px-6 py-3.5 bg-white text-red-600 font-extrabold rounded-full shadow-lg hover:bg-gray-50 transition-all scale-105"
          >
            ❤️ Save a Life Today
          </button>
        </div>
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

export default AdminDashboardPage;
