// models/Resident.js
const mongoose = require('mongoose');

const residentSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true
  },
  middleName: {
    type: String,
    trim: true
  },
  dateOfBirth: {
    type: Date,
    required: [true, 'Date of birth is required']
  },
  gender: {
    type: String,
    enum: {
      values: ['Male', 'Female', 'Other'],
      message: '{VALUE} is not supported'
    },
    required: [true, 'Gender is required']
  },
  civilStatus: {
    type: String,
    enum: {
      values: ['Single', 'Married', 'Widowed', 'Separated', 'Divorced'],
      message: '{VALUE} is not supported'
    },
    required: [true, 'Civil status is required']
  },
  contactNumber: {
    type: String,
    required: [true, 'Contact number is required']
  },
  email: {
    type: String,
    trim: true
  },
  address: {
    street: { type: String, default: '' },
    houseNumber: { type: String, default: '' },
    barangay: { type: String, default: '' },
    city: { type: String, default: '' },
    province: { type: String, default: '' },
    zipCode: { type: String, default: '' }
  },
  occupation: {
    type: String,
    trim: true,
    default: ''
  },
  monthlyIncome: {
    type: Number,
    default: 0
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
    required: [true, 'Resident ID is required']
  },
  qrCode: {
    type: String
  },
  status: {
    type: String,
    enum: {
      values: ['Active', 'Inactive', 'Deceased', 'Transferred'],
      message: '{VALUE} is not supported'
    },
    default: 'Active'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Resident', residentSchema);