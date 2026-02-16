import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { 
  ReadyGateSelfEvaluationSchema,
  AIUseStatementSchema,
  FeedbackCycleSchema,
  GradingGovernanceSchema,
  ConsensusReviewSchema,
  InterventionNudgeSchema,
} from '@/lib/validations/grading'
import { calculateConsensus, generateReconciliationPlan } from '@/lib/grading/consensus'

// GET - Retrieve grading workflow data
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const submissionId = searchParams.get('submissionId')
    const action = searchParams.get('action')

    if (!submissionId) {
      return NextResponse.json({ error: 'submissionId is required' }, { status: 400 })
    }

    // Verify user has access to this submission
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        assignment: { include: { course: true } },
        student: { select: { id: true, name: true, email: true } },
      },
    })

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    const isInstructor = submission.assignment.course.instructorId === session.user.id
    const isStudent = submission.studentId === session.user.id
    const user = session.user as any
    const isAdmin = user.role === 'ADMIN' || user.isOwner

    if (!isInstructor && !isStudent && !isAdmin) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    switch (action) {
      case 'self-evaluation':
        const selfEval = await prisma.readyGateSelfEvaluation.findUnique({
          where: { submissionId },
        })
        return NextResponse.json({ data: selfEval })

      case 'ai-use-statement':
        const aiUse = await prisma.aIUseStatement.findUnique({
          where: { submissionId },
        })
        return NextResponse.json({ data: aiUse })

      case 'feedback-cycle':
        const feedback = await prisma.feedbackCycle.findUnique({
          where: { submissionId },
          include: { governance: true },
        })
        return NextResponse.json({ data: feedback })

      case 'consensus':
        const reviews = await prisma.consensusReview.findMany({
          where: { submissionId },
          orderBy: { createdAt: 'desc' },
        })
        const consensusResult = calculateConsensus(
          reviews.map(r => ({ 
            reviewerId: r.reviewerId, 
            score: r.overallScore, 
            weight: r.weight 
          }))
        )
        const reconciliationPlan = consensusResult.requiresReconciliation
          ? generateReconciliationPlan(reviews.map(r => ({ 
              reviewerId: r.reviewerId, 
              score: r.overallScore, 
              weight: r.weight 
            })))
          : null
        return NextResponse.json({ 
          data: { 
            reviews, 
            consensus: consensusResult,
            reconciliation: reconciliationPlan,
          } 
        })

      case 'full':
      default:
        const fullData = await prisma.submission.findUnique({
          where: { id: submissionId },
          include: {
            assignment: { include: { rubric: { include: { criteria: true } } } },
            feedbackCycle: { include: { governance: true } },
            selfEvaluation: true,
            aiUseStatement: true,
            consensusReviews: true,
            grade: true,
          },
        })
        return NextResponse.json({ data: fullData })
    }
  } catch (error) {
    console.error('Error fetching grading workflow data:', error)
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 })
  }
}

