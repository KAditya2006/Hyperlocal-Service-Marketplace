const User = require('../models/User');
const Booking = require('../models/Booking');
const Chat = require('../models/Chat');
const WorkerProfile = require('../models/WorkerProfile');
const Review = require('../models/Review');
const { toPublicUser } = require('../utils/userAccess');
const { normalizeLanguage } = require('../utils/languages');
const { getUploadedFilePayload } = require('../utils/uploadedFile');

const normalizeCoordinates = (coordinates) => {
  if (!Array.isArray(coordinates) || coordinates.length < 2) return undefined;

  const [lng, lat] = coordinates.map(Number);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return undefined;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return undefined;

  return [lng, lat];
};

exports.updateProfile = async (req, res, next) => {
  try {
    const { name, phone, address, homeNumber, city, area, landmark, pincode, avatar, location, preferredLanguage } = req.body;
    const userId = req.user._id;
    const coordinates = normalizeCoordinates(location?.coordinates || req.body.coordinates);

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: req.t('userNotFound') });
    }

    // Update basic info
    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (avatar) user.avatar = avatar;
    if (preferredLanguage) user.preferredLanguage = normalizeLanguage(preferredLanguage);

    // Update location details
    if (address || homeNumber || city || area || landmark || pincode || coordinates) {
      user.location = {
        ...user.location,
        address: address || user.location.address,
        city: city || user.location.city,
        area: area || user.location.area,
        landmark: landmark || user.location.landmark,
        pincode: pincode || user.location.pincode,
        coordinates: coordinates || user.location.coordinates,
        homeNumber: user.role === 'user' ? (homeNumber || user.location.homeNumber) : undefined
      };
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: req.t('profileUpdated'),
      user: await toPublicUser(user)
    });
  } catch (error) {
    next(error);
  }
};

exports.updateAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: req.t('imageRequired') });
    }

    const userId = req.user._id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: req.t('userNotFound') });
    }

    // Capture New Avatar URL from Cloudinary
    user.avatar = req.file.path;
    await user.save();

    res.status(200).json({
      success: true,
      message: req.t('avatarUpdated'),
      avatar: user.avatar
    });
  } catch (error) {
    next(error);
  }
};

exports.uploadKYC = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: req.t('idProofRequired') });
    }

    const userId = req.user._id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: req.t('userNotFound') });
    }

    const idProof = getUploadedFilePayload(req.file);
    if (!idProof.url) {
      return res.status(400).json({ success: false, message: req.t('idProofRequired') });
    }

    user.kyc = {
      idProof,
      status: 'pending'
    };

    await user.save();

    res.status(200).json({
      success: true,
      message: req.t('kycSubmitted'),
      data: {
        id: user._id,
        kyc: user.kyc
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getUserPublicProfile = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const requesterId = req.user.id || req.user._id;

    // Target user must exist, not be deleted, and have role 'user'
    const targetUser = await User.findOne({
      _id: userId,
      isDeleted: { $ne: true }
    }).select('name avatar role isOnline lastSeenAt createdAt').lean();

    if (!targetUser) {
      return res.status(404).json({ success: false, message: req.t('userNotFound') });
    }

    if (targetUser.role !== 'user') {
      return res.status(400).json({ success: false, message: 'Public service history is only available for customer accounts.' });
    }

    // Relationship check: requester must be admin, self, or share a conversation with target user
    if (req.user.role !== 'admin' && requesterId.toString() !== userId.toString()) {
      const sharedChat = await Chat.findOne({
        participants: { $all: [requesterId, userId] }
      });
      if (!sharedChat) {
        return res.status(403).json({ success: false, message: req.t('chatRestricted') });
      }
    }

    // Query completed bookings taken by targetUser
    const completedBookings = await Booking.find({
      user: userId,
      status: 'completed'
    })
      .select('service scheduledDate updatedAt createdAt status worker')
      .populate('worker', 'name avatar role')
      .sort({ updatedAt: -1, scheduledDate: -1 })
      .limit(20)
      .lean();

    // Fetch worker profiles for workers in completed bookings
    const workerUserIds = completedBookings.map((b) => b.worker?._id).filter(Boolean);
    const workerProfiles = await WorkerProfile.find({
      user: { $in: workerUserIds }
    }).select('user skills averageRating totalReviews').lean();

    const workerProfileMap = new Map();
    workerProfiles.forEach((wp) => {
      workerProfileMap.set(wp.user.toString(), wp);
    });

    // Also fetch reviews left by targetUser for these bookings if available
    const bookingIds = completedBookings.map((b) => b._id);
    const reviews = await Review.find({
      booking: { $in: bookingIds },
      user: userId
    }).select('booking rating comment').lean();

    const reviewMap = new Map();
    reviews.forEach((r) => {
      reviewMap.set(r.booking.toString(), r);
    });

    const onlineUserIds = req.app.get('onlineUserIds') || new Set();

    const serviceHistory = completedBookings.map((booking) => {
      const workerUser = booking.worker;
      const workerProfile = workerUser ? workerProfileMap.get(workerUser._id.toString()) : null;
      const userReview = reviewMap.get(booking._id.toString());

      return {
        id: booking._id,
        service: booking.service,
        completedAt: booking.updatedAt || booking.scheduledDate || booking.createdAt,
        status: 'completed',
        worker: workerUser ? {
          id: workerUser._id,
          name: workerUser.name,
          avatar: workerUser.avatar,
          profession: workerProfile?.skills?.[0] || booking.service,
          averageRating: typeof workerProfile?.averageRating === 'number' ? workerProfile.averageRating : 0,
          totalReviews: typeof workerProfile?.totalReviews === 'number' ? workerProfile.totalReviews : 0
        } : null,
        userRating: userReview?.rating || null
      };
    });

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: targetUser._id,
          name: targetUser.name,
          avatar: targetUser.avatar,
          role: targetUser.role,
          isOnline: onlineUserIds.has(targetUser._id.toString()),
          lastSeenAt: targetUser.lastSeenAt,
          memberSince: targetUser.createdAt
        },
        serviceHistory
      }
    });
  } catch (error) {
    next(error);
  }
};
