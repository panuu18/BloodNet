const { validationResult } = require('express-validator');
const User = require('../models/User');
const BloodInventory = require('../models/BloodInventory');
const Request = require('../models/Request');
const Notification = require('../models/Notification');
const DonationCamp = require('../models/DonationCamp');
const AuditLog = require('../models/AuditLog');

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

const getNearbyHospitals = async (req, res) => {
  try {
    const { lat, lng, maxDistance = 50 } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ message: 'Location coordinates are required' });
    }

    const hospitals = await User.find({
      role: 'hospital'
    }).select('-password');

    const nearbyHospitals = hospitals.filter(hospital => {
      const distance = calculateDistance(
        parseFloat(lat), parseFloat(lng),
        hospital.location.lat, hospital.location.lng
      );
      hospital.distance = Math.round(distance * 10) / 10;
      return distance <= maxDistance;
    });

    nearbyHospitals.sort((a, b) => a.distance - b.distance);

    res.json({ hospitals: nearbyHospitals });
  } catch (error) {
    console.error('Get nearby hospitals error:', error);
    res.status(500).json({ message: 'Server error fetching nearby hospitals' });
  }
};

const getHospitalInventory = async (req, res) => {
  try {
    if (req.user.role !== 'hospital') {
      return res.status(403).json({ message: 'Only hospitals can view their inventory' });
    }

    const inventory = await BloodInventory.find({ hospitalId: req.user.id })
      .sort({ bloodGroup: 1 });

    const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    const completeInventory = bloodGroups.map(group => {
      const item = inventory.find(item => item.bloodGroup === group);
      return item || {
        hospitalId: req.user.id,
        bloodGroup: group,
        unitsAvailable: 0,
        minThreshold: 5,
        maxCapacity: 100,
        expiryDates: []
      };
    });

    res.json({ inventory: completeInventory });
  } catch (error) {
    console.error('Get hospital inventory error:', error);
    res.status(500).json({ message: 'Server error fetching inventory' });
  }
};

