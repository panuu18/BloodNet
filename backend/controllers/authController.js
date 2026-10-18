const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Notification = require('../models/Notification');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'bloodnet_fallback_secret_key_2026', {
    expiresIn: '30d',
  });
};

const register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { role, name, hospitalName, email, password, phone, contactNumber, bloodGroup, location, donorHealthDetails } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    const userData = {
      role,
      email,
      password,
      location,
      phone: contactNumber || phone
    };

    if (role === 'hospital') {
      userData.hospitalName = hospitalName;
      userData.contactNumber = contactNumber;
    } else {
      userData.name = name;
      userData.bloodGroup = bloodGroup;
      userData.phone = phone;
      
      if (role === 'donor') {
        userData.donorHealthDetails = donorHealthDetails;
      }
    }

    // Hash password before saving
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Add hashed password to user data
    userData.password = hashedPassword;
    
    console.log('User data before save:', userData);
    const user = new User(userData);
    await user.save();

    const token = generateToken(user._id);

    await Notification.create({
      userId: user._id,
      title: 'Welcome to BloodNet+',
      message: `Your ${role} account has been successfully created. Start using our platform to save lives!`,
      type: 'system',
      priority: 'medium'
    });

    res.status(201).json({
      token,
      user: {
        id: user._id,
        role: user.role,
        name: user.name,
        hospitalName: user.hospitalName,
        email: user.email,
        phone: user.phone,
        contactNumber: user.contactNumber,
        bloodGroup: user.bloodGroup,
        location: user.location,
        isAvailable: user.isAvailable
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration', error: error.message });
  }
};

const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user._id);

    res.json({
      token,
      user: {
        id: user._id,
        role: user.role,
        name: user.name,
        hospitalName: user.hospitalName,
        email: user.email,
        phone: user.phone,
        contactNumber: user.contactNumber,
        bloodGroup: user.bloodGroup,
        location: user.location,
        isAvailable: user.isAvailable,
        lastDonation: user.lastDonation
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json({ user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error fetching profile' });
  }
};

module.exports = {
  register,
  login,
  getProfile
};
