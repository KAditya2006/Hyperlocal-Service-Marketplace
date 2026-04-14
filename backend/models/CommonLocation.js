const mongoose = require('mongoose');

const commonLocationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  area: String,
  city: String,
  pincode: String,
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: [Number]
  },
  usageCount: {
    type: Number,
    default: 1
  },
  isGlobal: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

commonLocationSchema.index({ location: '2dsphere' });

const CommonLocation = mongoose.model('CommonLocation', commonLocationSchema);

module.exports = CommonLocation;