// POST - Create/Update grading workflow data
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, ...data } = body

    switch (action) {
      case 'self-evaluation': {
        const validated = ReadyGateSelfEvaluationSchema.parse(data)
        
        // Calculate if gate is passed
        const isGatePassed = validated.structureCheck && 
                            validated.citationsCheck && 
                            validated.evidenceCheck
        
        const gateFailureReasons = []
        if (!validated.structureCheck) gateFailureReasons.push('Structure check failed')
        if (!validated.citationsCheck) gateFailureReasons.push('Citations check failed')
        if (!validated.evidenceCheck) gateFailureReasons.push('Evidence check failed')
        if (!validated.accessibilityCheck) gateFailureReasons.push('Accessibility check incomplete')

        const result = await prisma.readyGateSelfEvaluation.upsert({
          where: { submissionId: validated.submissionId },
          update: {
            reflections: validated.reflections,
            outcomesMastery: validated.outcomesMastery,
            structureCheck: validated.structureCheck,
            citationsCheck: validated.citationsCheck,
            evidenceCheck: validated.evidenceCheck,
            accessibilityCheck: validated.accessibilityCheck,
            isGatePassed,
            gateFailureReasons: gateFailureReasons.length > 0 ? gateFailureReasons : null,
            completedAt: isGatePassed ? new Date() : null,
          },
          create: {
            submissionId: validated.submissionId,
            reflections: validated.reflections,
            outcomesMastery: validated.outcomesMastery,
            structureCheck: validated.structureCheck,
            citationsCheck: validated.citationsCheck,
            evidenceCheck: validated.evidenceCheck,
            accessibilityCheck: validated.accessibilityCheck,
            isGatePassed,
            gateFailureReasons: gateFailureReasons.length > 0 ? gateFailureReasons : null,
            completedAt: isGatePassed ? new Date() : null,
          },
        })
        
        return NextResponse.json({ 
          success: true, 
          data: result,
          isGatePassed,
          message: isGatePassed 
            ? 'Ready gate passed! You may now submit.' 
            : 'Please complete all checks before submitting.'
        })
      }

      case 'ai-use-statement': {
        const validated = AIUseStatementSchema.parse(data)
        
        const result = await prisma.aIUseStatement.upsert({
          where: { submissionId: validated.submissionId },
          update: {
            toolsUsed: validated.toolsUsed,
            verificationSteps: validated.verificationSteps,
            collaborationReflection: validated.collaborationReflection,
            hasProcessEvidence: validated.hasProcessEvidence,
            draftVersionsCount: validated.draftVersionsCount,
            changeLogAvailable: validated.changeLogAvailable,
          },
          create: {
            submissionId: validated.submissionId,
            toolsUsed: validated.toolsUsed,
            verificationSteps: validated.verificationSteps,
            collaborationReflection: validated.collaborationReflection,
            hasProcessEvidence: validated.hasProcessEvidence,
            draftVersionsCount: validated.draftVersionsCount,
            changeLogAvailable: validated.changeLogAvailable,
          },
        })
        
        return NextResponse.json({ success: true, data: result })
      }

      case 'feedback-cycle': {
        const validated = FeedbackCycleSchema.parse(data)
        
        const result = await prisma.feedbackCycle.upsert({
          where: { submissionId: validated.submissionId },
          update: {
            feedbackStyle: validated.feedbackStyle,
            academicLevel: validated.academicLevel,
            fieldOfStudy: validated.fieldOfStudy,
            topBunPositive: validated.topBunPositive,
            fillingConstructive: validated.fillingConstructive,
            bottomBunMotivational: validated.bottomBunMotivational,
            heatmapData: validated.heatmapData,
            uncertaintyScore: validated.uncertaintyScore,
            processAnomalies: validated.processAnomalies,
          },
          create: {
            submissionId: validated.submissionId,
            feedbackStyle: validated.feedbackStyle,
            academicLevel: validated.academicLevel,
            fieldOfStudy: validated.fieldOfStudy,
            topBunPositive: validated.topBunPositive,
            fillingConstructive: validated.fillingConstructive,
            bottomBunMotivational: validated.bottomBunMotivational,
            heatmapData: validated.heatmapData,
            uncertaintyScore: validated.uncertaintyScore,
            processAnomalies: validated.processAnomalies,
          },
        })
        
        return NextResponse.json({ success: true, data: result })
      }

      case 'approve-feedback': {
        const { feedbackCycleId, finalScore, overrideRationale } = data
        
        if (!feedbackCycleId) {
          return NextResponse.json({ error: 'feedbackCycleId is required' }, { status: 400 })
        }

        // Get current feedback cycle
        const feedbackCycle = await prisma.feedbackCycle.findUnique({
          where: { id: feedbackCycleId },
          include: { governance: true },
        })

        if (!feedbackCycle) {
          return NextResponse.json({ error: 'Feedback cycle not found' }, { status: 404 })
        }

        // Calculate if this is an override
        const wasOverridden = finalScore !== undefined && 
                             feedbackCycle.governance?.originalAIScore !== undefined &&
                             finalScore !== feedbackCycle.governance.originalAIScore

        if (wasOverridden && !overrideRationale) {
          return NextResponse.json({ 
            error: 'Override rationale is mandatory when changing AI-suggested score' 
          }, { status: 400 })
        }

        // Update feedback cycle and governance
        await prisma.feedbackCycle.update({
          where: { id: feedbackCycleId },
          data: {
            isDraft: false,
            isApproved: true,
            approvedBy: session.user.id,
            approvedAt: new Date(),
          },
        })

        // Update or create governance record
        const governanceData = {
          wasOverridden,
          finalScore,
          overrideRationale: wasOverridden ? overrideRationale : null,
          overriddenBy: wasOverridden ? session.user.id : null,
          overriddenAt: wasOverridden ? new Date() : null,
          auditLog: {
            action: 'FEEDBACK_APPROVED',
            performedBy: session.user.id,
            timestamp: new Date().toISOString(),
            previousValue: feedbackCycle.governance?.finalScore,
            newValue: finalScore,
            rationale: overrideRationale,
          },
        }

        if (feedbackCycle.governance) {
          await prisma.gradingGovernance.update({
            where: { feedbackCycleId },
            data: governanceData,
          })
        } else {
          await prisma.gradingGovernance.create({
            data: {
              feedbackCycleId,
              ...governanceData,
            },
          })
        }

        return NextResponse.json({ 
          success: true, 
          message: 'Feedback approved and finalized' 
        })
      }

      case 'consensus-review': {
        const validated = ConsensusReviewSchema.parse(data)
        
        const result = await prisma.consensusReview.create({
          data: {
            submissionId: validated.submissionId,
            reviewerId: validated.reviewerId,
            reviewerRole: validated.reviewerRole,
            weight: validated.weight,
            scores: validated.scores,
            overallScore: validated.overallScore,
            confidenceLevel: validated.confidenceLevel,
            requiresReconciliation: validated.requiresReconciliation,
            reconciliationNote: validated.reconciliationNote,
          },
        })

        // Check if reconciliation is needed based on all reviews
        const allReviews = await prisma.consensusReview.findMany({
          where: { submissionId: validated.submissionId },
        })
        
        const consensusResult = calculateConsensus(
          allReviews.map(r => ({ 
            reviewerId: r.reviewerId, 
            score: r.overallScore, 
            weight: r.weight 
          }))
        )

        return NextResponse.json({ 
          success: true, 
          data: result,
          consensus: consensusResult,
        })
      }

      case 'intervention-nudge': {
        const validated = InterventionNudgeSchema.parse(data)
        
        const result = await prisma.interventionNudge.create({
          data: {
            studentId: validated.studentId,
            courseId: validated.courseId,
            submissionId: validated.submissionId,
            nudgeType: validated.nudgeType,
            positivePart: validated.positivePart,
            constructivePart: validated.constructivePart,
            motivationalPart: validated.motivationalPart,
            actionableSteps: validated.actionableSteps,
            estimatedTime: validated.estimatedTime,
            triggerEvent: validated.triggerEvent,
            triggerData: validated.triggerData,
            escalationLevel: validated.escalationLevel,
          },
        })

        return NextResponse.json({ success: true, data: result })
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error: any) {
    console.error('Error in grading workflow:', error)
    
    if (error.name === 'ZodError') {
      return NextResponse.json({ 
        error: 'Validation failed', 
        details: error.errors 
      }, { status: 400 })
    }
    
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 })
  }
}
