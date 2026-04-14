const assert = require('node:assert/strict');
const { calculateBookingPrice, canTransitionBooking, canUpdatePaymentStatus, getPagination } = require('../utils/bookingRules');
const escapeRegex = require('../utils/escapeRegex');

const run = (name, fn) => {
  fn();
  console.log(`ok - ${name}`);
};

run('booking transitions allow only valid lifecycle moves', () => {
  assert.equal(canTransitionBooking('pending', 'accepted'), true);
  assert.equal(canTransitionBooking('pending', 'cancelled'), true);
  assert.equal(canTransitionBooking('accepted', 'completed'), true);
  assert.equal(canTransitionBooking('completed', 'accepted'), false);
  assert.equal(canTransitionBooking('cancelled', 'completed'), false);
});

run('booking price is calculated from worker profile pricing', () => {
  assert.equal(calculateBookingPrice({ pricing: { amount: 750 } }), 750);
  assert.equal(calculateBookingPrice({ pricing: { amount: -10 } }), 0);
  assert.equal(calculateBookingPrice({ pricing: { amount: '1200' } }), 1200);
  assert.equal(calculateBookingPrice({}), 0);
});

run('pagination clamps unsafe page and limit values', () => {
  assert.deepEqual(getPagination({ page: '2', limit: '10' }), { page: 2, limit: 10, skip: 10 });
  assert.deepEqual(getPagination({ page: '-1', limit: '999' }), { page: 1, limit: 50, skip: 0 });
});

run('payment status updates follow booking state rules', () => {
  assert.equal(canUpdatePaymentStatus({ status: 'accepted', paymentStatus: 'pending' }, 'paid'), true);
  assert.equal(canUpdatePaymentStatus({ status: 'pending', paymentStatus: 'pending' }, 'paid'), false);
  assert.equal(canUpdatePaymentStatus({ status: 'cancelled', paymentStatus: 'pending' }, 'paid'), false);
  assert.equal(canUpdatePaymentStatus({ status: 'cancelled', paymentStatus: 'paid' }, 'refunded'), true);
});

run('regex search terms are escaped before building Mongo filters', () => {
  assert.equal(escapeRegex('plumber.*(near)[me]'), 'plumber\\.\\*\\(near\\)\\[me\\]');
});
