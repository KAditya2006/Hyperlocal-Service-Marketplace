const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10),
    secure: process.env.SMTP_PORT == 465, // true for 465, false for others
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    },
    tls: {
      // Do not fail on invalid certs
      rejectUnauthorized: false
    }
  });

  const message = {
    from: `${process.env.FROM_NAME} <${process.env.SMTP_USER}>`, // Recommended for Gmail
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html
  };

  await transporter.sendMail(message);
};

module.exports = sendEmail;
