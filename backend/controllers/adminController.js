const User = require('../models/User');
const WorkerProfile = require('../models/WorkerProfile');
const Booking = require('../models/Booking');
const AuditLog = require('../models/AuditLog');

exports.getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalWorkers = await User.countDocuments({ role: 'worker' });
    const pendingApprovals = await WorkerProfile.countDocuments({ approvalStatus: 'pending' });
    const totalBookings = await Booking.countDocuments();
    const paidBookings = await Booking.countDocuments({ paymentStatus: 'paid' });

    res.status(200).json({
      success: true,
      data: { totalUsers, totalWorkers, pendingApprovals, totalBookings, paidBookings }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getPendingWorkers = async (req, res) => {
  try {
    const pendingWorkers = await WorkerProfile.find({ approvalStatus: 'pending' })
      .populate('user', 'name email phone avatar location');
    res.status(200).json({ success: true, data: pendingWorkers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.approveWorker = async (req, res) => {
  try {
    const { workerId, status, rejectionReason } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const profile = await WorkerProfile.findByIdAndUpdate(
      workerId,
      {
        approvalStatus: status,
        'kyc.status': status === 'approved' ? 'verified' : 'rejected',
        'kyc.rejectionReason': rejectionReason || ''
      },
      { new: true }
    );

    if (!profile) {
       return res.status(404).json({ success: false, message: 'Worker profile not found' });
    }

    await AuditLog.create({
      actor: req.user.id,
      action: `worker.${status}`,
      entityType: 'WorkerProfile',
      entityId: profile._id,
      details: { rejectionReason: rejectionReason || '' }
    });

    res.status(200).json({ success: true, message: `Worker ${status} successfully`, data: profile });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAuditLogs = async (req, res) => {
  try {
    const logs = await AuditLog.find()
      .populate('actor', 'name email role')
      .sort({ createdAt: -1 })
      .limit(100);

    res.status(200).json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
