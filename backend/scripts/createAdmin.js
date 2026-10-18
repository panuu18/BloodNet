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
    const hashedPassword = await bcrypt.hash('Bp2812211415#', 10);

    // Upsert Bhavana Pol admin account
    await User.deleteMany({ email: { $in: ['bhavana.pol@admin.com', 'bhavanapol@gmail.com', 'bhavana@bloodnet.com'] } });

    const adminUser = new User({
      name: 'Bhavana Pol',
      email: 'bhavana.pol@admin.com',
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

    // Also create secondary email alias bhavanapol@gmail.com for convenience
    const adminUserAlias = new User({
      name: 'Bhavana Pol',
      email: 'bhavanapol@gmail.com',
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

    await adminUserAlias.save();

    console.log('Bhavana Pol Admin user created successfully!');
    console.log('Name: Bhavana Pol');
    console.log('Emails: bhavana.pol@admin.com | bhavanapol@gmail.com');
    console.log('Password: Bp2812211415#');
    console.log('Role: admin');

  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

createAdminUser();
