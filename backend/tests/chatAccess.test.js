const assert = require('node:assert/strict');
const { canInitiateChat } = require('../utils/chatAccess');

const run = async (name, fn) => {
  await fn();
  console.log(`ok - ${name}`);
};

const existsWhen = (expectedFilter) => async (filter) => {
  assert.deepEqual(filter, expectedFilter);
  return { _id: 'existing-record' };
};

const missing = async () => null;

(async () => {
  await run('customers can start chats only with approved worker profiles', async () => {
    assert.equal(await canInitiateChat({
      requester: { role: 'user', _id: 'customer-1' },
      recipientId: 'worker-1',
      workerProfileExists: existsWhen({ user: 'worker-1', approvalStatus: 'approved' })
    }), true);

    assert.equal(await canInitiateChat({
      requester: { role: 'user', _id: 'customer-1' },
      recipientId: 'worker-2',
      workerProfileExists: missing
    }), false);
  });

  await run('workers can start chats only with customers from their jobs', async () => {
    assert.equal(await canInitiateChat({
      requester: { role: 'worker', _id: 'worker-1' },
      recipientId: 'customer-1',
      bookingExists: existsWhen({ worker: 'worker-1', user: 'customer-1' })
    }), true);

    assert.equal(await canInitiateChat({
      requester: { role: 'worker', _id: 'worker-1' },
      recipientId: 'customer-2',
      bookingExists: missing
    }), false);
  });

  await run('admins can start support chats without marketplace restrictions', async () => {
    assert.equal(await canInitiateChat({
      requester: { role: 'admin', _id: 'admin-1' },
      recipientId: 'user-1'
    }), true);
  });
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
