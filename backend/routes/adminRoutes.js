const express = require('express');
const router = express.Router();
const { getAuditLogs, getDashboardStats, getPendingWorkers, approveWorker } = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);
router.use(authorize('admin'));

router.get('/stats', getDashboardStats);
router.get('/audit-logs', getAuditLogs);
router.get('/pending-workers', getPendingWorkers);
router.post('/approve-worker', approveWorker);

module.exports = router;
