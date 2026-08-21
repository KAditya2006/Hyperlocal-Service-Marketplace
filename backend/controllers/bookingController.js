const Booking = require('../models/Booking');
const User = require('../models/User');
const WorkerProfile = require('../models/WorkerProfile');
const AuditLog = require('../models/AuditLog');
const Review = require('../models/Review');
const { calculateBookingPrice, canTransitionBooking, canUpdatePaymentStatus, getPagination } = require('../utils/bookingRules');
const createNotification = require('../utils/createNotification');
const { generateOTP, sendOTPEmail } = require('../services/otpService');
const asyncHandler = require('../utils/asyncHandler');
const { syncDynamicWorkerProfile } = require('../utils/syncWorkerProfile');
const { normalizeSupportedService } = require('../utils/supportedServices');
const { normalizeServiceSearch } = require('../utils/serviceKeywords');
const {
  MAX_BOOKING_OTP_ATTEMPTS,
  attachContactDetails,
  getBookingOtpExpiry,
  hasBookingOtpExpired,
  isBookingCustomer,
  isBookingWorker,
  normalizeCoordinates,
  parseFutureScheduledDate,
  populateBooking,
  recordBookingOtpFailure,
  sanitizeBookingForViewer,
  sanitizeBookingsForViewer
} = require('../utils/bookingView');

exports.createBooking = asyncHandler(async (req, res) => {
  const { workerId, service, scheduledDate, address, additionalNotes, serviceLocation, coordinates } = req.body;

  if (!workerId || !service || !scheduledDate || !address) {
    return res.status(400).json({ success: false, message: req.t('bookingRequiredFields') });
  }

  const supportedService = normalizeSupportedService(service);
  if (!supportedService) {
    return res.status(400).json({ success: false, message: req.t('serviceUnavailableNow') });
  }

  const parsedScheduledDate = parseFutureScheduledDate(scheduledDate);
  if (!parsedScheduledDate) {
    return res.status(400).json({ success: false, message: req.t('bookingFutureDate') });
  }

  if (req.user.role !== 'user') {
    return res.status(403).json({ success: false, message: req.t('onlyCustomersCreateBookings') });
  }

  const worker = await User.findOne({ _id: workerId, role: 'worker' });
  if (!worker) {
    return res.status(404).json({ success: false, message: req.t('workerNotFound') });
  }

  const profile = await WorkerProfile.findOne({
    user: workerId,
    approvalStatus: 'approved',
    $or: [
      { availabilityStatus: 'Available' },
      { availabilityStatus: { $exists: false } }
    ]
  });

  if (!profile) {
    return res.status(400).json({ success: false, message: req.t('workerUnavailableBooking') });
  }

  const workerOffersService = (profile.skills || []).some((skill) => (
    normalizeSupportedService(normalizeServiceSearch(skill)) === supportedService
  ));
  if (!workerOffersService) {
    return res.status(400).json({ success: false, message: req.t('workerDoesNotOfferService') });
  }

  const serviceCoordinates = normalizeCoordinates(
    serviceLocation?.coordinates || coordinates
  );
  const bookingPayload = {
    user: req.user.id,
    worker: workerId,
    service: supportedService,
    scheduledDate: parsedScheduledDate,
    address,
    additionalNotes,
    totalPrice: calculateBookingPrice(profile)
  };

  if (serviceCoordinates) {
    bookingPayload.serviceLocation = {
      type: 'Point',
      coordinates: serviceCoordinates,
      address
    };
  }

  const booking = await Booking.create(bookingPayload);

  await AuditLog.create({
    actor: req.user.id,
    action: 'booking.created',
    entityType: 'Booking',
    entityId: booking._id,
    details: { worker: workerId, status: booking.status }
  });

  await createNotification({
    user: workerId,
    type: 'booking',
    titleKey: 'newBookingRequestTitle',
    messageKey: 'newBookingRequestMessage',
    messageParams: { name: req.user.name, service: supportedService },
    entityType: 'Booking',
    entityId: booking._id
  });

  const populatedBooking = await populateBooking(Booking.findById(booking._id));
  const finalData = await attachContactDetails([populatedBooking]);
  res.status(201).json({ success: true, data: sanitizeBookingForViewer(finalData[0], req.user) });
});

