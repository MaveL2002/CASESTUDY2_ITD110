// controllers/residentControllers.js
const Resident = require('../models/Resident');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

// Create a new resident
exports.createResident = async (req, res) => {
  try {
    const residentData = req.body;
    
    // Log received data for debugging
    console.log('Received data:', JSON.stringify(residentData, null, 2));
    
    // Validate required fields
    if (!residentData.firstName || !residentData.lastName || !residentData.dateOfBirth || 
        !residentData.gender || !residentData.civilStatus || !residentData.contactNumber) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
        missingFields: {
          firstName: !residentData.firstName,
          lastName: !residentData.lastName,
          dateOfBirth: !residentData.dateOfBirth,
          gender: !residentData.gender,
          civilStatus: !residentData.civilStatus,
          contactNumber: !residentData.contactNumber
        }
      });
    }
    
    // Generate unique resident ID
    const residentId = `BR${Date.now()}${Math.floor(Math.random() * 1000)}`;
    residentData.residentId = residentId;

    // Create QR code
    const qrData = JSON.stringify({
      residentId: residentId,
      name: `${residentData.firstName} ${residentData.lastName}`,
      barangay: residentData.address?.barangay || ''
    });
    
    const qrCodeUrl = await QRCode.toDataURL(qrData);
    residentData.qrCode = qrCodeUrl;

    // Create new resident
    const resident = new Resident(residentData);
    
    // Validate model before saving
    const validationError = resident.validateSync();
    if (validationError) {
      console.error('Validation error:', validationError);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: validationError.message,
        details: validationError.errors
      });
    }
    
    await resident.save();

    res.status(201).json({
      success: true,
      message: 'Resident created successfully',
      data: resident
    });
  } catch (error) {
    console.error('Error creating resident:', error);
    res.status(400).json({
      success: false,
      message: 'Error creating resident',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Get all residents
exports.getAllResidents = async (req, res) => {
  try {
    const residents = await Resident.find();
    res.status(200).json({
      success: true,
      count: residents.length,
      data: residents
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching residents',
      error: error.message
    });
  }
};

// Get resident by ID
exports.getResidentById = async (req, res) => {
  try {
    const resident = await Resident.findById(req.params.id);
    if (!resident) {
      return res.status(404).json({
        success: false,
        message: 'Resident not found'
      });
    }
    res.status(200).json({
      success: true,
      data: resident
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching resident',
      error: error.message
    });
  }
};

// Update resident
exports.updateResident = async (req, res) => {
  try {
    const resident = await Resident.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!resident) {
      return res.status(404).json({
        success: false,
        message: 'Resident not found'
      });
    }
    res.status(200).json({
      success: true,
      message: 'Resident updated successfully',
      data: resident
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error updating resident',
      error: error.message
    });
  }
};

// Delete resident
exports.deleteResident = async (req, res) => {
  try {
    const resident = await Resident.findByIdAndDelete(req.params.id);
    if (!resident) {
      return res.status(404).json({
        success: false,
        message: 'Resident not found'
      });
    }
    res.status(200).json({
      success: true,
      message: 'Resident deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting resident',
      error: error.message
    });
  }
};

// Generate QR code for resident
exports.generateQRCode = async (req, res) => {
  try {
    const resident = await Resident.findById(req.params.id);
    if (!resident) {
      return res.status(404).json({
        success: false,
        message: 'Resident not found'
      });
    }

    const qrData = JSON.stringify({
      residentId: resident.residentId,
      name: `${resident.firstName} ${resident.lastName}`,
      address: resident.address,
      contactNumber: resident.contactNumber
    });

    const qrCodeUrl = await QRCode.toDataURL(qrData);
    
    // Update resident with new QR code
    resident.qrCode = qrCodeUrl;
    await resident.save();

    res.status(200).json({
      success: true,
      message: 'QR code generated successfully',
      qrCode: qrCodeUrl
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error generating QR code',
      error: error.message
    });
  }
};

// Export residents data
exports.exportResidents = async (req, res) => {
  try {
    const residents = await Resident.find();
    const exportData = JSON.stringify(residents, null, 2);
    
    // Create backup directory if it doesn't exist
    const backupDir = path.join(__dirname, '../backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir);
    }

    // Generate filename with timestamp
    const filename = `residents_backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    const filepath = path.join(backupDir, filename);

    // Write to file
    fs.writeFileSync(filepath, exportData);

    // Send file to client
    res.download(filepath, filename, (err) => {
      if (err) {
        throw err;
      }
      // Optionally delete the file after sending
      // fs.unlinkSync(filepath);
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error exporting residents data',
      error: error.message
    });
  }
};

// Import residents data
exports.importResidents = async (req, res) => {
  try {
    const { residents } = req.body;
    
    if (!Array.isArray(residents)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid data format. Expected an array of residents.'
      });
    }

    // Clear existing data (optional - you might want to make this configurable)
    // await Resident.deleteMany({});

    // Insert all residents
    const insertedResidents = await Resident.insertMany(residents, { ordered: false });

    res.status(200).json({
      success: true,
      message: 'Residents data imported successfully',
      count: insertedResidents.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error importing residents data',
      error: error.message
    });
  }
};