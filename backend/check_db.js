const mongoose = require('mongoose');
const User = require('./models/User');
const Request = require('./models/Request');

mongoose.connect('mongodb://localhost:27017/bloodnet')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Find user "bhavana pol"
    const user = await User.findOne({ name: /bhavana pol/i });
    console.log('\n=== User Info ===');
    if (user) {
      console.log('Name:', user.name);
      console.log('Email:', user.email);
      console.log('Role:', user.role);
      console.log('Blood Group:', user.bloodGroup);
      console.log('Location:', user.location);
      console.log('Is Available:', user.isAvailable);
    } else {
      console.log('User not found');
    }
    
    // Find all pending requests
    const requests = await Request.find({ status: 'pending' });
    console.log('\n=== Pending Requests ===');
    console.log('Total pending requests:', requests.length);
    requests.forEach((r, i) => {
      console.log(`\nRequest ${i + 1}:`);
      console.log('  Blood Group:', r.bloodGroup);
      console.log('  Location:', r.location);
      console.log('  Urgency:', r.urgency);
      console.log('  Units Needed:', r.unitsNeeded);
      console.log('  Status:', r.status);
    });
    
    // Find all requests regardless of status
    const allRequests = await Request.find({});
    console.log('\n=== All Requests ===');
    console.log('Total requests:', allRequests.length);
    
    mongoose.connection.close();
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
