const WorkerProfile = require('../models/WorkerProfile');
const User = require('../models/User');
const { getWorkerModel } = require('../models/WorkerModels');

const VALID_AVAILABILITY_STATUSES = ['Available', 'Busy', 'Offline', 'Pending Verification'];

const getWorkerCollectionName = (skills = []) => {
  if (!Array.isArray(skills) || skills.length === 0) return 'general';
  return skills.length === 1 ? skills[0] : 'multi_professional';
};

const getAvailabilityStatus = ({ availability, availabilityStatus }) => {
  if (VALID_AVAILABILITY_STATUSES.includes(availabilityStatus)) return availabilityStatus;
  if (typeof availability === 'boolean') return availability ? 'Available' : 'Offline';
  return undefined;
};

const syncDynamicWorkerProfile = async (profile) => {
  const DynamicWorkerModel = getWorkerModel(getWorkerCollectionName(profile.skills));

  await DynamicWorkerModel.findOneAndUpdate(
    { user: profile.user },
    {
      user: profile.user,
      professions: profile.skills,
      experience: profile.experience,
      bio: profile.bio,
      pricing: profile.pricing,
      availability: profile.availabilityStatus !== 'Offline',
      availabilityStatus: profile.availabilityStatus,
      approvalStatus: profile.approvalStatus
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
};

exports.getWorkerProfile = async (req, res, next) => {
  try {
    const profile = await WorkerProfile.findOne({ user: req.user.id }).populate('user', 'name email avatar phone');
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }
    res.status(200).json({ success: true, data: profile });
  } catch (error) {
    next(error);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const { skills, experience, bio, pricing, availability, availabilityStatus, address, coordinates } = req.body;
    const profileUpdates = {};
    const nextAvailabilityStatus = getAvailabilityStatus({ availability, availabilityStatus });

    if (skills !== undefined) profileUpdates.skills = skills;
    if (experience !== undefined) profileUpdates.experience = experience;
    if (bio !== undefined) profileUpdates.bio = bio;
    if (pricing !== undefined) profileUpdates.pricing = pricing;
    if (nextAvailabilityStatus !== undefined) profileUpdates.availabilityStatus = nextAvailabilityStatus;

    const profile = await WorkerProfile.findOneAndUpdate(
      { user: req.user.id },
      profileUpdates,
      { new: true, runValidators: true }
    );

    if (!profile) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    if (address || coordinates) {
      await User.findByIdAndUpdate(req.user.id, {
        location: {
          type: 'Point',
          coordinates: coordinates || req.user.location?.coordinates || [0, 0],
          address: address || req.user.location?.address
        }
      });
    }

    await syncDynamicWorkerProfile(profile);

    res.status(200).json({ success: true, data: profile });
  } catch (error) {
    next(error);
  }
};

exports.uploadKYC = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload ID Proof' });
    }

    const idProof = req.file;

    const profile = await WorkerProfile.findOneAndUpdate(
      { user: req.user.id },
      {
        kyc: {
          idProof: { url: idProof.path, publicId: idProof.filename },
          status: 'pending'
        }
      },
      { new: true }
    );

    if (!profile) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    res.status(200).json({ success: true, message: 'KYC submitted for approval', data: profile });
  } catch (error) {
    next(error);
  }
};
