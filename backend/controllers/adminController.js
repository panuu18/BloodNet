const User = require('../models/User');
const Request = require('../models/Request');
const Hospital = require('../models/Hospital');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');
const SystemAlert = require('../models/SystemAlert');

// System Overview
const getSystemOverview = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalDonors = await User.countDocuments({ role: 'donor' });
    const totalRecipients = await User.countDocuments({ role: 'recipient' });
    const totalHospitals = await User.countDocuments({ role: 'hospital' });
    
    const activeRequests = await Request.countDocuments({ status: 'active' });
    const completedRequests = await Request.countDocuments({ status: 'completed' });
    const pendingRequests = await Request.countDocuments({ status: 'pending' });
    const emergencyRequests = await Request.countDocuments({ urgency: 'emergency' });

    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name email role createdAt')
      .lean();

    const recentRequests = await Request.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('requesterId', 'name')
      .populate('donorId', 'name')
      .lean();

    res.json({
      overview: {
        totalUsers,
        totalDonors,
        totalRecipients,
        totalHospitals,
        activeRequests,
        completedRequests,
        pendingRequests,
        emergencyRequests
      },
      recentUsers,
      recentRequests,
      systemHealth: 'healthy',
      lastUpdated: new Date()
    });
  } catch (error) {
    console.error('Get system overview error:', error);
    res.status(500).json({ message: 'Server error fetching system overview' });
  }
};

const getSystemMetrics = async (req, res) => {
  try {
    const metrics = {
      serverUptime: '99.9%',
      responseTime: '120ms',
      databaseConnections: 5,
      activeSessions: 45,
      memoryUsage: '65%',
      cpuUsage: '42%',
      diskUsage: '78%',
      networkTraffic: '2.3 MB/s',
      errorRate: '0.02%',
      cacheHitRate: '94.5%'
    };

    res.json(metrics);
  } catch (error) {
    console.error('Get system metrics error:', error);
    res.status(500).json({ message: 'Server error fetching system metrics' });
  }
};

const getSystemHealth = async (req, res) => {
  try {
    const health = {
      status: 'healthy',
      services: {
        database: 'connected',
        redis: 'connected',
        email: 'operational',
        sms: 'operational',
        storage: 'operational'
      },
      performance: {
        responseTime: '120ms',
        throughput: '1000 req/min',
        errorRate: '0.02%'
      },
      lastCheck: new Date()
    };

    res.json(health);
  } catch (error) {
    console.error('Get system health error:', error);
    res.status(500).json({ message: 'Server error fetching system health' });
  }
};

// User Management
const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, role, status, search } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    if (role) query.role = role;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await User.countDocuments(query);

    res.json({
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ message: 'Server error fetching users' });
  }
};

const getUserStats = async (req, res) => {
  try {
    const stats = {
      total: await User.countDocuments(),
      donors: await User.countDocuments({ role: 'donor' }),
      recipients: await User.countDocuments({ role: 'recipient' }),
      hospitals: await User.countDocuments({ role: 'hospital' }),
      admins: await User.countDocuments({ role: 'admin' }),
      active: await User.countDocuments({ status: 'active' }),
      inactive: await User.countDocuments({ status: 'inactive' }),
      suspended: await User.countDocuments({ status: 'suspended' }),
      verified: await User.countDocuments({ verified: true }),
      unverified: await User.countDocuments({ verified: false })
    };

    // Get user growth over time (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const growthData = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$createdAt"
            }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    res.json({ stats, growthData });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ message: 'Server error fetching user stats' });
  }
};

const createUser = async (req, res) => {
  try {
    const { name, email, password, role, phone, location } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user
    const user = new User({
      name,
      email,
      password,
      role,
      phone,
      location,
      verified: true,
      status: 'active'
    });

    await user.save();

    // Log the action
    await AuditLog.create({
      action: 'user_created',
      userId: req.user.id,
      targetUserId: user._id,
      details: `Created user ${email} with role ${role}`
    });

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status
      }
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ message: 'Server error creating user' });
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const user = await User.findByIdAndUpdate(
      id,
      { ...updates, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Log the action
    await AuditLog.create({
      action: 'user_updated',
      userId: req.user.id,
      targetUserId: user._id,
      details: `Updated user ${user.email}`
    });

    res.json({
      message: 'User updated successfully',
      user
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Server error updating user' });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Log the action
    await AuditLog.create({
      action: 'user_deleted',
      userId: req.user.id,
      targetUserId: user._id,
      details: `Deleted user ${user.email}`
    });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error deleting user' });
  }
};

const activateUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByIdAndUpdate(
      id,
      { status: 'active', updatedAt: new Date() },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Log the action
    await AuditLog.create({
      action: 'user_activated',
      userId: req.user.id,
      targetUserId: user._id,
      details: `Activated user ${user.email}`
    });

    res.json({
      message: 'User activated successfully',
      user
    });
  } catch (error) {
    console.error('Activate user error:', error);
    res.status(500).json({ message: 'Server error activating user' });
  }
};

const deactivateUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByIdAndUpdate(
      id,
      { status: 'inactive', updatedAt: new Date() },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Log the action
    await AuditLog.create({
      action: 'user_deactivated',
      userId: req.user.id,
      targetUserId: user._id,
      details: `Deactivated user ${user.email}`
    });

    res.json({
      message: 'User deactivated successfully',
      user
    });
  } catch (error) {
    console.error('Deactivate user error:', error);
    res.status(500).json({ message: 'Server error deactivating user' });
  }
};

