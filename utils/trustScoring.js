// utils/trustScoring.js

/**
 * Calculates Final Contractor Trust Score
 * Weights:
 * 30% AI Risk Score (Inverted: lower risk is better)
 * 25% Government Rating
 * 20% Citizen Feedback (Project Quality Score average)
 * 15% Reliability Score
 * 10% Network Risk Score (Inverted: lower risk is better)
 * 
 * @param {Object} contractor - The User object representing the contractor
 * @param {Number} currentTargetAiRiskScore - The risk score of the current bid (0-100)
 * @returns {Number} Calculated Trust Score (0-100)
 */
exports.calculateTrustScore = (contractor, currentTargetAiRiskScore = 0) => {
    // Determine the AI Risk Score to use (use current bid's risk if provided, else use a default/average)
    // For simplicity, we assume AI Risk Score is inverted so higher score = higher trust.
    // If AI Risk Score = 20 (low risk), then trust contribution should be high (80).
    const aiRiskContribution = (100 - currentTargetAiRiskScore) * 0.30;

    const govRatingContribution = (contractor.governmentRating || 50) * 0.25;

    // Citizen feedback is aggregated somewhere else, we assume it's stored in User model or passed in.
    // For now, we'll use a mocked field on User or default to 50 if none.
    // We didn't add citizenScore to User yet, so let's default to reliability if missing
    // or we can just assume 50 for prototype if no projects yet.
    const citizenFeedback = 75; // Mocked average citizen rating for their projects
    const citizenContribution = citizenFeedback * 0.20;

    const reliabilityContribution = (contractor.reliabilityScore || 50) * 0.15;

    // Network risk is inverted
    const networkRisk = contractor.networkRiskScore || 0;
    const networkRiskContribution = (100 - networkRisk) * 0.10;

    let finalTrustScore = aiRiskContribution + govRatingContribution + citizenContribution + reliabilityContribution + networkRiskContribution;

    return Number(finalTrustScore.toFixed(2));
};

/**
 * Calculates Project Quality Score
 * @param {Number} numReports - Number of citizen reports
 * @param {Number} contractorTrustScore - The trust score of the contractor who built it
 * @returns {Number} Score 0-100
 */
exports.calculateProjectQualityScore = (numReports, contractorTrustScore) => {
    // Base score is contractor's trust score
    let score = contractorTrustScore;

    // Deduct points for citizen reports (e.g., 5 points per report)
    score -= (numReports * 5);

    if (score < 0) score = 0;
    if (score > 100) score = 100;

    return Number(score.toFixed(2));
};
