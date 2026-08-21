const nodemailer = require('nodemailer');

const getMissingSmtpConfig = () => {
  return ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS'].filter((key) => !process.env[key]);
};

const isPlaceholderValue = (value = '') => {
  return /your_|replace_|example|hyperlocal\.com/i.test(String(value));
};

const getSmtpSender = () => {
  const configuredFromEmail = process.env.FROM_EMAIL;
  return configuredFromEmail && !isPlaceholderValue(configuredFromEmail)
    ? configuredFromEmail
    : process.env.SMTP_USER;
};

const sendEmail = async (options) => {
  const missingConfig = getMissingSmtpConfig();
  if (missingConfig.length > 0) {
    const error = new Error(`SMTP email is not configured: ${missingConfig.join(', ')}`);
    error.code = 'SMTP_CONFIG_MISSING';
    throw error;
  }

  const smtpPort = Number(process.env.SMTP_PORT);
  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const fromEmail = getSmtpSender();
  const fromName = process.env.FROM_NAME || 'InstantSeva';

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: smtpUser,
      pass: process.env.SMTP_PASS
    },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 20000,
    tls: {
      // Do not fail on invalid certs
      rejectUnauthorized: false
    }
  });

  const message = {
    from: `${fromName} <${fromEmail}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html
  };

  await transporter.sendMail(message);
};

module.exports = sendEmail;
module.exports.getMissingSmtpConfig = getMissingSmtpConfig;
module.exports.getSmtpSender = getSmtpSender;
