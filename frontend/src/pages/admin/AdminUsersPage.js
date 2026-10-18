import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AdminNavPills from './AdminNavPills';
import { MagnifyingGlassIcon, SparklesIcon, TrashIcon } from '@heroicons/react/24/outline';

const AdminUsersPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [toastMessage, setToastMessage] = useState('');

  const [users, setUsers] = useState([
    { id: 'USR-101', name: 'Dr. Ramesh Kumar', email: 'ramesh.k@cityhospital.com', role: 'hospital', status: 'Active', location: 'Mumbai', bloodGroup: 'N/A', phone: '+91 98765 43210', joined: '2026-01-15' },
    { id: 'USR-102', name: 'Priya Sharma', email: 'priya.s@gmail.com', role: 'donor', status: 'Active', location: 'Delhi', bloodGroup: 'O+', phone: '+91 98123 45678', joined: '2026-02-10' },
    { id: 'USR-103', name: 'Amitabh Verma', email: 'averma@yahoo.com', role: 'recipient', status: 'Pending', location: 'Bangalore', bloodGroup: 'AB+', phone: '+91 99887 76655', joined: '2026-03-01' },
    { id: 'USR-104', name: 'Sneha Patel', email: 'sneha.p@outlook.com', role: 'donor', status: 'Active', location: 'Ahmedabad', bloodGroup: 'A-', phone: '+91 97654 32109', joined: '2026-03-12' },
    { id: 'USR-105', name: 'Metro Life Hospital', email: 'contact@metrolife.org', role: 'hospital', status: 'Active', location: 'Hyderabad', bloodGroup: 'N/A', phone: '+91 91234 56789', joined: '2026-03-20' },
    { id: 'USR-106', name: 'Vikram Singh', email: 'vikram.s@gmail.com', role: 'donor', status: 'Inactive', location: 'Pune', bloodGroup: 'B+', phone: '+91 94567 89012', joined: '2026-04-05' }
  ]);

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleToggleUserStatus = (userId) => {
    setUsers(users.map(u => {
      if (u.id === userId) {
        const nextStatus = u.status === 'Active' ? 'Inactive' : 'Active';
        triggerToast(`User ${u.name} status changed to ${nextStatus}`);
        return { ...u, status: nextStatus };
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

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          u.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          u.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || u.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesRole && matchesStatus;
  });

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
        <AdminNavPills activeTab="users" />

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
      </main>
    </div>
  );
};

export default AdminUsersPage;
