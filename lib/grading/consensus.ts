/**
 * Consensus Model Logic for TCA-IRR Grading System
 * 
 * Implements inter-rater reliability calculations and variance detection
 * for high-stakes grading scenarios.
 */

import type { ConsensusResult } from '@/lib/validations/grading'

interface ReviewScore {
  reviewerId?: string
  score: number
  weight: number
}

// Standard deviation threshold for triggering reconciliation
const VARIANCE_THRESHOLD = 10 // SD > 10 triggers reconciliation

/**
 * Calculate weighted mean of review scores
 */
function calculateWeightedMean(reviews: ReviewScore[]): number {
  const totalWeight = reviews.reduce((sum, r) => sum + r.weight, 0)
  const weightedSum = reviews.reduce((sum, r) => sum + r.score * r.weight, 0)
  return totalWeight > 0 ? weightedSum / totalWeight : 0
}

/**
 * Calculate standard deviation of scores
 */
function calculateStandardDeviation(reviews: ReviewScore[], mean: number): number {
  if (reviews.length < 2) return 0
  
  const squaredDiffs = reviews.map(r => Math.pow(r.score - mean, 2))
  const avgSquaredDiff = squaredDiffs.reduce((sum, d) => sum + d, 0) / reviews.length
  return Math.sqrt(avgSquaredDiff)
}

/**
 * Calculate Krippendorff's alpha for inter-rater reliability
 * Simplified version for ordinal data
 */
function calculateKrippendorffAlpha(reviews: ReviewScore[]): number {
  if (reviews.length < 2) return 1.0 // Perfect agreement with single reviewer
  
  const scores = reviews.map(r => r.score)
  const n = scores.length
  
  // Calculate observed disagreement
  let observedDisagreement = 0
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      observedDisagreement += Math.pow(scores[i] - scores[j], 2)
    }
  }
  observedDisagreement = observedDisagreement / (n * (n - 1) / 2)
  
  // Calculate expected disagreement (assuming uniform distribution)
  const mean = scores.reduce((a, b) => a + b, 0) / n
  const variance = scores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / n
  const expectedDisagreement = variance * 2 // Approximate for continuous scale
  
  // Alpha = 1 - (observed / expected)
  if (expectedDisagreement === 0) return 1.0
  return Math.max(0, 1 - (observedDisagreement / expectedDisagreement))
}

/**
 * Main consensus calculation function
 * Returns final score and governance flags
 */
export function calculateConsensus(reviews: ReviewScore[]): ConsensusResult {
  if (reviews.length === 0) {
    return {
      finalScore: 0,
      weightedMean: 0,
      standardDeviation: 0,
      requiresReconciliation: false,
      governanceFlag: null,
      reviewerScores: [],
    }
  }
  
  const weightedMean = calculateWeightedMean(reviews)
  const standardDeviation = calculateStandardDeviation(reviews, weightedMean)
  const irrValue = calculateKrippendorffAlpha(reviews)
  
  // Determine if reconciliation is needed
  const requiresReconciliation = standardDeviation > VARIANCE_THRESHOLD
  
  // Determine governance flag
  let governanceFlag: ConsensusResult['governanceFlag'] = null
  if (standardDeviation > VARIANCE_THRESHOLD) {
    governanceFlag = 'HIGH_VARIANCE_DETECTED'
  } else if (irrValue < 0.6) {
    governanceFlag = 'LOW_CONFIDENCE'
  }
  
  return {
    finalScore: Math.round(weightedMean * 100) / 100,
    weightedMean: Math.round(weightedMean * 100) / 100,
    standardDeviation: Math.round(standardDeviation * 100) / 100,
    requiresReconciliation,
    governanceFlag,
    reviewerScores: reviews.map(r => ({
      reviewerId: r.reviewerId || 'anonymous',
      score: r.score,
      weight: r.weight,
    })),
  }
}

/**
 * Check if a set of reviews has bias indicators
 * Compares against expected demographic distributions
 */
export function detectBiasIndicators(
  reviews: ReviewScore[],
  demographicMean?: number,
  threshold = 5
): boolean {
  if (!demographicMean || reviews.length === 0) return false
  
  const mean = calculateWeightedMean(reviews)
  return Math.abs(mean - demographicMean) > threshold
}

/**
 * Generate reconciliation recommendations
 */
export function generateReconciliationPlan(reviews: ReviewScore[]): {
  recommendation: string
  suggestedAction: 'REQUEST_VIVA' | 'ADDITIONAL_REVIEWER' | 'INSTRUCTOR_REVIEW' | 'ACCEPT_MEAN'
  outlierReviewers: string[]
} {
  const mean = calculateWeightedMean(reviews)
  const sd = calculateStandardDeviation(reviews, mean)
  
  // Find outliers (scores > 1.5 SD from mean)
  const outlierReviewers = reviews
    .filter(r => Math.abs(r.score - mean) > 1.5 * sd && r.reviewerId)
    .map(r => r.reviewerId!)
  
  if (sd > 20) {
    return {
      recommendation: 'Extreme variance detected. Recommend oral defense (viva) to clarify student work.',
      suggestedAction: 'REQUEST_VIVA',
      outlierReviewers,
    }
  } else if (sd > 15) {
    return {
      recommendation: 'High variance detected. Recommend additional reviewer or instructor mediation.',
      suggestedAction: 'ADDITIONAL_REVIEWER',
      outlierReviewers,
    }
  } else if (sd > 10) {
    return {
      recommendation: 'Moderate variance detected. Instructor review recommended.',
      suggestedAction: 'INSTRUCTOR_REVIEW',
      outlierReviewers,
    }
  }
  
  return {
    recommendation: 'Variance within acceptable range. Mean score can be used.',
    suggestedAction: 'ACCEPT_MEAN',
    outlierReviewers: [],
  }
}

/**
 * Calculate fairness metrics for dashboard display
 */
export function calculateFairnessMetrics(
  scoreGroups: Record<string, number[]>
): {
  overallMean: number
  groupMeans: Record<string, number>
  driftFlags: Record<string, boolean>
  maxDrift: number
} {
  const allScores: number[] = []
  const groupMeans: Record<string, number> = {}
  
  for (const [group, scores] of Object.entries(scoreGroups)) {
    if (scores.length > 0) {
      const mean = scores.reduce((a, b) => a + b, 0) / scores.length
      groupMeans[group] = Math.round(mean * 100) / 100
      allScores.push(...scores)
    }
  }
  
  const overallMean = allScores.length > 0
    ? allScores.reduce((a, b) => a + b, 0) / allScores.length
    : 0
  
  // Flag groups that drift more than 5 points from overall mean
  const driftFlags: Record<string, boolean> = {}
  let maxDrift = 0
  
  for (const [group, mean] of Object.entries(groupMeans)) {
    const drift = Math.abs(mean - overallMean)
    driftFlags[group] = drift > 5
    maxDrift = Math.max(maxDrift, drift)
  }
  
  return {
    overallMean: Math.round(overallMean * 100) / 100,
    groupMeans,
    driftFlags,
    maxDrift: Math.round(maxDrift * 100) / 100,
  }
}
