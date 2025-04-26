// routes/residentRoutes.js
const express = require('express');
const router = express.Router();
const residentController = require('../controllers/residentController');

// Create a new resident
router.post('/', residentController.createResident);

// Get all residents
router.get('/', residentController.getAllResidents);

// Get resident by ID
router.get('/:id', residentController.getResidentById);

// Update resident
router.put('/:id', residentController.updateResident);

// Delete resident
router.delete('/:id', residentController.deleteResident);

// Generate QR code for resident
router.get('/:id/qrcode', residentController.generateQRCode);

// Backup residents data
router.get('/backup/export', residentController.exportResidents);

// Restore residents data
router.post('/backup/import', residentController.importResidents);

module.exports = router;