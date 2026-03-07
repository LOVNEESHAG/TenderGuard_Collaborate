const Tender = require('../models/Tender');
const Bid = require('../models/Bid');
const User = require('../models/User');
const Complaint = require('../models/Complaint');
const { calculateNetworkRisk } = require('../utils/networkDetection');

// @desc    Get dashboard statistics
// @route   GET /api/stats
// @access  Public
exports.getStats = async (req, res) => {
    try {
        const totalTenders = await Tender.countDocuments();
        const activeTenders = await Tender.countDocuments({ status: 'open' });
        const totalBids = await Bid.countDocuments();
        const contractorsCount = await User.countDocuments({ role: 'contractor' });

        // High risk bids
        const highRiskBids = await Bid.countDocuments({ riskLevel: 'High' });

        // Cartel flagged bids
        const cartelBids = await Bid.countDocuments({ cartelSuspicion: true });

        // Total budget vs utilized budget
        const tenders = await Tender.find();
        let totalBudget = 0;
        let utilizedBudget = 0;

        tenders.forEach(t => {
            totalBudget += t.budget;
            utilizedBudget += t.fundUtilization || 0;
        });

        // Recent Activity
        const recentTenders = await Tender.find().sort('-createdAt').limit(5);
        const recentBids = await Bid.find().populate('contractor', 'name').populate('tender', 'title').sort('-createdAt').limit(5);
        const complaintsCount = await Complaint.countDocuments();

        res.status(200).json({
            success: true,
            data: {
                totalTenders,
                activeTenders,
                totalBids,
                contractorsCount,
                highRiskBids,
                cartelBids,
                totalBudget,
                utilizedBudget,
                recentTenders,
                recentBids,
                complaintsCount
            }
        });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

// @desc    Get Network Risk Stats for Dashboard
// @route   GET /api/stats/network-risk
// @access  Private (Admin potentially, open for prototype)
exports.getNetworkRiskStats = async (req, res) => {
    try {
        const contractors = await User.find({ role: 'contractor' });
        const allBids = await Bid.find().populate('tender');

        let nodes = [];
        let edges = [];
        let edgeTracker = new Set(); // To avoid duplicate edges between same pair

        let contractorsRiskData = [];

        for (const contractor of contractors) {
            const riskCalculation = calculateNetworkRisk(contractor._id, allBids);

            // Update the contractor model with the new network risk score
            contractor.networkRiskScore = riskCalculation.score;
            await contractor.save();

            contractorsRiskData.push({
                contractor,
                riskCalculation
            });

            // Nodes for Cytoscape
            let color = '#28a745'; // Low Risk
            if (riskCalculation.riskLevel === 'Medium') color = '#ffc107';
            if (riskCalculation.riskLevel === 'High') color = '#dc3545';

            nodes.push({
                data: {
                    id: contractor._id.toString(),
                    label: contractor.name,
                    score: riskCalculation.score,
                    riskLevel: riskCalculation.riskLevel,
                    flags: riskCalculation.flags,
                    color: color
                }
            });
        }

        // Generate edges based on co-participation in tenders
        const bidsByTender = {};
        allBids.forEach(bid => {
            const tId = bid.tender._id ? bid.tender._id.toString() : bid.tender.toString();
            if (!bidsByTender[tId]) bidsByTender[tId] = [];
            bidsByTender[tId].push(bid);
        });

        Object.values(bidsByTender).forEach(tenderBids => {
            for (let i = 0; i < tenderBids.length; i++) {
                for (let j = i + 1; j < tenderBids.length; j++) {
                    const c1 = tenderBids[i].contractor.toString();
                    const c2 = tenderBids[j].contractor.toString();
                    if (c1 !== c2) {
                        const edgeId1 = `${c1}-${c2}`;
                        const edgeId2 = `${c2}-${c1}`;
                        if (!edgeTracker.has(edgeId1) && !edgeTracker.has(edgeId2)) {
                            edges.push({
                                data: {
                                    id: edgeId1,
                                    source: c1,
                                    target: c2
                                }
                            });
                            edgeTracker.add(edgeId1);
                            edgeTracker.add(edgeId2);
                        }
                    }
                }
            }
        });

        // Filter out contractors who haven't participated in any tenders to clean up graph
        const activeNodes = nodes.filter(n => riskCalculationParams(n).participatedTenders > 0 || true);

        // Sorting contractors by highest risk for the UI table
        contractorsRiskData.sort((a, b) => b.riskCalculation.score - a.riskCalculation.score);

        res.status(200).json({
            success: true,
            data: {
                graph: {
                    nodes: nodes,
                    edges: edges
                },
                contractors: contractorsRiskData
            }
        });

    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

function riskCalculationParams(node) {
    // Helper since we didn't attach participatedTendersCount globally
    return { participatedTenders: 1 }; // dummy
}
