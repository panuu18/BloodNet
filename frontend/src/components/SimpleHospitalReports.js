import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { hospitalAPI } from '../services/api';
import * as XLSX from 'xlsx';
import {
  DocumentArrowDownIcon,
  ShareIcon,
  CalendarIcon,
  HeartIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  BuildingOfficeIcon,
  XMarkIcon,
  FunnelIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

const SimpleHospitalReports = () => {
  const { user } = useAuth();
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [timePeriod, setTimePeriod] = useState('week');
  const [showShareModal, setShowShareModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    fetchReportData();
  }, [timePeriod]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await hospitalAPI.getInventoryReport({ dateRange: timePeriod });
      setReportData(response.data);
    } catch (err) {
      console.error('Failed to fetch report data:', err);
      setError('Unable to load report data from the database. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = () => {
    try {
      if (!reportData) return;

      const wb = XLSX.utils.book_new();

      // Summary sheet
      const summaryData = [
        { 'Metric': 'Hospital Name', 'Value': user?.hospitalName || reportData.hospitalName || 'Hospital' },
        { 'Metric': 'Report Date', 'Value': new Date().toLocaleDateString() },
        { 'Metric': 'Time Period', 'Value': getTimePeriodLabel(timePeriod) },
        { 'Metric': 'Total Available Blood Units', 'Value': `${reportData.totalUnits || 0} units` },
        { 'Metric': 'Blood Requests Received', 'Value': `${reportData.requestSummary?.totalReceived || 0}` },
        { 'Metric': 'Blood Requests Accepted', 'Value': `${reportData.requestSummary?.accepted || 0}` },
        { 'Metric': 'Total Units Supplied to Patients', 'Value': `${reportData.requestSummary?.unitsSupplied || 0} units` },
        { 'Metric': 'Low Stock Blood Groups', 'Value': `${reportData.lowStockAlerts?.length || 0}` }
      ];
      const wsSummary = XLSX.utils.json_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

      // Blood Inventory sheet
      const bloodData = (reportData.inventory || []).map(item => ({
        'Blood Group': item.bloodGroup,
        'Available Units': item.unitsAvailable,
        'Minimum Threshold': item.minThreshold,
        'Maximum Capacity': item.maxCapacity,
        'Status': item.status || (item.unitsAvailable === 0 ? 'Out of Stock' : item.unitsAvailable <= item.minThreshold ? 'Low Stock' : 'Good Stock')
      }));
      const wsBlood = XLSX.utils.json_to_sheet(bloodData);
      XLSX.utils.book_append_sheet(wb, wsBlood, 'Inventory Stock');

      // Activity Log sheet
      const activityData = (reportData.activityLog || []).map(act => ({
        'Date': new Date(act.date).toLocaleDateString() + ' ' + new Date(act.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        'Blood Group': act.bloodGroup,
        'Activity Type': act.activityType,
        'Units': act.units,
        'Notes': act.notes || ''
      }));
      const wsActivity = XLSX.utils.json_to_sheet(activityData.length > 0 ? activityData : [{ 'Status': 'No activity recorded in this period' }]);
      XLSX.utils.book_append_sheet(wb, wsActivity, 'Activity Log');

      XLSX.writeFile(wb, `hospital-blood-report-${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (err) {
      console.error('Download report error:', err);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const getTimePeriodLabel = (period) => {
    const labels = {
      week: 'Last 7 days',
      month: 'Last 30 days',
      quarter: 'Last 3 months',
      year: 'Last 12 months'
    };
    return labels[period] || 'Last 7 days';
  };

  const getBloodTypeInfo = (bloodGroup) => {
    const info = {
      'A+': 'Can give to A+, AB+',
      'A-': 'Can give to A+, A-, AB+, AB-',
      'B+': 'Can give to B+, AB+',
      'B-': 'Can give to B+, B-, AB+, AB-',
      'AB+': 'Can give to AB+ only',
      'AB-': 'Can give to AB+, AB-',
      'O+': 'Can give to all positive types',
      'O-': 'Can give to EVERYONE (Universal Donor)'
    };
    return info[bloodGroup] || 'Special blood type';
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-500 border-t-transparent mb-4"></div>
        <p className="text-gray-600 font-medium">Loading verified database report...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 rounded-xl p-8 border border-red-200 text-center space-y-4">
        <ExclamationTriangleIcon className="h-12 w-12 text-red-600 mx-auto" />
        <h3 className="text-lg font-bold text-red-900">Failed to Load Report</h3>
        <p className="text-red-700 text-sm">{error}</p>
        <button
          onClick={fetchReportData}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
        >
          <ArrowPathIcon className="h-4 w-4" />
          <span>Retry</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm p-6 border border-gray-200"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Hospital Blood & Inventory Report</h1>
            <p className="text-gray-600 mt-1">Live data generated from hospital inventory and patient requests</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
            >
              <FunnelIcon className="h-4 w-4" />
              <span>{getTimePeriodLabel(timePeriod)}</span>
            </button>
            <button
              onClick={downloadReport}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium shadow-sm"
            >
              <DocumentArrowDownIcon className="h-4 w-4" />
              <span>Download Excel</span>
            </button>
            <button
              onClick={() => setShowShareModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm"
            >
              <ShareIcon className="h-4 w-4" />
              <span>Share</span>
            </button>
          </div>
        </div>

        {/* Hospital Info Banner */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <BuildingOfficeIcon className="h-6 w-6 text-blue-600" />
              <div>
                <p className="font-bold text-blue-950 text-base">{user?.hospitalName || reportData?.hospitalName || 'Medical Center'}</p>
                <p className="text-xs text-blue-700">Reporting Period: {getTimePeriodLabel(timePeriod)} • Generated: {new Date().toLocaleTimeString()}</p>
              </div>
            </div>
            <span className="hidden sm:inline-block px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
              Live Database
            </span>
          </div>
        </div>
      </motion.div>

      {/* Time Period Filter Panel */}
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="bg-white rounded-xl shadow-sm p-6 border border-gray-200"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Select Reporting Time Window</h3>
            <button onClick={() => setShowFilters(false)} className="text-gray-400 hover:text-gray-600">
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { value: 'week', label: 'Last 7 days' },
              { value: 'month', label: 'Last 30 days' },
              { value: 'quarter', label: 'Last 3 months' },
              { value: 'year', label: 'Last 12 months' }
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  setTimePeriod(option.value);
                  setShowFilters(false);
                }}
                className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  timePeriod === option.value
                    ? 'bg-red-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Summary Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-sm p-6 border border-gray-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-500">Total Blood Available</p>
              <p className="text-3xl font-black text-red-600 mt-2">{reportData?.totalUnits || 0}</p>
              <p className="text-xs text-gray-400 mt-1">units across 8 groups</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-600">
              <HeartIcon className="h-6 w-6" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-sm p-6 border border-gray-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-500">Incoming Requests</p>
              <p className="text-3xl font-black text-blue-600 mt-2">{reportData?.requestSummary?.totalReceived || 0}</p>
              <p className="text-xs text-gray-400 mt-1">in selected period</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
              <CalendarIcon className="h-6 w-6" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl shadow-sm p-6 border border-gray-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-500">Units Supplied</p>
              <p className="text-3xl font-black text-green-600 mt-2">{reportData?.requestSummary?.unitsSupplied || 0}</p>
              <p className="text-xs text-gray-400 mt-1">{reportData?.requestSummary?.accepted || 0} requests fulfilled</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600">
              <CheckCircleIcon className="h-6 w-6" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl shadow-sm p-6 border border-gray-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-500">Low/Critical Groups</p>
              <p className="text-3xl font-black text-amber-600 mt-2">{reportData?.lowStockAlerts?.length || 0}</p>
              <p className="text-xs text-gray-400 mt-1">blood types need attention</p>
            </div>
            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center text-amber-600">
              <ExclamationTriangleIcon className="h-6 w-6" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Blood Group Inventory Breakdown (8 Groups) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white rounded-xl shadow-sm p-6 border border-gray-200"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Current Stock by Blood Group</h2>
          <span className="text-xs text-gray-500">Real-time availability</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {(reportData?.inventory || []).map((item) => {
            const isZero = item.unitsAvailable === 0;
            const isLow = item.unitsAvailable <= item.minThreshold && !isZero;
            return (
              <div
                key={item.bloodGroup}
                className={`rounded-xl p-3 text-center border transition-all ${
                  isZero ? 'bg-red-50 border-red-200' :
                  isLow ? 'bg-amber-50 border-amber-200' :
                  'bg-gray-50 border-gray-200 hover:bg-gray-100'
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black mx-auto mb-2 text-sm ${
                  isZero ? 'bg-red-600 text-white' :
                  isLow ? 'bg-amber-500 text-white' :
                  'bg-teal-600 text-white'
                }`}>
                  {item.bloodGroup}
                </div>
                <p className="text-xl font-black text-gray-900">{item.unitsAvailable}</p>
                <p className="text-xs text-gray-500 font-medium">units</p>
                <span className={`inline-block mt-2 px-1.5 py-0.5 text-[10px] font-bold rounded ${
                  isZero ? 'bg-red-100 text-red-700' :
                  isLow ? 'bg-amber-100 text-amber-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  {item.status}
                </span>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Low & Critical Stock Alerts */}
      {reportData?.lowStockAlerts?.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 rounded-xl p-6 border border-red-200"
        >
          <div className="flex items-center space-x-2 text-red-900 mb-4">
            <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
            <h2 className="text-lg font-bold">Stock Alerts ({reportData.lowStockAlerts.length})</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {reportData.lowStockAlerts.map((alert, index) => (
              <div key={index} className="bg-white rounded-lg p-4 border border-red-200 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-lg font-black text-gray-900">{alert.bloodGroup}</span>
                  <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                    alert.severity === 'Critical' ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {alert.severity === 'Critical' ? '🚨 OUT OF STOCK' : '⚠️ LOW STOCK'}
                  </span>
                </div>
                <p className="text-xs text-gray-600">{alert.message}</p>
                <div className="mt-3 flex items-center justify-between text-xs">
                  <span className="text-gray-500">Available: <strong className="text-red-600">{alert.currentUnits}</strong> units</span>
                  <span className="text-gray-400">Min: {alert.minThreshold}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Real Activity & Transaction Log */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
      >
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Recorded Activity & Movement Log</h2>
            <p className="text-xs text-gray-500 mt-1">Real inventory updates and requests fulfilled by this hospital</p>
          </div>
          <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-full">
            {reportData?.activityLog?.length || 0} Events
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase tracking-wider text-left">
              <tr>
                <th className="px-6 py-3">Timestamp</th>
                <th className="px-6 py-3">Blood Group</th>
                <th className="px-6 py-3">Event Type</th>
                <th className="px-6 py-3">Units</th>
                <th className="px-6 py-3">Details / Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(!reportData?.activityLog || reportData.activityLog.length === 0) ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-400">
                    No activity recorded for the selected time window.
                  </td>
                </tr>
              ) : (
                reportData.activityLog.map((item, idx) => (
                  <tr key={item.id || idx} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3.5 text-gray-500 text-xs whitespace-nowrap">
                      {new Date(item.date).toLocaleDateString()} {new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-6 py-3.5 font-bold text-gray-900">
                      {item.bloodGroup}
                    </td>
                    <td className="px-6 py-3.5 whitespace-nowrap">
                      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                        item.activityType === 'Stock Added' ? 'bg-green-100 text-green-700' :
                        item.activityType === 'Stock Reduced' ? 'bg-amber-100 text-amber-700' :
                        item.activityType === 'Blood Request Fulfilled' || item.activityType === 'Request Fulfilled' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {item.activityType}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 font-bold text-gray-900">
                      {item.units} units
                    </td>
                    <td className="px-6 py-3.5 text-gray-600 text-xs">
                      {item.notes}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Share Modal */}
      {showShareModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto"
          onClick={() => setShowShareModal(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Share Report</h3>
              <button onClick={() => setShowShareModal(false)} className="text-gray-400 hover:text-gray-600">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              Share the current live report or download an Excel spreadsheet for record-keeping.
            </p>
            <div className="space-y-3">
              <button
                onClick={handleCopyLink}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors"
              >
                <ShareIcon className="h-5 w-5" />
                <span>{copiedLink ? 'Link Copied to Clipboard!' : 'Copy Dashboard Link'}</span>
              </button>
              <button
                onClick={() => {
                  downloadReport();
                  setShowShareModal(false);
                }}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 text-white font-medium rounded-xl hover:bg-green-700 transition-colors"
              >
                <DocumentArrowDownIcon className="h-5 w-5" />
                <span>Export & Download Excel</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SimpleHospitalReports;
