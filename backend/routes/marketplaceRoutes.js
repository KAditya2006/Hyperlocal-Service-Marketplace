const express = require('express');
const router = express.Router();
const { getWorkerDetails, searchWorkers } = require('../controllers/marketplaceController');
const { searchLocations } = require('../controllers/locationController');
const { locationSearchLimiter } = require('../middleware/rateLimiters');

router.get('/locations/search', locationSearchLimiter, searchLocations);
router.get('/workers', searchWorkers);
router.get('/workers/:workerId', getWorkerDetails);

module.exports = router;
