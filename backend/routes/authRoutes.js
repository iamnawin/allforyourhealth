const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyFirebaseToken } = require('../middleware/authMiddleware');

// Register a new user
router.post('/register', authController.register);

// Login user
router.post('/login', authController.login);

// Reset password
router.post('/reset-password', authController.resetPassword);

// Get current user (protected route)
router.get('/me', verifyFirebaseToken, authController.getCurrentUser);

// Logout user
router.post('/logout', authController.logout);

module.exports = router;