exports.getBookings = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = req.user.role === 'worker'
    ? { worker: req.user.id }
    : req.user.role === 'admin'
      ? {}
      : { user: req.user.id };

  const total = await Booking.countDocuments(filter);
  const bookings = await populateBooking(
    Booking.find(filter).sort({ scheduledDate: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
  );

  const bookingsWithDetails = await attachContactDetails(bookings);

  res.status(200).json({
    success: true,
    data: sanitizeBookingsForViewer(bookingsWithDetails, req.user),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 }
  });
});

exports.updateBookingStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const allowedStatuses = ['accepted', 'rejected', 'completed', 'cancelled'];

  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: req.t('invalidBookingStatus') });
  }

  const booking = await Booking.findById(req.params.id);
  if (!booking) {
    return res.status(404).json({ success: false, message: req.t('bookingNotFound') });
  }

  const isCustomer = booking.user.toString() === req.user.id.toString();
  const isWorker = booking.worker.toString() === req.user.id.toString();

  if (status === 'cancelled' && !isCustomer && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: req.t('onlyCustomerCancelBooking') });
  }

  if (['accepted', 'rejected', 'completed'].includes(status) && !isWorker && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: req.t('onlyAssignedWorkerUpdateBooking') });
  }

  if (!canTransitionBooking(booking.status, status)) {
    return res.status(400).json({
      success: false,
      message: req.t('cannotChangeBookingStatus', { from: booking.status, to: status })
    });
  }

  const previousStatus = booking.status;
  booking.status = status;
  await booking.save();

  await AuditLog.create({
    actor: req.user.id,
    action: 'booking.status_updated',
    entityType: 'Booking',
    entityId: booking._id,
    details: { from: previousStatus, to: status }
  });

  await createNotification({
    user: isWorker ? booking.user : booking.worker,
    type: 'booking',
    titleKey: 'bookingStatusUpdatedTitle',
    messageKey: 'bookingStatusUpdatedMessage',
    messageParams: { status },
    entityType: 'Booking',
    entityId: booking._id
  });

  if (status === 'accepted') {
    const otp = generateOTP();
    booking.startOTP = otp;
    booking.startOTPExpiresAt = getBookingOtpExpiry();
    booking.startOTPAttempts = 0;
    booking.startOTPVerified = false;
    await booking.save();

    const profile = await WorkerProfile.findOneAndUpdate(
      { user: booking.worker },
      { availabilityStatus: 'Busy' },
      { new: true }
    );
    await syncDynamicWorkerProfile(profile);

    const workerPopulated = await User.findById(booking.worker);
    await sendOTPEmail(workerPopulated.email, otp, 'Start', '6 hours');

    await createNotification({
      user: booking.worker,
      type: 'otp',
      titleKey: 'startOtpSentTitle',
      messageKey: 'startOtpSentMessage',
      entityType: 'Booking',
      entityId: booking._id
    });
  }

  if (status === 'completed' || status === 'cancelled' || status === 'rejected') {
    const profile = await WorkerProfile.findOneAndUpdate(
      { user: booking.worker },
      { availabilityStatus: 'Available' },
      { new: true }
    );
    await syncDynamicWorkerProfile(profile);
  }

  const populatedBooking = await populateBooking(Booking.findById(booking._id));
  const finalData = await attachContactDetails([populatedBooking]);
  res.status(200).json({ success: true, data: sanitizeBookingForViewer(finalData[0], req.user) });
});

