const Notification = require('../models/Notification');
const { getPagination } = require('../utils/bookingRules');

exports.getNotifications = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const filter = { user: req.user.id };

    const total = await Notification.countDocuments(filter);
    const unread = await Notification.countDocuments({ ...filter, read: false });
    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      data: notifications,
      unread,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.markNotificationsRead = async (req, res) => {
  try {
    await Notification.updateMany({ user: req.user.id, read: false }, { read: true });
    res.status(200).json({ success: true, message: 'Notifications marked as read' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
