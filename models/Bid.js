const mongoose = require('mongoose');

const BidSchema = new mongoose.Schema({
    tender: {
        type: mongoose.Schema.ObjectId,
        ref: 'Tender',
        required: true
    },
    contractor: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    quotedPrice: {
        type: Number,
        required: [true, 'Please add a quoted price']
    },
    timelineDays: {
        type: Number,
        required: [true, 'Please add a timeline in days']
    },
    documents: [{
        name: String,
        path: String,
        originalName: String
    }],
    experienceDetails: {
        type: String,
        required: true
    },
    // AI Risk Scoring
    riskScore: {
        type: Number,
        default: 0
    },
    riskLevel: {
        type: String,
        enum: ['Low', 'Medium', 'High'],
        default: 'Medium'
    },
    cartelSuspicion: {
        type: Boolean,
        default: false
    },
    fakeDocFlags: {
        type: [String],
        default: []
    },
    flags: {
        type: [String],
        default: []
    },
    // Final Ranked Score
    finalScore: {
        type: Number,
        default: 0
    },
    winningStatus: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Bid', BidSchema);
