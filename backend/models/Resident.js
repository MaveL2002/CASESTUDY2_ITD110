// models/Resident.js
const mongoose = require('mongoose');

const residentSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  middleName: {
    type: String,
    trim: true
  },
  dateOfBirth: {
    type: Date,
    required: true
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
    required: true
  },
  civilStatus: {
    type: String,
    enum: ['Single', 'Married', 'Widowed', 'Separated', 'Divorced'],
    required: true
  },
  contactNumber: {
    type: String,
    required: true
  },
  email: {
    type: String,
    trim: true
  },
  address: {
    street: String,
    houseNumber: String,
    barangay: String,
    city: String,
    province: String,
    zipCode: String
  },
  occupation: {
    type: String,
    trim: true
  },
  monthlyIncome: {
    type: Number
  },
  voterStatus: {
    type: Boolean,
    default: false
  },
  registrationDate: {
    type: Date,
    default: Date.now
  },
  residentId: {
    type: String,
    unique: true,
    required: true
  },
  qrCode: {
    type: String
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Deceased', 'Transferred'],
    default: 'Active'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Resident', residentSchema);