import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const OWNER_EMAILS = (process.env.OWNER_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean);

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only owner admins can create other admins
    const requestingUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true, email: true }
    });

    if (!requestingUser || requestingUser.role !== 'ADMIN' || !OWNER_EMAILS.includes(requestingUser.email.toLowerCase())) {
      return NextResponse.json({ error: 'Forbidden - owner access required' }, { status: 403 });
    }

    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { email }
    });

    if (user) {
      user = await prisma.user.update({
        where: { email },
        data: {
          role: 'ADMIN',
          updatedAt: new Date()
        }
      });
    } else {
      user = await prisma.user.create({
        data: {
          email,
          name: email.split('@')[0],
          role: 'ADMIN',
        }
      });
    }

    // Create/update invitation
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    await prisma.invitation.upsert({
      where: { email },
      update: {
        role: 'ADMIN',
        status: 'PENDING',
        expiresAt,
      },
      create: {
        email,
        role: 'ADMIN',
        status: 'PENDING',
        expiresAt,
      }
    });

    return NextResponse.json({
      success: true,
      message: `Admin user created/updated: ${email}`,
      userId: user.id
    });

  } catch (error) {
    console.error('Error creating admin:', error);
    return NextResponse.json({
      error: 'Failed to create admin user'
    }, { status: 500 });
  }
}