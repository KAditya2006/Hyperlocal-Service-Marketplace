const Booking = require('../models/Booking');
const User = require('../models/User');
const WorkerProfile = require('../models/WorkerProfile');
const AuditLog = require('../models/AuditLog');
const Review = require('../models/Review');
const { calculateBookingPrice, canTransitionBooking, canUpdatePaymentStatus, getPagination } = require('../utils/bookingRules');
const createNotification = require('../utils/createNotification');

const populateBooking = (query) => {
  return query
    .populate('user', 'name email avatar phone')
    .populate('worker', 'name email avatar phone');
};

const attachReviews = async (bookings) => {
  const plainBookings = bookings.map((booking) => booking.toObject ? booking.toObject() : booking);
  const bookingIds = plainBookings.map((booking) => booking._id);
  const reviews = await Review.find({ booking: { $in: bookingIds } }).select('booking rating comment createdAt');
  const reviewsByBooking = new Map(reviews.map((review) => [review.booking.toString(), review]));

  return plainBookings.map((booking) => ({
    ...booking,
    review: reviewsByBooking.get(booking._id.toString()) || null
  }));
};

exports.createBooking = async (req, res) => {
  try {
    const { workerId, service, scheduledDate, address, additionalNotes } = req.body;

    if (!workerId || !service || !scheduledDate || !address) {
      return res.status(400).json({ success: false, message: 'Worker, service, date, and address are required' });
    }

    if (req.user.role !== 'user') {
      return res.status(403).json({ success: false, message: 'Only customers can create bookings' });
    }

    const worker = await User.findOne({ _id: workerId, role: 'worker' });
    if (!worker) {
      return res.status(404).json({ success: false, message: 'Worker not found' });
    }

    const profile = await WorkerProfile.findOne({
      user: workerId,
      approvalStatus: 'approved',
      availability: true
    });

    if (!profile) {
      return res.status(400).json({ success: false, message: 'Worker is not available for bookings' });
    }

    const booking = await Booking.create({
      user: req.user.id,
      worker: workerId,
      service,
      scheduledDate,
      address,
      additionalNotes,
      totalPrice: calculateBookingPrice(profile)
    });

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
      title: 'New booking request',
      message: `${req.user.name} requested ${service}`,
      entityType: 'Booking',
      entityId: booking._id
    });

    const populatedBooking = await populateBooking(Booking.findById(booking._id));
    res.status(201).json({ success: true, data: populatedBooking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getBookings = async (req, res) => {
  try {
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

    const bookingsWithReviews = await attachReviews(bookings);

    res.status(200).json({
      success: true,
      data: bookingsWithReviews,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowedStatuses = ['accepted', 'rejected', 'completed', 'cancelled'];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid booking status' });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const isCustomer = booking.user.toString() === req.user.id.toString();
    const isWorker = booking.worker.toString() === req.user.id.toString();

    if (status === 'cancelled' && !isCustomer && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only the customer can cancel this booking' });
    }

    if (['accepted', 'rejected', 'completed'].includes(status) && !isWorker && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only the assigned worker can update this booking' });
    }

    if (!canTransitionBooking(booking.status, status)) {
      return res.status(400).json({ success: false, message: `Cannot change booking from ${booking.status} to ${status}` });
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
      title: 'Booking status updated',
      message: `Your booking is now ${status}`,
      entityType: 'Booking',
      entityId: booking._id
    });

    const populatedBooking = await populateBooking(Booking.findById(booking._id));
    res.status(200).json({ success: true, data: populatedBooking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updatePaymentStatus = async (req, res) => {
  try {
    const { paymentStatus, paymentMethod, paymentReference } = req.body;
    if (!['pending', 'paid', 'failed', 'refunded'].includes(paymentStatus)) {
      return res.status(400).json({ success: false, message: 'Invalid payment status' });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const isCustomer = booking.user.toString() === req.user.id.toString();
    if (!isCustomer && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only the customer or admin can update payment status' });
    }

    if (!canUpdatePaymentStatus(booking, paymentStatus)) {
      return res.status(400).json({ success: false, message: `Cannot mark payment ${paymentStatus} for a ${booking.status} booking` });
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
      title: 'Payment updated',
      message: `Payment status changed to ${paymentStatus}`,
      entityType: 'Booking',
      entityId: booking._id
    });

    const populatedBooking = await populateBooking(Booking.findById(booking._id));
    res.status(200).json({ success: true, data: populatedBooking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const numericRating = Number(rating);

    if (!Number.isFinite(numericRating) || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (booking.user.toString() !== req.user.id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the customer can review this booking' });
    }

    if (booking.status !== 'completed') {
      return res.status(400).json({ success: false, message: 'Only completed bookings can be reviewed' });
    }

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

    await WorkerProfile.findOneAndUpdate({ user: booking.worker }, {
      averageRating: stats[0]?.averageRating || 0,
      totalReviews: stats[0]?.totalReviews || 0
    });

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
      title: 'New review received',
      message: `${req.user.name} rated your work ${numericRating} stars`,
      entityType: 'Review',
      entityId: review._id
    });

    res.status(201).json({ success: true, data: review });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'This booking has already been reviewed' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};
