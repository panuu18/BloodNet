const mongoose = require('mongoose');

const inventoryLogSchema = new mongoose.Schema({
  hospitalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  bloodGroup: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    required: true
  },
  operation: {
    type: String,
    enum: ['add', 'subtract', 'set', 'fulfilled_request'],
    required: true
  },
  units: {
    type: Number,
    required: true
  },
  previousUnits: {
    type: Number,
    required: true,
    min: 0
  },
  newUnits: {
    type: Number,
    required: true,
    min: 0
  },
  reason: {
    type: String,
    default: ''
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  relatedRequestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Request'
  }
}, {
  timestamps: true
});

inventoryLogSchema.index({ hospitalId: 1, createdAt: -1 });
inventoryLogSchema.index({ hospitalId: 1, bloodGroup: 1, createdAt: -1 });

module.exports = mongoose.model('InventoryLog', inventoryLogSchema);