exports.updatePaymentStatus = asyncHandler(async (req, res) => {
  const { paymentStatus, paymentMethod, paymentReference } = req.body;
  if (!['pending', 'paid', 'failed', 'refunded'].includes(paymentStatus)) {
    return res.status(400).json({ success: false, message: req.t('invalidPaymentStatus') });
  }

  const booking = await Booking.findById(req.params.id);
  if (!booking) {
    return res.status(404).json({ success: false, message: req.t('bookingNotFound') });
  }

  const isCustomer = booking.user.toString() === req.user.id.toString();
  if (!isCustomer && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: req.t('onlyCustomerOrAdminPayment') });
  }

  if (!canUpdatePaymentStatus(booking, paymentStatus)) {
    return res.status(400).json({
      success: false,
      message: req.t('cannotMarkPayment', { paymentStatus, bookingStatus: booking.status })
    });
  }

  booking.paymentStatus = paymentStatus;
  booking.paymentMethod = paymentMethod || booking.paymentMethod;
  booking.paymentReference = paymentReference || booking.paymentReference;
  await booking.save();

  await AuditLog.create({
    actor: req.user.id,
    action: 'booking.payment_updated',
    entityType: 'Booking',
    entityId: booking._id,
    details: { paymentStatus, paymentMethod, paymentReference }
  });

  await createNotification({
    user: booking.worker,
    type: 'payment',
    titleKey: 'paymentUpdatedTitle',
    messageKey: 'paymentUpdatedMessage',
    messageParams: { paymentStatus },
    entityType: 'Booking',
    entityId: booking._id
  });

  const populatedBooking = await populateBooking(Booking.findById(booking._id));
  const finalData = await attachContactDetails([populatedBooking]);
  res.status(200).json({ success: true, data: sanitizeBookingForViewer(finalData[0], req.user) });
});

exports.createReview = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;
  const numericRating = Number(rating);

  if (!Number.isFinite(numericRating) || numericRating < 1 || numericRating > 5) {
    return res.status(400).json({ success: false, message: req.t('ratingBetween') });
  }

  const booking = await Booking.findById(req.params.id);
  if (!booking) {
    return res.status(404).json({ success: false, message: req.t('bookingNotFound') });
  }

  if (booking.user.toString() !== req.user.id.toString()) {
    return res.status(403).json({ success: false, message: req.t('onlyCustomerReview') });
  }

  if (booking.status !== 'completed') {
    return res.status(400).json({ success: false, message: req.t('onlyCompletedBookingsReviewed') });
  }

  try {
    const review = await Review.create({
      booking: booking._id,
      user: booking.user,
      worker: booking.worker,
      rating: numericRating,
      comment
    });

    const stats = await Review.aggregate([
      { $match: { worker: booking.worker } },
      { $group: { _id: '$worker', averageRating: { $avg: '$rating' }, totalReviews: { $sum: 1 } } }
    ]);

    const profile = await WorkerProfile.findOneAndUpdate(
      { user: booking.worker },
      {
        averageRating: stats[0]?.averageRating || 0,
        totalReviews: stats[0]?.totalReviews || 0
      },
      { new: true }
    );
    await syncDynamicWorkerProfile(profile);

    await AuditLog.create({
      actor: req.user.id,
      action: 'review.created',
      entityType: 'Review',
      entityId: review._id,
      details: { booking: booking._id, worker: booking.worker, rating: numericRating }
    });

    await createNotification({
      user: booking.worker,
      type: 'review',
      titleKey: 'newReviewTitle',
      messageKey: 'newReviewMessage',
      messageParams: { name: req.user.name, rating: numericRating },
      entityType: 'Review',
      entityId: review._id
    });

    return res.status(201).json({ success: true, data: review });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: req.t('bookingAlreadyReviewed') });
    }
    throw error;
  }
});

