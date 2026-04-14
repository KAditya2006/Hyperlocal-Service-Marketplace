const mongoose = require('mongoose');

const workerProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  skills: [{
    type: String,
    required: true
  }],
  experience: {
    type: Number,
    required: true
  },
  bio: {
    type: String,
    required: true
  },
  pricing: {
    amount: Number,
    unit: {
      type: String,
      enum: ['hour', 'day', 'job'],
      default: 'hour'
    }
  },
  availability: {
    type: Boolean,
    default: true
  },
  averageRating: {
    type: Number,
    default: 0
  },
  totalReviews: {
    type: Number,
    default: 0
  },
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  kyc: {
    idProof: {
      url: String,
      publicId: String
    },
    selfie: {
      url: String,
      publicId: String
    },
    status: {
      type: String,
      enum: ['none', 'pending', 'verified', 'rejected'],
      default: 'none'
    },
    rejectionReason: String
  }
}, {
  timestamps: true
});

const WorkerProfile = mongoose.model('WorkerProfile', workerProfileSchema);

module.exports = WorkerProfile;
