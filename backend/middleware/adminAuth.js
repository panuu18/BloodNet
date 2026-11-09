const User = require('../models/User');

const adminAuth = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    // Check if user has admin role
    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }

    // Check if account is suspended/inactive (if status is explicitly set)
    if (user.status && user.status === 'inactive') {
      return res.status(403).json({ message: 'Account is inactive' });
    }

    // Attach admin user info to request
    req.admin = user;
    next();
  } catch (error) {
    console.error('Admin auth error:', error);
    res.status(500).json({ message: 'Server error during admin authentication' });
  }
};

module.exports = adminAuth;