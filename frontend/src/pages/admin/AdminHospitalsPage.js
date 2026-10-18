import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AdminNavPills from './AdminNavPills';
import { SparklesIcon } from '@heroicons/react/24/outline';

const AdminHospitalsPage = () => {
  const [toastMessage, setToastMessage] = useState('');

  const [hospitals, setHospitals] = useState([
    { id: 'HSP-01', name: 'City Central Hospital', city: 'Mumbai', unitsAvailable: 850, verified: true, contact: '+91 22 2456 7890', emergencyLine: '108' },
    { id: 'HSP-02', name: 'Apollo Red Cross Care', city: 'Delhi', unitsAvailable: 1120, verified: true, contact: '+91 11 4123 9900', emergencyLine: '102' },
    { id: 'HSP-03', name: 'Max Super Speciality', city: 'Bangalore', unitsAvailable: 640, verified: true, contact: '+91 80 3344 5566', emergencyLine: '108' },
    { id: 'HSP-04', name: 'Sunrise Trauma Center', city: 'Hyderabad', unitsAvailable: 410, verified: false, contact: '+91 40 5566 7788', emergencyLine: '108' }
  ]);

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
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
        <AdminNavPills activeTab="hospitals" />

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
      </main>
    </div>
  );
};

export default AdminHospitalsPage;
