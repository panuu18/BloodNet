const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const socketIo = require('socket.io');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');
const fs = require('fs');

// Load environment variables (.env file for local dev)
dotenv.config();

// Fix DNS resolution for MongoDB Atlas SRV connection strings in certain environments
const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  // Ignore if custom dns servers cannot be set
}

const app = express();
const server = http.createServer(app);

// Security & Performance middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false
}));
app.use(compression());

// Allowed origins for CORS (REST API & WebSockets)
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  process.env.CLIENT_URL,
  process.env.FRONTEND_URL,
  process.env.CORS_ORIGIN
].filter(Boolean);

const isOriginAllowed = (origin) => {
  if (!origin) return true; // Mobile apps, curl, server-to-server health checks
  if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) return true;
  if (origin.endsWith('.vercel.app') || /^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(origin)) return true;
  if (process.env.NODE_ENV !== 'production' && /^http:\/\/localhost:\d+$/.test(origin)) return true;
  return false;
};

const corsOptions = {
  origin: function (origin, callback) {
    if (isOriginAllowed(origin)) {
      return callback(null, true);
    }
    console.warn(`[CORS] Blocked request from origin: ${origin}`);
    return callback(null, true); // Fallback allow to avoid breaking clients while logging
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Content-Range', 'X-Content-Range']
};

const io = socketIo(server, {
  cors: {
    origin: (origin, callback) => callback(null, true),
    methods: ['GET', 'POST'],
    credentials: true
  }
});

app.use(cors(corsOptions));
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check endpoints for cloud monitoring (Render, Railway, etc.)
const healthCheckHandler = (req, res) => {
  const mongoStates = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  const state = mongoose.connection.readyState;
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    database: mongoStates[state] || 'unknown',
    mongoReadyState: state,
    hasMongoUriEnv: Boolean(process.env.MONGODB_URI),
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
};

app.get('/api/health', healthCheckHandler);
app.get('/healthz', healthCheckHandler);

// Database connection logic (Supports MongoDB Atlas and Local fallback)
const mongoUri = process.env.MONGODB_URI || (process.env.NODE_ENV === 'production' ? null : 'mongodb://localhost:27017/bloodnet');

if (!mongoUri && process.env.NODE_ENV === 'production') {
  console.error('[DATABASE] CRITICAL ERROR: MONGODB_URI environment variable is missing in production!');
}

const mongooseOptions = {
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
};

mongoose.connect(mongoUri || 'mongodb://localhost:27017/bloodnet', mongooseOptions)
  .then(async () => {
    console.log('[DATABASE] Successfully connected to MongoDB');
    
    // Ensure default Rohit S. Sanas admin account exists with 12345678
    try {
      const User = require('./models/User');
      const bcrypt = require('bcryptjs');
      const adminEmail = 'bloodnet@admin.com';
      let admin = await User.findOne({ email: adminEmail });
      const saltRounds = parseInt(process.env.BCRYPT_ROUNDS, 10) || 10;
      const salt = await bcrypt.genSalt(saltRounds);
      const hashedPassword = await bcrypt.hash('12345678', salt);
      if (!admin) {
        admin = new User({
          name: 'Rohit S. Sanas',
          email: adminEmail,
          password: hashedPassword,
          role: 'admin',
          phone: '+919970776113',
          location: { lat: 19.076, lng: 72.8777 },
          verified: true,
          status: 'active',
          bloodGroup: 'O+'
        });
        await admin.save();
        console.log('[AUTH] Rohit S. Sanas admin account initialized on startup');
      } else {
        admin.name = 'Rohit S. Sanas';
        admin.password = hashedPassword;
        admin.role = 'admin';
        admin.status = 'active';
        admin.verified = true;
        await admin.save();
        console.log('[AUTH] Rohit S. Sanas admin account credentials verified on startup');
      }
    } catch (e) {
      console.error('[AUTH] Error ensuring admin user on startup:', e.message);
    }
  })
  .catch((err) => {
    console.error('[DATABASE] MongoDB connection error:', err.message);
    console.warn('[DATABASE] Server is running without active database connection. Check MONGODB_URI.');
  });

mongoose.connection.on('error', (err) => {
  console.error('[DATABASE] Runtime MongoDB error:', err.message);
});

mongoose.connection.on('disconnected', () => {
  console.warn('[DATABASE] MongoDB disconnected.');
});

// Mount application API routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const requestRoutes = require('./routes/requests');
const hospitalRoutes = require('./routes/hospitals');
const notificationRoutes = require('./routes/notifications');

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/hospitals', hospitalRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', require('./routes/admin'));

// Serve frontend static build if bundled directly
const publicDir = path.join(__dirname, 'public');
if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir));
  app.get('/api/health', healthCheckHandler);
  app.get('/healthz', healthCheckHandler);
  app.use((req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/socket.io') || req.path.startsWith('/uploads')) {
      return next();
    }
    res.sendFile(path.join(publicDir, 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.json({
      name: 'BloodNet+ API Server',
      status: 'OK',
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
      health: '/api/health'
    });
  });
}

// WebSocket real-time connection handler
const connectedUsers = new Map();

io.on('connection', (socket) => {
  console.log('[SOCKET] Client connected:', socket.id);

  socket.on('registerUser', (userId) => {
    connectedUsers.set(userId, socket.id);
    console.log(`[SOCKET] User ${userId} registered with socket ${socket.id}`);
  });

  socket.on('disconnect', () => {
    for (const [userId, socketId] of connectedUsers.entries()) {
      if (socketId === socket.id) {
        connectedUsers.delete(userId);
        break;
      }
    }
    console.log('[SOCKET] Client disconnected:', socket.id);
  });
});

global.io = io;
global.connectedUsers = connectedUsers;

// Bind server to PORT and 0.0.0.0 (Mandatory for Render cloud web services)
const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`=========================================`);
  console.log(` BloodNet+ Backend is LIVE on port ${PORT}`);
  console.log(` Host: 0.0.0.0 | Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(` Health Check: http://0.0.0.0:${PORT}/api/health`);
  console.log(`=========================================`);
});

// Graceful shutdown handling for Render deployments and container restarts
const gracefulShutdown = (signal) => {
  console.log(`[PROCESS] Received ${signal}. Closing HTTP and database connections...`);
  server.close(async () => {
    console.log('[PROCESS] HTTP server closed.');
    try {
      await mongoose.connection.close(false);
      console.log('[DATABASE] MongoDB connection closed cleanly.');
    } catch (err) {
      console.error('[DATABASE] Error during MongoDB disconnect:', err.message);
    }
    process.exit(0);
  });

  // Force shutdown if cleanup takes longer than 10 seconds
  setTimeout(() => {
    console.error('[PROCESS] Forcefully shutting down after timeout.');
    process.exit(1);
  }, 10000).unref();
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
