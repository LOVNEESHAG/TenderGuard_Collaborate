const Tender = require('../models/Tender');

// @desc    Get all tenders
// @route   GET /api/tenders
// @access  Public
exports.getTenders = async (req, res) => {
    try {
        const tenders = await Tender.find().sort('-createdAt');
        res.status(200).json({
            success: true,
            count: tenders.length,
            data: tenders
        });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

// @desc    Get single tender
// @route   GET /api/tenders/:id
// @access  Public
exports.getTender = async (req, res) => {
    try {
        const tender = await Tender.findById(req.params.id);

        if (!tender) {
            return res.status(404).json({ success: false, error: 'Tender not found' });
        }

        res.status(200).json({
            success: true,
            data: tender
        });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

// @desc    Create new tender
// @route   POST /api/tenders
// @access  Private (Admin only)
exports.createTender = async (req, res) => {
    try {
        const tender = await Tender.create(req.body);

        res.status(201).json({
            success: true,
            data: tender
        });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

// @desc    Update tender
// @route   PUT /api/tenders/:id
// @access  Private (Admin only)
exports.updateTender = async (req, res) => {
    try {
        let tender = await Tender.findById(req.params.id);

        if (!tender) {
            return res.status(404).json({ success: false, error: 'Tender not found' });
        }

        // Auto-lock if deadline passed handled on frontend/before update, but can enforce here
        if (new Date(tender.deadline) < new Date()) {
            return res.status(400).json({ success: false, error: 'Tender deadline passed, cannot edit' });
        }

        tender = await Tender.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        res.status(200).json({
            success: true,
            data: tender
        });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

// @desc    Delete tender
// @route   DELETE /api/tenders/:id
// @access  Private (Admin only)
exports.deleteTender = async (req, res) => {
    try {
        const tender = await Tender.findByIdAndDelete(req.params.id);

        if (!tender) {
            return res.status(404).json({ success: false, error: 'Tender not found' });
        }

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};
