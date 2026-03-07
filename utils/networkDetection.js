// utils/networkDetection.js

/**
 * Calculates Network Risk Score based on suspicious bidding patterns.
 * @param {Array} contractorBids - All bids submitted by the contractor across different tenders.
 * @param {Array} allTendersBids - A nested array or flat array of all bids for tenders the contractor participated in.
 * @returns {Object} { score, riskLevel, flags, participatedTendersCount }
 */
exports.calculateNetworkRisk = (contractorId, allBidsAcrossTenders) => {
    let score = 0;
    let flags = [];

    // Group bids by tender
    const bidsByTender = {};
    allBidsAcrossTenders.forEach(bid => {
        const tId = bid.tender.toString();
        if (!bidsByTender[tId]) bidsByTender[tId] = [];
        bidsByTender[tId].push(bid);
    });

    const participatedTenders = Object.values(bidsByTender).filter(tenderBids =>
        tenderBids.some(b => b.contractor.toString() === contractorId.toString())
    );

    const participatedTendersCount = participatedTenders.length;

    if (participatedTendersCount < 2) {
        return { score: 0, riskLevel: 'Low', flags: ['Not enough data for network risk'], participatedTendersCount };
    }

    // 1. Repeated Bidding Groups
    // Find contractors who frequently bid in the same tenders as this contractor
    const coBidders = {};
    participatedTenders.forEach(tenderBids => {
        tenderBids.forEach(b => {
            const cid = b.contractor.toString();
            if (cid !== contractorId.toString()) {
                coBidders[cid] = (coBidders[cid] || 0) + 1;
            }
        });
    });

    let maxCoBidding = 0;
    for (const count of Object.values(coBidders)) {
        if (count > maxCoBidding) maxCoBidding = count;
    }

    // If another contractor appears in > 60% of the same tenders (and at least 2), flag as Repeated Group
    if (participatedTendersCount >= 3 && (maxCoBidding / participatedTendersCount) > 0.6) {
        score += 30;
        flags.push('Repeated bidding group detected');
    }

    // 2. Rotating Winners
    // Check if the contractor and their frequent co-bidders take turns winning
    const groupMembers = Object.keys(coBidders).filter(cid => (coBidders[cid] / participatedTendersCount) > 0.5);
    groupMembers.push(contractorId.toString());

    let groupWins = 0;
    let contractorWins = 0;

    participatedTenders.forEach(tenderBids => {
        const winningBid = tenderBids.find(b => b.winningStatus === true);
        if (winningBid) {
            const winnerId = winningBid.contractor.toString();
            if (groupMembers.includes(winnerId)) {
                groupWins++;
                if (winnerId === contractorId.toString()) contractorWins++;
            }
        }
    });

    // If the group wins frequently, but members rotate (e.g., this contractor won some, others won some)
    if (groupWins >= 3 && contractorWins < groupWins && contractorWins > 0) {
        score += 35;
        flags.push('Winner rotation pattern detected');
    }

    // 3. Suspicious Bid Similarity & 4. Synchronized Submission Timing
    let similarBidsCount = 0;
    let syncTimingCount = 0;

    participatedTenders.forEach(tenderBids => {
        const myBid = tenderBids.find(b => b.contractor.toString() === contractorId.toString());
        if (!myBid) return;

        tenderBids.forEach(otherBid => {
            if (otherBid.contractor.toString() !== contractorId.toString()) {
                // Similarity (within 1.5%)
                const diffPercent = Math.abs(myBid.quotedPrice - otherBid.quotedPrice) / myBid.quotedPrice;
                if (diffPercent <= 0.015) {
                    similarBidsCount++;
                }

                // Timing (within 5 minutes = 300000 ms)
                const timeDiff = Math.abs(new Date(myBid.createdAt) - new Date(otherBid.createdAt));
                if (timeDiff < 300000) {
                    syncTimingCount++;
                }
            }
        });
    });

    if (similarBidsCount > 0) {
        score += 15 + (similarBidsCount * 5);
        flags.push('Suspicious bid similarity detected');
    }

    if (syncTimingCount > 0) {
        score += 10 + (syncTimingCount * 5);
        flags.push('Coordinated submission pattern detected');
    }

    // Cap score at 100
    score = Math.min(score, 100);

    let riskLevel = 'Low';
    if (score >= 70) riskLevel = 'High';
    else if (score >= 40) riskLevel = 'Medium';

    return {
        score,
        riskLevel,
        flags: [...new Set(flags)], // Unique flags
        participatedTendersCount
    };
};
