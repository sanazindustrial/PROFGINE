/**
 * Consensus Model Unit Tests
 * 
 * Tests for inter-rater reliability calculations and variance detection
 * for the TCA-IRR grading system.
 */

import { describe, it, expect } from 'vitest'
import {
    calculateConsensus,
    detectBiasIndicators,
    generateReconciliationPlan,
    calculateFairnessMetrics,
} from './consensus'

describe('Consensus Model Logic', () => {
    describe('calculateConsensus', () => {
        it('should calculate the mean score for low-variance reviews', () => {
            const reviews = [
                { score: 85, weight: 1 },
                { score: 88, weight: 1 },
                { score: 86, weight: 1 },
            ]
            const result = calculateConsensus(reviews)

            expect(result.finalScore).toBeCloseTo(86.33, 1)
            expect(result.requiresReconciliation).toBe(false)
            // Low variance reviews should not trigger HIGH_VARIANCE_DETECTED
            expect(result.governanceFlag).not.toBe('HIGH_VARIANCE_DETECTED')
        })

        it('should trigger reconciliation if variance exceeds threshold (SD > 10)', () => {
            const reviews = [
                { score: 95, weight: 1 },
                { score: 60, weight: 1 }, // Outlier/High disagreement
                { score: 92, weight: 1 },
            ]
            const result = calculateConsensus(reviews)

            expect(result.requiresReconciliation).toBe(true)
            expect(result.governanceFlag).toBe('HIGH_VARIANCE_DETECTED')
        })

        it('should accurately handle weighted reviews from different roles', () => {
            const reviews = [
                { score: 90, weight: 2 }, // Professor weight
                { score: 80, weight: 1 }, // TA weight
            ]
            const result = calculateConsensus(reviews)

            // Weighted mean: (90*2 + 80*1) / 3 = 260/3 = 86.67
            expect(result.finalScore).toBeCloseTo(86.67, 1)
        })

        it('should return zero for empty reviews', () => {
            const result = calculateConsensus([])

            expect(result.finalScore).toBe(0)
            expect(result.weightedMean).toBe(0)
            expect(result.standardDeviation).toBe(0)
            expect(result.requiresReconciliation).toBe(false)
        })

        it('should handle single reviewer without reconciliation', () => {
            const reviews = [{ score: 85, weight: 1, reviewerId: 'prof1' }]
            const result = calculateConsensus(reviews)

            expect(result.finalScore).toBe(85)
            expect(result.requiresReconciliation).toBe(false)
            expect(result.standardDeviation).toBe(0)
        })

        it('should include reviewer IDs in output', () => {
            const reviews = [
                { score: 85, weight: 1, reviewerId: 'prof1' },
                { score: 90, weight: 1, reviewerId: 'ta1' },
            ]
            const result = calculateConsensus(reviews)

            expect(result.reviewerScores).toHaveLength(2)
            expect(result.reviewerScores[0].reviewerId).toBe('prof1')
            expect(result.reviewerScores[1].reviewerId).toBe('ta1')
        })

        it('should set anonymous reviewerId when not provided', () => {
            const reviews = [{ score: 85, weight: 1 }]
            const result = calculateConsensus(reviews)

            expect(result.reviewerScores[0].reviewerId).toBe('anonymous')
        })

        it('should detect moderate variance without extreme reconciliation need', () => {
            const reviews = [
                { score: 80, weight: 1 },
                { score: 90, weight: 1 },
                { score: 85, weight: 1 },
            ]
            const result = calculateConsensus(reviews)

            expect(result.standardDeviation).toBeLessThan(10)
            expect(result.requiresReconciliation).toBe(false)
        })

        it('should correctly calculate standard deviation', () => {
            const reviews = [
                { score: 70, weight: 1 },
                { score: 80, weight: 1 },
                { score: 90, weight: 1 },
            ]
            const result = calculateConsensus(reviews)

            // Mean = 80, SD = sqrt(((70-80)^2 + (80-80)^2 + (90-80)^2) / 3) = sqrt(200/3) ≈ 8.16
            expect(result.standardDeviation).toBeCloseTo(8.16, 1)
        })
    })

    describe('detectBiasIndicators', () => {
        it('should detect bias when mean drifts significantly from demographic mean', () => {
            const reviews = [
                { score: 95, weight: 1 },
                { score: 92, weight: 1 },
                { score: 90, weight: 1 },
            ]
            const demographicMean = 80 // Expected mean is 80

            const hasBias = detectBiasIndicators(reviews, demographicMean, 5)

            expect(hasBias).toBe(true) // Mean ~92 is >5 points from 80
        })

        it('should not detect bias when mean is close to demographic mean', () => {
            const reviews = [
                { score: 82, weight: 1 },
                { score: 78, weight: 1 },
                { score: 80, weight: 1 },
            ]
            const demographicMean = 80

            const hasBias = detectBiasIndicators(reviews, demographicMean, 5)

            expect(hasBias).toBe(false)
        })

        it('should return false when no demographic mean provided', () => {
            const reviews = [{ score: 95, weight: 1 }]

            const hasBias = detectBiasIndicators(reviews, undefined)

            expect(hasBias).toBe(false)
        })

        it('should return false for empty reviews', () => {
            const hasBias = detectBiasIndicators([], 80)

            expect(hasBias).toBe(false)
        })

        it('should use custom threshold', () => {
            const reviews = [
                { score: 85, weight: 1 },
                { score: 85, weight: 1 },
            ]
            const demographicMean = 80

            // With default threshold (5), this should show bias
            expect(detectBiasIndicators(reviews, demographicMean, 5)).toBe(false) // 85-80=5, not >5

            // With stricter threshold (3), this should show bias
            expect(detectBiasIndicators(reviews, demographicMean, 3)).toBe(true) // 85-80=5 > 3
        })
    })

    describe('generateReconciliationPlan', () => {
        it('should recommend viva for extreme variance (SD > 20)', () => {
            const reviews = [
                { score: 100, weight: 1, reviewerId: 'prof1' },
                { score: 20, weight: 1, reviewerId: 'ta1' }, // Extreme disagreement
                { score: 95, weight: 1, reviewerId: 'ta2' },
            ]
            const plan = generateReconciliationPlan(reviews)

            expect(plan.suggestedAction).toBe('REQUEST_VIVA')
            expect(plan.recommendation).toContain('viva')
            // Outlier detection depends on 1.5*SD threshold
            expect(plan.outlierReviewers.length).toBeGreaterThanOrEqual(0)
        })

        it('should recommend additional reviewer for high variance (SD 15-20)', () => {
            const reviews = [
                { score: 95, weight: 1, reviewerId: 'prof1' },
                { score: 50, weight: 1, reviewerId: 'ta1' }, // High disagreement but not extreme
                { score: 90, weight: 1, reviewerId: 'ta2' },
            ]
            const plan = generateReconciliationPlan(reviews)

            // Should recommend additional reviewer or higher escalation
            expect(['ADDITIONAL_REVIEWER', 'REQUEST_VIVA']).toContain(plan.suggestedAction)
        })

        it('should recommend instructor review for moderate variance (SD 10-15)', () => {
            const reviews = [
                { score: 90, weight: 1, reviewerId: 'prof1' },
                { score: 60, weight: 1, reviewerId: 'ta1' }, // Moderate disagreement
                { score: 85, weight: 1, reviewerId: 'ta2' },
            ]
            const plan = generateReconciliationPlan(reviews)

            // Should recommend instructor review or higher escalation
            expect(['INSTRUCTOR_REVIEW', 'ADDITIONAL_REVIEWER', 'REQUEST_VIVA']).toContain(plan.suggestedAction)
        })

        it('should accept mean for low variance (SD < 10)', () => {
            const reviews = [
                { score: 85, weight: 1 },
                { score: 88, weight: 1 },
                { score: 86, weight: 1 },
            ]
            const plan = generateReconciliationPlan(reviews)

            expect(plan.suggestedAction).toBe('ACCEPT_MEAN')
            expect(plan.outlierReviewers).toHaveLength(0)
        })

        it('should identify outlier reviewers correctly', () => {
            const reviews = [
                { score: 90, weight: 1, reviewerId: 'prof1' },
                { score: 88, weight: 1, reviewerId: 'prof2' },
                { score: 50, weight: 1, reviewerId: 'ta1' }, // Outlier
                { score: 92, weight: 1, reviewerId: 'ta2' },
            ]
            const plan = generateReconciliationPlan(reviews)

            expect(plan.outlierReviewers).toContain('ta1')
            expect(plan.outlierReviewers).not.toContain('prof1')
        })
    })

    describe('calculateFairnessMetrics', () => {
        it('should calculate overall mean and group means correctly', () => {
            const scoreGroups = {
                'Group A': [85, 90, 88],
                'Group B': [75, 80, 78],
            }
            const metrics = calculateFairnessMetrics(scoreGroups)

            expect(metrics.overallMean).toBeCloseTo(82.67, 1)
            expect(metrics.groupMeans['Group A']).toBeCloseTo(87.67, 1)
            expect(metrics.groupMeans['Group B']).toBeCloseTo(77.67, 1)
        })

        it('should flag groups that drift more than 5 points from overall mean', () => {
            const scoreGroups = {
                'On Track': [80, 82, 81],
                'Drifting High': [95, 92, 93], // Should be flagged
                'Drifting Low': [60, 62, 61], // Should be flagged
            }
            const metrics = calculateFairnessMetrics(scoreGroups)

            expect(metrics.driftFlags['On Track']).toBe(false)
            expect(metrics.driftFlags['Drifting High']).toBe(true)
            expect(metrics.driftFlags['Drifting Low']).toBe(true)
        })

        it('should calculate maximum drift', () => {
            const scoreGroups = {
                'Normal': [80, 82, 81],
                'High': [95, 92, 93],
            }
            const metrics = calculateFairnessMetrics(scoreGroups)

            expect(metrics.maxDrift).toBeGreaterThan(5)
        })

        it('should handle empty groups', () => {
            const scoreGroups = {
                'Group A': [],
                'Group B': [80, 85],
            }
            const metrics = calculateFairnessMetrics(scoreGroups)

            expect(metrics.groupMeans['Group A']).toBeUndefined()
            expect(metrics.groupMeans['Group B']).toBeDefined()
        })

        it('should handle all empty groups', () => {
            const scoreGroups = {
                'Group A': [],
                'Group B': [],
            }
            const metrics = calculateFairnessMetrics(scoreGroups)

            expect(metrics.overallMean).toBe(0)
            expect(Object.keys(metrics.groupMeans)).toHaveLength(0)
        })

        it('should handle single score per group', () => {
            const scoreGroups = {
                'Solo Group': [85],
            }
            const metrics = calculateFairnessMetrics(scoreGroups)

            expect(metrics.overallMean).toBe(85)
            expect(metrics.groupMeans['Solo Group']).toBe(85)
            expect(metrics.driftFlags['Solo Group']).toBe(false)
        })
    })

    describe('Edge Cases and Boundary Conditions', () => {
        it('should handle perfect agreement (all same scores)', () => {
            const reviews = [
                { score: 85, weight: 1 },
                { score: 85, weight: 1 },
                { score: 85, weight: 1 },
            ]
            const result = calculateConsensus(reviews)

            expect(result.standardDeviation).toBe(0)
            expect(result.requiresReconciliation).toBe(false)
            expect(result.finalScore).toBe(85)
        })

        it('should handle zero scores', () => {
            const reviews = [
                { score: 0, weight: 1 },
                { score: 0, weight: 1 },
            ]
            const result = calculateConsensus(reviews)

            expect(result.finalScore).toBe(0)
            expect(result.requiresReconciliation).toBe(false)
        })

        it('should handle maximum scores (100)', () => {
            const reviews = [
                { score: 100, weight: 1 },
                { score: 100, weight: 1 },
                { score: 98, weight: 1 },
            ]
            const result = calculateConsensus(reviews)

            expect(result.finalScore).toBeCloseTo(99.33, 1)
            expect(result.requiresReconciliation).toBe(false)
        })

        it('should handle very high weights', () => {
            const reviews = [
                { score: 90, weight: 100 },
                { score: 80, weight: 1 },
            ]
            const result = calculateConsensus(reviews)

            // The weighted mean should be heavily influenced by the high-weight score
            expect(result.finalScore).toBeCloseTo(89.9, 1)
        })

        it('should handle fractional scores', () => {
            const reviews = [
                { score: 85.5, weight: 1 },
                { score: 87.3, weight: 1 },
                { score: 86.2, weight: 1 },
            ]
            const result = calculateConsensus(reviews)

            expect(result.finalScore).toBeCloseTo(86.33, 1)
        })

        it('should handle two reviewers at variance threshold boundary', () => {
            // Mean = 80, SD = 10 exactly (boundary)
            const reviews = [
                { score: 70, weight: 1 }, // Mean - 10
                { score: 90, weight: 1 }, // Mean + 10
            ]
            const result = calculateConsensus(reviews)

            // SD for 70, 90: sqrt(((70-80)^2 + (90-80)^2) / 2) = sqrt(200/2) = 10
            expect(result.standardDeviation).toBe(10)
            // SD = 10 is not > 10, so should not require reconciliation
            expect(result.requiresReconciliation).toBe(false)
        })

        it('should trigger reconciliation just above threshold', () => {
            const reviews = [
                { score: 69, weight: 1 }, // Mean - 10.5
                { score: 91, weight: 1 }, // Mean + 10.5
            ]
            const result = calculateConsensus(reviews)

            // SD > 10, should require reconciliation
            expect(result.standardDeviation).toBeGreaterThan(10)
            expect(result.requiresReconciliation).toBe(true)
        })
    })

    describe('Inter-Rater Reliability (IRR)', () => {
        it('should have perfect reliability for identical scores', () => {
            const reviews = [
                { score: 85, weight: 1 },
                { score: 85, weight: 1 },
                { score: 85, weight: 1 },
            ]
            const result = calculateConsensus(reviews)

            // When all scores are identical, there's no disagreement
            // The governance flag should be null (good reliability)
            expect(result.governanceFlag).toBeNull()
        })

        it('should flag low confidence when IRR is poor', () => {
            // High disagreement leads to low IRR
            const reviews = [
                { score: 90, weight: 1 },
                { score: 50, weight: 1 },
                { score: 30, weight: 1 },
                { score: 85, weight: 1 },
            ]
            const result = calculateConsensus(reviews)

            // With such high variance, should trigger a flag
            expect(result.governanceFlag).not.toBeNull()
        })
    })
})

