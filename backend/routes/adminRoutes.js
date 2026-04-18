const express = require('express');
const router = express.Router();
const {
  approveWorker,
  createUser,
  createWorker,
  deleteUser,
  deleteWorker,
  getAuditLogs,
  getBookings,
  getDashboardStats,
  getPendingWorkers,
  getUsers,
  getWorkers
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);
router.use(authorize('admin'));

router.get('/stats', getDashboardStats);
router.get('/audit-logs', getAuditLogs);
router.route('/users')
  .get(getUsers)
  .post(createUser);
router.delete('/users/:userId', deleteUser);
router.route('/workers')
  .get(getWorkers)
  .post(createWorker);
router.delete('/workers/:workerId', deleteWorker);
router.get('/bookings', getBookings);
router.get('/pending-workers', getPendingWorkers);
router.post('/approve-worker', approveWorker);

module.exports = router;
