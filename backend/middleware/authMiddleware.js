const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { getUserAccessState } = require('../utils/userAccess');

exports.protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authorized to access this route' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);

    if (!req.user) {
      return res.status(401).json({ success: false, message: 'User no longer exists' });
    }

    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Not authorized' });
  }
};

exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role} is not authorized to access this route`
      });
    }
    next();
  };
};

exports.verifiedOnly = (req, res, next) => {
  if (!req.user.isVerified) {
    return res.status(403).json({
      success: false,
      message: 'Please verify your email to access this resource'
    });
  }
  next();
};

exports.dashboardApprovedOnly = async (req, res, next) => {
  try {
    const access = await getUserAccessState(req.user);

    if (!access.canAccessDashboard) {
      return res.status(403).json({
        success: false,
        message: access.profileComplete
          ? 'Your profile is waiting for admin verification'
          : 'Please complete your profile and submit verification first',
        onboarding: {
          profileComplete: access.profileComplete,
          approvalStatus: access.approvalStatus,
          verificationStatus: access.verificationStatus,
          dashboardPath: access.dashboardPath
        }
      });
    }

    req.access = access;
    next();
  } catch (error) {
    next(error);
  }
};
