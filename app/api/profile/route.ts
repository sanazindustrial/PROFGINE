import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        professorProfile: true,
        studentProfile: true,
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      image: user.image,
      professorProfile: user.professorProfile,
      studentProfile: user.studentProfile,
    })
  } catch (error) {
    console.error('Error fetching profile:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { name, bio, institution, department } = body

    // Update basic user information
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: name || undefined,
      }
    })

    // Update or create professor profile if user is professor or admin
    if (session.user.role === 'PROFESSOR' || session.user.role === 'ADMIN') {
      await prisma.professorProfile.upsert({
        where: { userId: session.user.id },
        update: {
          bio: bio || undefined,
          institution: institution || undefined,
          department: department || undefined,
        },
        create: {
          userId: session.user.id,
          bio: bio || undefined,
          institution: institution || undefined,
          department: department || undefined,
        }
      })
    }

    // Update or create student profile if user is student
    if (session.user.role === 'STUDENT') {
      await prisma.studentProfile.upsert({
        where: { userId: session.user.id },
        update: {
          major: department || undefined,
        },
        create: {
          userId: session.user.id,
          major: department || undefined,
        }
      })
    }

    return NextResponse.json({ 
      success: true,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
      }
    })
  } catch (error) {
    console.error('Error updating profile:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}