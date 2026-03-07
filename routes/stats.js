const express = require('express');
const { getStats, getNetworkRiskStats } = require('../controllers/stats');

const router = express.Router();

router.get('/', getStats);
router.get('/network-risk', getNetworkRiskStats);

module.exports = router;
