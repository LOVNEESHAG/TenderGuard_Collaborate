const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const User = require('./models/User');
const Tender = require('./models/Tender');
const Bid = require('./models/Bid');

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/tenderguard');

const users = [
    { name: 'Admin User', email: 'admin@test.com', password: 'password', role: 'admin' },
    { name: 'Public User', email: 'public@test.com', password: 'password', role: 'public' },
    { name: 'Contractor One', email: 'c1@test.com', password: 'password', role: 'contractor', experience: 10, pastPerformance: 95, delayHistory: 0 },
    { name: 'Contractor Two', email: 'c2@test.com', password: 'password', role: 'contractor', experience: 5, pastPerformance: 80, delayHistory: 2 },
    { name: 'Contractor Three', email: 'c3@test.com', password: 'password', role: 'contractor', experience: 15, pastPerformance: 98, delayHistory: 0 },
    { name: 'Dodgy Contractor', email: 'c4@test.com', password: 'password', role: 'contractor', experience: 2, pastPerformance: 50, delayHistory: 5 },
    { name: 'Cartel Member A', email: 'ca@test.com', password: 'password', role: 'contractor', experience: 7, pastPerformance: 85, delayHistory: 1 },
    { name: 'Cartel Member B', email: 'cb@test.com', password: 'password', role: 'contractor', experience: 8, pastPerformance: 82, delayHistory: 1 }
];

// Provide some tenders initially
const tenders = [
    { title: 'Highway Construction NH44', description: 'Expanding NH44 to 6 lanes.', budget: 50000000, location: { name: 'NH44, India', lat: 21.14, lng: 79.08 }, deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000) },
    { title: 'Smart City Solar Streetlights', description: 'Install 10,000 solar streetlights.', budget: 15000000, location: { name: 'Pune, India', lat: 18.52, lng: 73.85 }, deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000) },
    { title: 'Public Hospital Renovation', description: 'Complete renovation of the city civil hospital.', budget: 35000000, location: { name: 'Delhi', lat: 28.70, lng: 77.10 }, deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) }
];

const importData = async () => {
    try {
        await User.deleteMany();
        await Tender.deleteMany();
        await Bid.deleteMany();

        await User.create(users);
        const createdTenders = await Tender.create(tenders);

        console.log('Data Imported!');
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

const destroyData = async () => {
    try {
        await User.deleteMany();
        await Tender.deleteMany();
        await Bid.deleteMany();

        console.log('Data Destroyed!');
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

if (process.argv[2] === '-d') {
    destroyData();
} else {
    importData();
}
