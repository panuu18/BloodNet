const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const socketIo = require('socket.io');
const bodyParser = require('body-parser');

dotenv.config();

const app = express();
const server = http.createServer(app);

// Allowed origins for CORS (REST & WebSockets)
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  process.env.CLIENT_URL,
  process.env.FRONTEND_URL
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (
      allowedOrigins.length === 0 ||
      allowedOrigins.includes(origin) ||
      allowedOrigins.includes('*') ||
      origin.endsWith('.vercel.app') ||
      process.env.NODE_ENV !== 'production'
    ) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

// Health check endpoint for cloud monitoring (Render, Railway, etc.)
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
  res.json({ message: 'BloodNet+ API Server is running', status: 'OK' });
});

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bloodnet', { serverSelectionTimeoutMS: 5000 })
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
    console.log('Starting server without MongoDB connection...');
  });

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const requestRoutes = require('./routes/requests');
const hospitalRoutes = require('./routes/hospitals');
const notificationRoutes = require('./routes/notifications');
// const certificateRoutes = require('./routes/certificates'); // Temporarily disabled

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/hospitals', hospitalRoutes);
app.use('/api/notifications', notificationRoutes);
// app.use('/api/certificates', certificateRoutes); // Temporarily disabled
app.use('/api/admin', require('./routes/admin'));

const connectedUsers = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('registerUser', (userId) => {
    connectedUsers.set(userId, socket.id);
    console.log(`User ${userId} registered with socket ${socket.id}`);
  });

  socket.on('disconnect', () => {
    for (const [userId, socketId] of connectedUsers.entries()) {
      if (socketId === socket.id) {
        connectedUsers.delete(userId);
        break;
      }
    }
    console.log('User disconnected:', socket.id);
  });
});

global.io = io;
global.connectedUsers = connectedUsers;

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

