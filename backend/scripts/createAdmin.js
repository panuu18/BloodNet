const mongoose = require('mongoose');
const User = require('../models/User');
const dotenv = require('dotenv');

dotenv.config();

const createAdminUser = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bloodnet');
    console.log('Connected to MongoDB');

    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('12345678', 10);

    // Remove old admin emails
    await User.deleteMany({ email: { $in: ['bloodnet@admin.com', 'bhavana.pol@admin.com', 'bhavanapol@gmail.com', 'bhavana@bloodnet.com'] } });

    const adminUser = new User({
      name: 'BloodNet Admin',
      email: 'bloodnet@admin.com',
      password: hashedPassword,
      role: 'admin',
      phone: '+91 98765 43210',
      location: {
        lat: 19.076,
        lng: 72.8777
      },
      verified: true,
      status: 'active',
      bloodGroup: 'O+'
    });

    await adminUser.save();

    console.log('BloodNet Admin user created successfully!');
    console.log('Name: BloodNet Admin');
    console.log('Email: bloodnet@admin.com');
    console.log('Password: 12345678');
    console.log('Role: admin');

  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

createAdminUser();
