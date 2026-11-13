const { validationResult } = require('express-validator');
const User = require('../models/User');
const BloodInventory = require('../models/BloodInventory');
const InventoryLog = require('../models/InventoryLog');
const Request = require('../models/Request');
const Notification = require('../models/Notification');
const DonationCamp = require('../models/DonationCamp');
const AuditLog = require('../models/AuditLog');

const ALL_BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

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
      if (!hospital.location || hospital.location.lat === undefined || hospital.location.lng === undefined) {
        return false;
      }
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

    const inventoryRecords = await BloodInventory.find({ hospitalId: req.user.id })
      .sort({ bloodGroup: 1 });

    const completeInventory = ALL_BLOOD_GROUPS.map(group => {
      const item = inventoryRecords.find(i => i.bloodGroup === group);
      const units = item ? item.unitsAvailable : 0;
      const minThreshold = item?.minThreshold || 5;
      const maxCapacity = item?.maxCapacity || 100;
      
      let status = 'good';
      let statusText = 'Good Stock';
      if (units === 0) {
        status = 'critical';
        statusText = 'Out of Stock';
      } else if (units <= Math.floor(minThreshold / 2)) {
        status = 'critical';
        statusText = 'Critical Stock';
      } else if (units <= minThreshold) {
        status = 'low';
        statusText = 'Low Stock';
      }

      return {
        _id: item?._id,
        hospitalId: req.user.id,
        bloodGroup: group,
        unitsAvailable: units,
        minThreshold,
        maxCapacity,
        status,
        statusText,
        percentage: Math.min(100, Math.round((units / maxCapacity) * 100)),
        lastUpdated: item?.lastUpdated || new Date(),
        expiryDates: item?.expiryDates || []
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

    const { bloodGroup, unitsAvailable, operation = 'set', reason = '', minThreshold, maxCapacity } = req.body;
    const units = parseInt(unitsAvailable, 10);

    if (isNaN(units) || units < 0) {
      return res.status(400).json({ message: 'Units must be a non-negative integer.' });
    }

    // Retrieve current stock
    let currentDoc = await BloodInventory.findOne({
      hospitalId: req.user.id,
      bloodGroup
    });

    const previousUnits = currentDoc ? currentDoc.unitsAvailable : 0;
    let newUnits = previousUnits;

    if (operation === 'add') {
      newUnits = previousUnits + units;
      currentDoc = await BloodInventory.findOneAndUpdate(
        { hospitalId: req.user.id, bloodGroup },
        {
          $inc: { unitsAvailable: units },
          $set: {
            lastUpdated: new Date(),
            ...(minThreshold !== undefined ? { minThreshold } : {}),
            ...(maxCapacity !== undefined ? { maxCapacity } : {})
          },
          $setOnInsert: {
            minThreshold: minThreshold || 5,
            maxCapacity: maxCapacity || 100,
            expiryDates: []
          }
        },
        { new: true, upsert: true }
      );
    } else if (operation === 'subtract') {
      if (previousUnits < units) {
        return res.status(400).json({
          message: `Cannot subtract ${units} units. Only ${previousUnits} units of ${bloodGroup} are currently in stock.`
        });
      }
      newUnits = previousUnits - units;
      // Atomic deduction with safety guard
      currentDoc = await BloodInventory.findOneAndUpdate(
        {
          hospitalId: req.user.id,
          bloodGroup,
          unitsAvailable: { $gte: units }
        },
        {
          $inc: { unitsAvailable: -units },
          $set: {
            lastUpdated: new Date(),
            ...(minThreshold !== undefined ? { minThreshold } : {}),
            ...(maxCapacity !== undefined ? { maxCapacity } : {})
          }
        },
        { new: true }
      );

      if (!currentDoc) {
        return res.status(409).json({
          message: `Inventory conflict: stock changed during update. Please refresh and try again.`
        });
      }
    } else if (operation === 'set') {
      newUnits = units;
      currentDoc = await BloodInventory.findOneAndUpdate(
        { hospitalId: req.user.id, bloodGroup },
        {
          $set: {
            unitsAvailable: units,
            lastUpdated: new Date(),
            ...(minThreshold !== undefined ? { minThreshold } : {}),
            ...(maxCapacity !== undefined ? { maxCapacity } : {})
          },
          $setOnInsert: {
            minThreshold: minThreshold || 5,
            maxCapacity: maxCapacity || 100,
            expiryDates: []
          }
        },
        { new: true, upsert: true }
      );
    }

    // Record change in InventoryLog
    try {
      await InventoryLog.create({
        hospitalId: req.user.id,
        bloodGroup,
        operation,
        units,
        previousUnits,
        newUnits: currentDoc.unitsAvailable,
        reason: reason || `Manual inventory update: ${operation} ${units} units`,
        performedBy: req.user.id
      });
    } catch (logErr) {
      console.error('InventoryLog creation error:', logErr.message);
    }

    // Record audit log
    try {
      await AuditLog.create({
        action: 'hospital_updated',
        userId: req.user.id,
        details: `Hospital inventory updated: ${bloodGroup} ${operation} ${units} units (now: ${currentDoc.unitsAvailable})`
      });
      if (global.io) {
        global.io.emit('adminUpdate', { type: 'inventory_update', hospitalId: req.user.id });
        global.io.emit('inventoryUpdate', { hospitalId: req.user.id, bloodGroup, unitsAvailable: currentDoc.unitsAvailable });
      }
    } catch (e) {
      console.error('AuditLog error:', e.message);
    }

    // Check low stock alert
    if (currentDoc.unitsAvailable <= (currentDoc.minThreshold || 5)) {
      try {
        await Notification.create({
          userId: req.user.id,
          title: currentDoc.unitsAvailable === 0 ? 'CRITICAL: Blood Stock Exhausted' : 'Low Blood Stock Alert',
          message: `${bloodGroup} blood stock is ${currentDoc.unitsAvailable === 0 ? 'completely out of stock' : 'running low'}. Current units: ${currentDoc.unitsAvailable}`,
          type: 'system',
          priority: currentDoc.unitsAvailable === 0 ? 'urgent' : 'high',
          actionRequired: true,
          actionUrl: '/dashboard/hospital'
        });
      } catch (e) {}
    }

    res.json({ inventory: currentDoc, message: 'Inventory updated successfully' });
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

    const { status, urgency, bloodGroup } = req.query;
    let query = {};

    if (status && status !== 'all') {
      query.status = status;
    } else {
      query.status = { $in: ['pending', 'active', 'accepted', 'fulfilled'] };
    }

    if (urgency && urgency !== 'all') {
      if (urgency === 'critical' || urgency === 'emergency') {
        query.urgency = { $in: ['critical', 'emergency'] };
      } else {
        query.urgency = urgency;
      }
    }

    if (bloodGroup && bloodGroup !== 'all') {
      query.bloodGroup = bloodGroup;
    }

    const requests = await Request.find(query)
      .populate('requesterId', 'name email phone location')
      .populate('donorId', 'name email phone location')
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

    // 1. Total blood units across all 8 blood groups
    const inventory = await BloodInventory.find({ hospitalId: req.user.id });
    const totalBloodUnits = inventory.reduce((sum, item) => sum + (item.unitsAvailable || 0), 0);

    // 2. Low stock vs Critical stock groups
    const criticalStockItems = [];
    const lowStockItems = [];
    const expiringItems = [];

    ALL_BLOOD_GROUPS.forEach(group => {
      const item = inventory.find(i => i.bloodGroup === group);
      const units = item ? item.unitsAvailable : 0;
      const minThreshold = item?.minThreshold || 5;

      if (units === 0 || units <= Math.floor(minThreshold / 2)) {
        criticalStockItems.push({
          bloodGroup: group,
          unitsAvailable: units,
          minThreshold,
          severity: units === 0 ? 'Out of Stock' : 'Critically Low'
        });
      } else if (units <= minThreshold) {
        lowStockItems.push({
          bloodGroup: group,
          unitsAvailable: units,
          minThreshold,
          severity: 'Low Stock'
        });
      }

      if (item && item.getTotalExpiringUnits && item.getTotalExpiringUnits(7) > 0) {
        expiringItems.push({
          bloodGroup: group,
          expiringUnits: item.getTotalExpiringUnits(7)
        });
      }
    });

    // 3. Active requests: Requests currently awaiting hospital action or in progress
    // Existing project statuses: 'pending', 'active'
    const activeRequests = await Request.countDocuments({
      status: { $in: ['pending', 'active'] }
    });

    // 4. Requests handled today: Accepted, fulfilled, or completed today (IST date convention)
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const requestsHandledToday = await Request.countDocuments({
      hospitalId: req.user.id,
      status: { $in: ['accepted', 'fulfilled', 'completed'] },
      $or: [
        { responseDate: { $gte: startOfDay } },
        { updatedAt: { $gte: startOfDay } }
      ]
    });

    // Hospital-specific historical counts
    const completedRequests = await Request.countDocuments({
      hospitalId: req.user.id,
      status: { $in: ['completed', 'fulfilled'] }
    });

    const acceptedRequests = await Request.countDocuments({
      hospitalId: req.user.id,
      status: 'accepted'
    });

    const totalHandledRequests = await Request.countDocuments({
      hospitalId: req.user.id
    });

    res.json({
      stats: {
        totalBloodUnits,
        activeRequests,
        requestsHandledToday,
        lowStockCount: lowStockItems.length,
        criticalStockCount: criticalStockItems.length,
        expiringSoonCount: expiringItems.length,
        completedRequests,
        acceptedRequests,
        totalRequests: totalHandledRequests
      },
      alerts: {
        criticalStockItems,
        lowStockItems,
        expiringItems
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

    const { status, urgency, bloodGroup } = req.query;
    let query = { hospitalId: req.user.id };

    if (status && status !== 'all') {
      query.status = status;
    }
    if (urgency && urgency !== 'all') {
      query.urgency = urgency;
    }
    if (bloodGroup && bloodGroup !== 'all') {
      query.bloodGroup = bloodGroup;
    }

    const requests = await Request.find(query)
      .populate('requesterId', 'name phone location email')
      .populate('donorId', 'name phone location email')
      .sort({ updatedAt: -1, createdAt: -1 });

    const history = requests.map(request => ({
      _id: request._id,
      recipientName: request.recipientName || request.requesterId?.name || 'Patient',
      recipientAge: request.recipientAge || 'N/A',
      bloodGroup: request.bloodGroup,
      unitsNeeded: request.unitsNeeded,
      medicalReason: request.medicalReason || 'Emergency requirement',
      urgency: request.urgency,
      status: request.status,
      hospitalName: request.hospitalName || req.user.hospitalName,
      location: request.location,
      contactPerson: request.contactPerson || request.requesterId?.name || '',
      contactPhone: request.contactPhone || request.requesterId?.phone || '',
      createdAt: request.createdAt,
      responseDate: request.responseDate || request.updatedAt
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
      targetUnits: parseInt(targetUnits, 10) || 50,
      status: 'upcoming'
    });

    await camp.save();

    await Notification.create({
      userId: req.user.id,
      title: 'Donation Camp Created',
      message: `Your donation camp "${name}" has been successfully scheduled for ${new Date(date).toLocaleDateString()}`,
      type: 'system',
      priority: 'medium',
      actionRequired: false
    });

    res.status(201).json({ camp, message: 'Donation camp created successfully' });
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

    const { hospitalName, contactNumber, address, emergencyContact, location } = req.body;
    const updates = {};
    if (hospitalName) updates.hospitalName = hospitalName;
    if (contactNumber) updates.contactNumber = contactNumber;
    if (address) updates.address = address;
    if (emergencyContact) updates.emergencyContact = emergencyContact;
    if (location) updates.location = location;

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

const getInventoryReport = async (req, res) => {
  try {
    if (req.user.role !== 'hospital') {
      return res.status(403).json({ message: 'Only hospitals can access inventory reports' });
    }

    const { dateRange = 'week', bloodGroup = 'all', reportType = 'comprehensive' } = req.query;
    
    // Calculate accurate date range filter
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

    // 1. Fetch real current inventory data
    let inventoryQuery = { hospitalId: req.user.id };
    if (bloodGroup !== 'all') {
      inventoryQuery.bloodGroup = bloodGroup;
    }
    
    const inventoryRecords = await BloodInventory.find(inventoryQuery);

    const completeInventory = (bloodGroup === 'all' ? ALL_BLOOD_GROUPS : [bloodGroup]).map(group => {
      const item = inventoryRecords.find(i => i.bloodGroup === group);
      const units = item ? item.unitsAvailable : 0;
      const minThreshold = item?.minThreshold || 5;
      const maxCapacity = item?.maxCapacity || 100;
      return {
        bloodGroup: group,
        unitsAvailable: units,
        minThreshold,
        maxCapacity,
        status: units === 0 ? 'Out of Stock' : (units <= minThreshold ? 'Low Stock' : 'Good Stock'),
        severity: units === 0 ? 'Critical' : (units <= minThreshold ? 'Low' : 'Good')
      };
    });

    const totalUnits = completeInventory.reduce((sum, item) => sum + item.unitsAvailable, 0);

    // 2. Fetch real requests handled by or for this hospital in the date range
    let requestQuery = { 
      hospitalId: req.user.id,
      createdAt: { $gte: startDate, $lte: now }
    };
    if (bloodGroup !== 'all') {
      requestQuery.bloodGroup = bloodGroup;
    }
    
    const requests = await Request.find(requestQuery)
      .populate('requesterId', 'name phone')
      .sort({ createdAt: -1 });

    // 3. Fetch real inventory logs within date range
    let logQuery = {
      hospitalId: req.user.id,
      createdAt: { $gte: startDate, $lte: now }
    };
    if (bloodGroup !== 'all') {
      logQuery.bloodGroup = bloodGroup;
    }

    const inventoryLogs = await InventoryLog.find(logQuery)
      .sort({ createdAt: -1 })
      .limit(50);

    // Build 100% REAL activity log from InventoryLog and Request transactions
    const activityLog = [];

    inventoryLogs.forEach(log => {
      activityLog.push({
        id: log._id,
        date: log.createdAt,
        bloodGroup: log.bloodGroup,
        operation: log.operation,
        units: log.units,
        previousUnits: log.previousUnits,
        newUnits: log.newUnits,
        activityType: log.operation === 'add' ? 'Stock Added' :
                      log.operation === 'subtract' ? 'Stock Reduced' :
                      log.operation === 'fulfilled_request' ? 'Request Fulfilled' : 'Stock Adjusted',
        notes: log.reason || `${log.operation} ${log.units} units of ${log.bloodGroup}`
      });
    });

    // If there are accepted requests not yet in logs, add them to activity log
    requests.forEach(reqDoc => {
      if (reqDoc.status === 'accepted' || reqDoc.status === 'fulfilled' || reqDoc.status === 'completed') {
        const alreadyInLog = activityLog.some(a => a.notes?.includes(reqDoc._id.toString()));
        if (!alreadyInLog) {
          activityLog.push({
            id: reqDoc._id,
            date: reqDoc.responseDate || reqDoc.updatedAt || reqDoc.createdAt,
            bloodGroup: reqDoc.bloodGroup,
            operation: 'fulfilled_request',
            units: reqDoc.unitsNeeded,
            activityType: 'Blood Request Fulfilled',
            notes: `Supplied ${reqDoc.unitsNeeded} units to ${reqDoc.recipientName || reqDoc.requesterId?.name || 'Patient'}`
          });
        }
      }
    });

    activityLog.sort((a, b) => new Date(b.date) - new Date(a.date));

    // 4. Calculate real low stock alerts
    const lowStockAlerts = completeInventory
      .filter(item => item.unitsAvailable <= item.minThreshold)
      .map(item => ({
        bloodGroup: item.bloodGroup,
        currentUnits: item.unitsAvailable,
        minThreshold: item.minThreshold,
        severity: item.unitsAvailable === 0 ? 'Critical' : 'Low',
        message: item.unitsAvailable === 0 
          ? `${item.bloodGroup} is completely out of stock` 
          : `${item.bloodGroup} is below the minimum threshold (${item.minThreshold} units)`,
        recommendedAction: item.unitsAvailable === 0 
          ? 'Immediate restocking or emergency donor drive required' 
          : 'Plan donation camp or donor requests soon'
      }));

    // 5. Calculate real request summary
    const acceptedRequestsList = requests.filter(r => r.status === 'accepted' || r.status === 'fulfilled' || r.status === 'completed');
    const unitsSupplied = acceptedRequestsList.reduce((sum, r) => sum + (r.unitsNeeded || 1), 0);

    const respondedRequests = requests.filter(r => r.responseDate);
    let avgResponseTime = 'N/A';
    if (respondedRequests.length > 0) {
      const totalMs = respondedRequests.reduce((sum, r) => sum + (new Date(r.responseDate) - new Date(r.createdAt)), 0);
      const avgMs = totalMs / respondedRequests.length;
      const hours = Math.floor(avgMs / (1000 * 60 * 60));
      const mins = Math.floor((avgMs % (1000 * 60 * 60)) / (1000 * 60));
      avgResponseTime = `${hours}h ${mins}m`;
    }

    const requestSummary = {
      totalReceived: requests.length,
      accepted: acceptedRequestsList.length,
      rejected: requests.filter(r => r.status === 'rejected' || r.status === 'cancelled').length,
      pending: requests.filter(r => r.status === 'pending').length,
      unitsSupplied,
      avgResponseTime
    };

    const reportData = {
      hospitalName: req.user.hospitalName || 'Hospital',
      generatedDate: new Date().toISOString(),
      dateRange,
      bloodGroup,
      reportType,
      totalUnits,
      inventory: completeInventory,
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

const generateExcelReport = async (req, res) => {
  try {
    if (req.user.role !== 'hospital') {
      return res.status(403).json({ message: 'Only hospitals can generate reports' });
    }

    const inventory = await BloodInventory.find({ hospitalId: req.user.id });
    const requests = await Request.find({ hospitalId: req.user.id }).populate('requesterId', 'name phone');

    const reportData = {
      hospitalName: req.user.hospitalName || 'Hospital',
      generatedDate: new Date().toISOString(),
      inventory: ALL_BLOOD_GROUPS.map(group => {
        const item = inventory.find(i => i.bloodGroup === group);
        const units = item ? item.unitsAvailable : 0;
        const minThreshold = item?.minThreshold || 5;
        const maxCapacity = item?.maxCapacity || 100;
        return {
          bloodGroup: group,
          unitsAvailable: units,
          minThreshold,
          maxCapacity,
          status: units === 0 ? 'Out of Stock' : units <= minThreshold ? 'Low Stock' : 'Good Stock'
        };
      }),
      requests: requests.map(r => ({
        id: r._id,
        recipientName: r.recipientName || r.requesterId?.name || 'Patient',
        bloodGroup: r.bloodGroup,
        unitsNeeded: r.unitsNeeded,
        urgency: r.urgency,
        status: r.status,
        createdAt: r.createdAt,
        responseDate: r.responseDate
      }))
    };

    res.json(reportData);
  } catch (error) {
    console.error('Generate Excel report error:', error);
    res.status(500).json({ message: 'Server error generating report' });
  }
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
