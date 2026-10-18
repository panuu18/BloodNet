import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AdminNavPills from './AdminNavPills';
import { SparklesIcon } from '@heroicons/react/24/outline';

const AdminDonorsPage = () => {
  const [toastMessage, setToastMessage] = useState('');

  const [donors] = useState([
    { id: 'USR-102', name: 'Priya Sharma', email: 'priya.s@gmail.com', role: 'donor', status: 'Active', location: 'Delhi', bloodGroup: 'O+', phone: '+91 98123 45678', joined: '2026-02-10' },
    { id: 'USR-104', name: 'Sneha Patel', email: 'sneha.p@outlook.com', role: 'donor', status: 'Active', location: 'Ahmedabad', bloodGroup: 'A-', phone: '+91 97654 32109', joined: '2026-03-12' },
    { id: 'USR-106', name: 'Vikram Singh', email: 'vikram.s@gmail.com', role: 'donor', status: 'Inactive', location: 'Pune', bloodGroup: 'B+', phone: '+91 94567 89012', joined: '2026-04-05' },
    { id: 'USR-107', name: 'Rahul Sharma', email: 'rahul.s@gmail.com', role: 'donor', status: 'Active', location: 'Mumbai', bloodGroup: 'O-', phone: '+91 98111 22233', joined: '2026-04-10' },
    { id: 'USR-108', name: 'Ananya Roy', email: 'ananya.r@yahoo.com', role: 'donor', status: 'Active', location: 'Kolkata', bloodGroup: 'AB+', phone: '+91 97222 33344', joined: '2026-05-01' }
  ]);

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50/60 via-white to-teal-50/60 font-sans relative overflow-x-hidden text-gray-800">
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 relative z-10 space-y-6">
        <AdminNavPills activeTab="donors" />

        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-2xl font-black text-gray-900">Registered Volunteer Donors</h3>
            <p className="text-xs text-gray-500">Verified donors active in the BloodNet+ system</p>
          </div>
          <span className="px-4 py-1.5 bg-red-100 text-red-700 rounded-full font-black text-xs">
            {donors.length} Active Donors
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {donors.map(donor => (
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
      </main>
    </div>
  );
};

export default AdminDonorsPage;
