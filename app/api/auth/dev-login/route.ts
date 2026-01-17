import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

export async function POST(request: Request) {
  try {
    const { email, name } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { email },
      include: {
        userSubscription: true
      }
    });

    if (!user) {
      // Create new user with PROFESSOR role by default
      user = await prisma.user.create({
        data: {
          email,
          name: name || email.split('@')[0],
          role: UserRole.PROFESSOR,
          image: `https://ui-avatars.com/api/?name=${encodeURIComponent(name || email)}&background=0D8ABC&color=fff`
        },
        include: {
          userSubscription: true
        }
      });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        image: user.image,
        subscriptionType: user.userSubscription?.tier || 'FREE',
        subscriptionStatus: user.userSubscription?.status || 'ACTIVE',
        currentPeriodEnd: user.userSubscription?.currentPeriodEnd
      }
    });
  } catch (error) {
    console.error("Dev auth error:", error);
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
  }
}