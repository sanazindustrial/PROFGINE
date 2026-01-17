import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { email, secret } = await request.json();
    
    // Simple security check
    if (secret !== process.env.NEXTAUTH_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }
    
    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { email }
    });
    
    if (user) {
      // Update existing user to admin
      user = await prisma.user.update({
        where: { email },
        data: { 
          role: 'ADMIN',
          updatedAt: new Date()
        }
      });
      console.log(`Updated existing user to ADMIN: ${email}`);
    } else {
      // Create new admin user
      user = await prisma.user.create({
        data: {
          email,
          name: email.split('@')[0],
          role: 'ADMIN',
        }
      });
      console.log(`Created new ADMIN user: ${email}`);
    }
    
    // Create/update invitation
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1); // Valid for 1 year
    
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
      error: 'Failed to create admin user',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'POST to this endpoint with { email, secret } to create admin user' 
  });
}