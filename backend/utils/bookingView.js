const User = require('../models/User');
const Review = require('../models/Review');

const BOOKING_OTP_TTL_MS = 6 * 60 * 60 * 1000;
const MAX_BOOKING_OTP_ATTEMPTS = 5;

const populateBooking = (query) => {
  return query
    .populate('user', 'name email avatar phone location')
    .populate('worker', 'name email avatar phone location');
};

const getId = (value) => {
  if (!value) return null;
  return value._id ? value._id.toString() : value.toString();
};

const getViewerId = (viewer) => {
  if (!viewer) return null;
  return viewer.id ? viewer.id.toString() : getId(viewer);
};

const isBookingCustomer = (booking, viewer) => getId(booking?.user) === getViewerId(viewer);
const isBookingWorker = (booking, viewer) => getId(booking?.worker) === getViewerId(viewer);

const parseFutureScheduledDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  if (date.getTime() <= Date.now()) return null;
  return date;
};

const getBookingOtpExpiry = () => new Date(Date.now() + BOOKING_OTP_TTL_MS);

const hasBookingOtpExpired = (expiresAt) => {
  if (!expiresAt) return true;
  return new Date(expiresAt).getTime() <= Date.now();
};

const recordBookingOtpFailure = async (booking, attemptsField) => {
  booking[attemptsField] = (booking[attemptsField] || 0) + 1;
  await booking.save();
  return booking[attemptsField] >= MAX_BOOKING_OTP_ATTEMPTS;
};

const normalizeCoordinates = (coordinates) => {
  if (!Array.isArray(coordinates) || coordinates.length < 2) return null;
  const [lng, lat] = coordinates.map(Number);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat === 0 && lng === 0) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return [lng, lat];
};

const sanitizeBookingForViewer = (booking, viewer) => {
  const plainBooking = booking?.toObject ? booking.toObject() : { ...booking };
  const startOTP = plainBooking.startOTP;
  const completionOTP = plainBooking.completionOTP;
  const canSeeStartOTP = isBookingWorker(plainBooking, viewer) && plainBooking.status === 'accepted' && !plainBooking.startOTPVerified;
  const canSeeCompletionOTP = isBookingCustomer(plainBooking, viewer) && plainBooking.status === 'in_progress' && !plainBooking.completionOTPVerified;

  delete plainBooking.startOTP;
  delete plainBooking.startOTPExpiresAt;
  delete plainBooking.startOTPAttempts;
  delete plainBooking.completionOTP;
  delete plainBooking.completionOTPExpiresAt;
  delete plainBooking.completionOTPAttempts;

  if (canSeeStartOTP) plainBooking.startOTP = startOTP;
  if (canSeeCompletionOTP) plainBooking.completionOTP = completionOTP;

  return plainBooking;
};

const sanitizeBookingsForViewer = (bookings, viewer) => {
  return bookings.map((booking) => sanitizeBookingForViewer(booking, viewer));
};

const attachContactDetails = async (bookings) => {
  const plainBookings = bookings.map((booking) => booking.toObject ? booking.toObject() : booking);
  const bookingIds = plainBookings.map((booking) => booking._id).filter(Boolean);
  const reviews = bookingIds.length
    ? await Review.find({ booking: { $in: bookingIds } }).select('booking rating comment createdAt')
    : [];
  const reviewsByBooking = new Map(reviews.map((review) => [review.booking.toString(), review]));

  const contactIds = new Set();
  plainBookings.forEach((booking) => {
    if (['accepted', 'in_progress'].includes(booking.status)) {
      const userId = getId(booking.user);
      const workerId = getId(booking.worker);
      if (userId) contactIds.add(userId);
      if (workerId) contactIds.add(workerId);
    }
  });

  const contacts = contactIds.size
    ? await User.find({ _id: { $in: [...contactIds] } }).select('phone').lean()
    : [];
  const phoneByUserId = new Map(contacts.map((contact) => [contact._id.toString(), contact.phone]));

  plainBookings.forEach((booking) => {
    booking.review = reviewsByBooking.get(booking._id.toString()) || null;

    if (['accepted', 'in_progress'].includes(booking.status)) {
      const userPhone = phoneByUserId.get(getId(booking.user));
      const workerPhone = phoneByUserId.get(getId(booking.worker));
      if (booking.user && typeof booking.user === 'object') booking.user.phone = userPhone;
      if (booking.worker && typeof booking.worker === 'object') booking.worker.phone = workerPhone;
    }
  });

  return plainBookings;
};

module.exports = {
  MAX_BOOKING_OTP_ATTEMPTS,
  populateBooking,
  parseFutureScheduledDate,
  getBookingOtpExpiry,
  hasBookingOtpExpired,
  recordBookingOtpFailure,
  normalizeCoordinates,
  sanitizeBookingForViewer,
  sanitizeBookingsForViewer,
  attachContactDetails,
  isBookingCustomer,
  isBookingWorker
};
