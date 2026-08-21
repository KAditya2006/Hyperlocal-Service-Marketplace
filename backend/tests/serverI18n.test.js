const assert = require('node:assert/strict');
const { tServer } = require('../utils/serverI18n');

const run = (name, fn) => {
  fn();
  console.log(`ok - ${name}`);
};

run('server translations interpolate params', () => {
  assert.equal(
    tServer('verificationRejectedMessage', 'en', { reason: 'Documents were unclear' }),
    'Your verification request was declined. Reason: Documents were unclear. Please re-upload your ID proof.'
  );
});

run('server translations fall back to english for unknown languages', () => {
  assert.equal(
    tServer('invalidCredentials', 'xx'),
    'Invalid credentials'
  );
});

run('server translations return key when message is missing', () => {
  assert.equal(
    tServer('totallyMissingMessage', 'en'),
    'totallyMissingMessage'
  );
});

run('server translations normalize regional language codes', () => {
  assert.equal(
    tServer('invalidCredentials', 'en-IN'),
    'Invalid credentials'
  );
});