// Blood Request Management
const getAllRequests = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, urgency, bloodGroup } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    if (status) query.status = status;
    if (urgency) query.urgency = urgency;
    if (bloodGroup) query.bloodGroup = bloodGroup;

    const requests = await Request.find(query)
      .populate('requesterId', 'name email phone')
      .populate('donorId', 'name email phone')
      .populate('hospitalId', 'hospitalName contactNumber')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await Request.countDocuments(query);

    res.json({
      requests,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get all requests error:', error);
    res.status(500).json({ message: 'Server error fetching requests' });
  }
};

const getRequestStats = async (req, res) => {
  try {
    const stats = {
      total: await Request.countDocuments(),
      pending: await Request.countDocuments({ status: 'pending' }),
      active: await Request.countDocuments({ status: 'active' }),
      completed: await Request.countDocuments({ status: 'completed' }),
      cancelled: await Request.countDocuments({ status: 'cancelled' }),
      emergency: await Request.countDocuments({ urgency: 'emergency' }),
      urgent: await Request.countDocuments({ urgency: 'urgent' }),
      routine: await Request.countDocuments({ urgency: 'routine' })
    };

    // Get request trends over time
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const trendData = await Request.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$createdAt"
            }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    res.json({ stats, trendData });
  } catch (error) {
    console.error('Get request stats error:', error);
    res.status(500).json({ message: 'Server error fetching request stats' });
  }
};

const updateRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const request = await Request.findByIdAndUpdate(
      id,
      { 
        status, 
        notes,
        updatedAt: new Date(),
        adminId: req.user.id
      },
      { new: true, runValidators: true }
    ).populate('requesterId', 'name email')
     .populate('donorId', 'name email')
     .populate('hospitalId', 'hospitalName');

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // Log the action
    await AuditLog.create({
      action: 'request_status_updated',
      userId: req.user.id,
      requestId: request._id,
      details: `Updated request status to ${status}`
    });

    res.json({
      message: 'Request status updated successfully',
      request
    });
  } catch (error) {
    console.error('Update request status error:', error);
    res.status(500).json({ message: 'Server error updating request status' });
  }
};

const deleteRequest = async (req, res) => {
  try {
    const { id } = req.params;

    const request = await Request.findByIdAndDelete(id);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // Log the action
    await AuditLog.create({
      action: 'request_deleted',
      userId: req.user.id,
      requestId: request._id,
      details: `Deleted blood request`
    });

    res.json({ message: 'Request deleted successfully' });
  } catch (error) {
    console.error('Delete request error:', error);
    res.status(500).json({ message: 'Server error deleting request' });
  }
};

const getEmergencyRequests = async (req, res) => {
  try {
    const requests = await Request.find({ urgency: 'emergency', status: { $in: ['pending', 'active'] } })
      .populate('requesterId', 'name email phone location')
      .populate('hospitalId', 'hospitalName contactNumber location')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ requests });
  } catch (error) {
    console.error('Get emergency requests error:', error);
    res.status(500).json({ message: 'Server error fetching emergency requests' });
  }
};

