const Complaint = require('../models/Complaint');
const Tender = require('../models/Tender');
const User = require('../models/User');
const { calculateProjectQualityScore, calculateTrustScore } = require('../utils/trustScoring');

// Helper to calculate distance in meters between two coordinates
function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // metres
    const φ1 = lat1 * Math.PI / 180; // φ, λ in radians
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // in metres
}

// @desc    Get all complaints
// @route   GET /api/complaints
// @access  Public (simplified, mostly admin sees all, public sees anon)
exports.getComplaints = async (req, res) => {
    try {
        const complaints = await Complaint.find().populate('tender', 'title');
        res.status(200).json({
            success: true,
            count: complaints.length,
            data: complaints
        });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

// @desc    Create complaint
// @route   POST /api/complaints
// @access  Private (Public role)
exports.createComplaint = async (req, res) => {
    try {
        req.body.user = req.user.id;

        const tender = await Tender.findById(req.body.tender).populate({ path: 'winningBid', populate: { path: 'contractor' } });
        if (!tender) {
            return res.status(404).json({ success: false, error: 'Tender not found' });
        }

        // Prevent Duplicate Feedback
        const existingComplaint = await Complaint.findOne({ tender: req.body.tender, user: req.user.id });
        if (existingComplaint) {
            return res.status(400).json({ success: false, error: 'You have already submitted feedback for this project.' });
        }

        if (req.file) {
            req.body.photo = req.file.path.replace(/\\/g, '/');
        }

        const complaint = await Complaint.create(req.body);

        // Calculate Project Quality Score
        const complaintsCount = await Complaint.countDocuments({ tender: req.body.tender });
        let contractorTrust = 50; // default

        if (tender.winningBid && tender.winningBid.contractor) {
            const contractor = await User.findById(tender.winningBid.contractor._id);
            if (contractor) {
                contractorTrust = contractor.trustScore || 50;

                // For simplicity, we assume we update Trust Score when new feedback arrives
                const updatedTrust = calculateTrustScore(contractor, tender.winningBid.riskScore);
                contractor.trustScore = updatedTrust;
                await contractor.save();
            }
        }

        const projectQualityScore = calculateProjectQualityScore(complaintsCount, contractorTrust);

        // Save projectQualityScore if we add it to Tender (we didn't add the field, but we can compute dynamically on frontend or save it here. Let's just return it for now)

        res.status(201).json({
            success: true,
            data: complaint,
            projectQualityScore
        });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

// @desc    Update complaint status
// @route   PUT /api/complaints/:id
// @access  Private (Admin)
exports.updateComplaint = async (req, res) => {
    try {
        let complaint = await Complaint.findById(req.params.id);

        if (!complaint) {
            return res.status(404).json({ success: false, error: 'Complaint not found' });
        }

        complaint = await Complaint.findByIdAndUpdate(req.params.id, { status: req.body.status }, {
            new: true,
            runValidators: true
        });

        res.status(200).json({
            success: true,
            data: complaint
        });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

// @desc    Get nearby projects based on lat/lng
// @route   GET /api/complaints/nearby
// @access  Private
exports.getNearbyProjects = async (req, res) => {
    try {
        const { lat, lng } = req.query;
        if (!lat || !lng) {
            return res.status(400).json({ success: false, error: 'Please provide lat and lng in query' });
        }

        const userLat = parseFloat(lat);
        const userLng = parseFloat(lng);

        const activeTenders = await Tender.find({ status: { $in: ['open', 'awarded'] } });

        let nearby = [];

        for (const tender of activeTenders) {
            if (tender.location && tender.location.lat && tender.location.lng) {
                const distance = getDistance(userLat, userLng, tender.location.lat, tender.location.lng);
                const radius = tender.location.radius || 150;

                if (distance <= radius) {
                    // Check if already provided feedback
                    if (req.user) {
                        const existing = await Complaint.findOne({ tender: tender._id, user: req.user.id });
                        if (!existing) {
                            nearby.push(tender);
                        }
                    } else {
                        // If no user, just return it (useful for testing)
                        nearby.push(tender);
                    }
                }
            }
        }

        res.status(200).json({
            success: true,
            count: nearby.length,
            data: nearby
        });

    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

// @desc    Get all complaints for Map
// @route   GET /api/complaints/map
// @access  Public
exports.getMapComplaints = async (req, res) => {
    try {
        const complaints = await Complaint.find().populate('tender', 'title location');
        res.status(200).json({
            success: true,
            count: complaints.length,
            data: complaints
        });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};
