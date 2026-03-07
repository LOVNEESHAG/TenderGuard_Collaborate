// Simulate AI Logic
const { calculateTrustScore } = require('./trustScoring');

exports.calculateRiskScore = (bid, allBids, contractorInfo, tenderBudget) => {
    let score = 0; // 0-100, higher is riskier
    let flags = [];

    // 1. Price deviation from average (if multiple bids exist)
    if (allBids && allBids.length > 0) {
        const sumPrice = allBids.reduce((acc, curr) => acc + curr.quotedPrice, 0) + bid.quotedPrice;
        const avgPrice = sumPrice / (allBids.length + 1);

        // If bid is uncharacteristically low (e.g., >30% below average or budget), flag as high risk
        const deviation = (avgPrice - bid.quotedPrice) / avgPrice;
        if (deviation > 0.3) {
            score += 30;
            flags.push('Unusually low price deviation (>30%)');
        }
    }

    // 2. Budget mismatch (e.g. higher than budget)
    if (bid.quotedPrice > tenderBudget) {
        score += 40;
        flags.push('Quoted price exceeds tender budget');
    }

    // 3. Past delay history
    if (contractorInfo.delayHistory > 2) {
        score += 20;
        flags.push('Contractor has history of delays');
    }

    return {
        score: Math.min(score, 100),
        flags
    };
};

exports.detectFakeDocuments = (documents) => {
    let fakeDocFlags = [];
    const knownFakeNames = ['dummy_doc.pdf', 'fake_cert.pdf']; // Mock logic

    documents.forEach(doc => {
        if (knownFakeNames.includes(doc.originalName.toLowerCase())) {
            fakeDocFlags.push(`Suspicious file name detected: ${doc.originalName}`);
        }

        // Mock metadata anomaly detection simulation
        if (Math.random() > 0.95) { // 5% chance to simulate an anomaly just for demo
            fakeDocFlags.push(`Metadata anomaly detected in ${doc.originalName}`);
        }
    });

    return fakeDocFlags;
};

exports.detectCartel = (bid, allBids) => {
    let isCartel = false;
    let flags = [];

    if (allBids && allBids.length > 0) {
        allBids.forEach(existingBid => {
            // 1. Bids within 1% difference
            const diff = Math.abs(existingBid.quotedPrice - bid.quotedPrice) / existingBid.quotedPrice;
            if (diff > 0 && diff < 0.01) {
                isCartel = true;
                flags.push(`Bid price within 1% of another contractor's bid`);
            }

            // 2. Similar submission timing (Mock logic: submitted within 5 minutes of each other)
            // In a real scenario we'd check timestamps. Here we just mock if they are created 'recently' compared to each other.
            const timeDiff = Math.abs(new Date(existingBid.createdAt) - new Date());
            if (timeDiff < 5 * 60 * 1000) { // 5 mins
                isCartel = true;
                flags.push(`Submission timing suspiciously close to another contractor`);
            }
        });
    }

    return { isCartel, cartelFlags: flags };
};

exports.calculateFinalScore = (bid, tender, contractor) => {
    // 40% Price competitiveness, 60% Contractor Trust Score
    // For price, lower price = higher score (up to a limit, compared to budget)

    const priceRatio = bid.quotedPrice / tender.budget;
    let priceScore = 40 * (1 - (priceRatio - 0.5)); // simplistic logic
    if (priceScore > 40) priceScore = 40;
    if (priceScore < 0) priceScore = 0;

    // Calculate dynamic Trust Score for the contractor
    const trustScore = calculateTrustScore(contractor, bid.riskScore);

    // 60% of Final Score is based on Trust Score
    const trustScoreValue = 60 * (trustScore / 100);

    return (priceScore + trustScoreValue).toFixed(2);
};
