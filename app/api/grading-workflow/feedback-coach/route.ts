import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { multiAI } from '@/adaptors/multi-ai.adaptor'

export const runtime = 'edge'

// POST - Generate "Sandwich" Feedback using AI
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      submissionId,
      submissionContent,
      rubricCriteria,
      feedbackStyle,
      academicLevel,
      fieldOfStudy,
      aiUseStatement,
    } = body

    if (!submissionContent || !rubricCriteria) {
      return NextResponse.json({ 
        error: 'submissionContent and rubricCriteria are required' 
      }, { status: 400 })
    }

    // Build the system prompt based on feedback style
    const stylePrompts: Record<string, string> = {
      ENCOURAGING_MENTOR: `You are an encouraging mentor for undergraduate students. 
        Focus on celebrating mastery of core concepts and providing supportive guidance. 
        Use warm, accessible language. Acknowledge effort and progress.`,
      
      CRITICAL_PEER: `You are a critical peer reviewer for graduate-level work. 
        Focus on synthesis of literature and professional application. 
        Be direct but constructive. Challenge assumptions and push for deeper analysis.`,
      
      SCHOLARLY_ADVISOR: `You are a scholarly advisor for doctoral research. 
        Focus on methodological rigor and potential for academic publication. 
        Use precise academic language. Identify contribution to the field.`,
      
      TECHNICAL_LEAD: `You are a technical lead reviewing lab/XR work. 
        Focus on procedure adherence, safety protocols, and technical accuracy. 
        Be specific about technical improvements needed.`,
    }

    const stylePrompt = stylePrompts[feedbackStyle || 'ENCOURAGING_MENTOR']

    const systemPrompt = `${stylePrompt}

You are providing feedback using the "Sandwich Method":
1. TOP BUN (Positive): Start with specific praise for demonstrated strengths and learning outcome mastery
2. FILLING (Constructive): Identify specific areas for growth with line references and clear rationales
3. BOTTOM BUN (Motivational): End with actionable next steps and encouragement

Academic Level: ${academicLevel || 'UNDERGRADUATE'}
Field of Study: ${fieldOfStudy || 'General'}

For each constructive point, you MUST:
- Reference specific lines or sections from the submission
- Explain WHY this is an area for improvement
- Provide an uncertainty badge (LOW/MEDIUM/HIGH) for your confidence
- Suggest specific improvements

Output your response as valid JSON with this structure:
{
  "topBunPositive": "string - specific praise and strengths",
  "fillingConstructive": [
    {
      "criterion": "rubric criterion name",
      "finding": "what you observed",
      "rationale": "why this needs improvement with line references",
      "lineReferences": [line numbers],
      "uncertaintyBadge": "LOW|MEDIUM|HIGH"
    }
  ],
  "bottomBunMotivational": "string - actionable tasks and encouragement",
  "uncertaintyScore": number between 0 and 1,
  "heatmapSuggestions": [
    {
      "startLine": number,
      "endLine": number,
      "rubricCriterion": "criterion name",
      "evidenceStrength": "STRONG|MODERATE|WEAK"
    }
  ],
  "processAnomalies": [
    {
      "type": "ONE_CLICK_PASTE|NO_DRAFTS|RAPID_COMPLETION|STYLE_INCONSISTENCY|OTHER",
      "description": "what was detected",
      "severity": "LOW|MEDIUM|HIGH"
    }
  ]
}`

    const userPrompt = `Please analyze this submission and provide "Sandwich" feedback.

RUBRIC CRITERIA:
${JSON.stringify(rubricCriteria, null, 2)}

STUDENT SUBMISSION:
${submissionContent}

${aiUseStatement ? `
AI-USE STATEMENT FROM STUDENT:
${JSON.stringify(aiUseStatement, null, 2)}
` : ''}

Generate comprehensive feedback following the Sandwich Method. Be specific with line references.`

    // Call AI to generate feedback
    const response = await multiAI.chatCompletion({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    })

    // Parse AI response
    let feedbackData
    try {
      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        feedbackData = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('No valid JSON found in response')
      }
    } catch (parseError) {
      console.error('Failed to parse AI feedback response:', parseError)
      return NextResponse.json({ 
        error: 'Failed to parse AI response', 
        rawResponse: response 
      }, { status: 500 })
    }

    // If submissionId provided, save to database
    if (submissionId) {
      await prisma.feedbackCycle.upsert({
        where: { submissionId },
        update: {
          feedbackStyle: feedbackStyle || 'ENCOURAGING_MENTOR',
          academicLevel: academicLevel || 'UNDERGRADUATE',
          fieldOfStudy,
          topBunPositive: feedbackData.topBunPositive,
          fillingConstructive: feedbackData.fillingConstructive,
          bottomBunMotivational: feedbackData.bottomBunMotivational,
          heatmapData: feedbackData.heatmapSuggestions,
          uncertaintyScore: feedbackData.uncertaintyScore,
          processAnomalies: feedbackData.processAnomalies,
          isDraft: true,
        },
        create: {
          submissionId,
          feedbackStyle: feedbackStyle || 'ENCOURAGING_MENTOR',
          academicLevel: academicLevel || 'UNDERGRADUATE',
          fieldOfStudy,
          topBunPositive: feedbackData.topBunPositive,
          fillingConstructive: feedbackData.fillingConstructive,
          bottomBunMotivational: feedbackData.bottomBunMotivational,
          heatmapData: feedbackData.heatmapSuggestions,
          uncertaintyScore: feedbackData.uncertaintyScore,
          processAnomalies: feedbackData.processAnomalies,
          isDraft: true,
        },
      })

      // Create initial governance record
      const feedbackCycle = await prisma.feedbackCycle.findUnique({
        where: { submissionId },
      })

      if (feedbackCycle) {
        await prisma.gradingGovernance.upsert({
          where: { feedbackCycleId: feedbackCycle.id },
          update: {
            originalAIScore: feedbackData.uncertaintyScore,
          },
          create: {
            feedbackCycleId: feedbackCycle.id,
            originalAIScore: feedbackData.uncertaintyScore,
          },
        })
      }
    }

    return NextResponse.json({
      success: true,
      feedback: {
        topBunPositive: feedbackData.topBunPositive,
        fillingConstructive: feedbackData.fillingConstructive,
        bottomBunMotivational: feedbackData.bottomBunMotivational,
        uncertaintyScore: feedbackData.uncertaintyScore,
        heatmapSuggestions: feedbackData.heatmapSuggestions,
        processAnomalies: feedbackData.processAnomalies,
      },
    })
  } catch (error) {
    console.error('Error generating feedback:', error)
    return NextResponse.json({ error: 'Failed to generate feedback' }, { status: 500 })
  }
}
