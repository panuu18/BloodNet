const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['recipient', 'donor', 'hospital', 'admin'],
    required: true
  },
  name: {
    type: String
  },
  hospitalName: {
    type: String
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  phone: {
    type: String,
    required: true
  },
  contactNumber: {
    type: String
  },
  bloodGroup: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
  },
  location: {
    lat: {
      type: Number,
      required: true
    },
    lng: {
      type: Number,
      required: true
    }
  },
  donorHealthDetails: {
    weight: {
      type: Number,
      min: 50
    },
    hemoglobin: {
      type: Number,
      min: 11
    },
    age: {
      type: Number,
      min: 18
    }
  },
  isAvailable: {
    type: Boolean,
    default: false
  },
  lastDonation: {
    type: Date,
    default: null
  },
  certificates: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Certificate'
  }]
}, {
  timestamps: true
});

// Password hashing will be done in the controller

userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  return user;
};

module.exports = mongoose.model('User', userSchema);
