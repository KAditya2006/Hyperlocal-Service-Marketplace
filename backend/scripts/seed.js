require('dotenv').config();
const connectDB = require('../config/db');
const User = require('../models/User');
const WorkerProfile = require('../models/WorkerProfile');
const Booking = require('../models/Booking');
const Review = require('../models/Review');

const ensureUser = async (email, data) => {
  let user = await User.findOne({ email });
  if (user) {
    Object.assign(user, data);
    await user.save();
    return user;
  }

  user = await User.create({ ...data, email, password: 'password123' });
  return user;
};

const seed = async () => {
  await connectDB();

  await ensureUser('admin@hyperlocal.test', { name: 'Admin User', role: 'admin', isVerified: true });
  const customer = await ensureUser('customer@hyperlocal.test', { name: 'Customer User', role: 'user', isVerified: true });
  const worker = await ensureUser('worker@hyperlocal.test', {
      name: 'Ravi Electrician',
      role: 'worker',
      isVerified: true,
      location: { type: 'Point', coordinates: [77.209, 28.6139], address: 'New Delhi' }
    });

  await WorkerProfile.findOneAndUpdate(
    { user: worker._id },
    {
      user: worker._id,
      skills: ['Electrical', 'Repairing'],
      experience: 5,
      bio: 'Licensed electrician for home wiring, appliance repair, and quick emergency fixes.',
      pricing: { amount: 700, unit: 'job' },
      availability: true,
      approvalStatus: 'approved',
      kyc: { status: 'verified' }
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const booking = await Booking.findOneAndUpdate(
    { user: customer._id, worker: worker._id, service: 'Fan repair' },
    {
      user: customer._id,
      worker: worker._id,
      service: 'Fan repair',
      scheduledDate: new Date(Date.now() + 86400000),
      status: 'completed',
      address: 'Sample customer address',
      additionalNotes: 'Ceiling fan makes noise at high speed.',
      totalPrice: 700,
      paymentStatus: 'paid',
      paymentMethod: 'manual'
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  await Review.findOneAndUpdate(
    { booking: booking._id },
    { booking: booking._id, user: customer._id, worker: worker._id, rating: 5, comment: 'Quick, polite, and solved the issue.' },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  console.log('Seed complete');
  console.log('Admin: admin@hyperlocal.test / password123');
  console.log('Customer: customer@hyperlocal.test / password123');
  console.log('Worker: worker@hyperlocal.test / password123');
  process.exit(0);
};

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