exports.verifyStartOTP = asyncHandler(async (req, res) => {
  const submittedOtp = String(req.body.otp || '').trim();
  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    return res.status(404).json({ success: false, message: req.t('bookingNotFound') });
  }

  if (!isBookingCustomer(booking, req.user)) {
    return res.status(403).json({ success: false, message: req.t('onlyCustomerVerifyWorkerOtp') });
  }

  if (booking.status !== 'accepted') {
    return res.status(400).json({ success: false, message: req.t('bookingInvalidForVerification') });
  }

  if ((booking.startOTPAttempts || 0) >= MAX_BOOKING_OTP_ATTEMPTS) {
    return res.status(429).json({ success: false, message: req.t('tooManyBookingOtpAttempts') });
  }

  if (hasBookingOtpExpired(booking.startOTPExpiresAt)) {
    return res.status(400).json({ success: false, message: req.t('bookingOtpExpired') });
  }

  if (booking.startOTP !== submittedOtp) {
    const locked = await recordBookingOtpFailure(booking, 'startOTPAttempts');
    if (locked) {
      return res.status(429).json({ success: false, message: req.t('tooManyBookingOtpAttempts') });
    }
    return res.status(400).json({ success: false, message: req.t('invalidStartOtp') });
  }

  booking.status = 'in_progress';
  booking.startOTPVerified = true;
  booking.startOTP = undefined;
  booking.startOTPExpiresAt = undefined;
  booking.startOTPAttempts = 0;
  await booking.save();

  const profile = await WorkerProfile.findOneAndUpdate(
    { user: booking.worker },
    { availabilityStatus: 'Busy' },
    { new: true }
  );
  await syncDynamicWorkerProfile(profile);

  await createNotification({
    user: booking.worker,
    type: 'booking',
    titleKey: 'jobStartedTitle',
    messageKey: 'jobStartedMessage',
    entityType: 'Booking',
    entityId: booking._id
  });

  const completionOTP = generateOTP();
  booking.completionOTP = completionOTP;
  booking.completionOTPExpiresAt = getBookingOtpExpiry();
  booking.completionOTPAttempts = 0;
  booking.completionOTPVerified = false;
  await booking.save();

  const userPopulated = await User.findById(booking.user);
  await sendOTPEmail(userPopulated.email, completionOTP, 'Completion', '6 hours');

  const populatedBooking = await populateBooking(Booking.findById(booking._id));
  const finalData = await attachContactDetails([populatedBooking]);
  res.status(200).json({ success: true, message: req.t('jobVerifiedStarted'), data: sanitizeBookingForViewer(finalData[0], req.user) });
});

exports.verifyCompletionOTP = asyncHandler(async (req, res) => {
  const submittedOtp = String(req.body.otp || '').trim();
  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    return res.status(404).json({ success: false, message: req.t('bookingNotFound') });
  }

  if (!isBookingWorker(booking, req.user)) {
    return res.status(403).json({ success: false, message: req.t('onlyAssignedWorkerVerifyCompletionOtp') });
  }

  if (booking.status !== 'in_progress') {
    return res.status(400).json({ success: false, message: req.t('bookingNotInProgress') });
  }

  if ((booking.completionOTPAttempts || 0) >= MAX_BOOKING_OTP_ATTEMPTS) {
    return res.status(429).json({ success: false, message: req.t('tooManyBookingOtpAttempts') });
  }

  if (hasBookingOtpExpired(booking.completionOTPExpiresAt)) {
    return res.status(400).json({ success: false, message: req.t('bookingOtpExpired') });
  }

  if (booking.completionOTP !== submittedOtp) {
    const locked = await recordBookingOtpFailure(booking, 'completionOTPAttempts');
    if (locked) {
      return res.status(429).json({ success: false, message: req.t('tooManyBookingOtpAttempts') });
    }
    return res.status(400).json({ success: false, message: req.t('invalidCompletionOtp') });
  }

  booking.status = 'completed';
  booking.completionOTPVerified = true;
  booking.completionOTP = undefined;
  booking.completionOTPExpiresAt = undefined;
  booking.completionOTPAttempts = 0;
  await booking.save();

  const profile = await WorkerProfile.findOneAndUpdate(
    { user: booking.worker },
    { availabilityStatus: 'Available' },
    { new: true }
  );
  await syncDynamicWorkerProfile(profile);

  await createNotification({
    user: booking.user,
    type: 'booking',
    titleKey: 'jobCompletedTitle',
    messageKey: 'jobCompletedMessage',
    entityType: 'Booking',
    entityId: booking._id
  });

  const populatedBooking = await populateBooking(Booking.findById(booking._id));
  const finalData = await attachContactDetails([populatedBooking]);
  res.status(200).json({ success: true, message: req.t('jobVerifiedCompleted'), data: sanitizeBookingForViewer(finalData[0], req.user) });
});
