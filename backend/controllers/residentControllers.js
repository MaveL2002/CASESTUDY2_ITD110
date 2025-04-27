// controllers/residentController.js
const Resident = require('../models/Resident');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

// Create a new resident
exports.createResident = async (req, res) => {
  try {
    console.log('Raw request body:', req.body);
    const residentData = req.body;
    
    // Convert birthdate to dateOfBirth to match the model
    if (residentData.birthdate && !residentData.dateOfBirth) {
      residentData.dateOfBirth = residentData.birthdate;
      delete residentData.birthdate;
    }
    
    // Convert address string to address object if needed
    if (typeof residentData.address === 'string') {
      residentData.address = {
        street: residentData.address,
        houseNumber: '',
        barangay: '',
        city: '',
        province: '',
        zipCode: ''
      };
    }
    
    // Log received data for debugging
    console.log('Processed data:', JSON.stringify(residentData, null, 2));
    
    // Validate required fields
    const requiredFields = ['firstName', 'lastName', 'dateOfBirth', 'gender', 'civilStatus', 'contactNumber'];
    const missingFields = requiredFields.filter(field => !residentData[field]);
    
    if (missingFields.length > 0) {
      console.log('Missing fields:', missingFields);
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
        missingFields: missingFields,
        receivedData: residentData
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

// Export residents data (supports both JSON and CSV)
exports.exportResidents = async (req, res) => {
  try {
    console.log('Export request received. Format:', req.query.format);
    const format = req.query.format || 'json'; // Default to JSON
    
    // Fetch residents data
    console.log('Fetching residents from database...');
    const residents = await Resident.find().lean(); // Use .lean() for better performance
    console.log(`Found ${residents.length} residents`);
    
    // Create backup directory if it doesn't exist
    const backupDir = path.join(__dirname, '../backups');
    console.log('Backup directory path:', backupDir);
    
    if (!fs.existsSync(backupDir)) {
      console.log('Creating backup directory...');
      fs.mkdirSync(backupDir, { recursive: true });
    }

    if (format === 'csv') {
      console.log('Converting to CSV format...');
      // Convert to CSV format
      const headers = ['residentId', 'firstName', 'lastName', 'middleName', 'dateOfBirth', 
                      'gender', 'civilStatus', 'contactNumber', 'email', 'address_street',
                      'address_houseNumber', 'address_barangay', 'address_city', 
                      'address_province', 'address_zipCode', 'occupation', 'monthlyIncome',
                      'voterStatus', 'registrationDate', 'status'];
      
      const csvRows = [];
      csvRows.push(headers.join(','));
      
      for (const resident of residents) {
        const row = headers.map(header => {
          if (header.startsWith('address_')) {
            const addressField = header.split('_')[1];
            const value = resident.address ? resident.address[addressField] : '';
            return `"${(value || '').toString().replace(/"/g, '""')}"`;
          }
          if (header === 'dateOfBirth' || header === 'registrationDate') {
            return resident[header] ? new Date(resident[header]).toISOString() : '';
          }
          const value = resident[header];
          return `"${(value !== null && value !== undefined ? value : '').toString().replace(/"/g, '""')}"`;
        });
        csvRows.push(row.join(','));
      }
      
      const csvContent = csvRows.join('\n');

      // Generate filename with timestamp
      const filename = `residents_backup_${new Date().toISOString().replace(/[:.]/g, '-')}.csv`;
      const filepath = path.join(backupDir, filename);
      console.log('Writing CSV file to:', filepath);

      // Write to file
      fs.writeFileSync(filepath, csvContent, 'utf8');

      // Send file to client
      console.log('Sending CSV file to client...');
      res.download(filepath, filename, (err) => {
        if (err) {
          console.error('Error sending file:', err);
          if (!res.headersSent) {
            res.status(500).json({
              success: false,
              message: 'Error sending file',
              error: err.message
            });
          }
        } else {
          // Delete the file after successful sending
          try {
            fs.unlinkSync(filepath);
            console.log('Temporary file deleted');
          } catch (unlinkErr) {
            console.error('Error deleting temporary file:', unlinkErr);
          }
        }
      });
    } else {
      console.log('Converting to JSON format...');
      // Export as JSON
      const exportData = JSON.stringify(residents, null, 2);
      
      // Generate filename with timestamp
      const filename = `residents_backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
      const filepath = path.join(backupDir, filename);
      console.log('Writing JSON file to:', filepath);

      // Write to file
      fs.writeFileSync(filepath, exportData, 'utf8');

      // Send file to client
      console.log('Sending JSON file to client...');
      res.download(filepath, filename, (err) => {
        if (err) {
          console.error('Error sending file:', err);
          if (!res.headersSent) {
            res.status(500).json({
              success: false,
              message: 'Error sending file',
              error: err.message
            });
          }
        } else {
          // Delete the file after successful sending
          try {
            fs.unlinkSync(filepath);
            console.log('Temporary file deleted');
          } catch (unlinkErr) {
            console.error('Error deleting temporary file:', unlinkErr);
          }
        }
      });
    }
  } catch (error) {
    console.error('Export error details:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Error exporting residents data',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
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