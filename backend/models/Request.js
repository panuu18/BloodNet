const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
  requesterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  donorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  hospitalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  bloodGroup: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'completed'],
    default: 'pending'
  },
  location: {
    lat: {
      type: Number,
      default: 0
    },
    lng: {
      type: Number,
      default: 0
    },
    address: {
      type: String,
      required: true
    }
  },
  urgency: {
    type: String,
    enum: ['normal', 'urgent', 'emergency', 'critical', 'routine'],
    default: 'normal'
  },
  unitsNeeded: {
    type: Number,
    required: true,
    min: 1,
    max: 10
  },
  medicalReason: {
    type: String,
    default: 'Blood donation request'
  },
  recipientName: {
    type: String,
    default: ''
  },
  recipientAge: {
    type: Number,
    default: null
  },
  recipientGender: {
    type: String,
    enum: ['male', 'female', 'other'],
    default: 'other'
  },
  hospitalName: {
    type: String,
    default: ''
  },
  contactPerson: {
    type: String,
    default: ''
  },
  contactPhone: {
    type: String,
    default: ''
  },
  notes: {
    type: String,
    default: ''
  },
  responses: [{
    responderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    responderType: {
      type: String,
      enum: ['donor', 'hospital'],
      required: true
    },
    response: {
      type: String,
      enum: ['accepted', 'rejected'],
      required: true
    },
    message: {
      type: String,
      default: ''
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  completedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

requestSchema.index({ requesterId: 1, status: 1 });
requestSchema.index({ bloodGroup: 1, status: 1 });
requestSchema.index({ 'location.lat': 1, 'location.lng': 1 });
requestSchema.index({ urgency: 1, status: 1 });

module.exports = mongoose.model('Request', requestSchema);
