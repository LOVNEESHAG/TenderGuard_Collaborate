const mongoose = require('mongoose');

const TenderSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please add a title'],
        trim: true,
        maxlength: [100, 'Title can not be more than 100 characters']
    },
    description: {
        type: String,
        required: [true, 'Please add a description']
    },
    budget: {
        type: Number,
        required: [true, 'Please add a budget']
    },
    location: {
        name: {
            type: String,
            required: true
        },
        lat: Number,
        lng: Number,
        radius: {
            type: Number,
            default: 150 // Default 150 meters
        }
    },
    deadline: {
        type: Date,
        required: [true, 'Please add a deadline']
    },
    requiredDocuments: {
        type: [String],
        default: ['GST', 'PAN', 'Experience']
    },
    status: {
        type: String,
        enum: ['open', 'closed', 'awarded'],
        default: 'open'
    },
    winningBid: {
        type: mongoose.Schema.ObjectId,
        ref: 'Bid'
    },
    fundUtilization: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Tender', TenderSchema);
