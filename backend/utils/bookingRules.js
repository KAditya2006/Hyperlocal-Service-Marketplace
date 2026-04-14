const BOOKING_TRANSITIONS = {
  pending: ['accepted', 'rejected', 'cancelled'],
  accepted: ['completed', 'cancelled'],
  rejected: [],
  completed: [],
  cancelled: []
};

const canTransitionBooking = (fromStatus, toStatus) => {
  return (BOOKING_TRANSITIONS[fromStatus] || []).includes(toStatus);
};

const calculateBookingPrice = (profile) => {
  const amount = Number(profile?.pricing?.amount || 0);
  return Number.isFinite(amount) && amount > 0 ? amount : 0;
};

const canUpdatePaymentStatus = (booking, paymentStatus) => {
  if (!['pending', 'paid', 'failed', 'refunded'].includes(paymentStatus)) return false;
  if (booking.status === 'cancelled' && paymentStatus !== 'refunded') return false;
  if (paymentStatus === 'paid' && !['accepted', 'completed'].includes(booking.status)) return false;
  if (paymentStatus === 'refunded' && booking.paymentStatus !== 'paid') return false;
  return true;
};

const getPagination = (query = {}) => {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 50);
  return {
    page,
    limit,
    skip: (page - 1) * limit
  };
};

module.exports = {
  BOOKING_TRANSITIONS,
  calculateBookingPrice,
  canUpdatePaymentStatus,
  canTransitionBooking,
  getPagination
};
