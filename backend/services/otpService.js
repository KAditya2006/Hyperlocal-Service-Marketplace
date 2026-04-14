const nodemailer = require('nodemailer');

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const sendOTPEmail = async (email, otp, type = 'Start') => {
  const isDev = process.env.NODE_ENV !== 'production';
  
  if (isDev) {
    console.log(`[DEV ONLY] OTP for ${email} (${type}): ${otp}`);
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: `Your ${type} OTP for Hyperlocal Service Booking`,
    html: `
      <div style="font-family: sans-serif; padding: 20px; color: #333;">
        <h2>Booking Verification Code</h2>
        <p>Please use the following code to verify your booking step:</p>
        <h1 style="color: #6366f1; letter-spacing: 5px;">${otp}</h1>
        <p>This code is valid for 10 minutes.</p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Email sending failed:', error);
    // In dev, we don't want to crash if email settings are missing
    if (!isDev) throw new Error('Could not send OTP email');
  }
};

module.exports = {
  generateOTP,
  sendOTPEmail
};