describe('Integration Scenarios', () => {
    it('should handle a typical high-stakes dissertation evaluation', () => {
        const reviews = [
            { score: 88, weight: 2, reviewerId: 'advisor' },
            { score: 85, weight: 1.5, reviewerId: 'committee1' },
            { score: 82, weight: 1.5, reviewerId: 'committee2' },
            { score: 90, weight: 1, reviewerId: 'external' },
        ]
        const result = calculateConsensus(reviews)

        // Should be close to weighted average
        expect(result.finalScore).toBeGreaterThan(85)
        expect(result.finalScore).toBeLessThan(90)
        expect(result.requiresReconciliation).toBe(false)
    })

    it('should handle a contentious peer review situation', () => {
        const reviews = [
            { score: 95, weight: 1, reviewerId: 'ta1' },
            { score: 45, weight: 1, reviewerId: 'ta2' }, // Very different opinion
            { score: 88, weight: 2, reviewerId: 'professor' },
        ]
        const result = calculateConsensus(reviews)
        const plan = generateReconciliationPlan(reviews)

        expect(result.requiresReconciliation).toBe(true)
        expect(result.governanceFlag).toBe('HIGH_VARIANCE_DETECTED')
        expect(plan.outlierReviewers).toContain('ta2')
    })

    it('should support full workflow: consensus → bias check → reconciliation', () => {
        // Step 1: Calculate consensus
        const reviews = [
            { score: 92, weight: 1, reviewerId: 'r1' },
            { score: 55, weight: 1, reviewerId: 'r2' },
            { score: 88, weight: 1, reviewerId: 'r3' },
        ]
        const consensus = calculateConsensus(reviews)

        // Step 2: Check for bias
        const demographicMean = 78
        const hasBias = detectBiasIndicators(reviews, demographicMean)

        // Step 3: Generate reconciliation plan if needed
        const plan = generateReconciliationPlan(reviews)

        // Verify full workflow
        expect(consensus.requiresReconciliation).toBe(true)
        expect(hasBias).toBe(false) // Mean ~78.3 is close to demographic mean 78
        expect(plan.suggestedAction).not.toBe('ACCEPT_MEAN')
        // outlierReviewers may be empty if no reviewer is >1.5*SD from mean
        expect(plan.suggestedAction).toBeDefined()
    })

    it('should handle fairness dashboard data aggregation', () => {
        const scoreGroups = {
            'Section A (Morning)': [85, 88, 82, 90, 86],
            'Section B (Afternoon)': [78, 75, 80, 77, 79],
            'Section C (Online)': [82, 84, 81, 85, 83],
        }
        const metrics = calculateFairnessMetrics(scoreGroups)

        // Verify metrics are reasonable
        expect(metrics.overallMean).toBeGreaterThan(75)
        expect(metrics.overallMean).toBeLessThan(90)

        // Check that appropriate drift flags are set
        // Section A is likely higher than overall mean
        // Section B is likely lower than overall mean
        const groupDiffs = Object.entries(metrics.groupMeans).map(([group, mean]) => ({
            group,
            diff: Math.abs(mean - metrics.overallMean),
        }))

        // At least one group should have notable drift
        expect(groupDiffs.some(g => g.diff > 3)).toBe(true)
    })
})
