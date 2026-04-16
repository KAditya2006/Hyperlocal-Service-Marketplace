require('dotenv').config({ path: './backend/.env' });
const connectDB = require('../config/db');
const User = require('../models/User');

const makeAdmin = async (email) => {
  try {
    await connectDB();
    const user = await User.findOneAndUpdate(
      { email },
      { role: 'admin', isAdminApproved: true },
      { new: true }
    );

    if (user) {
      console.log(`SUCCESS: User ${email} is now an ADMIN.`);
      console.log('User stats:', { email: user.email, role: user.role });
    } else {
      console.log(`ERROR: User with email ${email} not found.`);
    }
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

makeAdmin('kaditya39546@gmail.com');
