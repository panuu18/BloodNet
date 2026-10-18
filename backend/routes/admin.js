const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { auth } = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

// Apply admin authentication to all admin routes
router.use(auth);
router.use(adminAuth);

// System Overview
router.get('/overview', adminController.getSystemOverview);
router.get('/metrics', adminController.getSystemMetrics);
router.get('/health', adminController.getSystemHealth);

// User Management
router.get('/users', adminController.getAllUsers);
router.get('/users/stats', adminController.getUserStats);
router.post('/users', adminController.createUser);
router.put('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);
router.post('/users/:id/activate', adminController.activateUser);
router.post('/users/:id/deactivate', adminController.deactivateUser);

// Blood Request Management
router.get('/requests', adminController.getAllRequests);
router.get('/requests/stats', adminController.getRequestStats);
router.put('/requests/:id/status', adminController.updateRequestStatus);
router.delete('/requests/:id', adminController.deleteRequest);
router.get('/requests/emergency', adminController.getEmergencyRequests);

// Hospital Management
router.get('/hospitals', adminController.getAllHospitals);
router.post('/hospitals', adminController.createHospital);
router.put('/hospitals/:id', adminController.updateHospital);
router.delete('/hospitals/:id', adminController.deleteHospital);
router.get('/hospitals/:id/inventory', adminController.getHospitalInventory);

// Analytics and Reports
router.get('/analytics/dashboard', adminController.getDashboardAnalytics);
router.get('/analytics/users', adminController.getUserAnalytics);
router.get('/analytics/requests', adminController.getRequestAnalytics);
router.get('/analytics/donations', adminController.getDonationAnalytics);
router.get('/reports/export', adminController.exportReports);

// System Alerts and Notifications
router.get('/alerts', adminController.getSystemAlerts);
router.post('/alerts', adminController.createAlert);
router.put('/alerts/:id', adminController.updateAlert);
router.delete('/alerts/:id', adminController.deleteAlert);
router.post('/alerts/:id/resolve', adminController.resolveAlert);

// Security and Audit
router.get('/security/logs', adminController.getSecurityLogs);
router.get('/audit/trail', adminController.getAuditTrail);
router.post('/security/lockdown', adminController.initiateLockdown);
router.post('/security/unlock', adminController.releaseLockdown);

// System Settings
router.get('/settings', adminController.getSystemSettings);
router.put('/settings', adminController.updateSystemSettings);
router.post('/settings/backup', adminController.initiateBackup);
router.get('/settings/backups', adminController.getBackupHistory);

// Emergency Response
router.post('/emergency/broadcast', adminController.emergencyBroadcast);
router.get('/emergency/contacts', adminController.getEmergencyContacts);
router.post('/emergency/contacts', adminController.addEmergencyContact);

// Content Management
router.get('/content/banners', adminController.getBanners);
router.post('/content/banners', adminController.createBanner);
router.put('/content/banners/:id', adminController.updateBanner);
router.delete('/content/banners/:id', adminController.deleteBanner);

module.exports = router;
