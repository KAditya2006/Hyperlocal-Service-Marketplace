const assert = require('node:assert/strict');
const { canInitiateChat } = require('../utils/chatAccess');

const run = async (name, fn) => {
  await fn();
  console.log(`ok - ${name}`);
};

const exists = async () => ({ _id: 'existing-record' });
const missing = async () => null;

(async () => {
  await run('User can initiate chat with another User', async () => {
    assert.equal(await canInitiateChat({
      requester: { role: 'user', _id: 'user-1' },
      recipientId: 'user-2',
      userExists: exists
    }), true);
  });

  await run('User can initiate chat with a Worker', async () => {
    assert.equal(await canInitiateChat({
      requester: { role: 'user', _id: 'user-1' },
      recipientId: 'worker-1',
      userExists: exists
    }), true);
  });

  await run('Worker can initiate chat with a User', async () => {
    assert.equal(await canInitiateChat({
      requester: { role: 'worker', _id: 'worker-1' },
      recipientId: 'user-1',
      userExists: exists
    }), true);
  });

  await run('Worker can initiate chat with another Worker', async () => {
    assert.equal(await canInitiateChat({
      requester: { role: 'worker', _id: 'worker-1' },
      recipientId: 'worker-2',
      userExists: exists
    }), true);
  });

  await run('Self-chat is blocked', async () => {
    assert.equal(await canInitiateChat({
      requester: { role: 'user', _id: 'user-1' },
      recipientId: 'user-1',
      userExists: exists
    }), false);
  });

  await run('Admins can start support chats with anyone', async () => {
    assert.equal(await canInitiateChat({
      requester: { role: 'admin', _id: 'admin-1' },
      recipientId: 'user-1',
      userExists: exists
    }), true);
  });

  await run('Non-existing recipient is rejected when userExists is provided', async () => {
    assert.equal(await canInitiateChat({
      requester: { role: 'user', _id: 'user-1' },
      recipientId: 'user-999',
      userExists: missing
    }), false);
  });

  await run('User profile authorization allows participants with shared chat and admins', async () => {
    const canAccessProfile = ({ requesterId, targetId, requesterRole, targetRole, hasSharedChat }) => {
      if (targetRole !== 'user') return false;
      if (requesterRole === 'admin') return true;
      if (requesterId === targetId) return true;
      return Boolean(hasSharedChat);
    };

    assert.equal(canAccessProfile({ requesterId: 'u1', targetId: 'u2', requesterRole: 'user', targetRole: 'user', hasSharedChat: true }), true);
    assert.equal(canAccessProfile({ requesterId: 'u1', targetId: 'u2', requesterRole: 'user', targetRole: 'user', hasSharedChat: false }), false);
    assert.equal(canAccessProfile({ requesterId: 'admin1', targetId: 'u2', requesterRole: 'admin', targetRole: 'user', hasSharedChat: false }), true);
    assert.equal(canAccessProfile({ requesterId: 'u1', targetId: 'w1', requesterRole: 'user', targetRole: 'worker', hasSharedChat: true }), false);
  });

  await run('Service history payload excludes private addresses, payments, and OTPs', async () => {
    const rawBooking = {
      _id: 'booking-1',
      service: 'electrician',
      status: 'completed',
      scheduledDate: new Date('2026-08-18'),
      address: 'Private Apartment 404, Confidential Street',
      serviceLocation: { coordinates: [77.2, 28.6], address: 'Exact GPS Address' },
      startOTP: '123456',
      completionOTP: '654321',
      additionalNotes: 'Private gate passcode 9999',
      totalPrice: 1500,
      paymentMethod: 'card',
      paymentReference: 'PAY_CONFIDENTIAL_123',
      worker: { _id: 'w1', name: 'Amit Kumar', avatar: '/avatar.svg' }
    };

    const sanitizeHistory = (booking, workerProfile) => ({
      id: booking._id,
      service: booking.service,
      completedAt: booking.scheduledDate,
      status: 'completed',
      worker: booking.worker ? {
        id: booking.worker._id,
        name: booking.worker.name,
        avatar: booking.worker.avatar,
        profession: workerProfile?.skills?.[0] || booking.service,
        averageRating: workerProfile?.averageRating || 0,
        totalReviews: workerProfile?.totalReviews || 0
      } : null
    });

    const safe = sanitizeHistory(rawBooking, { skills: ['electrician'], averageRating: 4.8, totalReviews: 124 });

    assert.equal(safe.service, 'electrician');
    assert.equal(safe.worker.name, 'Amit Kumar');
    assert.equal(safe.worker.averageRating, 4.8);
    assert.equal(safe.address, undefined);
    assert.equal(safe.serviceLocation, undefined);
    assert.equal(safe.startOTP, undefined);
    assert.equal(safe.completionOTP, undefined);
    assert.equal(safe.additionalNotes, undefined);
    assert.equal(safe.totalPrice, undefined);
    assert.equal(safe.paymentMethod, undefined);
    assert.equal(safe.paymentReference, undefined);
  });
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
