const express = require('express');
const { body } = require('express-validator');
const { auth, authorize } = require('../middleware/auth');
const {
  createRequest,
  getMyRequests,
  getNearbyRequests,
  respondToRequest,
  getRequestDetails,
  deleteRequest
} = require('../controllers/requestController');

const router = express.Router();

const createRequestValidation = [
  body('bloodGroup').isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).withMessage('Invalid blood group'),
  body('location.lat').optional().isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
  body('location.lng').optional().isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
  body('location.address').notEmpty().withMessage('Address is required'),
  body('urgency').isIn(['normal', 'urgent', 'emergency', 'critical', 'routine']).withMessage('Invalid urgency level'),
  body('unitsNeeded').isInt({ min: 1, max: 10 }).withMessage('Units needed must be between 1 and 10'),
  body('notes').optional().isLength({ max: 500 }).withMessage('Message too long'),
];

const respondValidation = [
  body('response').isIn(['accepted', 'rejected']).withMessage('Response must be accepted or rejected'),
  body('message').optional().isLength({ max: 500 }).withMessage('Message too long'),
];

router.post('/', auth, authorize('recipient', 'hospital'), createRequestValidation, createRequest);
router.post('/create', auth, authorize('recipient', 'hospital'), createRequestValidation, createRequest);

router.get('/my', auth, authorize('recipient'), getMyRequests);

router.get('/nearby', auth, authorize('donor', 'hospital'), getNearbyRequests);

router.put('/:requestId/respond', auth, authorize('donor', 'hospital'), respondValidation, respondToRequest);

router.get('/:requestId', auth, getRequestDetails);

router.delete('/:requestId', auth, authorize('recipient'), deleteRequest);

module.exports = router;
