const express = require('express');
const {
    getComplaints,
    createComplaint,
    updateComplaint,
    getNearbyProjects,
    getMapComplaints
} = require('../controllers/complaints');

const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/map', getMapComplaints);

router.get('/nearby', protect, authorize('public', 'admin'), getNearbyProjects);

router
    .route('/')
    .get(getComplaints) // Public can view
    .post(protect, authorize('public'), upload.single('photo'), createComplaint); // Fix upload assuming single file named 'photo'

router
    .route('/:id')
    .put(protect, authorize('admin'), updateComplaint);

module.exports = router;
