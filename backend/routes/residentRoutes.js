// routes/residentRoutes.js
const express = require('express');
const router = express.Router();
const residentController = require('../controllers/residentControllers'); // Note: with 's' at the end

// Create a new resident
router.post('/', residentController.createResident);

// Get all residents
router.get('/', residentController.getAllResidents);

// Export residents data - must be before /:id routes
router.get('/export', residentController.exportResidents);

// Get resident by ID - must be after specific routes
router.get('/:id', residentController.getResidentById);

// Update resident
router.put('/:id', residentController.updateResident);

// Delete resident
router.delete('/:id', residentController.deleteResident);

// Generate QR code for resident
router.get('/:id/qrcode', residentController.generateQRCode);

// Import residents data
router.post('/import', residentController.importResidents);

module.exports = router;