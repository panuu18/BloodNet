const { validationResult } = require('express-validator');
const Request = require('../models/Request');
const User = require('../models/User');
const Notification = require('../models/Notification');
const BloodInventory = require('../models/BloodInventory');

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

const createRequest = async (req, res) => {
  try {
    console.log('Request body received:', req.body);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    // Get user profile information
    const user = await User.findById(req.user.id);
    if (!user) {
      console.log('User not found:', req.user.id);
      return res.status(404).json({ message: 'User not found' });
    }

    const {
      bloodGroup,
      location,
      urgency,
      unitsNeeded,
      notes
    } = req.body;

    console.log('Extracted data:', { bloodGroup, location, urgency, unitsNeeded, notes });

    const request = new Request({
      requesterId: req.user.id,
      bloodGroup,
      location,
      urgency,
      unitsNeeded,
      medicalReason: 'Blood donation request',
      recipientName: user.name || '',
      recipientAge: user.age || null,
      recipientGender: 'other',
      hospitalName: user.role === 'hospital' ? user.name : '',
      contactPerson: user.name || '',
      contactPhone: user.phone || '',
      notes: notes || ''
    });

    await request.save();

    const nearbyDonors = await User.find({
      role: 'donor',
      bloodGroup,
      isAvailable: true,
      'donorHealthDetails.age': { $gte: 18 },
      'donorHealthDetails.weight': { $gte: 50 },
      'donorHealthDetails.hemoglobin': { $gte: 11 }
    });

    const nearbyHospitals = await User.find({
      role: 'hospital',
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [location.lng, location.lat]
          },
          $maxDistance: 50000
        }
      }
    });

    const notifications = [];

    nearbyDonors.forEach(donor => {
      const distance = calculateDistance(
        location.lat, location.lng,
        donor.location.lat, donor.location.lng
      );

      if (distance <= 50) {
        notifications.push({
          userId: donor._id,
          title: 'Blood Donation Request',
          message: `Urgent: ${unitsNeeded} units of ${bloodGroup} blood needed within ${Math.round(distance)}km`,
          type: 'blood_request',
          relatedRequestId: request._id,
          relatedUserId: req.user.id,
          priority: urgency === 'emergency' ? 'urgent' : urgency === 'urgent' ? 'high' : 'medium',
          actionRequired: true,
          actionUrl: `/requests/${request._id}`,
          metadata: { distance, unitsNeeded, bloodGroup }
        });
      }
    });

    nearbyHospitals.forEach(hospital => {
      const distance = calculateDistance(
        location.lat, location.lng,
        hospital.location.lat, hospital.location.lng
      );

      if (distance <= 50) {
        notifications.push({
          userId: hospital._id,
          title: 'Blood Request from Nearby',
          message: `${unitsNeeded} units of ${bloodGroup} blood requested within ${Math.round(distance)}km`,
          type: 'blood_request',
          relatedRequestId: request._id,
          relatedUserId: req.user.id,
          priority: urgency === 'emergency' ? 'urgent' : 'medium',
          actionRequired: true,
          actionUrl: `/requests/${request._id}`,
          metadata: { distance, unitsNeeded, bloodGroup, hospitalName }
        });
      }
    });

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
      
      // Broadcast new request to all connected donors and hospitals
      const allConnectedUsers = Array.from(global.connectedUsers.keys());
      const connectedDonorsAndHospitals = await User.find({
        _id: { $in: allConnectedUsers },
        role: { $in: ['donor', 'hospital'] }
      });
      
      connectedDonorsAndHospitals.forEach(user => {
        const socketId = global.connectedUsers.get(user._id.toString());
        if (socketId) {
          // Send the actual request data for real-time updates
          global.io.to(socketId).emit('newBloodRequest', {
            request: request,
            type: 'new_request',
            timestamp: new Date()
          });
          
          // Also send notification
          const userNotification = notifications.find(n => n.userId.toString() === user._id.toString());
          if (userNotification) {
            global.io.to(socketId).emit('newNotification', userNotification);
          }
        }
      });
    }

    res.status(201).json({ request });
  } catch (error) {
    console.error('Create request error:', error);
    res.status(500).json({ message: 'Server error creating request' });
  }
};

const getMyRequests = async (req, res) => {
  try {
    console.log('Getting requests for user:', req.user.id);
    const requests = await Request.find({ requesterId: req.user.id })
      .populate('donorId', 'name phone location')
      .populate('hospitalId', 'hospitalName contactNumber location')
      .sort({ createdAt: -1 });

    console.log('Found requests:', requests);
    console.log('Number of requests:', requests.length);
    
    res.json({ requests });
  } catch (error) {
    console.error('Get my requests error:', error);
    res.status(500).json({ message: 'Server error fetching requests' });
  }
};