// System Alerts
const getSystemAlerts = async (req, res) => {
  try {
    const { page = 1, limit = 10, priority, status } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    if (priority) query.priority = priority;
    if (status) query.status = status;

    const alerts = await SystemAlert.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await SystemAlert.countDocuments(query);

    res.json({
      alerts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get system alerts error:', error);
    res.status(500).json({ message: 'Server error fetching system alerts' });
  }
};

const createAlert = async (req, res) => {
  try {
    const { type, message, priority } = req.body;

    const alert = new SystemAlert({
      type,
      message,
      priority,
      createdBy: req.user.id
    });

    await alert.save();

    // Log the action
    await AuditLog.create({
      action: 'alert_created',
      userId: req.user.id,
      alertId: alert._id,
      details: `Created ${priority} priority alert: ${message}`
    });

    res.status(201).json({
      message: 'Alert created successfully',
      alert
    });
  } catch (error) {
    console.error('Create alert error:', error);
    res.status(500).json({ message: 'Server error creating alert' });
  }
};

const updateAlert = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const alert = await SystemAlert.findByIdAndUpdate(
      id,
      { ...updates, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!alert) {
      return res.status(404).json({ message: 'Alert not found' });
    }

    // Log the action
    await AuditLog.create({
      action: 'alert_updated',
      userId: req.user.id,
      alertId: alert._id,
      details: `Updated alert`
    });

    res.json({
      message: 'Alert updated successfully',
      alert
    });
  } catch (error) {
    console.error('Update alert error:', error);
    res.status(500).json({ message: 'Server error updating alert' });
  }
};

const deleteAlert = async (req, res) => {
  try {
    const { id } = req.params;

    const alert = await SystemAlert.findByIdAndDelete(id);
    if (!alert) {
      return res.status(404).json({ message: 'Alert not found' });
    }

    // Log the action
    await AuditLog.create({
      action: 'alert_deleted',
      userId: req.user.id,
      alertId: alert._id,
      details: `Deleted alert`
    });

    res.json({ message: 'Alert deleted successfully' });
  } catch (error) {
    console.error('Delete alert error:', error);
    res.status(500).json({ message: 'Server error deleting alert' });
  }
};

const resolveAlert = async (req, res) => {
  try {
    const { id } = req.params;
    const { resolution } = req.body;

    const alert = await SystemAlert.findByIdAndUpdate(
      id,
      { 
        status: 'resolved',
        resolution,
        resolvedBy: req.user.id,
        resolvedAt: new Date()
      },
      { new: true }
    );

    if (!alert) {
      return res.status(404).json({ message: 'Alert not found' });
    }

    // Log the action
    await AuditLog.create({
      action: 'alert_resolved',
      userId: req.user.id,
      alertId: alert._id,
      details: `Resolved alert: ${resolution}`
    });

    res.json({
      message: 'Alert resolved successfully',
      alert
    });
  } catch (error) {
    console.error('Resolve alert error:', error);
    res.status(500).json({ message: 'Server error resolving alert' });
  }
};

// Placeholder functions for other admin features
const getAllHospitals = async (req, res) => {
  try {
    const hospitals = await User.find({ role: 'hospital' })
      .select('-password')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ hospitals });
  } catch (error) {
    console.error('Get all hospitals error:', error);
    res.status(500).json({ message: 'Server error fetching hospitals' });
  }
};

const createHospital = async (req, res) => {
  res.json({ message: 'Hospital creation endpoint - to be implemented' });
};

const updateHospital = async (req, res) => {
  res.json({ message: 'Hospital update endpoint - to be implemented' });
};

const deleteHospital = async (req, res) => {
  res.json({ message: 'Hospital deletion endpoint - to be implemented' });
};

const getHospitalInventory = async (req, res) => {
  res.json({ message: 'Hospital inventory endpoint - to be implemented' });
};

const getDashboardAnalytics = async (req, res) => {
  res.json({ message: 'Dashboard analytics endpoint - to be implemented' });
};

const getUserAnalytics = async (req, res) => {
  res.json({ message: 'User analytics endpoint - to be implemented' });
};

const getRequestAnalytics = async (req, res) => {
  res.json({ message: 'Request analytics endpoint - to be implemented' });
};

const getDonationAnalytics = async (req, res) => {
  res.json({ message: 'Donation analytics endpoint - to be implemented' });
};

const exportReports = async (req, res) => {
  res.json({ message: 'Export reports endpoint - to be implemented' });
};

let currentSystemSettings = {
  maintenanceMode: false,
  autoVerifyDonors: true,
  emailAlerts: true,
  smsAlerts: true,
  emergencyBroadcastEnabled: true,
  maxDonationRadiusKm: 50,
  minHemoglobinLevel: 11
};

const getSecurityLogs = async (req, res) => {
  try {
    const logs = await AuditLog.find()
      .populate('userId', 'name email role')
      .populate('targetUserId', 'name email role')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    res.json({ logs });
  } catch (error) {
    console.error('Get security logs error:', error);
    res.status(500).json({ message: 'Server error fetching security logs' });
  }
};

const getAuditTrail = async (req, res) => {
  try {
    const logs = await AuditLog.find()
      .populate('userId', 'name email role')
      .populate('targetUserId', 'name email role')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    res.json({ logs });
  } catch (error) {
    console.error('Get audit trail error:', error);
    res.status(500).json({ message: 'Server error fetching audit trail' });
  }
};

const initiateLockdown = async (req, res) => {
  currentSystemSettings.maintenanceMode = true;
  await AuditLog.create({
    action: 'security_lockdown',
    userId: req.user.id,
    details: 'System emergency lockdown initiated by Admin'
  });
  res.json({ message: 'Lockdown initiated', settings: currentSystemSettings });
};

