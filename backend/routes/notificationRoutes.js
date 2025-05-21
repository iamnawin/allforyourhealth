const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const notificationController = require('../controllers/notificationController');

// Get all notifications for the authenticated user
router.get('/', protect, notificationController.getNotifications);

// Get unread notifications for the authenticated user
router.get('/unread', protect, notificationController.getUnreadNotifications);

// Get a single notification
router.get('/:id', protect, notificationController.getNotification);

// Create a new notification
router.post('/', protect, notificationController.createNotification);

// Send notification via multiple channels (in-app, push, WhatsApp)
router.post('/send', protect, notificationController.sendNotification);

// Mark notification as read
router.put('/:id/read', protect, notificationController.markNotificationAsRead);

// Mark all notifications as read
router.put('/read-all', protect, notificationController.markAllNotificationsAsRead);

// Delete a notification
router.delete('/:id', protect, notificationController.deleteNotification);

// Update notification settings
router.put('/settings', protect, notificationController.updateNotificationSettings);

// Register device token for push notifications
router.post('/register-device', protect, notificationController.registerDeviceToken);

// Unregister device token
router.post('/unregister-device', protect, notificationController.unregisterDeviceToken);

module.exports = router;