const updateInventory = async (req, res) => {
  try {
    if (req.user.role !== 'hospital') {
      return res.status(403).json({ message: 'Only hospitals can update inventory' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { bloodGroup, unitsAvailable, operation, expiryDates, minThreshold, maxCapacity } = req.body;

    let inventory = await BloodInventory.findOne({
      hospitalId: req.user.id,
      bloodGroup
    });

    if (!inventory) {
      inventory = new BloodInventory({
        hospitalId: req.user.id,
        bloodGroup,
        unitsAvailable: 0,
        minThreshold: minThreshold || 5,
        maxCapacity: maxCapacity || 100
      });
    }

    if (operation === 'add' && unitsAvailable > 0) {
      inventory.unitsAvailable += unitsAvailable;
      
      if (expiryDates && expiryDates.length > 0) {
        expiryDates.forEach(expiry => {
          inventory.expiryDates.push({
            units: expiry.units,
            expiryDate: new Date(expiry.expiryDate),
            batchNumber: expiry.batchNumber || `BATCH-${Date.now()}`
          });
        });
      }
    } else if (operation === 'subtract' && unitsAvailable > 0) {
      inventory.unitsAvailable = Math.max(0, inventory.unitsAvailable - unitsAvailable);
      
      if (expiryDates && expiryDates.length > 0) {
        expiryDates.forEach(expiry => {
          const existingExpiry = inventory.expiryDates.find(
            e => e.batchNumber === expiry.batchNumber
          );
          if (existingExpiry) {
            existingExpiry.units = Math.max(0, existingExpiry.units - expiry.units);
          }
        });
      }
    } else if (operation === 'set') {
      inventory.unitsAvailable = unitsAvailable;
    }

    if (minThreshold !== undefined) inventory.minThreshold = minThreshold;
    if (maxCapacity !== undefined) inventory.maxCapacity = maxCapacity;

    await inventory.save();

    try {
      await AuditLog.create({
        action: 'hospital_updated',
        userId: req.user.id,
        details: `Hospital inventory updated: ${bloodGroup} (${inventory.unitsAvailable} units available)`
      });
      if (global.io) {
        global.io.emit('adminUpdate', { type: 'inventory_update', hospitalId: req.user.id });
      }
    } catch (e) {
      console.error('AuditLog error:', e.message);
    }

    if (inventory.isLowStock()) {
      await Notification.create({
        userId: req.user.id,
        title: 'Low Blood Stock Alert',
        message: `${bloodGroup} blood stock is running low. Current units: ${inventory.unitsAvailable}`,
        type: 'system',
        priority: 'high',
        actionRequired: true,
        actionUrl: '/inventory'
      });
    }

    res.json({ inventory });
  } catch (error) {
    console.error('Update inventory error:', error);
    res.status(500).json({ message: 'Server error updating inventory' });
  }
};

const getAllBloodRequests = async (req, res) => {
  try {
    if (req.user.role !== 'hospital') {
      return res.status(403).json({ message: 'Only hospitals can view blood requests' });
    }

    const requests = await Request.find({
      status: { $in: ['pending', 'accepted'] }
    })
    .populate('requesterId', 'name phone location')
    .populate('donorId', 'name phone location')
    .populate('hospitalId', 'hospitalName contactNumber location')
    .sort({ createdAt: -1 });

    res.json({ requests });
  } catch (error) {
    console.error('Get all blood requests error:', error);
    res.status(500).json({ message: 'Server error fetching blood requests' });
  }
};

const getHospitalStats = async (req, res) => {
  try {
    if (req.user.role !== 'hospital') {
      return res.status(403).json({ message: 'Only hospitals can view stats' });
    }

    const inventory = await BloodInventory.find({ hospitalId: req.user.id });
    const totalUnits = inventory.reduce((sum, item) => sum + item.unitsAvailable, 0);
    
    const lowStockItems = inventory.filter(item => item.isLowStock());
    const expiringItems = inventory.filter(item => item.getTotalExpiringUnits(7) > 0);

    const requests = await Request.find({ hospitalId: req.user.id });
    const completedRequests = requests.filter(r => r.status === 'completed').length;
    const pendingRequests = requests.filter(r => r.status === 'pending').length;
    const acceptedRequests = requests.filter(r => r.status === 'accepted').length;

    res.json({
      stats: {
        totalBloodUnits: totalUnits,
        lowStockCount: lowStockItems.length,
        expiringSoonCount: expiringItems.length,
        completedRequests,
        pendingRequests,
        acceptedRequests,
        totalRequests: requests.length
      },
      alerts: {
        lowStockItems: lowStockItems.map(item => ({
          bloodGroup: item.bloodGroup,
          unitsAvailable: item.unitsAvailable,
          minThreshold: item.minThreshold
        })),
        expiringItems: expiringItems.map(item => ({
          bloodGroup: item.bloodGroup,
          expiringUnits: item.getTotalExpiringUnits(7)
        }))
      }
    });
  } catch (error) {
    console.error('Get hospital stats error:', error);
    res.status(500).json({ message: 'Server error fetching hospital stats' });
  }
};

const getRequestHistory = async (req, res) => {
  try {
    if (req.user.role !== 'hospital') {
      return res.status(403).json({ message: 'Only hospitals can view request history' });
    }

    const requests = await Request.find({ hospitalId: req.user.id })
      .populate('requesterId', 'name phone location')
      .populate('donorId', 'name phone location')
      .sort({ createdAt: -1 });

    const history = requests.map(request => ({
      _id: request._id,
      recipientName: request.requesterId?.name || 'Unknown',
      recipientAge: request.recipientAge || 'N/A',
      bloodGroup: request.bloodGroup,
      unitsNeeded: request.unitsNeeded,
      medicalReason: request.medicalReason,
      urgency: request.urgency,
      status: request.status,
      hospitalName: request.hospitalName || req.user.hospitalName,
      location: request.location,
      contactPerson: request.contactPerson,
      contactPhone: request.contactPhone,
      createdAt: request.createdAt,
      responseDate: request.responseDate
    }));

    res.json({ history });
  } catch (error) {
    console.error('Get request history error:', error);
    res.status(500).json({ message: 'Server error fetching request history' });
  }
};

const createDonationCamp = async (req, res) => {
  try {
    if (req.user.role !== 'hospital') {
      return res.status(403).json({ message: 'Only hospitals can create donation camps' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, date, location, description, targetUnits } = req.body;

    const camp = new DonationCamp({
      hospitalId: req.user.id,
      name,
      date: new Date(date),
      location,
      description,
      targetUnits,
      status: 'upcoming'
    });

    await camp.save();

    // Create notification for successful camp creation
    await Notification.create({
      userId: req.user.id,
      title: 'Donation Camp Created',
      message: `Your donation camp "${name}" has been successfully created for ${new Date(date).toLocaleDateString()}`,
      type: 'system',
      priority: 'medium',
      actionRequired: false
    });

    res.status(201).json({ camp });
  } catch (error) {
    console.error('Create donation camp error:', error);
    res.status(500).json({ message: 'Server error creating donation camp' });
  }
};

const updateHospitalProfile = async (req, res) => {
  try {
    if (req.user.role !== 'hospital') {
      return res.status(403).json({ message: 'Only hospitals can update their profile' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const updates = req.body;
    
    // Update user profile
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ message: 'Hospital not found' });
    }

    res.json({ 
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Update hospital profile error:', error);
    res.status(500).json({ message: 'Server error updating profile' });
  }
};

const generateExcelReport = async (req, res) => {
  try {
    if (req.user.role !== 'hospital') {
      return res.status(403).json({ message: 'Only hospitals can generate reports' });
    }

    const inventory = await BloodInventory.find({ hospitalId: req.user.id });
    const requests = await Request.find({ hospitalId: req.user.id });

    // Create Excel report data
    const reportData = {
      hospitalName: req.user.hospitalName,
      generatedDate: new Date().toISOString(),
      inventory: inventory.map(item => ({
        bloodGroup: item.bloodGroup,
        unitsAvailable: item.unitsAvailable,
        minThreshold: item.minThreshold,
        maxCapacity: item.maxCapacity,
        status: item.isLowStock() ? 'Low Stock' : 'Good Stock'
      })),
      requests: requests.map(request => ({
        recipientName: request.requesterId?.name || 'Unknown',
        bloodGroup: request.bloodGroup,
        unitsNeeded: request.unitsNeeded,
        status: request.status,
        createdAt: request.createdAt,
        responseDate: request.responseDate
      }))
    };

    // For now, return JSON data. In production, you'd use a library like exceljs
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=blood-inventory-report-${new Date().toISOString().split('T')[0]}.json`);
    res.json(reportData);
  } catch (error) {
    console.error('Generate Excel report error:', error);
    res.status(500).json({ message: 'Server error generating report' });
  }
};

const getInventoryReport = async (req, res) => {
  try {
    if (req.user.role !== 'hospital') {
      return res.status(403).json({ message: 'Only hospitals can access inventory reports' });
    }

    const { dateRange = 'week', bloodGroup = 'all', reportType = 'comprehensive' } = req.query;
    
    // Calculate date range
    const now = new Date();
    let startDate = new Date();
    
    switch (dateRange) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setDate(now.getDate() - 30);
        break;
      case 'quarter':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setDate(now.getDate() - 7);
    }

    // Fetch inventory data
    let inventoryQuery = { hospitalId: req.user.id };
    if (bloodGroup !== 'all') {
      inventoryQuery.bloodGroup = bloodGroup;
    }
    
    const inventory = await BloodInventory.find(inventoryQuery);
    
    // Fetch requests within date range
    let requestQuery = { 
      hospitalId: req.user.id,
      createdAt: { $gte: startDate, $lte: now }
    };
    
    const requests = await Request.find(requestQuery)
      .populate('requesterId', 'name')
      .sort({ createdAt: -1 });

    // Calculate activity log (mock data for now - in production, this would come from activity tracking)
    const activityLog = generateMockActivityLog(inventory, requests, startDate, now);
    
    // Calculate low stock alerts
    const lowStockAlerts = inventory
      .filter(item => item.unitsAvailable <= item.minThreshold)
      .map(item => ({
        bloodGroup: item.bloodGroup,
        currentUnits: item.unitsAvailable,
        minThreshold: item.minThreshold,
        severity: item.unitsAvailable === 0 ? 'Critical' : 'Low',
        message: item.unitsAvailable === 0 
          ? `${item.bloodGroup} is out of stock` 
          : `${item.bloodGroup} is critically low`,
        recommendedAction: item.unitsAvailable === 0 
          ? 'Immediate restocking required' 
          : 'Consider restocking soon'
      }));

    // Calculate request summary
    const requestSummary = {
      totalReceived: requests.length,
      accepted: requests.filter(r => r.status === 'accepted').length,
      rejected: requests.filter(r => r.status === 'rejected').length,
      unitsSupplied: requests.filter(r => r.status === 'accepted').reduce((sum, r) => sum + r.unitsNeeded, 0),
      avgResponseTime: calculateAverageResponseTime(requests)
    };

    // Calculate total units
    const totalUnits = inventory.reduce((sum, item) => sum + item.unitsAvailable, 0);

    // Enhanced inventory data with stock movement
    const enhancedInventory = inventory.map(item => ({
      ...item.toObject(),
      unitsAdded: Math.floor(Math.random() * 20) + 5, // Mock data - would come from activity tracking
      unitsUsed: Math.floor(Math.random() * 15) + 2, // Mock data - would come from activity tracking
    }));

    const reportData = {
      hospitalName: req.user.hospitalName,
      generatedDate: new Date().toISOString(),
      dateRange,
      bloodGroup,
      reportType,
      totalUnits,
      inventory: enhancedInventory,
      lowStockAlerts,
      activityLog,
      requestSummary,
      filters: {
        dateRange,
        bloodGroup,
        reportType
      }
    };

    res.json(reportData);
  } catch (error) {
    console.error('Get inventory report error:', error);
    res.status(500).json({ message: 'Server error fetching inventory report' });
  }
};

// Helper function to generate mock activity log
const generateMockActivityLog = (inventory, requests, startDate, endDate) => {
  const activities = [];
  
  // Generate some mock activities based on requests
  requests.slice(0, 10).forEach(request => {
    activities.push({
      date: request.createdAt,
      bloodGroup: request.bloodGroup,
      unitsAdded: 0,
      unitsUsed: request.status === 'accepted' ? request.unitsNeeded : 0,
      activityType: request.status === 'accepted' ? 'Blood Request Fulfilled' : 'Blood Request Received',
      notes: `Request from ${request.requesterId?.name || 'Unknown'}`
    });
  });

  // Add some mock inventory additions
  inventory.forEach(item => {
    if (Math.random() > 0.5) {
      const randomDate = new Date(startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime()));
      activities.push({
        date: randomDate,
        bloodGroup: item.bloodGroup,
        unitsAdded: Math.floor(Math.random() * 20) + 5,
        unitsUsed: 0,
        activityType: 'Stock Added',
        notes: 'Regular blood donation'
      });
    }
  });

  return activities.sort((a, b) => new Date(b.date) - new Date(a.date));
};

// Helper function to calculate average response time
const calculateAverageResponseTime = (requests) => {
  const respondedRequests = requests.filter(r => r.responseDate);
  if (respondedRequests.length === 0) return 'N/A';
  
  const totalResponseTime = respondedRequests.reduce((sum, request) => {
    const responseTime = new Date(request.responseDate) - new Date(request.createdAt);
    return sum + responseTime;
  }, 0);
  
  const avgResponseTime = totalResponseTime / respondedRequests.length;
  const hours = Math.floor(avgResponseTime / (1000 * 60 * 60));
  const minutes = Math.floor((avgResponseTime % (1000 * 60 * 60)) / (1000 * 60));
  
  return `${hours}h ${minutes}m`;
};

module.exports = {
  getNearbyHospitals,
  getHospitalInventory,
  updateInventory,
  getAllBloodRequests,
  getHospitalStats,
  getRequestHistory,
  createDonationCamp,
  updateHospitalProfile,
  generateExcelReport,
  getInventoryReport
};
