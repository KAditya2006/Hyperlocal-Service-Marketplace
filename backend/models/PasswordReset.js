const mongoose = require('mongoose');

const passwordResetSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  tokenHash: {
    type: String,
    required: true
  },
  attempts: {
    type: Number,
    default: 0,
    min: 0
  },
  lastAttemptAt: Date,
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 900
  }
});

const PasswordReset = mongoose.model('PasswordReset', passwordResetSchema);

module.exports = PasswordReset;
