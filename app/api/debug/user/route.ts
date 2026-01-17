import { getServerSession } from "next-auth/next"
import { NextRequest, NextResponse } from "next/server"
import { authOptions } from "../../auth/[...nextauth]/route"
import { prisma } from "@/prisma/client"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({
        authenticated: false,
        message: "No session found"
      })
    }

    // Get user data from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        subscriptionType: true,
        subscriptionExpiresAt: true,
        trialStartedAt: true,
        trialExpiresAt: true,
        createdAt: true,
        updatedAt: true
      }
    })

    if (!user) {
      return NextResponse.json({
        authenticated: true,
        sessionEmail: session.user.email,
        error: "User not found in database"
      })
    }

    // Calculate trial status
    const now = new Date()
    const trialActive = user.trialExpiresAt ? now < user.trialExpiresAt : false
    const trialExpired = user.trialExpiresAt ? now >= user.trialExpiresAt : false
    const daysUntilExpiry = user.trialExpiresAt ? 
      Math.ceil((user.trialExpiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null

    return NextResponse.json({
      authenticated: true,
      user: user,
      trialStatus: {
        isActive: trialActive,
        isExpired: trialExpired,
        daysUntilExpiry: daysUntilExpiry,
        expirationDate: user.trialExpiresAt
      },
      recommendations: {
        shouldRedirectTo: getRecommendedRedirect(user, trialExpired),
        reason: getRedirectReason(user, trialExpired)
      }
    })
  } catch (error) {
    console.error('User check error:', error)
    return NextResponse.json({
      error: 'Failed to check user status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

function getRecommendedRedirect(user: any, trialExpired: boolean): string {
  if (user.role === 'ADMIN') {
    return '/user-management'
  }

  switch (user.subscriptionType) {
    case 'FREE_TRIAL':
      return trialExpired ? '/subscription/upgrade' : '/trial-dashboard'
    case 'BASIC':
    case 'PREMIUM': 
    case 'ENTERPRISE':
      return '/dashboard'
    default:
      return '/trial-dashboard'
  }
}

function getRedirectReason(user: any, trialExpired: boolean): string {
  if (user.role === 'ADMIN') {
    return 'Admin user - redirect to admin dashboard'
  }

  switch (user.subscriptionType) {
    case 'FREE_TRIAL':
      return trialExpired ? 
        'Free trial expired - redirect to upgrade page' :
        'Active free trial - redirect to trial dashboard'
    case 'BASIC':
    case 'PREMIUM':
    case 'ENTERPRISE':
      return 'Paid subscription - redirect to full dashboard'
    default:
      return 'Unknown subscription type - default to trial dashboard'
  }
}