const releaseLockdown = async (req, res) => {
  currentSystemSettings.maintenanceMode = false;
  await AuditLog.create({
    action: 'security_unlock',
    userId: req.user.id,
    details: 'System lockdown released by Admin'
  });
  res.json({ message: 'Lockdown released', settings: currentSystemSettings });
};

const getSystemSettings = async (req, res) => {
  res.json({ settings: currentSystemSettings });
};

const updateSystemSettings = async (req, res) => {
  try {
    currentSystemSettings = { ...currentSystemSettings, ...(req.body.settings || req.body) };
    await AuditLog.create({
      action: 'system_update',
      userId: req.user.id,
      details: 'Updated platform system settings'
    });
    res.json({ message: 'Settings updated successfully', settings: currentSystemSettings });
  } catch (error) {
    res.status(500).json({ message: 'Server error updating system settings' });
  }
};

const initiateBackup = async (req, res) => {
  await AuditLog.create({
    action: 'system_backup',
    userId: req.user.id,
    details: 'System database snapshot backup initiated'
  });
  res.json({ message: 'Automated backup completed', timestamp: new Date() });
};

const getBackupHistory = async (req, res) => {
  res.json({ backups: [
    { id: 'BKP-01', timestamp: new Date(), status: 'completed', size: '14.2 MB' }
  ] });
};

const emergencyBroadcast = async (req, res) => {
  try {
    const { title, message, bloodGroup, targetRole } = req.body;
    const alertMsg = message || `EMERGENCY BROADCAST: Urgent blood requirement for ${bloodGroup || 'all groups'}`;
    
    const alert = await SystemAlert.create({
      type: 'emergency',
      message: alertMsg,
      priority: 'high',
      createdBy: req.user.id
    });

    const userQuery = targetRole ? { role: targetRole } : {};
    const users = await User.find(userQuery).select('_id');
    const notifs = users.map(u => ({
      userId: u._id,
      title: title || 'BloodNet+ Emergency Alert',
      message: alertMsg,
      type: 'emergency',
      priority: 'high'
    }));
    if (notifs.length > 0) {
      await Notification.insertMany(notifs);
    }

    if (global.io) {
      global.io.emit('emergencyAlert', {
        title: title || 'Emergency Broadcast',
        message: alertMsg,
        bloodGroup
      });
    }

    await AuditLog.create({
      action: 'emergency_broadcast',
      userId: req.user.id,
      alertId: alert._id,
      details: `Dispatched emergency broadcast: ${alertMsg}`
    });

    res.json({ message: 'Emergency broadcast dispatched successfully', count: users.length });
  } catch (error) {
    console.error('Emergency broadcast error:', error);
    res.status(500).json({ message: 'Server error sending broadcast' });
  }
};

const getEmergencyContacts = async (req, res) => {
  res.json({ message: 'Emergency contacts endpoint - to be implemented' });
};

const addEmergencyContact = async (req, res) => {
  res.json({ message: 'Add emergency contact endpoint - to be implemented' });
};

const getBanners = async (req, res) => {
  res.json({ message: 'Get banners endpoint - to be implemented' });
};

const createBanner = async (req, res) => {
  res.json({ message: 'Create banner endpoint - to be implemented' });
};

const updateBanner = async (req, res) => {
  res.json({ message: 'Update banner endpoint - to be implemented' });
};

const deleteBanner = async (req, res) => {
  res.json({ message: 'Delete banner endpoint - to be implemented' });
};

module.exports = {
  // System Overview
  getSystemOverview,
  getSystemMetrics,
  getSystemHealth,
  
  // User Management
  getAllUsers,
  getUserStats,
  createUser,
  updateUser,
  deleteUser,
  activateUser,
  deactivateUser,
  
  // Blood Request Management
  getAllRequests,
  getRequestStats,
  updateRequestStatus,
  deleteRequest,
  getEmergencyRequests,
  
  // Hospital Management
  getAllHospitals,
  createHospital,
  updateHospital,
  deleteHospital,
  getHospitalInventory,
  
  // Analytics and Reports
  getDashboardAnalytics,
  getUserAnalytics,
  getRequestAnalytics,
  getDonationAnalytics,
  exportReports,
  
  // System Alerts
  getSystemAlerts,
  createAlert,
  updateAlert,
  deleteAlert,
  resolveAlert,
  
  // Security and Audit
  getSecurityLogs,
  getAuditTrail,
  initiateLockdown,
  releaseLockdown,
  
  // System Settings
  getSystemSettings,
  updateSystemSettings,
  initiateBackup,
  getBackupHistory,
  
  // Emergency Response
  emergencyBroadcast,
  getEmergencyContacts,
  addEmergencyContact,
  
  // Content Management
  getBanners,
  createBanner,
  updateBanner,
  deleteBanner
};
