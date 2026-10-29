const mongoose = require('mongoose');

const menuAvailabilitySchema = new mongoose.Schema({
  itemKey: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    index: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  isAvailable: {
    type: Boolean,
    default: true,
    index: true,
  },
  updatedBy: {
    type: String,
    default: '',
    trim: true,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('MenuAvailability', menuAvailabilitySchema);
