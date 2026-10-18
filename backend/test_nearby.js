const mongoose = require('mongoose');
const User = require('./models/User');
const Request = require('./models/Request');

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

mongoose.connect('mongodb://localhost:27017/bloodnet')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Get the user
    const user = await User.findOne({ name: /bhavana pol/i });
    console.log('\n=== User Location ===');
    console.log('User:', user.name);
    console.log('Location:', user.location);
    
    // Get all pending requests
    const allRequests = await Request.find({ status: 'pending' });
    console.log('\n=== Distance Calculation ===');
    
    allRequests.forEach((request, i) => {
      const distance = calculateDistance(
        user.location.lat, user.location.lng,
        request.location.lat, request.location.lng
      );
      
      console.log(`\nRequest ${i + 1}:`);
      console.log('  Blood Group:', request.bloodGroup);
      console.log('  Request Location:', request.location);
      console.log('  Distance from user:', Math.round(distance * 10) / 10, 'km');
      console.log('  Within 50km:', distance <= 50 ? 'YES' : 'NO');
      console.log('  Matches user blood group:', request.bloodGroup === user.bloodGroup ? 'YES' : 'NO');
    });
    
    // Simulate the getNearbyRequests logic
    const maxDistance = 50;
    const nearbyRequests = allRequests.filter(request => {
      const distance = calculateDistance(
        user.location.lat, user.location.lng,
        request.location.lat, request.location.lng
      );
      return distance <= maxDistance;
    });
    
    console.log('\n=== Final Result ===');
    console.log('Total pending requests:', allRequests.length);
    console.log('Requests within 50km:', nearbyRequests.length);
    
    mongoose.connection.close();
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
