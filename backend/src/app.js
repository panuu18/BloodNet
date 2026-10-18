/**
 * BloodNet+ Enterprise Application
 * Modular architecture with all layers integrated
 */
// code from dev branch
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const Redis = require('redis');
const mongoose = require('mongoose');
const http = require('http');

// Import modules
const authModule = require('./modules/auth/auth.module');
const donorModule = require('./modules/donor/donor.module');
const notificationService = require('./services/notificationService');
const { createGeoIndexes } = require('./utils/geoUtils');

class BloodNetApp {
  constructor() {
    this.app = express();
    this.server = null;
    this.redisClient = null;
    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  /**
   * Initialize security and performance middleware
   */
  initializeMiddleware() {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
          imgSrc: ["'self'", "data:", "https:"],
          scriptSrc: ["'self'"],
          connectSrc: ["'self'", "wss:", "https://fcm.googleapis.com"]
        }
      }
    }));

    // CORS configuration
    this.app.use(cors({
      origin: process.env.FRONTEND_URL || "http://localhost:3000",
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization']
    }));

    // Performance middleware
    this.app.use(compression());
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Global rate limiting
    const globalLimiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 1000, // limit each IP to 1000 requests per windowMs
      message: 'Too many requests from this IP, please try again later.',
      standardHeaders: true,
      legacyHeaders: false,
      keyGenerator: (req) => {
        return req.ip;
      }
    });

    this.app.use(globalLimiter);

    // Request logging
    this.app.use((req, res, next) => {
      console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - IP: ${req.ip}`);
      next();
    });
  }

  /**
   * Initialize all route modules
   */
  initializeRoutes() {
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: process.env.APP_VERSION || '1.0.0',
        services: notificationService.getServiceStatus()
      });
    });

    // API routes
    this.app.use('/api/auth', authModule);
    this.app.use('/api/donor', donorModule);

    // Legacy routes (for backward compatibility)
    this.app.use('/api/requests', require('./routes/requests'));
    this.app.use('/api/users', require('./routes/users'));
    this.app.use('/api/hospitals', require('./routes/hospitals'));

    // Admin routes
    this.app.use('/api/admin', require('./modules/admin/admin.module'));

    // Analytics routes
    this.app.use('/api/analytics', require('./modules/analytics/analytics.module'));

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        message: 'Endpoint not found',
        path: req.originalUrl,
        method: req.method
      });
    });
  }

  /**
   * Initialize error handling
   */
  initializeErrorHandling() {
    // Global error handler
    this.app.use((error, req, res, next) => {
      console.error('Global error handler:', error);

      // Mongoose validation errors
      if (error.name === 'ValidationError') {
        const errors = Object.values(error.errors).map(err => ({
          field: err.path,
          message: err.message
        }));
        return res.status(400).json({
          message: 'Validation failed',
          errors
        });
      }

      // JWT errors
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          message: 'Invalid token'
        });
      }

      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          message: 'Token expired'
        });
      }

      // MongoDB duplicate key errors
      if (error.code === 11000) {
        const field = Object.keys(error.keyValue)[0];
        return res.status(400).json({
          message: `${field} already exists`,
          field
        });
      }

      // Default error response
      res.status(error.status || 500).json({
        message: error.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
      });
    });

    // Unhandled promise rejection handler
    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    });

    // Uncaught exception handler
    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error);
      process.exit(1);
    });
  }

  /**
   * Initialize database connections
   */
  async initializeDatabase() {
    try {
      // Connect to MongoDB
      const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/bloodnet';
      await mongoose.connect(mongoUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });

      console.log('Connected to MongoDB');

      // Create geospatial indexes
      await createGeoIndexes();

      // Connect to Redis
      this.redisClient = Redis.createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        retry_strategy: (options) => {
          if (options.error && options.error.code === 'ECONNREFUSED') {
            return new Error('Redis server refused connection');
          }
          if (options.total_retry_time > 1000 * 60 * 60) {
            return new Error('Retry time exhausted');
          }
          if (options.attempt > 10) {
            return undefined;
          }
          return Math.min(options.attempt * 100, 3000);
        }
      });

      this.redisClient.on('error', (err) => {
        console.error('Redis Client Error:', err);
      });

      this.redisClient.on('connect', () => {
        console.log('Connected to Redis');
      });

      await this.redisClient.connect();

    } catch (error) {
      console.error('Database initialization error:', error);
      throw error;
    }
  }

  /**
   * Start the application server
   */
  async start() {
    try {
      // Initialize database
      await this.initializeDatabase();

      // Create HTTP server
      this.server = http.createServer(this.app);

      // Initialize Socket.io
      const io = notificationService.initializeSocketIo(this.server);
      this.app.set('io', io);

      // Start server
      const PORT = process.env.PORT || 5000;
      this.server.listen(PORT, () => {
        console.log(`🚀 BloodNet+ Server running on port ${PORT}`);
        console.log(`📊 Health check: http://localhost:${PORT}/health`);
        console.log(`🔗 API Base: http://localhost:${PORT}/api`);
        console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      });

      // Graceful shutdown
      this.setupGracefulShutdown();

    } catch (error) {
      console.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  /**
   * Setup graceful shutdown
   */
  setupGracefulShutdown() {
    const shutdown = async (signal) => {
      console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);

      try {
        // Close HTTP server
        if (this.server) {
          await new Promise((resolve) => {
            this.server.close(resolve);
          });
          console.log('✅ HTTP server closed');
        }

        // Close Socket.io
        if (notificationService.io) {
          await new Promise((resolve) => {
            notificationService.io.close(resolve);
          });
          console.log('✅ Socket.io server closed');
        }

        // Close Redis connection
        if (this.redisClient) {
          await this.redisClient.quit();
          console.log('✅ Redis connection closed');
        }

        // Close MongoDB connection
        await mongoose.connection.close();
        console.log('✅ MongoDB connection closed');

        console.log('🎉 Graceful shutdown completed');
        process.exit(0);

      } catch (error) {
        console.error('❌ Error during shutdown:', error);
        process.exit(1);
      }
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  }

  /**
   * Get application instance
   */
  getApp() {
    return this.app;
  }

  /**
   * Get server instance
   */
  getServer() {
    return this.server;
  }

  /**
   * Get Redis client
   */
  getRedisClient() {
    return this.redisClient;
  }
}

// Create and export app instance
const bloodNetApp = new BloodNetApp();

// Start server if this file is run directly
if (require.main === module) {
  bloodNetApp.start();
}

module.exports = bloodNetApp;