const getNearbyRequests = async (req, res) => {
  try {
    const { maxDistance = 200 } = req.query;
    const user = await User.findById(req.user.id);

    let query = {
      status: 'pending',
      'location.lat': { $exists: true },
      'location.lng': { $exists: true }
    };

    // Don't filter by bloodGroup - show all requests for friend referrals
    const requests = await Request.find(query)
      .populate('requesterId', 'name phone')
      .sort({ createdAt: -1 });

    const nearbyRequests = requests.filter(request => {
      const distance = calculateDistance(
        user.location.lat, user.location.lng,
        request.location.lat, request.location.lng
      );
      return distance <= maxDistance;
    });

    res.json({ requests: nearbyRequests });
  } catch (error) {
    console.error('Get nearby requests error:', error);
    res.status(500).json({ message: 'Server error fetching nearby requests' });
  }
};

const respondToRequest = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { requestId } = req.params;
    const { response, message } = req.body;

    const request = await Request.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Request is no longer pending' });
    }

    const existingResponse = request.responses.find(
      r => r.responderId.toString() === req.user.id
    );

    if (existingResponse) {
      return res.status(400).json({ message: 'You have already responded to this request' });
    }

    request.responses.push({
      responderId: req.user.id,
      responderType: req.user.role,
      response,
      message,
      timestamp: new Date()
    });

    if (response === 'accepted') {
      if (req.user.role === 'donor') {
        request.donorId = req.user.id;
      } else if (req.user.role === 'hospital') {
        request.hospitalId = req.user.id;
      }
      request.status = 'accepted';
    }

    await request.save();

    await Notification.create({
      userId: request.requesterId,
      title: `Request ${response === 'accepted' ? 'Accepted' : 'Rejected'}`,
      message: `Your blood request has been ${response === 'accepted' ? 'accepted' : 'rejected'} by ${req.user.role === 'donor' ? 'a donor' : 'a hospital'}`,
      type: response === 'accepted' ? 'request_accepted' : 'request_rejected',
      relatedRequestId: request._id,
      relatedUserId: req.user.id,
      priority: 'high',
      actionRequired: false
    });

    const requesterSocketId = global.connectedUsers.get(request.requesterId.toString());
    if (requesterSocketId) {
      global.io.to(requesterSocketId).emit('requestUpdate', {
        requestId: request._id,
        status: request.status,
        responder: req.user
      });
    }

    res.json({ request });
  } catch (error) {
    console.error('Respond to request error:', error);
    res.status(500).json({ message: 'Server error responding to request' });
  }
};

const getRequestDetails = async (req, res) => {
  try {
    const { requestId } = req.params;
    
    const request = await Request.findById(requestId)
      .populate('requesterId', 'name phone email location')
      .populate('donorId', 'name phone location')
      .populate('hospitalId', 'hospitalName contactNumber location')
      .populate('responses.responderId', 'name hospitalName phone location');

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    res.json({ request });
  } catch (error) {
    console.error('Get request details error:', error);
    res.status(500).json({ message: 'Server error fetching request details' });
  }
};

const deleteRequest = async (req, res) => {
  try {
    console.log('Delete request received');
    console.log('Request params:', req.params);
    console.log('User ID:', req.user.id);
    
    const { requestId } = req.params;
    
    // Find the request and verify it belongs to the user
    const request = await Request.findOne({ _id: requestId, requesterId: req.user.id });
    
    console.log('Found request:', request);
    
    if (!request) {
      console.log('Request not found or unauthorized');
      return res.status(404).json({ message: 'Request not found or you do not have permission to delete it' });
    }
    
    console.log('Request status:', request.status);
    
    // Only allow deletion of pending requests
    if (request.status !== 'pending') {
      console.log('Request not pending, cannot delete');
      return res.status(400).json({ message: 'Cannot delete request that is already processed' });
    }
    
    console.log('Deleting request...');
    await Request.findByIdAndDelete(requestId);
    console.log('Request deleted successfully');
    
    res.json({ message: 'Request deleted successfully' });
  } catch (error) {
    console.error('Delete request error:', error);
    res.status(500).json({ message: 'Server error deleting request' });
  }
};

module.exports = {
  createRequest,
  getMyRequests,
  getNearbyRequests,
  respondToRequest,
  getRequestDetails,
  deleteRequest
};
