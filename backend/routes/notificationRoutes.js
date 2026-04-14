const express = require('express');
const router = express.Router();
const { getNotifications, markNotificationsRead } = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', getNotifications);
router.patch('/read', markNotificationsRead);

module.exports = router;
