const express = require('express');
const router = express.Router();
const { getWorkerDetails, searchWorkers } = require('../controllers/marketplaceController');

router.get('/workers', searchWorkers);
router.get('/workers/:workerId', getWorkerDetails);

module.exports = router;
