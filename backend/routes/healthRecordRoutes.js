const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const healthRecordController = require('../controllers/healthRecordController');

// Get all health records for the authenticated user
router.get('/', protect, healthRecordController.getHealthRecords);

// Get health records by type
router.get('/type/:recordType', protect, healthRecordController.getHealthRecordsByType);

// Get shared health records
router.get('/shared', protect, healthRecordController.getSharedHealthRecords);

// Search health records
router.get('/search', protect, healthRecordController.searchHealthRecords);

// Get a single health record
router.get('/:id', protect, healthRecordController.getHealthRecord);

// Upload a new health record
router.post('/', protect, healthRecordController.uploadHealthRecord);

// Update a health record
router.put('/:id', protect, healthRecordController.updateHealthRecord);

// Delete a health record
router.delete('/:id', protect, healthRecordController.deleteHealthRecord);

// Share a health record with another user
router.post('/:id/share', protect, healthRecordController.shareHealthRecord);

// Unshare a health record
router.post('/:id/unshare', protect, healthRecordController.unshareHealthRecord);

module.exports = router;
