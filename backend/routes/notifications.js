const express = require('express');
const { body } = require('express-validator');
const { auth, authorize } = require('../middleware/auth');
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount,
  createNotification,
  getNotificationStats
} = require('../controllers/notificationController');

const router = express.Router();

const createNotificationValidation = [
  body('userId').isMongoId().withMessage('Valid user ID is required'),
  body('title').notEmpty().withMessage('Title is required'),
  body('message').notEmpty().withMessage('Message is required'),
  body('type').isIn(['blood_request', 'request_accepted', 'request_rejected', 'request_completed', 'donor_available', 'hospital_response', 'system']).withMessage('Invalid notification type'),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority'),
  body('actionRequired').optional().isBoolean().withMessage('actionRequired must be boolean'),
  body('actionUrl').optional().isURL().withMessage('actionUrl must be a valid URL'),
];

router.get('/', auth, getNotifications);

router.get('/unread-count', auth, getUnreadCount);

router.get('/stats', auth, getNotificationStats);

router.put('/:notificationId/read', auth, markAsRead);

router.put('/read-all', auth, markAllAsRead);

router.delete('/:notificationId', auth, deleteNotification);

router.post('/create', auth, authorize('admin'), createNotificationValidation, createNotification);

module.exports = router;