const express = require('express');
const router = express.Router();
const { getWorkerDetails, searchWorkers } = require('../controllers/marketplaceController');
const { searchLocations } = require('../controllers/locationController');
const { locationSearchLimiter } = require('../middleware/rateLimiters');

const { customerOrGuestOnly } = require('../middleware/authMiddleware');

router.get('/locations/search', locationSearchLimiter, searchLocations);
router.get('/workers', customerOrGuestOnly, searchWorkers);
router.get('/workers/:workerId', customerOrGuestOnly, getWorkerDetails);

module.exports = router;
