const express = require('express');
const router = express.Router();
const { createBooking, createReview, getBookings, updateBookingStatus, updatePaymentStatus } = require('../controllers/bookingController');
const { protect, verifiedOnly } = require('../middleware/authMiddleware');

router.use(protect);
router.use(verifiedOnly);

router.route('/')
  .get(getBookings)
  .post(createBooking);

router.patch('/:id/status', updateBookingStatus);
router.patch('/:id/payment', updatePaymentStatus);
router.post('/:id/review', createReview);

module.exports = router;
