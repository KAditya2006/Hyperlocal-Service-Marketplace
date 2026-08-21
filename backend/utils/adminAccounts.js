const User = require('../models/User');
const WorkerProfile = require('../models/WorkerProfile');
const Booking = require('../models/Booking');
const Notification = require('../models/Notification');
const OTP = require('../models/OTP');
const PasswordReset = require('../models/PasswordReset');
const PushSubscription = require('../models/PushSubscription');

const ACTIVE_BOOKING_STATUSES = ['pending', 'accepted', 'in_progress'];

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

const normalizeSkills = (skills) => {
  if (Array.isArray(skills)) {
    return skills.map((skill) => String(skill).trim()).filter(Boolean);
  }

  return String(skills || '')
    .split(',')
    .map((skill) => skill.trim())
    .filter(Boolean);
};

const getLocationPayload = ({ address, city, pincode }) => ({
  type: 'Point',
  coordinates: [0, 0],
  address: String(address || '').trim(),
  city: String(city || '').trim(),
  pincode: String(pincode || '').trim()
});

const hasActiveBookings = (userId) => {
  return Booking.exists({
    status: { $in: ACTIVE_BOOKING_STATUSES },
    $or: [
      { user: userId },
      { worker: userId }
    ]
  });
};

const softDeleteAccountData = async (userId) => {
  await Promise.all([
    Notification.deleteMany({ user: userId }),
    OTP.deleteMany({ user: userId }),
    PasswordReset.deleteMany({ user: userId }),
    PushSubscription.deleteMany({ user: userId }),
    WorkerProfile.findOneAndUpdate(
      { user: userId },
      { availabilityStatus: 'Offline', approvalStatus: 'rejected' }
    )
  ]);

  await User.findByIdAndUpdate(userId, {
    isDeleted: true,
    deletedAt: new Date(),
    suspendedAt: new Date(),
    isAdminApproved: false
  });
};

module.exports = {
  normalizeEmail,
  normalizeSkills,
  getLocationPayload,
  hasActiveBookings,
  softDeleteAccountData
};
