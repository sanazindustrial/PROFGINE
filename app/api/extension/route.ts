import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { gradingService } from '@/lib/services/chrome-extension-grading'
import { chromeExtensionConfig } from '@/lib/config/services'

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Validate origin (Chrome extension or allowed domains)
    const origin = request.headers.get('origin')
    const isValidOrigin = chromeExtensionConfig.allowedOrigins.some(allowedOrigin => {
      if (allowedOrigin.includes('*')) {
        const pattern = allowedOrigin.replace('*', '.*')
        return new RegExp(pattern).test(origin || '')
      }
      return origin === allowedOrigin
    })

    if (!isValidOrigin && origin) {
      console.warn('🚫 Invalid origin:', origin)
      return NextResponse.json({ error: 'Forbidden origin' }, { status: 403 })
    }

    const body = await request.json()
    const { type, data } = body

    console.log('📨 Extension API request:', { type, userId: session.user.id })

    // Handle different extension message types
    const result = await gradingService.handleExtensionMessage({ type, data })

    return NextResponse.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Extension API error:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Return extension configuration and status
    return NextResponse.json({
      status: 'active',
      version: '1.0.0',
      supportedPlatforms: [
        'google-classroom',
        'canvas', 
        'blackboard',
        'brightspace',
        'moodle'
      ],
      features: {
        aiGrading: true,
        discussionScanning: true,
        batchProcessing: true,
        rubricIntegration: true
      },
      limits: {
        maxAssignmentsPerRequest: 10,
        maxStudentsPerBatch: 50
      }
    })

  } catch (error) {
    console.error('❌ Extension status error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}