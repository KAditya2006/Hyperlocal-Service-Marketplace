require('dotenv').config({ path: './backend/.env' });
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

  await ensureUser('kaditya39546@gmail.com', { name: 'Admin User', role: 'admin', isVerified: true, isAdminApproved: true });
  const customer = await ensureUser('customer@instantseva.test', {
    name: 'Customer User',
    role: 'user',
    isVerified: true,
    isAdminApproved: true,
    kyc: { status: 'verified' },
    location: { type: 'Point', coordinates: [77.1025, 28.7041], address: 'Rohini, Delhi', homeNumber: 'H-12, Sector 9' }
  });
  
  const additionalLocations = [
    { email: 'plumber1@test.com', name: 'Amit Plumber', profession: 'plumber', coords: [77.391, 28.5355], address: 'Sector 62, Noida' },
    { email: 'electric1@test.com', name: 'Suresh Electric', profession: 'electrician', coords: [77.0266, 28.4595], address: 'Cyber Hub, Gurgaon' },
    { email: 'carpenter1@test.com', name: 'Vikram Woodwork', profession: 'carpenters', coords: [77.2167, 28.6667], address: 'Civil Lines, Delhi' },
    { email: 'tutor1@test.com', name: 'Priya Maths', profession: 'home tutors', coords: [77.3159, 28.5823], address: 'Sector 15, Noida' },
    { email: 'ac1@test.com', name: 'Karan AC Service', profession: 'ac repair/service', coords: [77.209, 28.6139], address: 'Connaught Place, Delhi' },
    { email: 'multi1@test.com', name: 'All-Rounder Raj', professions: ['plumber', 'electrician'], coords: [77.209, 28.6139], address: 'Connaught Place, Delhi' }
  ];

  const { getWorkerModel } = require('../models/WorkerModels');

  for (const loc of additionalLocations) {
    const user = await ensureUser(loc.email, {
      name: loc.name,
      role: 'worker',
      isVerified: true,
      isAdminApproved: true,
      location: { type: 'Point', coordinates: loc.coords, address: loc.address }
    });

    const professions = loc.professions || [loc.profession];
    const targetCollection = professions.length > 1 ? 'multi_professional' : professions[0];
    const DynamicModel = getWorkerModel(targetCollection);

    await DynamicModel.findOneAndUpdate(
      { user: user._id },
      {
        user: user._id,
        professions,
        experience: 4,
        bio: `Professional ${professions.join(' & ')} with years of local experience on InstantSeva.`,
        pricing: { amount: 500, unit: 'hour' },
        availability: true,
        availabilityStatus: 'Available',
        approvalStatus: 'approved'
      },
      { upsert: true, new: true }
    );

    // Also sync to main WorkerProfile for global search
    await WorkerProfile.findOneAndUpdate(
      { user: user._id },
      {
        user: user._id,
        skills: professions,
        experience: 4,
        bio: `Verified InstantSeva ${professions[0]}`,
        availabilityStatus: 'Available',
        approvalStatus: 'approved',
        kyc: { status: 'verified' }
      },
      { upsert: true }
    );
  }

  console.log('Seed complete - Identity: InstantSeva');
  console.log('Admin: kaditya39546@gmail.com / password123');
  console.log('Customer: customer@instantseva.test / password123');
  console.log('Worker Examples (check additionalLocations array above)');
  process.exit(0);
};

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
