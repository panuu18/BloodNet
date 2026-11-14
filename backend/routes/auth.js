const express = require('express');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const { auth } = require('../middleware/auth');
const {
  register,
  login,
  forgotPassword,
  resetPassword,
  getDonorRules,
  getProfile
} = require('../controllers/authController');
const DONOR_SCREENING_RULES = require('../config/donorRules');

const router = express.Router();

// Abuse prevention rate limiters
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // 15 attempts per IP per 15 min
  message: { message: 'Too many login attempts from this network. Please wait 15 minutes before trying again.' },
  standardHeaders: true,
  legacyHeaders: false
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 account registrations per hour per IP
  message: { message: 'Too many registration requests from this network. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});

const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 6,
  message: { message: 'Too many password reset requests. Please wait a few minutes before trying again.' },
  standardHeaders: true,
  legacyHeaders: false
});

const baseRegisterValidation = [
  body('role').isIn(['recipient', 'donor', 'hospital']).withMessage('Role must be recipient, donor, or hospital'),
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email address'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('confirmPassword').optional().custom((value, { req }) => {
    if (value && value !== req.body.password) {
      throw new Error('Confirm password does not match password');
    }
    return true;
  }),
  body('phone').optional().isLength({ min: 7 }).withMessage('Please provide a valid phone number with country code'),
  body('contactNumber').optional().isLength({ min: 7 }).withMessage('Please provide a valid contact number'),
  body('location.lat').optional().isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
  body('location.lng').optional().isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
  body('location.address').optional().trim(),
  body('location.city').optional().trim(),
];

const recipientValidation = [
  ...baseRegisterValidation,
  body('bloodGroup').isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).withMessage('Please select a valid blood group'),
  body().custom((body) => {
    if (!body.name && !body.firstName) {
      throw new Error('First name is required for recipient registration');
    }
    if (!body.phone && !body.contactNumber) {
      throw new Error('Phone number with country code is required');
    }
    return true;
  })
];

const donorValidation = [
  ...baseRegisterValidation,
  body('bloodGroup').isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).withMessage('Please select a valid blood group'),
  body('donorHealthDetails.weight').isFloat({ min: DONOR_SCREENING_RULES.MIN_WEIGHT_KG })
    .withMessage(`Donor weight must be at least ${DONOR_SCREENING_RULES.MIN_WEIGHT_KG} kg`),
  body('donorHealthDetails.hemoglobin').isFloat({ min: DONOR_SCREENING_RULES.MIN_HEMOGLOBIN_GDL })
    .withMessage(`Donor hemoglobin must be at least ${DONOR_SCREENING_RULES.MIN_HEMOGLOBIN_GDL} g/dL`),
  body('donorHealthDetails.age').isInt({ min: DONOR_SCREENING_RULES.MIN_AGE_YEARS })
    .withMessage(`Donor must be at least ${DONOR_SCREENING_RULES.MIN_AGE_YEARS} years old`),
  body().custom((body) => {
    if (!body.name && !body.firstName) {
      throw new Error('First name is required for donor registration');
    }
    if (!body.phone && !body.contactNumber) {
      throw new Error('Phone number with country code is required');
    }
    return true;
  })
];

const hospitalValidation = [
  ...baseRegisterValidation,
  body('hospitalName').notEmpty().trim().withMessage('Hospital name is required'),
  body().custom((body) => {
    if (!body.phone && !body.contactNumber) {
      throw new Error('Hospital phone number with country code is required');
    }
    return true;
  })
];

const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email address'),
  body('password').notEmpty().withMessage('Password is required'),
];

router.post('/register', registerLimiter, async (req, res, next) => {
  const { role } = req.body;

  let validations;
  switch (role) {
    case 'recipient':
      validations = recipientValidation;
      break;
    case 'donor':
      validations = donorValidation;
      break;
    case 'hospital':
      validations = hospitalValidation;
      break;
    default:
      return res.status(400).json({ message: 'Invalid role specified. Must be recipient, donor, or hospital.' });
  }

  await Promise.all(validations.map(validation => validation.run(req)));

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: errors.array()[0]?.msg || 'Validation failed',
      errors: errors.array()
    });
  }

  next();
}, register);

router.post('/login', loginLimiter, loginValidation, login);

router.post('/forgot-password', passwordResetLimiter, [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email address')
], (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0]?.msg || 'Valid email required' });
  }
  next();
}, forgotPassword);

router.post('/reset-password', passwordResetLimiter, [
  body('token').notEmpty().withMessage('Reset token is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('confirmPassword').custom((val, { req }) => {
    if (val !== req.body.password) {
      throw new Error('Passwords do not match');
    }
    return true;
  })
], (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0]?.msg || 'Validation failed' });
  }
  next();
}, resetPassword);

router.get('/donor-rules', getDonorRules);

router.get('/profile', auth, getProfile);

module.exports = router;
