const express = require('express');
const { getBids, createBid, updateBid, deleteBid } = require('../controllers/bids');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Merge params to allow nested routes from tender (e.g. /api/tenders/:tenderId/bids)
const router = express.Router({ mergeParams: true });

router
    .route('/')
    .get(protect, getBids)
    .post(protect, authorize('contractor'), upload.array('documents', 5), createBid);

// Direct bid routes (without tender in URL) are needed since the dashboard provides bid ID directly.
router
    .route('/:id')
    .put(protect, authorize('contractor', 'admin'), updateBid)
    .delete(protect, authorize('contractor', 'admin'), deleteBid);

module.exports = router;
