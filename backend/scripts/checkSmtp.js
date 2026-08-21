const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const sendEmail = require('../utils/sendEmail');

const maskEmail = (email = '') => {
  const [name, domain] = String(email).split('@');
  if (!name || !domain) return '<invalid email>';
  return `${name.slice(0, 2)}***@${domain}`;
};

const run = async () => {
  const to = process.env.SMTP_TEST_TO || process.env.SMTP_USER;

  if (!to) {
    throw new Error('Set SMTP_TEST_TO or SMTP_USER before running this check.');
  }

  await sendEmail({
    email: to,
    subject: 'InstantSeva SMTP test',
    message: 'InstantSeva SMTP email delivery is working.',
    html: '<p>InstantSeva SMTP email delivery is working.</p>'
  });

  console.log(`SMTP test email sent to ${maskEmail(to)}`);
};

run().catch((error) => {
  console.error('SMTP check failed');
  console.error(`code=${error.code || ''}`);
  console.error(`command=${error.command || ''}`);
  console.error(`responseCode=${error.responseCode || ''}`);
  console.error(`message=${error.message}`);
  process.exitCode = 1;
});
