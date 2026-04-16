const WorkerProfile = require('../models/WorkerProfile');
const User = require('../models/User');

exports.getWorkerProfile = async (req, res) => {
  try {
    const profile = await WorkerProfile.findOne({ user: req.user.id }).populate('user', 'name email avatar phone');
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }
    res.status(200).json({ success: true, data: profile });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { skills, experience, bio, pricing, availability, address, coordinates } = req.body;
    const profileUpdates = {};

    if (skills !== undefined) profileUpdates.skills = skills;
    if (experience !== undefined) profileUpdates.experience = experience;
    if (bio !== undefined) profileUpdates.bio = bio;
    if (pricing !== undefined) profileUpdates.pricing = pricing;
    if (availability !== undefined) profileUpdates.availability = availability;

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

    res.status(200).json({ success: true, data: profile });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.uploadKYC = async (req, res) => {
  try {
    console.log('--- Worker KYC Upload Attempt ---');
    console.log('User:', req.user.id);
    
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

    console.log('Worker KYC Updated Successfully');
    res.status(200).json({ success: true, message: 'KYC submitted for approval', data: profile });
  } catch (error) {
    console.error('Worker KYC Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
